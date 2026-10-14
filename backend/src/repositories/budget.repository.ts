import prisma from '../config/db';
import { Prisma } from '@prisma/client';

export class BudgetRepository {
  /**
   * Create budget for the budget workflow.
   *
   * Use it from services that need budget persistence.
   * @param data - The input data required to create budget for the budget workflow.
   * @returns A promise containing the resulting budget value.
   */
  async create(data: {
    userId: string;
    categoryId?: string | null;
    amount: number;
    month: number;
    year: number;
  }) {
    return prisma.budget.create({
      data: {
        userId: data.userId,
        categoryId: data.categoryId ?? null,
        categoryScope: data.categoryId ?? 'GLOBAL',
        amount: new Prisma.Decimal(data.amount),
        month: data.month,
        year: data.year,
      },
      include: { category: { select: { name: true, color: true, type: true } } },
    });
  }

  /**
   * Find by id in the budget data source.
   *
   * Use it from services that need budget persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting budget value.
   */
  async findById(id: string) {
    return prisma.budget.findUnique({
      where: { id },
      include: { category: { select: { name: true, color: true, type: true } } },
    });
  }

  /**
   * Find by user month year in the budget data source.
   *
   * Use it from services that need budget persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @param month - The date or reporting period used by the operation.
   * @param year - The date or reporting period used by the operation.
   * @returns A promise containing the resulting budget value.
   */
  async findByUserMonthYear(userId: string, month: number, year: number) {
    return prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: { select: { name: true, color: true, type: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find duplicate in the budget data source.
   *
   * Use it from services that need budget persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @param categoryId - The stable identifier of the record targeted by the operation.
   * @param month - The date or reporting period used by the operation.
   * @param year - The date or reporting period used by the operation.
   * @param excludeId - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting budget value.
   */
  async findDuplicate(userId: string, categoryId: string | null, month: number, year: number, excludeId?: string) {
    return prisma.budget.findFirst({
      where: {
        userId,
        categoryId,
        month,
        year,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
  }

  /**
   * Update budget while preserving the budget workflow's rules.
   *
   * Use it from services that need budget persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param data - The input data required to update budget while preserving the budget workflow's rules.
   * @returns A promise containing the resulting budget value.
   */
  async update(id: string, data: { amount?: number; categoryId?: string | null }) {
    const resetAlerts = data.amount !== undefined || data.categoryId !== undefined;
    return prisma.budget.update({
      where: { id },
      data: {
        amount: data.amount !== undefined ? new Prisma.Decimal(data.amount) : undefined,
        categoryId: data.categoryId,
        categoryScope: data.categoryId !== undefined ? data.categoryId ?? 'GLOBAL' : undefined,
        warningNotified: resetAlerts ? false : undefined,
        exceededNotified: resetAlerts ? false : undefined,
      },
      include: { category: { select: { name: true, color: true, type: true } } },
    });
  }

  /**
   * Delete budget through the budget workflow.
   *
   * Use it from services that need budget persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting budget value.
   */
  async delete(id: string) {
    return prisma.budget.delete({ where: { id } });
  }

  /**
   * Claim alert for budget.
   *
   * Use it from services that need budget persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param level - The level value required by the operation.
   * @returns A promise containing the resulting budget value.
   */
  async claimAlert(id: string, level: 'WARNING' | 'EXCEEDED') {
    const field = level === 'WARNING' ? 'warningNotified' : 'exceededNotified';
    const result = await prisma.budget.updateMany({
      where: { id, [field]: false },
      data: { [field]: true },
    });
    return result.count === 1;
  }

  /**
   * Release alert for budget.
   *
   * Use it from services that need budget persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param level - The level value required by the operation.
   * @returns A promise that resolves after the operation completes.
   */
  async releaseAlert(id: string, level: 'WARNING' | 'EXCEEDED') {
    const field = level === 'WARNING' ? 'warningNotified' : 'exceededNotified';
    await prisma.budget.update({ where: { id }, data: { [field]: false } });
  }

  /**
   * Return spent amount required by the budget workflow.
   *
   * Use it from services that need budget persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @param categoryId - The stable identifier of the record targeted by the operation.
   * @param month - The date or reporting period used by the operation.
   * @param year - The date or reporting period used by the operation.
   * @returns A promise containing the resulting budget value.
   */
  async getSpentAmount(userId: string, categoryId: string | null, month: number, year: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
      type: 'EXPENSE',
      transactionDate: { gte: startDate, lte: endDate },
    };
    if (categoryId) where.categoryId = categoryId;

    const result = await prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
    });
    return Number(result._sum.amount || 0);
  }
}
