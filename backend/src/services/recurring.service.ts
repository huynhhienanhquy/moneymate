import { RecurringRepository } from '../repositories/recurring.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { NotificationService } from './notification.service';
import { BudgetService } from './budget.service';
import { AppError } from '../common/app-error';
import { CategoryType, Frequency, NotificationType, TransactionType, Prisma } from '@prisma/client';
import prisma from '../config/db';
import { calculateNextDate } from '../common/recurrence';

export { calculateNextDate } from '../common/recurrence';

export const MAX_RECURRING_OCCURRENCES_PER_RUN = 100;

export class RecurringService {
  private recurringRepository = new RecurringRepository();
  private walletRepository = new WalletRepository();
  private categoryRepository = new CategoryRepository();
  private notificationService = new NotificationService();
  private budgetService = new BudgetService();

  async createRecurring(userId: string, data: {
    walletId: string;
    categoryId: string;
    amount: number;
    type: CategoryType;
    frequency: Frequency;
    note?: string;
    startDate: Date;
  }) {
    if (data.amount <= 0) throw new AppError('Amount must be positive', 400);

    const wallet = await this.walletRepository.findById(data.walletId);
    if (!wallet || wallet.userId !== userId) throw new AppError('Wallet not found', 404);

    const category = await this.categoryRepository.findById(data.categoryId);
    if (!category || (category.userId !== null && category.userId !== userId)) {
      throw new AppError('Category not found', 404);
    }
    if (category.type !== data.type) {
      throw new AppError('Category type must match transaction type', 400);
    }

    return this.recurringRepository.create({
      userId,
      ...data,
      nextExecutionDate: data.startDate,
    });
  }

  async getRecurringList(userId: string) {
    return this.recurringRepository.findAllByUserId(userId);
  }

  async getRecurring(userId: string, id: string) {
    const item = await this.recurringRepository.findById(id);
    if (!item || item.userId !== userId) throw new AppError('Recurring transaction not found', 404);
    return item;
  }

  async updateRecurring(userId: string, id: string, data: Partial<{
    walletId: string;
    categoryId: string;
    amount: number;
    type: CategoryType;
    frequency: Frequency;
    note: string;
    startDate: Date;
    isActive: boolean;
  }>) {
    const current = await this.getRecurring(userId, id);
    if (data.amount !== undefined && data.amount <= 0) {
      throw new AppError('Amount must be positive', 400);
    }

    const targetWalletId = data.walletId ?? current.walletId;
    const targetCategoryId = data.categoryId ?? current.categoryId;
    const targetType = data.type ?? current.type;

    const wallet = await this.walletRepository.findById(targetWalletId);
    if (!wallet || wallet.userId !== userId) {
      throw new AppError('Wallet not found or unauthorized', 404);
    }

    const category = await this.categoryRepository.findById(targetCategoryId);
    if (!category || (category.userId !== null && category.userId !== userId)) {
      throw new AppError('Category not found or unauthorized', 404);
    }
    if (category.type !== targetType) {
      throw new AppError('Category type must match transaction type', 400);
    }

    const resumedAt = !current.isActive && data.isActive === true ? new Date() : null;

    return this.recurringRepository.update(id, {
      ...data,
      ...(data.startDate ? { nextExecutionDate: data.startDate } : {}),
      ...(resumedAt ? { startDate: resumedAt, nextExecutionDate: resumedAt } : {}),
    });
  }

  async deleteRecurring(userId: string, id: string) {
    await this.getRecurring(userId, id);
    await this.recurringRepository.delete(id);
    return true;
  }

  async toggleActive(userId: string, id: string) {
    const item = await this.getRecurring(userId, id);
    const resumedAt = !item.isActive ? new Date() : null;
    if (resumedAt) {
      const wallet = await this.walletRepository.findById(item.walletId);
      if (!wallet || wallet.userId !== userId) throw new AppError('Wallet not found', 404);
    }
    return this.recurringRepository.update(id, {
      isActive: !item.isActive,
      // Restart both the execution cursor and recurrence anchor to skip the pause.
      ...(resumedAt ? { startDate: resumedAt, nextExecutionDate: resumedAt } : {}),
    });
  }

  /** Process all due recurring transactions (called by cron) */
  async processDueTransactions() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dueItems = await this.recurringRepository.findDueTransactions(today);
    let processed = 0;

    for (const item of dueItems) {
      try {
        const amountDec = new Prisma.Decimal(item.amount);
        const txType = item.type === CategoryType.INCOME ? TransactionType.INCOME : TransactionType.EXPENSE;
        const generatedDates: Date[] = [];
        let executionDate = new Date(item.nextExecutionDate);

        while (executionDate <= today && generatedDates.length < MAX_RECURRING_OCCURRENCES_PER_RUN) {
          generatedDates.push(new Date(executionDate));
          executionDate = calculateNextDate(executionDate, item.frequency, item.startDate);
        }

        if (generatedDates.length === 0) continue;

        const claimed = await prisma.$transaction(async (tx) => {
          const claim = await tx.recurringTransaction.updateMany({
            where: {
              id: item.id,
              isActive: true,
              nextExecutionDate: item.nextExecutionDate,
            },
            data: { nextExecutionDate: executionDate },
          });
          if (claim.count !== 1) return false;

          const [ownedWallet, accessibleCategory] = await Promise.all([
            tx.wallet.findFirst({
              where: { id: item.walletId, userId: item.userId, deletedAt: null },
              select: { id: true },
            }),
            tx.category.findFirst({
              where: {
                id: item.categoryId,
                type: item.type,
                OR: [{ userId: item.userId }, { userId: null }],
              },
              select: { id: true },
            }),
          ]);
          if (!ownedWallet || !accessibleCategory) {
            throw new AppError('Recurring transaction references an unauthorized wallet or category', 400);
          }

          for (const transactionDate of generatedDates) {
            await tx.transaction.create({
              data: {
                userId: item.userId,
                walletId: item.walletId,
                categoryId: item.categoryId,
                amount: amountDec,
                type: txType,
                note: item.note || `Giao dịch định kỳ: ${item.category.name}`,
                transactionDate,
                recurringTransactionId: item.id,
              },
            });

            if (txType === TransactionType.INCOME) {
              const result = await tx.wallet.updateMany({
                where: { id: item.walletId, userId: item.userId, deletedAt: null },
                data: { initialBalance: { increment: amountDec } },
              });
              if (result.count !== 1) throw new AppError('Wallet not found', 404);
            }
          }

          const closedPeriods = Array.from(new Map(generatedDates
            .filter((date) => date < new Date(today.getFullYear(), today.getMonth(), 1))
            .map((date) => [`${date.getFullYear()}-${date.getMonth() + 1}`, {
              year: date.getFullYear(), month: date.getMonth() + 1,
            }])).values());
          if (closedPeriods.length > 0) {
            await tx.monthlySavingsSnapshot.deleteMany({
              where: { userId: item.userId, OR: closedPeriods },
            });
          }

          return true;
        });

        if (!claimed) continue;

        processed += generatedDates.length;
        if (txType === TransactionType.EXPENSE) {
          const periods = Array.from(new Map(generatedDates.map((date) => [
            `${date.getFullYear()}-${date.getMonth() + 1}`,
            date,
          ])).values());
          for (const transactionDate of periods) {
            try {
              await this.budgetService.checkBudgetAlerts(item.userId, item.categoryId, transactionDate);
            } catch (error) {
              console.error('Budget alert processing failed after recurring transaction commit', {
                userId: item.userId,
                recurringTransactionId: item.id,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }
        }

        try {
          await this.notificationService.create(item.userId, {
            title: 'Giao dịch định kỳ',
            message: `Đã tạo giao dịch "${item.category.name}" - ${Number(item.amount).toLocaleString('vi-VN')} VND.`,
            type: NotificationType.RECURRING_TRANSACTION,
          });
        } catch (error) {
          console.error('Recurring notification creation failed after transaction commit', {
            userId: item.userId,
            recurringTransactionId: item.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } catch (err) {
        console.error(`Failed to process recurring transaction ${item.id}:`, err);
      }
    }

    return processed;
  }
}
