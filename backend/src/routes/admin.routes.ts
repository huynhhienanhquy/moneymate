import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/admin';

const router = Router();
const controller = new AdminController();

router.use(authenticate, requireAdmin);

router.get('/users', controller.getAllUsers);
router.get('/users/:id', controller.getUser);
router.put('/users/:id', controller.updateUser);
router.delete('/users/:id', controller.deleteUser);

export default router;
