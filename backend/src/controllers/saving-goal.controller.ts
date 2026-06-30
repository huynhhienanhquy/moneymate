import { Response, NextFunction } from 'express';
import { SavingGoalService } from '../services/saving-goal.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class SavingGoalController {
  private savingGoalService = new SavingGoalService();

  public createGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const goal = await this.savingGoalService.createGoal(userId, req.body);
      return sendSuccess(res, goal, 'Saving goal created successfully', 201);
    } catch (error) { next(error); }
  };

  public getGoals = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const goals = await this.savingGoalService.getGoals(userId);
      return sendSuccess(res, goals, 'Saving goals retrieved successfully');
    } catch (error) { next(error); }
  };

  public getGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const goal = await this.savingGoalService.getGoal(userId, req.params.id);
      return sendSuccess(res, goal, 'Saving goal retrieved successfully');
    } catch (error) { next(error); }
  };

  public updateGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const goal = await this.savingGoalService.updateGoal(userId, req.params.id, req.body);
      return sendSuccess(res, goal, 'Saving goal updated successfully');
    } catch (error) { next(error); }
  };

  public deleteGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.savingGoalService.deleteGoal(userId, req.params.id);
      return sendSuccess(res, null, 'Saving goal deleted successfully');
    } catch (error) { next(error); }
  };

  public deposit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const goal = await this.savingGoalService.deposit(userId, req.params.id, req.body);
      return sendSuccess(res, goal, 'Deposit successful');
    } catch (error) { next(error); }
  };

  public withdraw = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const goal = await this.savingGoalService.withdraw(userId, req.params.id, req.body);
      return sendSuccess(res, goal, 'Withdrawal successful');
    } catch (error) { next(error); }
  };
}
