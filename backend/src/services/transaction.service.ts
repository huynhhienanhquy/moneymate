import { TransactionRepository, TransactionFilter } from '../repositories/transaction.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { BudgetService } from './budget.service';
import { AppError } from '../common/app-error';
import { TransactionType, CategoryType, Prisma } from '@prisma/client';
import prisma from '../config/db';

export class TransactionService {
  private transactionRepository = new TransactionRepository();
  private walletRepository = new WalletRepository();
  private categoryRepository = new CategoryRepository();
  private budgetService = new BudgetService();

  async createTransaction(userId: string, data: {
    walletId: string;
    categoryId: string;
    amount: number;
    type: TransactionType;
    note?: string;
    transactionDate: Date;
  }) {
    // 1. Verify wallet ownership
    const wallet = await this.walletRepository.findById(data.walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new AppError('Wallet not found or unauthorized', 404);
    }

    // 2. Verify category ownership/existence
    const category = await this.categoryRepository.findById(data.categoryId);
    if (!category || (category.userId !== null && category.userId !== userId)) {
      throw new AppError('Category not found or unauthorized', 404);
    }

    // 3. Category type must match transaction type
    if (
      (data.type === TransactionType.INCOME && category.type !== CategoryType.INCOME) ||
      (data.type === TransactionType.EXPENSE && category.type !== CategoryType.EXPENSE)
    ) {
      throw new AppError('Transaction type must match category type', 400);
    }

    // 4. Run database transaction to record transaction and update wallet balance
    const amountDec = new Prisma.Decimal(data.amount);
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: data.walletId,
          categoryId: data.categoryId,
          amount: amountDec,
          type: data.type,
          note: data.note,
          transactionDate: data.transactionDate
        },
        include: {
          wallet: { select: { name: true } },
          category: { select: { name: true, color: true } }
        }
      });

      // Update wallet balance
      if (data.type === TransactionType.INCOME) {
        await tx.wallet.update({
          where: { id: data.walletId },
          data: { initialBalance: { increment: amountDec } }
        });
      } else if (data.type === TransactionType.EXPENSE) {
        await tx.wallet.update({
          where: { id: data.walletId },
          data: { initialBalance: { decrement: amountDec } }
        });
      }

      return transaction;
    }).then(async (transaction) => {
      if (data.type === TransactionType.EXPENSE) {
        await this.budgetService.checkBudgetAlerts(userId, data.categoryId, data.transactionDate);
      }
      return transaction;
    });
  }

  async getTransactions(userId: string, query: Omit<TransactionFilter, 'userId'>) {
    const filter: TransactionFilter = { ...query, userId };
    const transactions = await this.transactionRepository.findAll(filter);
    const total = await this.transactionRepository.count(filter);

    return {
      transactions,
      pagination: {
        total,
        skip: query.skip || 0,
        take: query.take || 20
      }
    };
  }

  async getTransaction(userId: string, id: string) {
    const tx = await this.transactionRepository.findById(id);
    if (!tx || tx.userId !== userId) {
      throw new AppError('Transaction not found', 404);
    }
    return tx;
  }

  async updateTransaction(userId: string, id: string, data: {
    walletId?: string;
    categoryId?: string;
    amount?: number;
    type?: TransactionType;
    note?: string;
    transactionDate?: Date;
  }) {
    const oldTx = await this.getTransaction(userId, id);

    // Validate wallet and category if changed
    const targetWalletId = data.walletId || oldTx.walletId;
    const targetCategoryId = data.categoryId || oldTx.categoryId;

    if (data.walletId && data.walletId !== oldTx.walletId) {
      const wallet = await this.walletRepository.findById(data.walletId);
      if (!wallet || wallet.userId !== userId) {
        throw new AppError('Target wallet not found or unauthorized', 404);
      }
    }

    if (data.categoryId && data.categoryId !== oldTx.categoryId) {
      const category = await this.categoryRepository.findById(data.categoryId);
      if (!category || (category.userId !== null && category.userId !== userId)) {
        throw new AppError('Target category not found or unauthorized', 404);
      }
    }

    const oldAmount = new Prisma.Decimal(oldTx.amount);
    const newAmount = data.amount ? new Prisma.Decimal(data.amount) : oldAmount;
    const oldType = oldTx.type;
    const newType = data.type || oldType;

    return prisma.$transaction(async (tx) => {
      // 1. Reverse the old transaction balance change on the old wallet
      if (oldType === TransactionType.INCOME) {
        await tx.wallet.update({
          where: { id: oldTx.walletId },
          data: { initialBalance: { decrement: oldAmount } }
        });
      } else if (oldType === TransactionType.EXPENSE) {
        await tx.wallet.update({
          where: { id: oldTx.walletId },
          data: { initialBalance: { increment: oldAmount } }
        });
      }

      // 2. Perform the update
      const updatedTx = await tx.transaction.update({
        where: { id },
        data: {
          walletId: targetWalletId,
          categoryId: targetCategoryId,
          amount: newAmount,
          type: newType,
          note: data.note,
          transactionDate: data.transactionDate
        },
        include: {
          wallet: { select: { name: true } },
          category: { select: { name: true, color: true } }
        }
      });

      // 3. Apply the new transaction balance change on the new wallet
      if (newType === TransactionType.INCOME) {
        await tx.wallet.update({
          where: { id: targetWalletId },
          data: { initialBalance: { increment: newAmount } }
        });
      } else if (newType === TransactionType.EXPENSE) {
        await tx.wallet.update({
          where: { id: targetWalletId },
          data: { initialBalance: { decrement: newAmount } }
        });
      }

      return updatedTx;
    });
  }

  async deleteTransaction(userId: string, id: string) {
    const txVal = await this.getTransaction(userId, id);
    const amountDec = new Prisma.Decimal(txVal.amount);

    return prisma.$transaction(async (tx) => {
      await tx.transaction.delete({
        where: { id }
      });

      // Reverse balance change on wallet
      if (txVal.type === TransactionType.INCOME) {
        await tx.wallet.update({
          where: { id: txVal.walletId },
          data: { initialBalance: { decrement: amountDec } }
        });
      } else if (txVal.type === TransactionType.EXPENSE) {
        await tx.wallet.update({
          where: { id: txVal.walletId },
          data: { initialBalance: { increment: amountDec } }
        });
      }

      return true;
    });
  }

  async transferBetweenWallets(userId: string, data: {
    sourceWalletId: string;
    destinationWalletId: string;
    amount: number;
    note?: string;
    transferDate: Date;
  }) {
    if (data.sourceWalletId === data.destinationWalletId) {
      throw new AppError('Source and destination wallets must be different', 400);
    }
    if (data.amount <= 0) {
      throw new AppError('Amount must be positive and non-zero', 400);
    }

    const category = await this.categoryRepository.findFirst({ type: CategoryType.EXPENSE }, { name: 'asc' });
    const categoryId = category?.id || (await this.categoryRepository.findFirst({ type: CategoryType.INCOME }, { name: 'asc' }))?.id;
    if (!categoryId) throw new AppError('No category found for transfer', 500);

    return this.transactionRepository.transferFunds({
      userId,
      sourceWalletId: data.sourceWalletId,
      destinationWalletId: data.destinationWalletId,
      amount: data.amount,
      note: data.note,
      transferDate: data.transferDate,
      categoryId,
    });
  }

  async getDashboardSummary(userId: string) {
    // Current date values
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const wallets = await this.walletRepository.findAllByUserId(userId);
    const netWorth = wallets.reduce((sum, w) => sum + Number(w.initialBalance), 0);

    const monthlyStats = await this.transactionRepository.getMonthlySummary(userId, currentMonth, currentYear);
    
    // Top 5 recent transactions
    const recentTransactions = await this.transactionRepository.findAll({
      userId,
      take: 5,
      sortBy: 'transactionDate',
      order: 'desc'
    });

    return {
      netWorth,
      monthlyIncome: monthlyStats.totalIncome,
      monthlyExpense: monthlyStats.totalExpense,
      monthlySavings: monthlyStats.netSavings,
      recentTransactions
    };
  }

  async getMonthlyReport(userId: string, month: number, year: number) {
    const stats = await this.transactionRepository.getMonthlySummary(userId, month, year);
    const categoryBreakdown = await this.transactionRepository.getCategoryBreakdown(userId, month, year);

    return {
      month,
      year,
      summary: stats,
      categoryExpenses: categoryBreakdown
    };
  }

  async getMonthlyTrend(userId: string, months = 6) {
    const count = Math.min(Math.max(months, 1), 12);
    return this.transactionRepository.getMonthlyTrend(userId, count);
  }

  async getYearlyReport(userId: string, year: number) {
    const summary = await this.transactionRepository.getYearlySummary(userId, year);

    const yearlyCategories: Record<string, { id: string; name: string; color: string; amount: number }> = {};
    for (let month = 1; month <= 12; month++) {
      const breakdown = await this.transactionRepository.getCategoryBreakdown(userId, month, year);
      breakdown.forEach((cat) => {
        if (!yearlyCategories[cat.id]) {
          yearlyCategories[cat.id] = { ...cat };
        } else {
          yearlyCategories[cat.id].amount += cat.amount;
        }
      });
    }

    return {
      ...summary,
      categoryExpenses: Object.values(yearlyCategories).sort((a, b) => b.amount - a.amount),
    };
  }
}
