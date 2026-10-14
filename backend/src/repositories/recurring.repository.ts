import prisma from '../config/db';
import { CategoryType, Frequency, Prisma } from '@prisma/client';

export class RecurringRepository {
  /**
   * Create recurring for the recurring workflow.
   *
   * Use it from services that need recurring persistence.
   * @param data - The input data required to create recurring for the recurring workflow.
   * @returns A promise containing the resulting recurring value.
   */
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

  /**
   * Find by id in the recurring data source.
   *
   * Use it from services that need recurring persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting recurring value.
   */
  async findById(id: string) {
    return prisma.recurringTransaction.findUnique({
      where: { id },
      include: {
        wallet: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    });
  }

  /**
   * Find all by user id in the recurring data source.
   *
   * Use it from services that need recurring persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting recurring value.
   */
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

  /**
   * Find due transactions in the recurring data source.
   *
   * Use it from services that need recurring persistence.
   * @param beforeDate - The date or reporting period used by the operation.
   * @returns A promise containing the resulting recurring value.
   */
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

  /**
   * Update recurring while preserving the recurring workflow's rules.
   *
   * Use it from services that need recurring persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param data - The input data required to update recurring while preserving the recurring workflow's rules.
   * @returns A promise containing the resulting recurring value.
   */
  async update(id: string, data: Partial<{
    walletId: string;
    categoryId: string;
    amount: number;
    type: CategoryType;
    frequency: Frequency;
    note: string;
    startDate: Date;
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
        startDate: data.startDate,
        nextExecutionDate: data.nextExecutionDate,
        isActive: data.isActive,
      },
      include: {
        wallet: { select: { name: true } },
        category: { select: { name: true, color: true } },
      },
    });
  }

  /**
   * Delete recurring through the recurring workflow.
   *
   * Use it from services that need recurring persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting recurring value.
   */
  async delete(id: string) {
    return prisma.recurringTransaction.delete({ where: { id } });
  }
}
