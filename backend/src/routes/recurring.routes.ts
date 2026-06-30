import { Router } from 'express';
import { RecurringController } from '../controllers/recurring.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { createRecurringSchema, updateRecurringSchema } from '../validators/recurring.validator';

const router = Router();
const controller = new RecurringController();

router.use(authenticate);
router.post('/', validateRequest(createRecurringSchema), controller.create);
router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.put('/:id', validateRequest(updateRecurringSchema), controller.update);
router.patch('/:id/toggle', controller.toggle);
router.delete('/:id', controller.delete);

export default router;
