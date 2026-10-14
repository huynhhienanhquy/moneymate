import { Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';
import { safeParseInt } from '../common/utils';
import { TransactionType } from '@prisma/client';

export class TransactionController {
  private transactionService = new TransactionService();

  /**
   * Create transaction for the transaction workflow.
   *
   * Use it as the HTTP boundary for the transaction route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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

  /**
   * Return transactions required by the transaction workflow.
   *
   * Use it as the HTTP boundary for the transaction route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

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
      } = req.query as unknown as {
        walletId?: string;
        categoryId?: string;
        type?: TransactionType;
        startDate?: Date;
        endDate?: Date;
        search?: string;
        sortBy: 'transactionDate' | 'amount' | 'createdAt' | 'updatedAt' | 'type';
        order: 'asc' | 'desc';
        skip: number;
        take: number;
      };

      const filters = {
        walletId,
        categoryId,
        type,
        startDate,
        endDate,
        search,
        sortBy,
        order,
        skip,
        take,
      };

      const result = await this.transactionService.getTransactions(userId, filters);
      return sendSuccess(res, result, 'Transactions retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Return transaction required by the transaction workflow.
   *
   * Use it as the HTTP boundary for the transaction route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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

  /**
   * Update transaction while preserving the transaction workflow's rules.
   *
   * Use it as the HTTP boundary for the transaction route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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

  /**
   * Delete transaction through the transaction workflow.
   *
   * Use it as the HTTP boundary for the transaction route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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

  /**
   * Transfer funds for transaction.
   *
   * Use it as the HTTP boundary for the transaction route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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

  /**
   * Return dashboard required by the transaction workflow.
   *
   * Use it as the HTTP boundary for the transaction route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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

  /**
   * Return monthly report required by the transaction workflow.
   *
   * Use it as the HTTP boundary for the transaction route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getMonthlyReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      
      const query = req.query as unknown as { month?: number; year?: number };
      const month = query.month ?? new Date().getMonth() + 1;
      const year = query.year ?? new Date().getFullYear();

      const report = await this.transactionService.getMonthlyReport(userId, month, year);
      return sendSuccess(res, report, 'Monthly report details loaded');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Return monthly trend required by the transaction workflow.
   *
   * Use it as the HTTP boundary for the transaction route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getMonthlyTrend = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const months = (req.query as unknown as { months: number }).months;
      const trend = await this.transactionService.getMonthlyTrend(userId, months);
      return sendSuccess(res, trend, 'Monthly trend loaded');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Return yearly report required by the transaction workflow.
   *
   * Use it as the HTTP boundary for the transaction route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getYearlyReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const year = (req.query as unknown as { year?: number }).year ?? new Date().getFullYear();
      const report = await this.transactionService.getYearlyReport(userId, year);
      return sendSuccess(res, report, 'Yearly report loaded');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Synchronize transactions with the transaction source of truth.
   *
   * Use it as the HTTP boundary for the transaction route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public syncTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
      const take = safeParseInt(req.query.take) || 100;
      return sendSuccess(res, await this.transactionService.syncTransactions(userId, cursor, take), 'Transaction sync delta retrieved');
    } catch (error) { next(error); }
  };
}
