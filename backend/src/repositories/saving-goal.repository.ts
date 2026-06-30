import prisma from '../config/db';
import { GoalTransactionType, Prisma } from '@prisma/client';

export class SavingGoalRepository {
  async create(data: {
    userId: string;
    title: string;
    targetAmount: number;
    targetDate: Date;
  }) {
    return prisma.savingGoal.create({
      data: {
        userId: data.userId,
        title: data.title,
        targetAmount: new Prisma.Decimal(data.targetAmount),
        targetDate: data.targetDate,
      },
    });
  }

  async findById(id: string) {
    return prisma.savingGoal.findUnique({
      where: { id },
      include: {
        goalTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { wallet: { select: { name: true } } },
        },
      },
    });
  }

  async findAllByUserId(userId: string) {
    return prisma.savingGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: {
    title?: string;
    targetAmount?: number;
    targetDate?: Date;
  }) {
    return prisma.savingGoal.update({
      where: { id },
      data: {
        title: data.title,
        targetAmount: data.targetAmount !== undefined ? new Prisma.Decimal(data.targetAmount) : undefined,
        targetDate: data.targetDate,
      },
    });
  }

  async delete(id: string) {
    return prisma.savingGoal.delete({ where: { id } });
  }

  async addGoalTransaction(data: {
    savingGoalId: string;
    walletId: string;
    amount: number;
    type: GoalTransactionType;
  }) {
    const amountDec = new Prisma.Decimal(data.amount);
    return prisma.$transaction(async (tx) => {
      const goalTx = await tx.goalTransaction.create({
        data: {
          savingGoalId: data.savingGoalId,
          walletId: data.walletId,
          amount: amountDec,
          type: data.type,
        },
      });

      if (data.type === GoalTransactionType.DEPOSIT) {
        await tx.savingGoal.update({
          where: { id: data.savingGoalId },
          data: { currentAmount: { increment: amountDec } },
        });
        await tx.wallet.update({
          where: { id: data.walletId },
          data: { initialBalance: { decrement: amountDec } },
        });
      } else {
        await tx.savingGoal.update({
          where: { id: data.savingGoalId },
          data: { currentAmount: { decrement: amountDec } },
        });
        await tx.wallet.update({
          where: { id: data.walletId },
          data: { initialBalance: { increment: amountDec } },
        });
      }

      return goalTx;
    });
  }
}
