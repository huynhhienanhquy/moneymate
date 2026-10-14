import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class UserController {
  private userService = new UserService();

  /**
   * Return profile required by the user workflow.
   *
   * Use it as the HTTP boundary for the user route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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

  /**
   * Update profile while preserving the user workflow's rules.
   *
   * Use it as the HTTP boundary for the user route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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

  /**
   * Change password for user.
   *
   * Use it as the HTTP boundary for the user route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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

  /**
   * Delete account through the user workflow.
   *
   * Use it as the HTTP boundary for the user route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.userService.deleteAccount(userId, req.body.password);
      return sendSuccess(res, null, 'Account deleted successfully');
    } catch (error) { next(error); }
  };
}
