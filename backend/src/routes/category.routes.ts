import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';

const router = Router();
const controller = new CategoryController();

router.use(authenticate);

router.post('/', validateRequest(createCategorySchema), controller.createCategory);
router.get('/', controller.getCategories);
router.get('/:id', controller.getCategory);
router.put('/:id', validateRequest(updateCategorySchema), controller.updateCategory);
router.delete('/:id', controller.deleteCategory);

export default router;
