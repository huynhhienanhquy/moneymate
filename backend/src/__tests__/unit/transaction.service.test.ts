import '../helpers/prisma-mock';
import { TransactionService } from '../../services/transaction.service';
import { WalletRepository } from '../../repositories/wallet.repository';
import { CategoryRepository } from '../../repositories/category.repository';
import { TransactionRepository } from '../../repositories/transaction.repository';
import { BudgetService } from '../../services/budget.service';
import { TransactionType, CategoryType, WalletType } from '@prisma/client';
import prisma from '../../config/db';

jest.mock('../../repositories/wallet.repository');
jest.mock('../../repositories/category.repository');
jest.mock('../../repositories/transaction.repository');

const MockWalletRepo = WalletRepository as jest.MockedClass<typeof WalletRepository>;
const MockCategoryRepo = CategoryRepository as jest.MockedClass<typeof CategoryRepository>;
const MockTransactionRepo = TransactionRepository as jest.MockedClass<typeof TransactionRepository>;

const MOCK_WALLET = {
  id: 'wallet-1',
  userId: 'user-1',
  name: 'Tiền mặt',
  type: WalletType.CASH,
  currency: 'VND',
  initialBalance: '5000000' as any,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const MOCK_EXPENSE_CATEGORY = {
  id: 'cat-expense-1',
  userId: null,
  name: 'Ăn uống',
  type: CategoryType.EXPENSE,
  color: '#FF5722',
  icon: 'utensils',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_INCOME_CATEGORY = {
  id: 'cat-income-1',
  userId: null,
  name: 'Lương',
  type: CategoryType.INCOME,
  color: '#4CAF50',
  icon: 'briefcase',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TransactionService', () => {
  let txService: TransactionService;
  let mockWalletRepo: jest.Mocked<WalletRepository>;
  let mockCategoryRepo: jest.Mocked<CategoryRepository>;
  let mockTransactionRepo: jest.Mocked<TransactionRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    MockWalletRepo.mockClear();
    MockCategoryRepo.mockClear();
    MockTransactionRepo.mockClear();
    txService = new TransactionService();
    mockWalletRepo = MockWalletRepo.mock.instances[0] as jest.Mocked<WalletRepository>;
    mockCategoryRepo = MockCategoryRepo.mock.instances[0] as jest.Mocked<CategoryRepository>;
    mockTransactionRepo = MockTransactionRepo.mock.instances[0] as jest.Mocked<TransactionRepository>;
    mockPrisma = prisma as any;
  });

  afterEach(() => jest.restoreAllMocks());

  // ─── CREATE TRANSACTION ───────────────────────────────────────────────────────
  describe('createTransaction()', () => {
    it('should reject direct transfer creation', async () => {
      await expect(txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-expense-1',
        amount: 100000,
        type: TransactionType.TRANSFER,
        transactionDate: new Date(),
      })).rejects.toThrow('Transfers must be created through the transfer endpoint');
    });

    it('should reject a future transaction date', async () => {
      await expect(txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-expense-1',
        amount: 100000,
        type: TransactionType.EXPENSE,
        transactionDate: new Date(Date.now() + 60_000),
      })).rejects.toThrow('Transaction date cannot be in the future');
    });

    it('should throw AppError if wallet not found', async () => {
      mockWalletRepo.findById.mockResolvedValue(null);

      await expect(txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-expense-1',
        amount: 100000,
        type: TransactionType.EXPENSE,
        transactionDate: new Date(),
      })).rejects.toThrow('Wallet not found or unauthorized');
    });

    it('should throw AppError if wallet belongs to another user', async () => {
      mockWalletRepo.findById.mockResolvedValue({ ...MOCK_WALLET, userId: 'other-user' });

      await expect(txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-expense-1',
        amount: 100000,
        type: TransactionType.EXPENSE,
        transactionDate: new Date(),
      })).rejects.toThrow('Wallet not found or unauthorized');
    });

    it('should throw AppError if category type mismatches transaction type', async () => {
      mockWalletRepo.findById.mockResolvedValue(MOCK_WALLET);
      // Income category used for EXPENSE transaction → must fail
      mockCategoryRepo.findById.mockResolvedValue(MOCK_INCOME_CATEGORY);

      await expect(txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-income-1',
        amount: 100000,
        type: TransactionType.EXPENSE,
        transactionDate: new Date(),
      })).rejects.toThrow('Transaction type must match category type');
    });

    it('should create transaction using database atomic transaction', async () => {
      mockWalletRepo.findById.mockResolvedValue(MOCK_WALLET);
      mockCategoryRepo.findById.mockResolvedValue(MOCK_EXPENSE_CATEGORY);

      const mockCreatedTx = {
        id: 'tx-1',
        userId: 'user-1',
        walletId: 'wallet-1',
        categoryId: 'cat-expense-1',
        amount: '100000' as any,
        type: TransactionType.EXPENSE,
        note: 'Ăn phở',
        transactionDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        wallet: { name: 'Tiền mặt' },
        category: { name: 'Ăn uống', color: '#FF5722' },
      };

      const updateWallet = jest.fn();
      const updateWalletMany = jest.fn().mockResolvedValue({ count: 1 });
      // Mock the prisma.$transaction to call the callback and return the result
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const txClient = {
          transaction: { create: jest.fn().mockResolvedValue(mockCreatedTx) },
          wallet: {
            update: updateWallet,
            updateMany: updateWalletMany,
          },
        };
        return cb(txClient);
      });

      const result = await txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-expense-1',
        amount: 100000,
        type: TransactionType.EXPENSE,
        note: 'Ăn phở',
        transactionDate: new Date(),
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.id).toBe('tx-1');
      expect(updateWallet).not.toHaveBeenCalled();
      expect(updateWalletMany).not.toHaveBeenCalled();
    });

    it('records an expense larger than the wallet amount without changing that amount', async () => {
      mockWalletRepo.findById.mockResolvedValue(MOCK_WALLET);
      mockCategoryRepo.findById.mockResolvedValue(MOCK_EXPENSE_CATEGORY);
      const create = jest.fn().mockResolvedValue({ id: 'tx-large-expense' });
      const updateMany = jest.fn();
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb({
        transaction: { create },
        wallet: { updateMany },
      }));

      await expect(txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-expense-1',
        amount: 6000000,
        type: TransactionType.EXPENSE,
        transactionDate: new Date(),
      })).resolves.toEqual({ id: 'tx-large-expense' });
      expect(create).toHaveBeenCalled();
      expect(updateMany).not.toHaveBeenCalled();
    });

    it('adds an income transaction amount to its wallet', async () => {
      mockWalletRepo.findById.mockResolvedValue(MOCK_WALLET);
      mockCategoryRepo.findById.mockResolvedValue(MOCK_INCOME_CATEGORY);
      const updateMany = jest.fn().mockResolvedValue({ count: 1 });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb({
        transaction: { create: jest.fn().mockResolvedValue({ id: 'tx-income' }) },
        wallet: { updateMany },
      }));

      await expect(txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-income-1',
        amount: 750000,
        type: TransactionType.INCOME,
        transactionDate: new Date(),
      })).resolves.toEqual({ id: 'tx-income' });

      expect(updateMany).toHaveBeenCalledWith({
        where: { id: 'wallet-1', userId: 'user-1', deletedAt: null },
        data: { initialBalance: { increment: expect.anything() } },
      });
    });

    it('invalidates a closed-month snapshot in the same transaction', async () => {
      mockWalletRepo.findById.mockResolvedValue(MOCK_WALLET);
      mockCategoryRepo.findById.mockResolvedValue(MOCK_INCOME_CATEGORY);
      const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb({
        transaction: { create: jest.fn().mockResolvedValue({ id: 'tx-backdated' }) },
        wallet: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        monthlySavingsSnapshot: { deleteMany },
      }));

      await txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-income-1',
        amount: 100000,
        type: TransactionType.INCOME,
        transactionDate: new Date(2020, 4, 10),
      });

      expect(deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', OR: [{ year: 2020, month: 5 }] },
      });
    });

    it('returns a committed transaction when post-commit budget alerts fail', async () => {
      mockWalletRepo.findById.mockResolvedValue(MOCK_WALLET);
      mockCategoryRepo.findById.mockResolvedValue(MOCK_EXPENSE_CATEGORY);
      const committedTransaction = { id: 'tx-committed' };
      mockPrisma.$transaction.mockResolvedValue(committedTransaction);
      jest.spyOn(BudgetService.prototype, 'checkBudgetAlerts')
        .mockRejectedValueOnce(new Error('notification database unavailable'));
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(txService.createTransaction('user-1', {
        walletId: 'wallet-1',
        categoryId: 'cat-expense-1',
        amount: 100000,
        type: TransactionType.EXPENSE,
        transactionDate: new Date(),
      })).resolves.toBe(committedTransaction);
      expect(errorSpy).toHaveBeenCalledWith(
        'Budget alert processing failed after transaction commit',
        expect.objectContaining({ userId: 'user-1', transactionId: 'tx-committed' }),
      );
      errorSpy.mockRestore();
    });
  });

  // ─── DELETE TRANSACTION ───────────────────────────────────────────────────────
  describe('deleteTransaction()', () => {
    it('does not change the wallet amount when deleting an expense', async () => {
      mockTransactionRepo.findById.mockResolvedValue({
        id: 'tx-1', userId: 'user-1', walletId: 'wallet-1', categoryId: 'cat-1',
        amount: '100000' as any, type: TransactionType.EXPENSE, version: 1,
        note: null, transactionDate: new Date(), createdAt: new Date(), updatedAt: new Date(),
      } as any);
      const updateMany = jest.fn().mockResolvedValue({ count: 1 });
      const updateWallet = jest.fn();
      mockPrisma.$transaction.mockImplementation(async (callback: any) => callback({
        transaction: { updateMany },
        wallet: { update: updateWallet },
      }));

      await expect(txService.deleteTransaction('user-1', 'tx-1', 1)).resolves.toBe(true);
      expect(updateWallet).not.toHaveBeenCalled();
    });

    it('reverses an income credit when deleting it', async () => {
      mockTransactionRepo.findById.mockResolvedValue({
        id: 'tx-1', userId: 'user-1', walletId: 'wallet-1', categoryId: 'cat-1',
        amount: '100000' as any, type: TransactionType.INCOME, version: 1,
        note: null, transactionDate: new Date(), createdAt: new Date(), updatedAt: new Date(),
      } as any);
      const updateWallet = jest.fn();
      mockPrisma.$transaction.mockImplementation(async (callback: any) => callback({
        transaction: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        wallet: { update: updateWallet },
      }));

      await expect(txService.deleteTransaction('user-1', 'tx-1', 1)).resolves.toBe(true);
      expect(updateWallet).toHaveBeenCalledWith({
        where: { id: 'wallet-1' },
        data: { initialBalance: { decrement: expect.anything() } },
      });
    });

    it('does not refund when the transaction was already deleted or changed', async () => {
      mockTransactionRepo.findById.mockResolvedValue({
        id: 'tx-1', userId: 'user-1', walletId: 'wallet-1', categoryId: 'cat-1',
        amount: '100000' as any, type: TransactionType.EXPENSE, version: 1,
        note: null, transactionDate: new Date(), createdAt: new Date(), updatedAt: new Date(),
      } as any);
      const updateWallet = jest.fn();
      mockPrisma.$transaction.mockImplementation(async (callback: any) => callback({
        transaction: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        wallet: { update: updateWallet },
      }));

      await expect(txService.deleteTransaction('user-1', 'tx-1', 1))
        .rejects.toMatchObject({ statusCode: 409 });
      expect(updateWallet).not.toHaveBeenCalled();
    });

    it('should throw AppError when trying to delete another user transaction', async () => {
      const mockTxRepo = MockTransactionRepo.mock.instances[0] as jest.Mocked<TransactionRepository>;
      mockTxRepo.findById.mockResolvedValue({
        id: 'tx-1',
        userId: 'other-user',  // different user!
        walletId: 'wallet-1',
        categoryId: 'cat-1',
        amount: '100000' as any,
        type: TransactionType.EXPENSE,
        note: null,
        transactionDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(txService.deleteTransaction('user-1', 'tx-1'))
        .rejects.toThrow('Transaction not found');
    });

    it('should reject deleting one side of a transfer', async () => {
      mockTransactionRepo.findById.mockResolvedValue({
        id: 'tx-transfer', userId: 'user-1', walletId: 'wallet-1', categoryId: 'cat-expense-1',
        amount: '100000' as any, type: TransactionType.TRANSFER, version: 1,
        note: null, transactionDate: new Date(), createdAt: new Date(), updatedAt: new Date(),
      } as any);

      await expect(txService.deleteTransaction('user-1', 'tx-transfer'))
        .rejects.toThrow('Transfers cannot be deleted as regular transactions');
    });
  });

  describe('updateTransaction()', () => {
    it('should validate the category against the resulting transaction type', async () => {
      mockWalletRepo.findById.mockResolvedValue(MOCK_WALLET);
      mockTransactionRepo.findById.mockResolvedValue({
        id: 'tx-1', userId: 'user-1', walletId: 'wallet-1', categoryId: 'cat-expense-1',
        amount: '100000' as any, type: TransactionType.EXPENSE, version: 1,
        note: null, transactionDate: new Date(), createdAt: new Date(), updatedAt: new Date(),
      } as any);
      mockCategoryRepo.findById.mockResolvedValue(MOCK_EXPENSE_CATEGORY);

      await expect(txService.updateTransaction('user-1', 'tx-1', { type: TransactionType.INCOME }))
        .rejects.toThrow('Transaction type must match category type');
    });

    it('checks budget alerts after an expense update commits', async () => {
      mockWalletRepo.findById.mockResolvedValue(MOCK_WALLET);
      const transactionDate = new Date();
      mockTransactionRepo.findById.mockResolvedValue({
        id: 'tx-1', userId: 'user-1', walletId: 'wallet-1', categoryId: 'cat-expense-1',
        amount: '100000' as any, type: TransactionType.EXPENSE, version: 1,
        note: null, transactionDate, createdAt: new Date(), updatedAt: new Date(),
      } as any);
      mockCategoryRepo.findById.mockResolvedValue(MOCK_EXPENSE_CATEGORY);
      const updated = { id: 'tx-1', transactionDate, type: TransactionType.EXPENSE };
      const updateWallet = jest.fn();
      const updateWalletMany = jest.fn();
      mockPrisma.$transaction.mockImplementation(async (callback: any) => callback({
        wallet: { update: updateWallet, updateMany: updateWalletMany },
        transaction: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          findUniqueOrThrow: jest.fn().mockResolvedValue(updated),
        },
      }));
      const alertSpy = jest.spyOn(BudgetService.prototype, 'checkBudgetAlerts').mockResolvedValue();

      await expect(txService.updateTransaction('user-1', 'tx-1', { amount: 200000 }))
        .resolves.toBe(updated);
      expect(alertSpy).toHaveBeenCalledWith('user-1', 'cat-expense-1', transactionDate);
      expect(updateWallet).not.toHaveBeenCalled();
      expect(updateWalletMany).not.toHaveBeenCalled();
    });
  });

  // ─── TRANSFER VALIDATION ──────────────────────────────────────────────────────
  describe('transferBetweenWallets()', () => {
    it('should throw AppError if source and destination are the same', async () => {
      await expect(txService.transferBetweenWallets('user-1', {
        sourceWalletId: 'wallet-1',
        destinationWalletId: 'wallet-1',
        amount: 50000,
        transferDate: new Date(),
      })).rejects.toThrow('Source and destination wallets must be different');
    });

    it('should throw AppError if amount is zero or negative', async () => {
      await expect(txService.transferBetweenWallets('user-1', {
        sourceWalletId: 'wallet-1',
        destinationWalletId: 'wallet-2',
        amount: 0,
        transferDate: new Date(),
      })).rejects.toThrow('Amount must be positive and non-zero');
    });

    it('should only use a global category for transfer records', async () => {
      mockCategoryRepo.findFirst.mockResolvedValue(MOCK_EXPENSE_CATEGORY);
      mockTransactionRepo.transferFunds.mockResolvedValue({ id: 'transfer-1' } as any);

      await txService.transferBetweenWallets('user-1', {
        sourceWalletId: 'wallet-1',
        destinationWalletId: 'wallet-2',
        amount: 50000,
        transferDate: new Date(),
      });

      expect(mockCategoryRepo.findFirst).toHaveBeenCalledWith(
        { type: CategoryType.EXPENSE, userId: null },
        { name: 'asc' },
      );
    });
  });

  describe('getDashboardSummary()', () => {
    it('uses the sum of wallet amounts as total assets', async () => {
      mockTransactionRepo.getWalletBalanceTotal.mockResolvedValue(5_000_000);
      mockTransactionRepo.getMonthlySummary.mockResolvedValue({
        totalIncome: 10_000_000,
        actualIncome: 10_000_000,
        recurringIncome: 0,
        salaryIncome: 10_000_000,
        otherIncome: 0,
        totalExpense: 4_000_000,
        actualExpense: 4_000_000,
        recurringExpense: 0,
        netSavings: 6_000_000,
        remainingAmount: 6_000_000,
        walletBalance: 11_000_000,
      });
      mockTransactionRepo.findAll.mockResolvedValue([]);

      const result = await txService.getDashboardSummary('user-1');

      expect(result.netWorth).toBe(5_000_000);
      expect(result.walletBalanceTotal).toBe(5_000_000);
      expect(result.monthlySavings).toBe(1_000_000);
      expect(result.monthlyRemaining).toBe(1_000_000);
      expect(mockTransactionRepo.getWalletBalanceTotal).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getMonthlyReport()', () => {
    it('matches monthly balance income using the requested month wallet balance', async () => {
      mockTransactionRepo.getWalletBalanceTotal.mockResolvedValue(5_000_000);
      mockTransactionRepo.getMonthlySummary.mockResolvedValue({
        totalIncome: 10_000_000,
        actualIncome: 9_000_000,
        recurringIncome: 1_000_000,
        salaryIncome: 10_000_000,
        otherIncome: 0,
        totalExpense: 4_000_000,
        actualExpense: 3_000_000,
        recurringExpense: 1_000_000,
        netSavings: 6_000_000,
        remainingAmount: 6_000_000,
        walletBalance: 11_000_000,
      });
      mockTransactionRepo.getCategoryBreakdown.mockResolvedValue([]);
      mockTransactionRepo.findAll.mockResolvedValue([]);

      const report = await txService.getMonthlyReport('user-1', 8, 2026);

      expect(report.summary.totalIncome).toBe(11_000_000);
      expect(report.summary.totalExpense).toBe(4_000_000);
      expect(report.summary.netSavings).toBe(7_000_000);
      expect(report.summary.remainingAmount).toBe(report.summary.netSavings);
      expect(report.summary.actualIncome).toBe(9_000_000);
      expect(report.summary.recurringIncome).toBe(1_000_000);
      expect(mockTransactionRepo.getMonthlySummary).toHaveBeenCalledWith('user-1', 8, 2026);
      expect(mockTransactionRepo.getWalletBalanceTotal).not.toHaveBeenCalled();
    });
  });

  describe('getYearlyReport()', () => {
    it('sums the same monthly wallet balances shown on the monthly savings page', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 8, 15));
      try {
        mockPrisma.user.findUnique.mockResolvedValue({ createdAt: new Date(2026, 2, 10) });
        mockTransactionRepo.getWalletBalanceTotal.mockResolvedValue(20_000_000);
        mockTransactionRepo.getCategoryBreakdown.mockResolvedValue([]);
        mockTransactionRepo.getYearlySummary.mockResolvedValue({
          year: 2026,
          totalIncome: 999,
          totalExpense: 999,
          netSavings: 0,
          monthlyData: [
            { month: 1, walletBalance: 1_000_000, expense: 500_000 },
            { month: 3, walletBalance: 3_000_000, expense: 1_000_000 },
            { month: 4, walletBalance: 4_000_000, expense: 2_000_000 },
            { month: 9, walletBalance: 9_000_000, expense: 3_000_000 },
            { month: 10, walletBalance: 10_000_000, expense: 4_000_000 },
          ],
        } as any);

        const report = await txService.getYearlyReport('user-1', 2026);

        expect(report.totalIncome).toBe(16_000_000);
        expect(report.totalExpense).toBe(6_000_000);
        expect(report.netSavings).toBe(10_000_000);
        expect(report.walletBalanceTotal).toBe(20_000_000);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('syncTransactions()', () => {
    it('carries both updatedAt and id in the next cursor', async () => {
      const updatedAt = new Date('2026-09-03T10:00:00.000Z');
      mockTransactionRepo.findSyncDelta.mockResolvedValueOnce([
        { id: 'tx-a', updatedAt },
        { id: 'tx-b', updatedAt },
      ] as any).mockResolvedValueOnce([]);

      const first = await txService.syncTransactions('user-1', undefined, 2);
      await txService.syncTransactions('user-1', first.nextCursor!, 2);

      expect(mockTransactionRepo.findSyncDelta).toHaveBeenLastCalledWith('user-1', {
        updatedAt,
        id: 'tx-b',
      }, 2);
    });
  });
});
