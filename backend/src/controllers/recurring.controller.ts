import { Response, NextFunction } from 'express';
import { RecurringService } from '../services/recurring.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class RecurringController {
  private recurringService = new RecurringService();

  /**
   * Create recurring for the recurring workflow.
   *
   * Use it as the HTTP boundary for the recurring route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const item = await this.recurringService.createRecurring(userId, req.body);
      return sendSuccess(res, item, 'Recurring transaction created', 201);
    } catch (error) { next(error); }
  };

  /**
   * Return all required by the recurring workflow.
   *
   * Use it as the HTTP boundary for the recurring route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const items = await this.recurringService.getRecurringList(userId);
      return sendSuccess(res, items, 'Recurring transactions retrieved');
    } catch (error) { next(error); }
  };

  /**
   * Return one required by the recurring workflow.
   *
   * Use it as the HTTP boundary for the recurring route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getOne = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const item = await this.recurringService.getRecurring(userId, req.params.id);
      return sendSuccess(res, item, 'Recurring transaction retrieved');
    } catch (error) { next(error); }
  };

  /**
   * Update recurring while preserving the recurring workflow's rules.
   *
   * Use it as the HTTP boundary for the recurring route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const item = await this.recurringService.updateRecurring(userId, req.params.id, req.body);
      return sendSuccess(res, item, 'Recurring transaction updated');
    } catch (error) { next(error); }
  };

  /**
   * Delete recurring through the recurring workflow.
   *
   * Use it as the HTTP boundary for the recurring route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.recurringService.deleteRecurring(userId, req.params.id);
      return sendSuccess(res, null, 'Recurring transaction deleted');
    } catch (error) { next(error); }
  };

  /**
   * Toggle recurring in the recurring interface.
   *
   * Use it as the HTTP boundary for the recurring route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public toggle = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const item = await this.recurringService.toggleActive(userId, req.params.id);
      return sendSuccess(res, item, 'Recurring transaction toggled');
    } catch (error) { next(error); }
  };
}
