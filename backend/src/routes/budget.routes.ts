import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { createBudgetSchema, updateBudgetSchema } from '../validators/budget.validator';

const router = Router();
const controller = new BudgetController();

router.use(authenticate);
router.post('/', validateRequest(createBudgetSchema), controller.createBudget);
router.get('/', controller.getBudgets);
router.get('/:id', controller.getBudget);
router.put('/:id', validateRequest(updateBudgetSchema), controller.updateBudget);
router.delete('/:id', controller.deleteBudget);

export default router;
