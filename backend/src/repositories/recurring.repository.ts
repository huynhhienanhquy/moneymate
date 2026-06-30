import prisma from '../config/db';
import { CategoryType, Frequency, Prisma } from '@prisma/client';

export class RecurringRepository {
  async create(data: {
    userId: string;
    walletId: string;
    categoryId: string;
    amount: number;
    type: CategoryType;
    frequency: Frequency;
    note?: string;
    startDate: Date;
    nextExecutionDate: Date;
  }) {
    return prisma.recurringTransaction.create({
      data: {
        userId: data.userId,
        walletId: data.walletId,
        categoryId: data.categoryId,
        amount: new Prisma.Decimal(data.amount),
        type: data.type,
        frequency: data.frequency,
        note: data.note,
        startDate: data.startDate,
        nextExecutionDate: data.nextExecutionDate,
      },
      include: {
        wallet: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.recurringTransaction.findUnique({
      where: { id },
      include: {
        wallet: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    });
  }

  async findAllByUserId(userId: string) {
    return prisma.recurringTransaction.findMany({
      where: { userId },
      include: {
        wallet: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
      orderBy: { nextExecutionDate: 'asc' },
    });
  }

  async findDueTransactions(beforeDate: Date) {
    return prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        nextExecutionDate: { lte: beforeDate },
      },
      include: {
        wallet: true,
        category: true,
        user: true,
      },
    });
  }

  async update(id: string, data: Partial<{
    walletId: string;
    categoryId: string;
    amount: number;
    type: CategoryType;
    frequency: Frequency;
    note: string;
    nextExecutionDate: Date;
    isActive: boolean;
  }>) {
    return prisma.recurringTransaction.update({
      where: { id },
      data: {
        walletId: data.walletId,
        categoryId: data.categoryId,
        amount: data.amount !== undefined ? new Prisma.Decimal(data.amount) : undefined,
        type: data.type,
        frequency: data.frequency,
        note: data.note,
        nextExecutionDate: data.nextExecutionDate,
        isActive: data.isActive,
      },
      include: {
        wallet: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.recurringTransaction.delete({ where: { id } });
  }
}
