import { Response, NextFunction } from 'express';
import { AiService } from '../services/ai.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';
import { safeParseInt } from '../common/utils';

export class AiController {
  private aiService = new AiService();

  public getStatus = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      return sendSuccess(res, this.aiService.getStatus(), 'AI status retrieved');
    } catch (error) { next(error); }
  };

  public analyzeExpenses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const month = safeParseInt(req.query.month) ?? req.body?.month;
      const year = safeParseInt(req.query.year) ?? req.body?.year;
      const result = await this.aiService.analyzeExpenses(userId, month, year);
      return sendSuccess(res, result, 'Expense analysis completed');
    } catch (error) { next(error); }
  };

  public budgetForecast = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const month = safeParseInt(req.query.month);
      const year = safeParseInt(req.query.year);
      const result = await this.aiService.budgetForecast(userId, month, year);
      return sendSuccess(res, result, 'Budget forecast generated');
    } catch (error) { next(error); }
  };

  public advisorInsights = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const result = await this.aiService.getAdvisorInsights(userId);
      return sendSuccess(res, result, 'Advisor insights generated');
    } catch (error) { next(error); }
  };

  public scanReceipt = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      if (!req.file) throw new AppError('No file uploaded', 400);
      const result = await this.aiService.scanReceipt(userId, req.file);
      return sendSuccess(res, result, 'Receipt scanned successfully');
    } catch (error) { next(error); }
  };

  public chat = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const { message, history } = req.body;
      const result = await this.aiService.chat(userId, message, history);
      return sendSuccess(res, result, 'Chat response generated');
    } catch (error) { next(error); }
  };
}
