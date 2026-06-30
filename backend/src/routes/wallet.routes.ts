import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { createWalletSchema, updateWalletSchema } from '../validators/wallet.validator';

const router = Router();
const controller = new WalletController();

router.use(authenticate);

router.post('/', validateRequest(createWalletSchema), controller.createWallet);
router.get('/', controller.getWallets);
router.get('/:id', controller.getWallet);
router.put('/:id', validateRequest(updateWalletSchema), controller.updateWallet);
router.delete('/:id', controller.deleteWallet);

export default router;
