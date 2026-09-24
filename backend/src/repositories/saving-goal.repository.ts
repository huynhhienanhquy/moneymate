import prisma from '../config/db';
import { GoalTransactionType, Prisma } from '@prisma/client';
import { AppError } from '../common/app-error';

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

  async deleteIfUnused(id: string, userId: string) {
    const result = await prisma.savingGoal.deleteMany({
      where: {
        id,
        userId,
        currentAmount: { equals: new Prisma.Decimal(0) },
        goalTransactions: { none: {} },
      },
    });
    return result.count === 1;
  }

  async addGoalTransaction(data: {
    userId: string;
    savingGoalId: string;
    walletId: string;
    amount: number;
    type: GoalTransactionType;
  }) {
    const amountDec = new Prisma.Decimal(data.amount);
    return prisma.$transaction(async (tx) => {
      if (data.type === GoalTransactionType.DEPOSIT) {
        const walletDebit = await tx.wallet.updateMany({
          where: {
            id: data.walletId,
            userId: data.userId,
            initialBalance: { gte: amountDec },
          },
          data: { initialBalance: { decrement: amountDec } },
        });
        if (walletDebit.count !== 1) {
          throw new AppError('Insufficient wallet balance', 400, [], 'INSUFFICIENT_WALLET_BALANCE');
        }

        const goalCredit = await tx.savingGoal.updateMany({
          where: { id: data.savingGoalId, userId: data.userId },
          data: { currentAmount: { increment: amountDec } },
        });
        if (goalCredit.count !== 1) {
          throw new AppError('Saving goal not found', 404);
        }
      } else {
        const goalDebit = await tx.savingGoal.updateMany({
          where: {
            id: data.savingGoalId,
            userId: data.userId,
            currentAmount: { gte: amountDec },
          },
          data: { currentAmount: { decrement: amountDec } },
        });
        if (goalDebit.count !== 1) {
          throw new AppError('Insufficient goal balance', 400, [], 'INSUFFICIENT_GOAL_BALANCE');
        }

        const walletCredit = await tx.wallet.updateMany({
          where: { id: data.walletId, userId: data.userId },
          data: { initialBalance: { increment: amountDec } },
        });
        if (walletCredit.count !== 1) {
          throw new AppError('Wallet not found', 404);
        }
      }

      const goalTx = await tx.goalTransaction.create({
        data: {
          savingGoalId: data.savingGoalId,
          walletId: data.walletId,
          amount: amountDec,
          type: data.type,
        },
      });

      return goalTx;
    });
  }
}
