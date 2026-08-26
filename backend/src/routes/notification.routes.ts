import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { registerDeviceSchema, unregisterDeviceSchema } from '../validators/notification.validator';

const router = Router();
const controller = new NotificationController();

router.use(authenticate);
router.post('/devices', validateRequest(registerDeviceSchema), controller.registerDevice);
router.delete('/devices', validateRequest(unregisterDeviceSchema), controller.unregisterDevice);
router.get('/', controller.getNotifications);
router.patch('/read-all', controller.markAllAsRead);
router.patch('/:id/read', controller.markAsRead);
router.delete('/:id', controller.deleteNotification);

export default router;
