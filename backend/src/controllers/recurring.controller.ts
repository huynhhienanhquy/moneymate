import { Response, NextFunction } from 'express';
import { RecurringService } from '../services/recurring.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class RecurringController {
  private recurringService = new RecurringService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const item = await this.recurringService.createRecurring(userId, req.body);
      return sendSuccess(res, item, 'Recurring transaction created', 201);
    } catch (error) { next(error); }
  };

  public getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const items = await this.recurringService.getRecurringList(userId);
      return sendSuccess(res, items, 'Recurring transactions retrieved');
    } catch (error) { next(error); }
  };

  public getOne = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const item = await this.recurringService.getRecurring(userId, req.params.id);
      return sendSuccess(res, item, 'Recurring transaction retrieved');
    } catch (error) { next(error); }
  };

  public update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const item = await this.recurringService.updateRecurring(userId, req.params.id, req.body);
      return sendSuccess(res, item, 'Recurring transaction updated');
    } catch (error) { next(error); }
  };

  public delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.recurringService.deleteRecurring(userId, req.params.id);
      return sendSuccess(res, null, 'Recurring transaction deleted');
    } catch (error) { next(error); }
  };

  public toggle = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const item = await this.recurringService.toggleActive(userId, req.params.id);
      return sendSuccess(res, item, 'Recurring transaction toggled');
    } catch (error) { next(error); }
  };
}
