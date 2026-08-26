import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class NotificationController {
  private notificationService = new NotificationService();

  public getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const unreadOnly = req.query.unreadOnly === 'true';
      const result = await this.notificationService.getNotifications(userId, unreadOnly);
      return sendSuccess(res, result, 'Notifications retrieved');
    } catch (error) { next(error); }
  };

  public markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.notificationService.markAsRead(userId, req.params.id);
      return sendSuccess(res, null, 'Notification marked as read');
    } catch (error) { next(error); }
  };

  public markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.notificationService.markAllAsRead(userId);
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) { next(error); }
  };

  public registerDevice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      const result = await this.notificationService.registerDevice(userId, req.body);
      return sendSuccess(res, result, 'Device registered for notifications');
    } catch (error) { next(error); }
  };

  public unregisterDevice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.notificationService.unregisterDevice(userId, req.body.deviceId);
      return sendSuccess(res, null, 'Device notifications disabled');
    } catch (error) { next(error); }
  };

  public deleteNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);
      await this.notificationService.deleteNotification(userId, req.params.id);
      return sendSuccess(res, null, 'Notification deleted');
    } catch (error) { next(error); }
  };
}
