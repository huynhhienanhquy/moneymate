import '../helpers/prisma-mock';
import { CategoryType, Frequency } from '@prisma/client';
import prisma from '../../config/db';
import { RecurringRepository } from '../../repositories/recurring.repository';
import { WalletRepository } from '../../repositories/wallet.repository';
import { CategoryRepository } from '../../repositories/category.repository';
import { NotificationService } from '../../services/notification.service';
import { BudgetService } from '../../services/budget.service';
import { calculateNextDate, RecurringService } from '../../services/recurring.service';
import { MAX_RECURRING_OCCURRENCES_PER_RUN } from '../../services/recurring.service';

jest.mock('../../repositories/recurring.repository');
jest.mock('../../repositories/wallet.repository');
jest.mock('../../repositories/category.repository');
jest.mock('../../services/notification.service');
jest.mock('../../services/budget.service');

const MockRecurringRepo = RecurringRepository as jest.MockedClass<typeof RecurringRepository>;
const MockWalletRepo = WalletRepository as jest.MockedClass<typeof WalletRepository>;
const MockCategoryRepo = CategoryRepository as jest.MockedClass<typeof CategoryRepository>;
const MockNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>;
const MockBudgetService = BudgetService as jest.MockedClass<typeof BudgetService>;

describe('RecurringService', () => {
  const currentRecurring = {
    id: 'recurring-1', userId: 'user-1', walletId: 'wallet-1', categoryId: 'category-1',
    amount: '100000' as any, type: CategoryType.EXPENSE, frequency: Frequency.MONTHLY,
    note: null, startDate: new Date(), nextExecutionDate: new Date(), isActive: true,
  };

  it('preserves the original monthly anchor day and clamps short months', () => {
    const anchor = new Date(2025, 0, 31, 9);
    const february = calculateNextDate(anchor, Frequency.MONTHLY, anchor);
    const march = calculateNextDate(february, Frequency.MONTHLY, anchor);

    expect(february.getFullYear()).toBe(2025);
    expect(february.getMonth()).toBe(1);
    expect(february.getDate()).toBe(28);
    expect(march.getMonth()).toBe(2);
    expect(march.getDate()).toBe(31);
  });

  it('skips an item when another processor already advanced it', async () => {
    const service = new RecurringService();
    const recurringRepo = MockRecurringRepo.mock.instances[0] as jest.Mocked<RecurringRepository>;
    const notificationService = MockNotificationService.mock.instances[0] as jest.Mocked<NotificationService>;
    const startDate = new Date(2025, 0, 31, 9);
    recurringRepo.findDueTransactions.mockResolvedValue([{
      id: 'recurring-1', userId: 'user-1', walletId: 'wallet-1', categoryId: 'category-1',
      amount: '100000' as any, type: CategoryType.EXPENSE, frequency: Frequency.MONTHLY,
      note: null, startDate, nextExecutionDate: startDate, isActive: true,
      category: { name: 'Internet' },
    } as any]);

    const create = jest.fn();
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => callback({
      recurringTransaction: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      transaction: { create },
      wallet: { update: jest.fn() },
    }));

    await expect(service.processDueTransactions()).resolves.toBe(0);
    expect(create).not.toHaveBeenCalled();
    expect(notificationService.create).not.toHaveBeenCalled();
  });

  it('does not process a legacy recurring record that references another tenant', async () => {
    const service = new RecurringService();
    const recurringRepo = MockRecurringRepo.mock.instances[0] as jest.Mocked<RecurringRepository>;
    const notificationService = MockNotificationService.mock.instances[0] as jest.Mocked<NotificationService>;
    const startDate = new Date(2025, 0, 31, 9);
    recurringRepo.findDueTransactions.mockResolvedValue([{
      ...currentRecurring,
      startDate,
      nextExecutionDate: startDate,
      category: { name: 'Internet' },
    } as any]);

    const create = jest.fn();
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => callback({
      recurringTransaction: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      transaction: { create },
      wallet: { findFirst: jest.fn().mockResolvedValue(null), updateMany: jest.fn() },
      category: { findFirst: jest.fn().mockResolvedValue({ id: 'category-1' }) },
    }));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(service.processDueTransactions()).resolves.toBe(0);
    expect(create).not.toHaveBeenCalled();
    expect(notificationService.create).not.toHaveBeenCalled();
  });

  it('rejects changing a recurring transaction to another user wallet', async () => {
    const service = new RecurringService();
    const recurringRepo = MockRecurringRepo.mock.instances[0] as jest.Mocked<RecurringRepository>;
    const walletRepo = MockWalletRepo.mock.instances[0] as jest.Mocked<WalletRepository>;
    recurringRepo.findById.mockResolvedValue(currentRecurring as any);
    walletRepo.findById.mockResolvedValue({ id: 'wallet-2', userId: 'other-user' } as any);

    await expect(service.updateRecurring('user-1', 'recurring-1', { walletId: 'wallet-2' }))
      .rejects.toThrow('Wallet not found or unauthorized');
    expect(recurringRepo.update).not.toHaveBeenCalled();
  });

  it('persists an edited start date and restarts the next execution from it', async () => {
    const service = new RecurringService();
    const recurringRepo = MockRecurringRepo.mock.instances[0] as jest.Mocked<RecurringRepository>;
    const walletRepo = MockWalletRepo.mock.instances[0] as jest.Mocked<WalletRepository>;
    const categoryRepo = MockCategoryRepo.mock.instances[0] as jest.Mocked<CategoryRepository>;
    const startDate = new Date('2026-10-15T00:00:00.000Z');
    recurringRepo.findById.mockResolvedValue(currentRecurring as any);
    walletRepo.findById.mockResolvedValue({ id: 'wallet-1', userId: 'user-1' } as any);
    categoryRepo.findById.mockResolvedValue({
      id: 'category-1', userId: null, type: CategoryType.EXPENSE,
    } as any);
    recurringRepo.update.mockResolvedValue({} as any);

    await service.updateRecurring('user-1', 'recurring-1', { startDate });

    expect(recurringRepo.update).toHaveBeenCalledWith('recurring-1', {
      startDate,
      nextExecutionDate: startDate,
    });
  });

  it('caps each catch-up batch instead of materializing an unbounded history', async () => {
    const service = new RecurringService();
    const recurringRepo = MockRecurringRepo.mock.instances[0] as jest.Mocked<RecurringRepository>;
    const startDate = new Date('2020-01-01T08:00:00.000Z');
    recurringRepo.findDueTransactions.mockResolvedValue([{
      ...currentRecurring,
      frequency: Frequency.DAILY,
      startDate,
      nextExecutionDate: startDate,
      category: { name: 'Internet' },
    } as any]);
    const transactionCreate = jest.fn().mockResolvedValue({});
    const recurringUpdate = jest.fn().mockResolvedValue({ count: 1 });
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => callback({
      recurringTransaction: { updateMany: recurringUpdate },
      transaction: { create: transactionCreate },
      wallet: { findFirst: jest.fn().mockResolvedValue({ id: 'wallet-1' }), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      category: { findFirst: jest.fn().mockResolvedValue({ id: 'category-1' }) },
      monthlySavingsSnapshot: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    }));

    await expect(service.processDueTransactions()).resolves.toBe(MAX_RECURRING_OCCURRENCES_PER_RUN);
    expect(transactionCreate).toHaveBeenCalledTimes(MAX_RECURRING_OCCURRENCES_PER_RUN);
    expect(transactionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ recurringTransactionId: 'recurring-1' }),
    });
    expect(recurringUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { nextExecutionDate: new Date('2020-04-10T08:00:00.000Z') },
    }));
  });

  it.each(['toggle', 'update'] as const)('restarts a paused schedule from today via %s', async (method) => {
    const resumedAt = new Date(2026, 8, 5, 10);
    jest.useFakeTimers().setSystemTime(resumedAt);
    try {
      const service = new RecurringService();
      const recurringRepo = MockRecurringRepo.mock.instances[0] as jest.Mocked<RecurringRepository>;
      const walletRepo = MockWalletRepo.mock.instances[0] as jest.Mocked<WalletRepository>;
      const categoryRepo = MockCategoryRepo.mock.instances[0] as jest.Mocked<CategoryRepository>;
      const paused = {
        ...currentRecurring, isActive: false, frequency: Frequency.DAILY,
        startDate: new Date(2026, 7, 1, 10), nextExecutionDate: new Date(2026, 7, 15, 10),
        category: { name: 'Internet' },
      };
      recurringRepo.findById.mockResolvedValue(paused as any);
      walletRepo.findById.mockResolvedValue({ id: 'wallet-1', userId: 'user-1' } as any);
      categoryRepo.findById.mockResolvedValue({ id: 'category-1', userId: null, type: CategoryType.EXPENSE } as any);
      recurringRepo.update.mockImplementation(async (_id, data) => ({ ...paused, ...data }) as any);

      const resumed = method === 'toggle'
        ? await service.toggleActive('user-1', 'recurring-1')
        : await service.updateRecurring('user-1', 'recurring-1', { isActive: true, startDate: paused.startDate });

      expect(resumed).toMatchObject({ isActive: true, startDate: resumedAt, nextExecutionDate: resumedAt });
      expect(calculateNextDate(resumed.nextExecutionDate, Frequency.MONTHLY, resumed.startDate))
        .toEqual(new Date(2026, 9, 5, 10));
      expect(calculateNextDate(resumed.nextExecutionDate, Frequency.YEARLY, resumed.startDate))
        .toEqual(new Date(2027, 8, 5, 10));

      recurringRepo.findDueTransactions.mockResolvedValue([resumed] as any);
      const create = jest.fn().mockResolvedValue({});
      const advance = jest.fn().mockResolvedValue({ count: 1 });
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => callback({
        recurringTransaction: { updateMany: advance },
        transaction: { create },
        wallet: { findFirst: jest.fn().mockResolvedValue({ id: 'wallet-1' }), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        category: { findFirst: jest.fn().mockResolvedValue({ id: 'category-1' }) },
      }));

      await expect(service.processDueTransactions()).resolves.toBe(1);
      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ transactionDate: resumedAt }) });
      expect(advance).toHaveBeenCalledWith(expect.objectContaining({
        data: { nextExecutionDate: new Date(2026, 8, 6, 10) },
      }));
    } finally {
      jest.useRealTimers();
    }
  });

  it('pauses an active schedule without changing its dates', async () => {
    const service = new RecurringService();
    const recurringRepo = MockRecurringRepo.mock.instances[0] as jest.Mocked<RecurringRepository>;
    recurringRepo.findById.mockResolvedValue(currentRecurring as any);

    await service.toggleActive('user-1', 'recurring-1');

    expect(recurringRepo.update).toHaveBeenCalledWith('recurring-1', { isActive: false });
  });

  it('does not restart a schedule whose wallet was deleted', async () => {
    const service = new RecurringService();
    const recurringRepo = MockRecurringRepo.mock.instances[0] as jest.Mocked<RecurringRepository>;
    const walletRepo = MockWalletRepo.mock.instances[0] as jest.Mocked<WalletRepository>;
    recurringRepo.findById.mockResolvedValue({ ...currentRecurring, isActive: false } as any);
    walletRepo.findById.mockResolvedValue(null);

    await expect(service.toggleActive('user-1', 'recurring-1')).rejects.toMatchObject({ statusCode: 404 });
    expect(recurringRepo.update).not.toHaveBeenCalled();
  });

  it('does not restart a schedule that is already active when updating its status', async () => {
    const service = new RecurringService();
    const recurringRepo = MockRecurringRepo.mock.instances[0] as jest.Mocked<RecurringRepository>;
    const walletRepo = MockWalletRepo.mock.instances[0] as jest.Mocked<WalletRepository>;
    const categoryRepo = MockCategoryRepo.mock.instances[0] as jest.Mocked<CategoryRepository>;
    recurringRepo.findById.mockResolvedValue(currentRecurring as any);
    walletRepo.findById.mockResolvedValue({ id: 'wallet-1', userId: 'user-1' } as any);
    categoryRepo.findById.mockResolvedValue({ id: 'category-1', userId: null, type: CategoryType.EXPENSE } as any);

    await service.updateRecurring('user-1', 'recurring-1', { isActive: true });

    expect(recurringRepo.update).toHaveBeenCalledWith('recurring-1', { isActive: true });
  });

  it('checks budget alerts after a recurring expense commits', async () => {
    const service = new RecurringService();
    const recurringRepo = MockRecurringRepo.mock.instances.at(-1) as jest.Mocked<RecurringRepository>;
    const budgetService = MockBudgetService.mock.instances.at(-1) as jest.Mocked<BudgetService>;
    const executionDate = new Date();
    recurringRepo.findDueTransactions.mockResolvedValue([{
      ...currentRecurring,
      startDate: executionDate,
      nextExecutionDate: executionDate,
      category: { name: 'Internet' },
    } as any]);
    const walletUpdateMany = jest.fn();
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => callback({
      recurringTransaction: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      transaction: { create: jest.fn().mockResolvedValue({}) },
      wallet: {
        findFirst: jest.fn().mockResolvedValue({ id: 'wallet-1' }),
        updateMany: walletUpdateMany,
      },
      category: { findFirst: jest.fn().mockResolvedValue({ id: 'category-1' }) },
      monthlySavingsSnapshot: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    }));

    await expect(service.processDueTransactions()).resolves.toBe(1);
    expect(budgetService.checkBudgetAlerts)
      .toHaveBeenCalledWith('user-1', 'category-1', executionDate);
    expect(walletUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects a private category owned by another user', async () => {
    const service = new RecurringService();
    const recurringRepo = MockRecurringRepo.mock.instances[0] as jest.Mocked<RecurringRepository>;
    const walletRepo = MockWalletRepo.mock.instances[0] as jest.Mocked<WalletRepository>;
    const categoryRepo = MockCategoryRepo.mock.instances[0] as jest.Mocked<CategoryRepository>;
    recurringRepo.findById.mockResolvedValue(currentRecurring as any);
    walletRepo.findById.mockResolvedValue({ id: 'wallet-1', userId: 'user-1' } as any);
    categoryRepo.findById.mockResolvedValue({
      id: 'category-2', userId: 'other-user', type: CategoryType.EXPENSE,
    } as any);

    await expect(service.updateRecurring('user-1', 'recurring-1', { categoryId: 'category-2' }))
      .rejects.toThrow('Category not found or unauthorized');
    expect(recurringRepo.update).not.toHaveBeenCalled();
  });

  it('validates category type against the resulting recurring type', async () => {
    const service = new RecurringService();
    const recurringRepo = MockRecurringRepo.mock.instances[0] as jest.Mocked<RecurringRepository>;
    const walletRepo = MockWalletRepo.mock.instances[0] as jest.Mocked<WalletRepository>;
    const categoryRepo = MockCategoryRepo.mock.instances[0] as jest.Mocked<CategoryRepository>;
    recurringRepo.findById.mockResolvedValue(currentRecurring as any);
    walletRepo.findById.mockResolvedValue({ id: 'wallet-1', userId: 'user-1' } as any);
    categoryRepo.findById.mockResolvedValue({
      id: 'category-1', userId: null, type: CategoryType.EXPENSE,
    } as any);

    await expect(service.updateRecurring('user-1', 'recurring-1', { type: CategoryType.INCOME }))
      .rejects.toThrow('Category type must match transaction type');
    expect(recurringRepo.update).not.toHaveBeenCalled();
  });
});
