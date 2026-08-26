import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class UserController {
  private userService = new UserService();

  public getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const profile = await this.userService.getProfile(userId);
      return sendSuccess(res, profile, 'User profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const profile = await this.userService.updateProfile(userId, req.body);
      return sendSuccess(res, profile, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  public changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const { currentPassword, newPassword } = req.body;
      await this.userService.changePassword(userId, currentPassword, newPassword);
      return sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  };

  public deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.userService.deleteAccount(userId, req.body.password);
      return sendSuccess(res, null, 'Account deleted successfully');
    } catch (error) { next(error); }
  };
}
