import { RecurringRepository } from '../repositories/recurring.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { NotificationService } from './notification.service';
import { AppError } from '../common/app-error';
import { CategoryType, Frequency, NotificationType, TransactionType, Prisma } from '@prisma/client';
import prisma from '../config/db';

export function calculateNextDate(current: Date, frequency: Frequency): Date {
  const next = new Date(current);
  switch (frequency) {
    case Frequency.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case Frequency.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case Frequency.MONTHLY:
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      if (next.getDate() !== 1) next.setDate(0);
      break;
    case Frequency.YEARLY:
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export class RecurringService {
  private recurringRepository = new RecurringRepository();
  private walletRepository = new WalletRepository();
  private categoryRepository = new CategoryRepository();
  private notificationService = new NotificationService();

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
    isActive: boolean;
  }>) {
    await this.getRecurring(userId, id);
    if (data.amount !== undefined && data.amount <= 0) {
      throw new AppError('Amount must be positive', 400);
    }
    return this.recurringRepository.update(id, data);
  }

  async deleteRecurring(userId: string, id: string) {
    await this.getRecurring(userId, id);
    await this.recurringRepository.delete(id);
    return true;
  }

  async toggleActive(userId: string, id: string) {
    const item = await this.getRecurring(userId, id);
    return this.recurringRepository.update(id, { isActive: !item.isActive });
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

        while (executionDate <= today) {
          generatedDates.push(new Date(executionDate));
          executionDate = calculateNextDate(executionDate, item.frequency);
        }

        if (generatedDates.length === 0) continue;

        await prisma.$transaction(async (tx) => {
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
              },
            });

            if (txType === TransactionType.INCOME) {
              await tx.wallet.update({
                where: { id: item.walletId },
                data: { initialBalance: { increment: amountDec } },
              });
            } else {
              await tx.wallet.update({
                where: { id: item.walletId },
                data: { initialBalance: { decrement: amountDec } },
              });
            }
          }

          await tx.recurringTransaction.update({
            where: { id: item.id },
            data: { nextExecutionDate: executionDate },
          });
        });

        await this.notificationService.create(item.userId, {
          title: 'Giao dịch định kỳ',
          message: `Đã tạo giao dịch "${item.category.name}" - ${Number(item.amount).toLocaleString('vi-VN')} VND.`,
          type: NotificationType.RECURRING_TRANSACTION,
        });

        processed += generatedDates.length;
      } catch (err) {
        console.error(`Failed to process recurring transaction ${item.id}:`, err);
      }
    }

    return processed;
  }
}
