import { Response, NextFunction } from 'express';
import { BudgetService } from '../services/budget.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';
import { safeParseInt } from '../common/utils';

export class BudgetController {
  private budgetService = new BudgetService();

  /**
   * Create budget for the budget workflow.
   *
   * Use it as the HTTP boundary for the budget route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public createBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const budget = await this.budgetService.createBudget(userId, req.body);
      return sendSuccess(res, budget, 'Budget created successfully', 201);
    } catch (error) { next(error); }
  };

  /**
   * Return budgets required by the budget workflow.
   *
   * Use it as the HTTP boundary for the budget route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getBudgets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const month = safeParseInt(req.query.month) || new Date().getMonth() + 1;
      const year = safeParseInt(req.query.year) || new Date().getFullYear();
      const budgets = await this.budgetService.getBudgets(userId, month, year);
      return sendSuccess(res, budgets, 'Budgets retrieved successfully');
    } catch (error) { next(error); }
  };

  /**
   * Return budget required by the budget workflow.
   *
   * Use it as the HTTP boundary for the budget route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const budget = await this.budgetService.getBudget(userId, req.params.id);
      return sendSuccess(res, budget, 'Budget retrieved successfully');
    } catch (error) { next(error); }
  };

  /**
   * Update budget while preserving the budget workflow's rules.
   *
   * Use it as the HTTP boundary for the budget route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public updateBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const budget = await this.budgetService.updateBudget(userId, req.params.id, req.body);
      return sendSuccess(res, budget, 'Budget updated successfully');
    } catch (error) { next(error); }
  };

  /**
   * Delete budget through the budget workflow.
   *
   * Use it as the HTTP boundary for the budget route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public deleteBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.budgetService.deleteBudget(userId, req.params.id);
      return sendSuccess(res, null, 'Budget deleted successfully');
    } catch (error) { next(error); }
  };
}
