import { Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class AdminController {
  private adminService = new AdminService();

  /**
   * Return all users required by the admin workflow.
   *
   * Use it as the HTTP boundary for the admin route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getAllUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const users = await this.adminService.getAllUsers();
      return sendSuccess(res, users, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Return user required by the admin workflow.
   *
   * Use it as the HTTP boundary for the admin route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await this.adminService.getUser(req.params.id);
      return sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user while preserving the admin workflow's rules.
   *
   * Use it as the HTTP boundary for the admin route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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

  /**
   * Delete user through the admin workflow.
   *
   * Use it as the HTTP boundary for the admin route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
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
