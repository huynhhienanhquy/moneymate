import { Response, NextFunction } from 'express';
import { SavingGoalService } from '../services/saving-goal.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class SavingGoalController {
  private savingGoalService = new SavingGoalService();

  /**
   * Create goal for the saving goal workflow.
   *
   * Use it as the HTTP boundary for the saving goal route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public createGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const goal = await this.savingGoalService.createGoal(userId, req.body);
      return sendSuccess(res, goal, 'Saving goal created successfully', 201);
    } catch (error) { next(error); }
  };

  /**
   * Return goals required by the saving goal workflow.
   *
   * Use it as the HTTP boundary for the saving goal route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getGoals = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const goals = await this.savingGoalService.getGoals(userId);
      return sendSuccess(res, goals, 'Saving goals retrieved successfully');
    } catch (error) { next(error); }
  };

  /**
   * Return goal required by the saving goal workflow.
   *
   * Use it as the HTTP boundary for the saving goal route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const goal = await this.savingGoalService.getGoal(userId, req.params.id);
      return sendSuccess(res, goal, 'Saving goal retrieved successfully');
    } catch (error) { next(error); }
  };

  /**
   * Update goal while preserving the saving goal workflow's rules.
   *
   * Use it as the HTTP boundary for the saving goal route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public updateGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const goal = await this.savingGoalService.updateGoal(userId, req.params.id, req.body);
      return sendSuccess(res, goal, 'Saving goal updated successfully');
    } catch (error) { next(error); }
  };

  /**
   * Delete goal through the saving goal workflow.
   *
   * Use it as the HTTP boundary for the saving goal route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public deleteGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.savingGoalService.deleteGoal(userId, req.params.id);
      return sendSuccess(res, null, 'Saving goal deleted successfully');
    } catch (error) { next(error); }
  };

  /**
   * Deposit for saving goal.
   *
   * Use it as the HTTP boundary for the saving goal route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public deposit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const goal = await this.savingGoalService.deposit(userId, req.params.id, req.body);
      return sendSuccess(res, goal, 'Deposit successful');
    } catch (error) { next(error); }
  };

  /**
   * Withdraw for saving goal.
   *
   * Use it as the HTTP boundary for the saving goal route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public withdraw = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const goal = await this.savingGoalService.withdraw(userId, req.params.id, req.body);
      return sendSuccess(res, goal, 'Withdrawal successful');
    } catch (error) { next(error); }
  };
}
