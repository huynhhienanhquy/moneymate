import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class NotificationController {
  private notificationService = new NotificationService();

  /**
   * Return notifications required by the notification workflow.
   *
   * Use it as the HTTP boundary for the notification route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const unreadOnly = req.query.unreadOnly === 'true';
      const result = await this.notificationService.getNotifications(userId, unreadOnly);
      return sendSuccess(res, result, 'Notifications retrieved');
    } catch (error) { next(error); }
  };

  /**
   * Mark as read for notification.
   *
   * Use it as the HTTP boundary for the notification route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.notificationService.markAsRead(userId, req.params.id);
      return sendSuccess(res, null, 'Notification marked as read');
    } catch (error) { next(error); }
  };

  /**
   * Mark all as read for notification.
   *
   * Use it as the HTTP boundary for the notification route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.notificationService.markAllAsRead(userId);
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) { next(error); }
  };

  /**
   * Register device for the notification workflow.
   *
   * Use it as the HTTP boundary for the notification route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public registerDevice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const result = await this.notificationService.registerDevice(userId, req.body);
      return sendSuccess(res, result, 'Device registered for notifications');
    } catch (error) { next(error); }
  };

  /**
   * Unregister device for notification.
   *
   * Use it as the HTTP boundary for the notification route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public unregisterDevice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.notificationService.unregisterDevice(userId, req.body.deviceId);
      return sendSuccess(res, null, 'Device notifications disabled');
    } catch (error) { next(error); }
  };

  /**
   * Delete notification through the notification workflow.
   *
   * Use it as the HTTP boundary for the notification route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public deleteNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.notificationService.deleteNotification(userId, req.params.id);
      return sendSuccess(res, null, 'Notification deleted');
    } catch (error) { next(error); }
  };
}
