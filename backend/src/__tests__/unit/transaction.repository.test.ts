import '../helpers/prisma-mock';
import prisma from '../../config/db';
import { TransactionRepository } from '../../repositories/transaction.repository';
import { CategoryType, Frequency } from '@prisma/client';

describe('TransactionRepository atomic transfer guards', () => {
  it('does not transfer after another request consumes the source balance', async () => {
    const tx = {
      wallet: {
        findUnique: jest.fn()
          .mockResolvedValueOnce({ id: 'source', userId: 'user-1', initialBalance: '100' })
          .mockResolvedValueOnce({ id: 'destination', userId: 'user-1', initialBalance: '0' }),
        updateMany: jest.fn().mockResolvedValueOnce({ count: 0 }),
      },
      transaction: { create: jest.fn().mockResolvedValue({}) },
      walletTransfer: { create: jest.fn().mockResolvedValue({ id: 'transfer-1' }) },
    };
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(tx));
    const repository = new TransactionRepository();

    await expect(repository.transferFunds({
      userId: 'user-1',
      sourceWalletId: 'source',
      destinationWalletId: 'destination',
      amount: 80,
      transferDate: new Date(),
      categoryId: 'category-1',
    })).rejects.toMatchObject({ statusCode: 400 });
    expect(tx.transaction.create).not.toHaveBeenCalled();
    expect(tx.walletTransfer.create).not.toHaveBeenCalled();
  });

  it('records one transfer after both guarded wallet updates succeed', async () => {
    const tx = {
      wallet: {
        findUnique: jest.fn()
          .mockResolvedValueOnce({ id: 'source', userId: 'user-1', initialBalance: '100' })
          .mockResolvedValueOnce({ id: 'destination', userId: 'user-1', initialBalance: '0' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      transaction: { create: jest.fn().mockResolvedValue({}) },
      walletTransfer: { create: jest.fn().mockResolvedValue({ id: 'transfer-1' }) },
    };
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(tx));
    const repository = new TransactionRepository();

    await expect(repository.transferFunds({
      userId: 'user-1',
      sourceWalletId: 'source',
      destinationWalletId: 'destination',
      amount: 80,
      transferDate: new Date(),
      categoryId: 'category-1',
    })).resolves.toEqual({ id: 'transfer-1' });
    expect(tx.wallet.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.transaction.create).toHaveBeenCalledTimes(2);
    expect(tx.walletTransfer.create).toHaveBeenCalledTimes(1);
  });
});

describe('TransactionRepository monthly assets', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('recovers month-end assets without counting later income, transfers or goal movements', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 6));
    const cutoff = new Date(2026, 7, 31, 23, 59, 59, 999);
    const mockPrisma = prisma as any;
    mockPrisma.wallet.findMany.mockResolvedValue([
      { id: 'old-a', initialBalance: '3000000' },
      { id: 'old-b', initialBalance: '2000000' },
    ]);
    mockPrisma.transaction.aggregate
      .mockResolvedValueOnce({ _sum: { amount: '2000000' } })
      .mockResolvedValueOnce({ _sum: { amount: '1000000' } });
    mockPrisma.walletTransfer.findMany.mockResolvedValue([
      { sourceWalletId: 'old-a', destinationWalletId: 'new-wallet', amount: '500000' },
      { sourceWalletId: 'new-wallet', destinationWalletId: 'old-a', amount: '200000' },
      { sourceWalletId: 'old-a', destinationWalletId: 'old-b', amount: '900000' },
    ]);
    mockPrisma.goalTransaction.findMany.mockResolvedValue([
      { type: 'DEPOSIT', amount: '300000' },
      { type: 'WITHDRAW', amount: '100000' },
    ]);

    const result = await new TransactionRepository().getWalletBalancesAtDate('user-1', cutoff);

    expect(result).toBe(4_500_000);
    expect(mockPrisma.wallet.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', createdAt: { lte: cutoff } },
    });
    expect(mockPrisma.transaction.aggregate).toHaveBeenNthCalledWith(1, {
      where: { userId: 'user-1', deletedAt: null, walletId: { in: ['old-a', 'old-b'] },
        type: 'INCOME', transactionDate: { gt: cutoff } },
      _sum: { amount: true },
    });
    expect(mockPrisma.transaction.aggregate).toHaveBeenNthCalledWith(2, {
      where: { userId: 'user-1', deletedAt: null, walletId: { in: ['old-a', 'old-b'] },
        type: 'EXPENSE', transactionDate: { gt: cutoff } },
      _sum: { amount: true },
    });
    expect(mockPrisma.walletTransfer.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'user-1', transferDate: { gt: cutoff } }),
    }));
    expect(mockPrisma.goalTransaction.findMany).toHaveBeenCalledWith({
      where: { walletId: { in: ['old-a', 'old-b'] }, createdAt: { gt: cutoff } },
    });
  });

  it('uses live assets for the current month and zero before any wallet existed', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 6));
    const repository = new TransactionRepository();
    const mockPrisma = prisma as any;
    mockPrisma.wallet.findMany.mockResolvedValueOnce([{ initialBalance: '5000000' }])
      .mockResolvedValueOnce([]);

    expect(await repository.getWalletBalancesAtDate('user-1', new Date(2026, 8, 30))).toBe(5_000_000);
    expect(await repository.getWalletBalancesAtDate('user-1', new Date(2020, 0, 31))).toBe(0);
    expect(mockPrisma.transaction.aggregate).not.toHaveBeenCalled();
  });

  it('plots each month\'s own assets across a year boundary, including zero and negative assets', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 6));
    const repository = new TransactionRepository();
    const summary = jest.spyOn(repository, 'getMonthlySummary');
    for (const walletBalance of [0, -100_000, 5_000_000]) {
      summary.mockResolvedValueOnce({
        totalIncome: 10_000_000, actualIncome: 9_000_000, recurringIncome: 1_000_000,
        salaryIncome: 10_000_000, otherIncome: 0, totalExpense: 200_000,
        actualExpense: 200_000, recurringExpense: 0, netSavings: 9_800_000,
        remainingAmount: 9_800_000, walletBalance,
      });
    }

    const result = await repository.getMonthlyTrend('user-1', 3);

    expect(result.map(({ month, year, income, expense, remaining }) =>
      ({ month, year, income, expense, remaining }))).toEqual([
      { month: 11, year: 2025, income: 0, expense: 200_000, remaining: -200_000 },
      { month: 12, year: 2025, income: -100_000, expense: 200_000, remaining: -300_000 },
      { month: 1, year: 2026, income: 5_000_000, expense: 200_000, remaining: 4_800_000 },
    ]);
    expect(summary.mock.calls).toEqual([['user-1', 11, 2025], ['user-1', 12, 2025], ['user-1', 1, 2026]]);
    expect(result[2].actualIncome).toBe(9_000_000);
  });
});

describe('TransactionRepository yearly savings snapshots', () => {
  it('recalculates legacy snapshots using historical month-end assets minus expense', async () => {
    const repository = new TransactionRepository();
    const mockPrisma = prisma as any;
    mockPrisma.monthlySavingsSnapshot.findUnique.mockResolvedValue({ formulaVersion: 7, walletBalance: '5000000' });
    mockPrisma.wallet.findMany.mockResolvedValue([
      { initialBalance: '3000000' },
      { initialBalance: '2000000' },
    ]);
    mockPrisma.monthlySavingsSnapshot.upsert.mockResolvedValue({});
    jest.spyOn(repository, 'getMonthlySummary').mockResolvedValue({
      totalIncome: 10_000_000,
      actualIncome: 10_000_000,
      recurringIncome: 0,
      salaryIncome: 8_000_000,
      otherIncome: 2_000_000,
      totalExpense: 4_000_000,
      actualExpense: 4_000_000,
      recurringExpense: 0,
      netSavings: 6_000_000,
      remainingAmount: 6_000_000,
      walletBalance: 11_000_000,
    });

    const result = await repository.getYearlySummary('user-1', 2020);

    expect(result.monthlyData[0]).toMatchObject({
      income: 11_000_000,
      salaryIncome: 8_000_000,
      expense: 4_000_000,
      savings: 7_000_000,
    });
    expect(mockPrisma.monthlySavingsSnapshot.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({
        salaryIncome: 8_000_000,
        otherIncome: 2_000_000,
        savings: 7_000_000,
        walletBalance: 11_000_000,
        formulaVersion: 8,
      }),
    }));
    expect(result.netSavings).toBe(result.monthlyData.reduce((sum, item) => sum + item.savings, 0));
  });

  it('matches dashboard trend for every month and refreshes history after backdated changes', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 5));
    try {
      const repository = new TransactionRepository();
      const mockPrisma = prisma as any;
      mockPrisma.wallet.findMany.mockResolvedValue([{ initialBalance: '5000000' }]);
      mockPrisma.monthlySavingsSnapshot.findUnique.mockResolvedValue({
        formulaVersion: 7, walletBalance: '8000000', salaryIncome: '10000000',
        otherIncome: '0', expense: '4000000', savings: '4000000',
      });
      let correction = 0;
      jest.spyOn(repository, 'getMonthlySummary').mockImplementation(async (_userId, month) => ({
        totalIncome: 10_000_000, actualIncome: 10_000_000, recurringIncome: 0,
        salaryIncome: 10_000_000, otherIncome: 0, totalExpense: 6_000_000,
        actualExpense: 6_000_000, recurringExpense: 0, netSavings: 4_000_000,
        remainingAmount: 4_000_000, walletBalance: month * 1_000_000 + correction,
      }));

      const result = await repository.getYearlySummary('user-1', 2026);
      const trend = await repository.getMonthlyTrend('user-1', 6);

      for (const point of trend) {
        expect(result.monthlyData[point.month - 1]).toMatchObject({
          income: point.income, expense: point.expense, savings: point.remaining,
        });
      }
      expect(result.monthlyData[7]).toMatchObject({ income: 8_000_000, savings: 2_000_000 });
      expect(result.monthlyData[8]).toMatchObject({ income: 9_000_000, expense: 6_000_000, savings: 3_000_000 });

      correction = 500_000;
      const updated = await repository.getYearlySummary('user-1', 2026);
      expect(updated.monthlyData[7]).toMatchObject({ income: 8_500_000, savings: 2_500_000 });
      expect(mockPrisma.monthlySavingsSnapshot.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId_month_year: { userId: 'user-1', month: 8, year: 2026 } },
        update: expect.objectContaining({ walletBalance: 8_500_000, savings: 2_500_000, formulaVersion: 8 }),
      }));
    } finally {
      jest.useRealTimers();
    }
  });

  it('uses both timestamp and id at a sync page boundary', async () => {
    const repository = new TransactionRepository();
    const mockPrisma = prisma as any;
    const updatedAt = new Date('2026-09-03T10:00:00.000Z');
    mockPrisma.transaction.findMany.mockResolvedValue([]);

    await repository.findSyncDelta('user-1', { updatedAt, id: 'tx-b' }, 100);

    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        userId: 'user-1',
        OR: [
          { updatedAt: { gt: updatedAt } },
          { updatedAt, id: { gt: 'tx-b' } },
        ],
      },
    }));
  });
});

describe('TransactionRepository recurring projections', () => {
  it('matches generated occurrences by recurring ID and does not project closed dates', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-04T08:00:00.000Z'));
    const mockPrisma = prisma as any;
    mockPrisma.recurringTransaction.findMany.mockResolvedValue([{
      id: 'recurring-1', userId: 'user-1', walletId: 'wallet-1', categoryId: 'category-1',
      amount: 100, type: CategoryType.EXPENSE, frequency: Frequency.DAILY,
      startDate: new Date('2026-09-03T08:00:00.000Z'), isActive: true,
      category: { name: 'Ăn uống', color: '#f00' },
    }]);
    mockPrisma.transaction.findMany.mockResolvedValue([
      { transactionDate: new Date('2026-09-05T08:00:00.000Z') },
    ]);
    const repository = new TransactionRepository();

    const result = await (repository as any).getProjectedRecurringAmount(
      'user-1',
      new Date('2026-09-01T00:00:00.000Z'),
      new Date('2026-09-05T23:59:59.999Z'),
      CategoryType.EXPENSE,
    );

    expect(result.total).toBe(100);
    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: expect.arrayContaining([{ recurringTransactionId: 'recurring-1' }]),
      }),
    }));
    jest.useRealTimers();
  });
});
