import { Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';
import { safeParseInt } from '../common/utils';
import { TransactionType } from '@prisma/client';

export class TransactionController {
  private transactionService = new TransactionService();

  public createTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const transaction = await this.transactionService.createTransaction(userId, req.body);
      return sendSuccess(res, transaction, 'Transaction recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public getTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      // Parse filters from query params
      const {
        walletId,
        categoryId,
        type,
        startDate,
        endDate,
        search,
        sortBy,
        order,
        skip,
        take
      } = req.query;

      const filters: any = {};
      if (walletId) filters.walletId = String(walletId);
      if (categoryId) filters.categoryId = String(categoryId);
      if (type) filters.type = type as TransactionType;
      if (startDate) filters.startDate = new Date(String(startDate));
      if (endDate) filters.endDate = new Date(String(endDate));
      if (search) filters.search = String(search);
      if (sortBy) filters.sortBy = String(sortBy);
      if (order) filters.order = order === 'asc' ? 'asc' : 'desc';
      if (skip) filters.skip = safeParseInt(skip);
      if (take) filters.take = safeParseInt(take);

      const result = await this.transactionService.getTransactions(userId, filters);
      return sendSuccess(res, result, 'Transactions retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  public getTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const transactionId = req.params.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const transaction = await this.transactionService.getTransaction(userId, transactionId);
      return sendSuccess(res, transaction, 'Transaction retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  public updateTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const transactionId = req.params.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const transaction = await this.transactionService.updateTransaction(userId, transactionId, req.body);
      return sendSuccess(res, transaction, 'Transaction updated successfully');
    } catch (error) {
      next(error);
    }
  };

  public deleteTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const transactionId = req.params.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const version = req.query.version ? safeParseInt(req.query.version) : undefined;
      await this.transactionService.deleteTransaction(userId, transactionId, version);
      return sendSuccess(res, null, 'Transaction deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  public transferFunds = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const transfer = await this.transactionService.transferBetweenWallets(userId, req.body);
      return sendSuccess(res, transfer, 'Funds transferred successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public getDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const dashboard = await this.transactionService.getDashboardSummary(userId);
      return sendSuccess(res, dashboard, 'Dashboard details loaded');
    } catch (error) {
      next(error);
    }
  };

  public getMonthlyReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      
      const month = safeParseInt(req.query.month) || new Date().getMonth() + 1;
      const year = safeParseInt(req.query.year) || new Date().getFullYear();

      const report = await this.transactionService.getMonthlyReport(userId, month, year);
      return sendSuccess(res, report, 'Monthly report details loaded');
    } catch (error) {
      next(error);
    }
  };

  public getMonthlyTrend = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const months = safeParseInt(req.query.months) || 6;
      const trend = await this.transactionService.getMonthlyTrend(userId, months);
      return sendSuccess(res, trend, 'Monthly trend loaded');
    } catch (error) {
      next(error);
    }
  };

  public getYearlyReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const year = safeParseInt(req.query.year) || new Date().getFullYear();
      const report = await this.transactionService.getYearlyReport(userId, year);
      return sendSuccess(res, report, 'Yearly report loaded');
    } catch (error) {
      next(error);
    }
  };

  public syncTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : undefined;
      const take = safeParseInt(req.query.take) || 100;
      return sendSuccess(res, await this.transactionService.syncTransactions(userId, cursor, take), 'Transaction sync delta retrieved');
    } catch (error) { next(error); }
  };
}
