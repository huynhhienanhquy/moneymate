import { Response, NextFunction } from 'express';
import { AiService } from '../services/ai.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';
import { safeParseInt } from '../common/utils';

export class AiController {
  private aiService = new AiService();

  /**
   * Return status required by the ai workflow.
   *
   * Use it as the HTTP boundary for the ai route.
   * @param _req - The req value required by the operation.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getStatus = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      return sendSuccess(res, this.aiService.getStatus(), 'AI status retrieved');
    } catch (error) { next(error); }
  };

  /**
   * Analyze expenses for ai.
   *
   * Use it as the HTTP boundary for the ai route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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

  /**
   * Budget forecast for ai.
   *
   * Use it as the HTTP boundary for the ai route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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

  /**
   * Advisor insights for ai.
   *
   * Use it as the HTTP boundary for the ai route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public advisorInsights = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const result = await this.aiService.getAdvisorInsights(userId);
      return sendSuccess(res, result, 'Advisor insights generated');
    } catch (error) { next(error); }
  };

  /**
   * Scan receipt for ai.
   *
   * Use it as the HTTP boundary for the ai route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public scanReceipt = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      if (!req.file) throw new AppError('No file uploaded', 400);
      const result = await this.aiService.scanReceipt(userId, req.file);
      return sendSuccess(res, result, 'Receipt scanned successfully');
    } catch (error) { next(error); }
  };

  /**
   * Chat for ai.
   *
   * Use it as the HTTP boundary for the ai route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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
