import { BudgetRepository } from '../repositories/budget.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { NotificationService } from './notification.service';
import { AppError } from '../common/app-error';
import { CategoryType, NotificationType } from '@prisma/client';

export class BudgetService {
  private budgetRepository = new BudgetRepository();
  private categoryRepository = new CategoryRepository();
  private notificationService = new NotificationService();

  private async validateExpenseCategory(userId: string, categoryId: string | null) {
    if (!categoryId) return;
    const category = await this.categoryRepository.findById(categoryId);
    if (!category || (category.userId !== null && category.userId !== userId)) {
      throw new AppError('Category not found', 404);
    }
    if (category.type !== CategoryType.EXPENSE) {
      throw new AppError('Budgets can only use expense categories', 400);
    }
  }

  private isUniqueConstraintError(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }

  private async enrichBudget(budget: any, userId: string) {
    const spent = await this.budgetRepository.getSpentAmount(
      userId,
      budget.categoryId,
      budget.month,
      budget.year
    );
    const limit = Number(budget.amount);
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    return {
      ...budget,
      amount: limit,
      spent,
      remaining: Math.max(0, limit - spent),
      percentage,
      status: percentage >= 100 ? 'EXCEEDED' : percentage >= 80 ? 'WARNING' : 'OK',
    };
  }

  async createBudget(userId: string, data: {
    categoryId?: string | null;
    amount: number;
    month: number;
    year: number;
  }) {
    if (data.amount <= 0) throw new AppError('Budget amount must be positive', 400);
    if (data.month < 1 || data.month > 12) throw new AppError('Invalid month', 400);

    await this.validateExpenseCategory(userId, data.categoryId ?? null);

    const existing = await this.budgetRepository.findDuplicate(
      userId, data.categoryId ?? null, data.month, data.year
    );
    if (existing) throw new AppError('Budget already exists for this category and month', 400);

    let budget;
    try {
      budget = await this.budgetRepository.create({
        userId,
        categoryId: data.categoryId ?? null,
        amount: data.amount,
        month: data.month,
        year: data.year,
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new AppError('Budget already exists for this category and month', 409);
      }
      throw error;
    }
    return this.enrichBudget(budget, userId);
  }

  async getBudgets(userId: string, month: number, year: number) {
    const budgets = await this.budgetRepository.findByUserMonthYear(userId, month, year);
    return Promise.all(budgets.map((b) => this.enrichBudget(b, userId)));
  }

  async getBudget(userId: string, id: string) {
    const budget = await this.budgetRepository.findById(id);
    if (!budget || budget.userId !== userId) throw new AppError('Budget not found', 404);
    return this.enrichBudget(budget, userId);
  }

  async updateBudget(userId: string, id: string, data: { amount?: number; categoryId?: string | null }) {
    const budget = await this.budgetRepository.findById(id);
    if (!budget || budget.userId !== userId) throw new AppError('Budget not found', 404);
    if (data.amount !== undefined && data.amount <= 0) throw new AppError('Budget amount must be positive', 400);

    const targetCategoryId = data.categoryId !== undefined ? data.categoryId : budget.categoryId;
    await this.validateExpenseCategory(userId, targetCategoryId);
    if (data.categoryId !== undefined) {
      const existing = await this.budgetRepository.findDuplicate(
        userId, targetCategoryId, budget.month, budget.year, budget.id,
      );
      if (existing) throw new AppError('Budget already exists for this category and month', 409);
    }

    let updated;
    try {
      updated = await this.budgetRepository.update(id, data);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new AppError('Budget already exists for this category and month', 409);
      }
      throw error;
    }
    return this.enrichBudget(updated, userId);
  }

  async deleteBudget(userId: string, id: string) {
    const budget = await this.budgetRepository.findById(id);
    if (!budget || budget.userId !== userId) throw new AppError('Budget not found', 404);
    await this.budgetRepository.delete(id);
    return true;
  }

  /** Called after an expense transaction is created */
  async checkBudgetAlerts(userId: string, categoryId: string, transactionDate: Date) {
    const month = transactionDate.getMonth() + 1;
    const year = transactionDate.getFullYear();

    const budgets = await this.budgetRepository.findByUserMonthYear(userId, month, year);
    const relevant = budgets.filter(
      (b) => b.categoryId === categoryId || b.categoryId === null
    );

    for (const budget of relevant) {
      const enriched = await this.enrichBudget(budget, userId);
      const catName = budget.category?.name || 'Tổng chi tiêu';

      const level = enriched.percentage >= 100
        ? 'EXCEEDED'
        : enriched.percentage >= 80
          ? 'WARNING'
          : null;
      if (!level || !await this.budgetRepository.claimAlert(budget.id, level)) continue;

      try {
        await this.notificationService.create(userId, level === 'EXCEEDED' ? {
          title: 'Vượt ngân sách!',
          message: `Danh mục "${catName}" đã vượt ngân sách tháng ${month}/${year} (${enriched.percentage}%).`,
          type: NotificationType.BUDGET_ALERT,
        } : {
          title: 'Cảnh báo ngân sách',
          message: `Danh mục "${catName}" đã dùng ${enriched.percentage}% ngân sách tháng ${month}/${year}.`,
          type: NotificationType.BUDGET_ALERT,
        });
      } catch (error) {
        await this.budgetRepository.releaseAlert(budget.id, level);
        throw error;
      }
    }
  }
}
