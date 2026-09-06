import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { authenticate } from '../middlewares/auth';
import { createAuthRateLimitMiddleware } from '../middlewares/auth-rate-limit';

const router = Router();
const controller = new AuthController();
const registerRateLimit = createAuthRateLimitMiddleware('register');
const loginRateLimit = createAuthRateLimitMiddleware('login');

router.post('/register', registerRateLimit, validateRequest(registerSchema), controller.register);
router.post('/login', loginRateLimit, validateRequest(loginSchema), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/sessions', authenticate, controller.listSessions);
router.delete('/sessions/:id', authenticate, controller.revokeSession);
router.delete('/sessions', authenticate, controller.revokeAllSessions);

export default router;
