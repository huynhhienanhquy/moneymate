import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { chatSchema } from '../validators/ai.validator';
import { upload } from '../middlewares/upload';

const router = Router();
const controller = new AiController();

router.use(authenticate);

router.get('/status', controller.getStatus);
router.get('/analyze/expenses', controller.analyzeExpenses);
router.post('/analyze/expenses', controller.analyzeExpenses);
router.get('/budget/forecast', controller.budgetForecast);
router.get('/advisor/insights', controller.advisorInsights);
router.post('/receipt/scan', upload.single('file'), controller.scanReceipt);
router.post('/chat', validateRequest(chatSchema), controller.chat);

export default router;
