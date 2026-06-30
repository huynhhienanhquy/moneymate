import { Router } from 'express';
import { SavingGoalController } from '../controllers/saving-goal.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import {
  createSavingGoalSchema,
  updateSavingGoalSchema,
  goalTransactionSchema,
} from '../validators/saving-goal.validator';

const router = Router();
const controller = new SavingGoalController();

router.use(authenticate);
router.post('/', validateRequest(createSavingGoalSchema), controller.createGoal);
router.get('/', controller.getGoals);
router.get('/:id', controller.getGoal);
router.put('/:id', validateRequest(updateSavingGoalSchema), controller.updateGoal);
router.delete('/:id', controller.deleteGoal);
router.post('/:id/deposit', validateRequest(goalTransactionSchema), controller.deposit);
router.post('/:id/withdraw', validateRequest(goalTransactionSchema), controller.withdraw);

export default router;
