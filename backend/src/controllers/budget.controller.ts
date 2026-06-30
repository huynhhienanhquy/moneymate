import { Response, NextFunction } from 'express';
import { BudgetService } from '../services/budget.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';
import { safeParseInt } from '../common/utils';

export class BudgetController {
  private budgetService = new BudgetService();

  public createBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const budget = await this.budgetService.createBudget(userId, req.body);
      return sendSuccess(res, budget, 'Budget created successfully', 201);
    } catch (error) { next(error); }
  };

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

  public getBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const budget = await this.budgetService.getBudget(userId, req.params.id);
      return sendSuccess(res, budget, 'Budget retrieved successfully');
    } catch (error) { next(error); }
  };

  public updateBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const budget = await this.budgetService.updateBudget(userId, req.params.id, req.body);
      return sendSuccess(res, budget, 'Budget updated successfully');
    } catch (error) { next(error); }
  };

  public deleteBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.budgetService.deleteBudget(userId, req.params.id);
      return sendSuccess(res, null, 'Budget deleted successfully');
    } catch (error) { next(error); }
  };
}
