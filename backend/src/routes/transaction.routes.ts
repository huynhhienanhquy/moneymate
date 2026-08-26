import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import {
  createTransactionSchema,
  deleteTransactionSchema,
  transactionSyncSchema,
  updateTransactionSchema,
  walletTransferSchema
} from '../validators/transaction.validator';
import { idempotency } from '../middlewares/idempotency';

const router = Router();
const controller = new TransactionController();

router.use(authenticate);

// Static paths first
router.post('/transfer', validateRequest(walletTransferSchema), idempotency, controller.transferFunds);
router.get('/dashboard', controller.getDashboard);
router.get('/trend', controller.getMonthlyTrend);
router.get('/report/yearly', controller.getYearlyReport);
router.get('/report', controller.getMonthlyReport);
router.get('/sync', validateRequest(transactionSyncSchema), controller.syncTransactions);

// General paths
router.post('/', validateRequest(createTransactionSchema), idempotency, controller.createTransaction);
router.get('/', controller.getTransactions);

// Parameterized paths last
router.get('/:id', controller.getTransaction);
router.put('/:id', validateRequest(updateTransactionSchema), controller.updateTransaction);
router.delete('/:id', validateRequest(deleteTransactionSchema), controller.deleteTransaction);

export default router;
