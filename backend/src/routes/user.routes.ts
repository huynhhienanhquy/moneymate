import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { updateProfileSchema, changePasswordSchema, deleteAccountSchema } from '../validators/user.validator';

const router = Router();
const controller = new UserController();

router.get('/profile', authenticate, controller.getProfile);
router.put('/profile', authenticate, validateRequest(updateProfileSchema), controller.updateProfile);
router.put('/change-password', authenticate, validateRequest(changePasswordSchema), controller.changePassword);
router.delete('/profile', authenticate, validateRequest(deleteAccountSchema), controller.deleteAccount);

export default router;
