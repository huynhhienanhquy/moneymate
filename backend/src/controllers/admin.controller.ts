import { Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class AdminController {
  private adminService = new AdminService();

  public getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const users = await this.adminService.getAllUsers();
      return sendSuccess(res, users, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  public getUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await this.adminService.getUser(req.params.id);
      return sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  public updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (req.params.id === req.user?.id) {
        throw new AppError('Cannot change your own role via admin panel. Use profile settings.', 400);
      }
      const user = await this.adminService.updateUser(req.params.id, req.body);
      return sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  };

  public deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (req.params.id === req.user?.id) {
        throw new AppError('Cannot delete your own account', 400);
      }
      await this.adminService.deleteUser(req.params.id);
      return sendSuccess(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
