import prisma from '../config/db';
import { CategoryType, TransactionType, Prisma } from '@prisma/client';
import { AppError } from '../common/app-error';
import { calculateNextDate } from '../common/recurrence';

export interface TransactionFilter {
  userId: string;
  walletId?: string;
  categoryId?: string;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  skip?: number;
  take?: number;
}

export interface TransactionSyncCursor {
  updatedAt: Date;
  id: string;
}

export class TransactionRepository {
  private async getProjectedRecurringAmount(
    userId: string,
    startDate: Date,
    endDate: Date,
    type: CategoryType
  ) {
    const transactionType = type === CategoryType.INCOME ? TransactionType.INCOME : TransactionType.EXPENSE;
    const recurringItems = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        type,
        startDate: { lte: endDate },
      },
      include: { category: true },
    });

    let total = 0;
    const byCategory: Record<string, { id: string; name: string; color: string; amount: number }> = {};

    for (const item of recurringItems) {
      let executionDate = new Date(item.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          deletedAt: null,
          OR: [
            { recurringTransactionId: item.id },
            {
              recurringTransactionId: null,
              walletId: item.walletId,
              categoryId: item.categoryId,
              type: transactionType,
              amount: item.amount,
            },
          ],
          transactionDate: { gte: startDate, lte: endDate },
        },
        select: { transactionDate: true },
      });
      const existingDates = new Set(
        existingTransactions.map((tx) => tx.transactionDate.toISOString().slice(0, 10))
      );

      while (executionDate <= endDate) {
        if (executionDate >= startDate && executionDate >= today) {
          const dateKey = executionDate.toISOString().slice(0, 10);
          if (existingDates.has(dateKey)) {
            executionDate = calculateNextDate(executionDate, item.frequency, item.startDate);
            continue;
          }

          const amount = Number(item.amount);
          total += amount;

          if (!byCategory[item.categoryId]) {
            byCategory[item.categoryId] = {
              id: item.categoryId,
              name: item.category.name,
              color: item.category.color,
              amount: 0,
            };
          }
          byCategory[item.categoryId].amount += amount;
        }
        executionDate = calculateNextDate(executionDate, item.frequency, item.startDate);
      }
    }

    return { total, byCategory };
  }

  private async getProjectedRecurringExpenses(userId: string, startDate: Date, endDate: Date) {
    return this.getProjectedRecurringAmount(userId, startDate, endDate, CategoryType.EXPENSE);
  }

  private async getProjectedRecurringIncome(userId: string, startDate: Date, endDate: Date) {
    return this.getProjectedRecurringAmount(userId, startDate, endDate, CategoryType.INCOME);
  }

  async create(data: {
    userId: string;
    walletId: string;
    categoryId: string;
    amount: number;
    type: TransactionType;
    note?: string;
    transactionDate: Date;
  }) {
    return prisma.transaction.create({
      data: {
        userId: data.userId,
        walletId: data.walletId,
        categoryId: data.categoryId,
        amount: new Prisma.Decimal(data.amount),
        type: data.type,
        note: data.note,
        transactionDate: data.transactionDate
      }
    });
  }

  async findById(id: string) {
    return prisma.transaction.findFirst({
      where: { id, deletedAt: null },
      include: {
        wallet: true,
        category: true
      }
    });
  }

  async findAll(filter: TransactionFilter) {
    const where: Prisma.TransactionWhereInput = {
      userId: filter.userId,
      deletedAt: null
    };

    if (filter.walletId) {
      where.walletId = filter.walletId;
    }

    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.startDate || filter.endDate) {
      where.transactionDate = {};
      if (filter.startDate) {
        where.transactionDate.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.transactionDate.lte = filter.endDate;
      }
    }

    if (filter.search) {
      where.note = {
        contains: filter.search
      };
    }

    const sortBy = filter.sortBy || 'transactionDate';
    const order = filter.order || 'desc';

    return prisma.transaction.findMany({
      where,
      orderBy: {
        [sortBy]: order
      },
      include: {
        wallet: { select: { name: true, type: true } },
        category: { select: { name: true, color: true, icon: true, type: true } }
      },
      skip: filter.skip,
      take: filter.take
    });
  }

  async count(filter: TransactionFilter): Promise<number> {
    const where: Prisma.TransactionWhereInput = {
      userId: filter.userId,
      deletedAt: null
    };

    if (filter.walletId) {
      where.walletId = filter.walletId;
    }

    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.startDate || filter.endDate) {
      where.transactionDate = {};
      if (filter.startDate) {
        where.transactionDate.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.transactionDate.lte = filter.endDate;
      }
    }

    if (filter.search) {
      where.note = {
        contains: filter.search
      };
    }

    return prisma.transaction.count({ where });
  }

  async update(id: string, data: {
    walletId?: string;
    categoryId?: string;
    amount?: number;
    type?: TransactionType;
    note?: string;
    transactionDate?: Date;
  }) {
    return prisma.transaction.update({
      where: { id },
      data: {
        walletId: data.walletId,
        categoryId: data.categoryId,
        amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
        type: data.type,
        note: data.note,
        transactionDate: data.transactionDate
      }
    });
  }

  async delete(id: string) {
    return prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date(), version: { increment: 1 } }
    });
  }

  async findSyncDelta(userId: string, cursor: TransactionSyncCursor | undefined, take: number) {
    return prisma.transaction.findMany({
      where: {
        userId,
        ...(cursor ? {
          OR: [
            { updatedAt: { gt: cursor.updatedAt } },
            { updatedAt: cursor.updatedAt, id: { gt: cursor.id } },
          ],
        } : {}),
      },
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take,
      select: {
        id: true,
        walletId: true,
        categoryId: true,
        amount: true,
        type: true,
        note: true,
        transactionDate: true,
        version: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  // Inter-wallet transfers executed as an atomic Prisma transaction
  async transferFunds(data: {
    userId: string;
    sourceWalletId: string;
    destinationWalletId: string;
    amount: number;
    note?: string;
    transferDate: Date;
    categoryId: string;
  }) {
    const amountDec = new Prisma.Decimal(data.amount);

    return prisma.$transaction(async (tx) => {
      const srcWallet = await tx.wallet.findUnique({
        where: { id: data.sourceWalletId }
      });
      const destWallet = await tx.wallet.findUnique({
        where: { id: data.destinationWalletId }
      });

      if (!srcWallet || srcWallet.userId !== data.userId || srcWallet.deletedAt) {
        throw new AppError('Source wallet not found or unauthorized', 404);
      }
      if (!destWallet || destWallet.userId !== data.userId || destWallet.deletedAt) {
        throw new AppError('Destination wallet not found or unauthorized', 404);
      }
      if (Number(srcWallet.initialBalance) < Number(data.amount)) {
        throw new AppError('Insufficient balance in source wallet', 400);
      }

      // Debit only if the balance is still sufficient at the moment of the write.
      const sourceDebit = await tx.wallet.updateMany({
        where: {
          id: data.sourceWalletId,
          userId: data.userId,
          deletedAt: null,
          initialBalance: { gte: amountDec },
        },
        data: { initialBalance: { decrement: amountDec } }
      });
      if (sourceDebit.count !== 1) {
        throw new AppError('Insufficient balance in source wallet', 400, [], 'INSUFFICIENT_WALLET_BALANCE');
      }

      // Credit Destination Wallet
      const destinationCredit = await tx.wallet.updateMany({
        where: { id: data.destinationWalletId, userId: data.userId, deletedAt: null },
        data: { initialBalance: { increment: amountDec } }
      });
      if (destinationCredit.count !== 1) {
        throw new AppError('Destination wallet not found or unauthorized', 404);
      }

      // Create corresponding Transaction records for both sides
      const srcTx = await tx.transaction.create({
        data: {
          userId: data.userId,
          walletId: data.sourceWalletId,
          categoryId: data.categoryId,
          amount: amountDec,
          type: TransactionType.TRANSFER,
          note: data.note ? `Chuyển tiền: ${data.note}` : 'Chuyển tiền',
          transactionDate: data.transferDate,
        }
      });

      await tx.transaction.create({
        data: {
          userId: data.userId,
          walletId: data.destinationWalletId,
          categoryId: data.categoryId,
          amount: amountDec,
          type: TransactionType.TRANSFER,
          note: data.note ? `Nhận tiền: ${data.note}` : 'Nhận tiền',
          transactionDate: data.transferDate,
        }
      });

      // Create a WalletTransfer record
      const transfer = await tx.walletTransfer.create({
        data: {
          userId: data.userId,
          sourceWalletId: data.sourceWalletId,
          destinationWalletId: data.destinationWalletId,
          amount: amountDec,
          note: data.note,
          transferDate: data.transferDate,
        }
      });

      return transfer;
    });
  }

  // Get Monthly Summary statistics (Income, Expense, Net)
  async getMonthlySummary(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        transactionDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { category: { select: { name: true } } }
    });

    let totalIncome = 0;
    let salaryIncome = 0;
    let otherIncome = 0;
    let actualExpense = 0;

    transactions.forEach((tx) => {
      const amountVal = Number(tx.amount);
      if (tx.type === TransactionType.INCOME) {
        totalIncome += amountVal;
        const categoryName = tx.category.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (categoryName === 'luong' || categoryName === 'salary') {
          salaryIncome += amountVal;
        } else {
          otherIncome += amountVal;
        }
      } else if (tx.type === TransactionType.EXPENSE) {
        actualExpense += amountVal;
      }
    });

    const recurringIncomeData = await this.getProjectedRecurringIncome(userId, startDate, endDate);
    const recurringIncome = recurringIncomeData.total;
    const recurring = await this.getProjectedRecurringExpenses(userId, startDate, endDate);
    const recurringExpense = recurring.total;
    const actualIncome = totalIncome;
    Object.values(recurringIncomeData.byCategory).forEach((category) => {
      const categoryName = category.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (categoryName === 'luong' || categoryName === 'salary') {
        salaryIncome += category.amount;
      } else {
        otherIncome += category.amount;
      }
    });
    totalIncome = actualIncome + recurringIncome;
    const totalExpense = actualExpense + recurringExpense;
    const remainingAmount = totalIncome - totalExpense;

    // Tổng số dư thực tế của tất cả ví tại cuối tháng này
    const walletBalance = await this.getWalletBalancesAtDate(userId, endDate);

    return {
      totalIncome,
      actualIncome,
      recurringIncome,
      salaryIncome,
      otherIncome,
      totalExpense,
      actualExpense,
      recurringExpense,
      netSavings: remainingAmount,
      remainingAmount,
      walletBalance,
    };
  }

  /**
   * initialBalance stores the live balance. Recover historical assets by reversing
   * later movements, using only wallets that existed at the requested cutoff.
   */
  async getWalletBalancesAtDate(userId: string, endDate: Date): Promise<number> {
    if (endDate >= new Date()) return this.getWalletBalanceTotal(userId);

    const wallets = await prisma.wallet.findMany({ where: {
      userId,
      createdAt: { lte: endDate },
      OR: [{ deletedAt: null }, { deletedAt: { gt: endDate } }],
    } });
    if (wallets.length === 0) return 0;
    const walletIds = wallets.map((wallet) => wallet.id);
    const walletIdSet = new Set(walletIds);
    const currentBalance = wallets.reduce((sum, wallet) => sum + Number(wallet.initialBalance), 0);

    const [incomeAgg, transfers, goalTransactions] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          deletedAt: null,
          walletId: { in: walletIds },
          type: TransactionType.INCOME,
          transactionDate: { gt: endDate },
        },
        _sum: { amount: true },
      }),
      prisma.walletTransfer.findMany({
        where: {
          userId,
          transferDate: { gt: endDate },
          OR: [{ sourceWalletId: { in: walletIds } }, { destinationWalletId: { in: walletIds } }],
        },
      }),
      prisma.goalTransaction.findMany({
        where: { walletId: { in: walletIds }, createdAt: { gt: endDate } },
      }),
    ]);

    const totalIncome = Number(incomeAgg._sum.amount ?? 0);
    const transferAdjustment = transfers.reduce((sum, transfer) => sum
      + (walletIdSet.has(transfer.sourceWalletId) ? Number(transfer.amount) : 0)
      - (walletIdSet.has(transfer.destinationWalletId) ? Number(transfer.amount) : 0), 0);
    const goalAdjustment = goalTransactions.reduce((sum, transaction) => sum
      + (transaction.type === 'DEPOSIT' ? Number(transaction.amount) : -Number(transaction.amount)), 0);
    return currentBalance - totalIncome + transferAdjustment + goalAdjustment;
  }



  // Get Category breakdown for Pie Chart
  async getCategoryBreakdown(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        type: TransactionType.EXPENSE,
        transactionDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        category: true
      }
    });

    const categoriesMap: Record<string, { id: string; name: string; color: string; amount: number }> = {};

    expenses.forEach((tx) => {
      const catId = tx.categoryId;
      const amountVal = Number(tx.amount);

      if (!categoriesMap[catId]) {
        categoriesMap[catId] = {
          id: catId,
          name: tx.category.name,
          color: tx.category.color,
          amount: 0
        };
      }
      categoriesMap[catId].amount += amountVal;
    });

    const recurring = await this.getProjectedRecurringExpenses(userId, startDate, endDate);
    Object.values(recurring.byCategory).forEach((cat) => {
      if (!categoriesMap[cat.id]) {
        categoriesMap[cat.id] = { ...cat };
      } else {
        categoriesMap[cat.id].amount += cat.amount;
      }
    });

    return Object.values(categoriesMap);
  }

  async getMonthlyTrend(userId: string, months: number) {
    const today = new Date();
    const trend = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const summary = await this.getMonthlySummary(userId, month, year);
      trend.push({
        month,
        year,
        label: `T${month}`,
        income: summary.walletBalance,
        actualIncome: summary.actualIncome,
        recurringIncome: summary.recurringIncome,
        expense: summary.totalExpense,
        remaining: summary.walletBalance - summary.totalExpense,
      });
    }

    return trend;
  }

  async getWalletBalanceTotal(userId: string): Promise<number> {
    const wallets = await prisma.wallet.findMany({ where: { userId, deletedAt: null } });
    return wallets.reduce((sum, wallet) => sum + Number(wallet.initialBalance), 0);
  }

  async getYearlySummary(userId: string, year: number) {
    const currentFormulaVersion = 9;
    const monthlyData = [];
    let totalIncome = 0;
    let totalExpense = 0;

    for (let month = 1; month <= 12; month++) {
      const now = new Date();
      const isClosedMonth = new Date(year, month - 1, 1) < new Date(now.getFullYear(), now.getMonth(), 1);
      // Recompute from the same history as the dashboard trend. A backdated
      // transaction changes the income/expense totals of its own month.
      const calculated = await this.getMonthlySummary(userId, month, year);
      const lockedWalletBalance = calculated.walletBalance;
      const monthlyIncome = calculated.salaryIncome + calculated.otherIncome;
      const monthlyExpense = calculated.totalExpense;
      const monthlySavings = monthlyIncome - monthlyExpense;

      if (isClosedMonth) {
        await prisma.monthlySavingsSnapshot.upsert({
          where: { userId_month_year: { userId, month, year } },
          update: {
            salaryIncome: calculated.salaryIncome,
            otherIncome: calculated.otherIncome,
            expense: monthlyExpense,
            savings: monthlySavings,
            walletBalance: lockedWalletBalance,
            formulaVersion: currentFormulaVersion,
          },
          create: {
            userId,
            month,
            year,
            salaryIncome: calculated.salaryIncome,
            otherIncome: calculated.otherIncome,
            expense: monthlyExpense,
            savings: monthlySavings,
            walletBalance: lockedWalletBalance,
            formulaVersion: currentFormulaVersion,
          },
        });
      }

      totalIncome += monthlyIncome;
      totalExpense += monthlyExpense;
      monthlyData.push({
        month,
        label: `T${month}`,
        income: monthlyIncome,
        salaryIncome: calculated.salaryIncome,
        otherIncome: calculated.otherIncome,
        walletBalance: lockedWalletBalance,
        expense: monthlyExpense,
        savings: monthlySavings,
        remaining: monthlySavings,
      });
    }

    return {
      year,
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      monthlyData,
    };
  }
}
