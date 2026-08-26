import prisma from '../config/db';
import { Prisma } from '@prisma/client';

export class BudgetRepository {
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
        amount: new Prisma.Decimal(data.amount),
        month: data.month,
        year: data.year,
      },
      include: { category: { select: { name: true, color: true, type: true } } },
    });
  }

  async findById(id: string) {
    return prisma.budget.findUnique({
      where: { id },
      include: { category: { select: { name: true, color: true, type: true } } },
    });
  }

  async findByUserMonthYear(userId: string, month: number, year: number) {
    return prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: { select: { name: true, color: true, type: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

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

  async update(id: string, data: { amount?: number; categoryId?: string | null }) {
    return prisma.budget.update({
      where: { id },
      data: {
        amount: data.amount !== undefined ? new Prisma.Decimal(data.amount) : undefined,
        categoryId: data.categoryId,
      },
      include: { category: { select: { name: true, color: true, type: true } } },
    });
  }

  async delete(id: string) {
    return prisma.budget.delete({ where: { id } });
  }

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
