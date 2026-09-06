import '../helpers/prisma-mock';
import { CategoryType } from '@prisma/client';
import { BudgetRepository } from '../../repositories/budget.repository';
import { CategoryRepository } from '../../repositories/category.repository';
import { BudgetService } from '../../services/budget.service';
import { NotificationService } from '../../services/notification.service';

jest.mock('../../repositories/budget.repository');
jest.mock('../../repositories/category.repository');
jest.mock('../../services/notification.service');

const MockBudgetRepository = BudgetRepository as jest.MockedClass<typeof BudgetRepository>;
const MockCategoryRepository = CategoryRepository as jest.MockedClass<typeof CategoryRepository>;
const MockNotificationService = NotificationService as jest.MockedClass<typeof NotificationService>;

const budget = {
  id: 'budget-1', userId: 'user-1', categoryId: 'category-1', categoryScope: 'category-1',
  amount: '100' as any, month: 9, year: 2026,
  category: { name: 'Ăn uống', type: CategoryType.EXPENSE },
};

describe('BudgetService', () => {
  let service: BudgetService;
  let budgets: jest.Mocked<BudgetRepository>;
  let categories: jest.Mocked<CategoryRepository>;
  let notifications: jest.Mocked<NotificationService>;

  beforeEach(() => {
    service = new BudgetService();
    budgets = MockBudgetRepository.mock.instances.at(-1) as jest.Mocked<BudgetRepository>;
    categories = MockCategoryRepository.mock.instances.at(-1) as jest.Mocked<CategoryRepository>;
    notifications = MockNotificationService.mock.instances.at(-1) as jest.Mocked<NotificationService>;
  });

  it('rejects an income category', async () => {
    categories.findById.mockResolvedValue({ userId: null, type: CategoryType.INCOME } as any);
    await expect(service.createBudget('user-1', {
      categoryId: 'category-1', amount: 100, month: 9, year: 2026,
    })).rejects.toThrow('Budgets can only use expense categories');
  });

  it('validates ownership and duplicates when changing category', async () => {
    budgets.findById.mockResolvedValue(budget as any);
    categories.findById.mockResolvedValue({ userId: 'user-1', type: CategoryType.EXPENSE } as any);
    budgets.findDuplicate.mockResolvedValue({ id: 'budget-2' } as any);

    await expect(service.updateBudget('user-1', 'budget-1', { categoryId: 'category-2' }))
      .rejects.toThrow('Budget already exists for this category and month');
    expect(budgets.update).not.toHaveBeenCalled();
  });

  it('converts a database uniqueness race into a conflict', async () => {
    budgets.findDuplicate.mockResolvedValue(null);
    budgets.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.createBudget('user-1', {
      categoryId: null, amount: 100, month: 9, year: 2026,
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('only emits an 80 percent warning when the alert claim succeeds', async () => {
    budgets.findByUserMonthYear.mockResolvedValue([budget] as any);
    budgets.getSpentAmount.mockResolvedValue(85);
    budgets.claimAlert.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await service.checkBudgetAlerts('user-1', 'category-1', new Date(2026, 8, 3));
    await service.checkBudgetAlerts('user-1', 'category-1', new Date(2026, 8, 4));

    expect(notifications.create).toHaveBeenCalledTimes(1);
    expect(notifications.create).toHaveBeenCalledWith('user-1', expect.objectContaining({
      title: 'Cảnh báo ngân sách',
    }));
  });

  it('emits the exceeded alert once when crossing 100 percent', async () => {
    budgets.findByUserMonthYear.mockResolvedValue([budget] as any);
    budgets.getSpentAmount.mockResolvedValue(105);
    budgets.claimAlert.mockResolvedValue(true);

    await service.checkBudgetAlerts('user-1', 'category-1', new Date(2026, 8, 3));

    expect(notifications.create).toHaveBeenCalledWith('user-1', expect.objectContaining({
      title: 'Vượt ngân sách!',
    }));
  });
});
