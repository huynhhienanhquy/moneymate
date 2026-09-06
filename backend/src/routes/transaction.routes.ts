import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import {
  createTransactionSchema,
  deleteTransactionSchema,
  monthlyReportQuerySchema,
  monthlyTrendQuerySchema,
  transactionListSchema,
  transactionSyncSchema,
  updateTransactionSchema,
  walletTransferSchema,
  yearlyReportQuerySchema,
} from '../validators/transaction.validator';
import { idempotency } from '../middlewares/idempotency';

const router = Router();
const controller = new TransactionController();

router.use(authenticate);

// Static paths first
router.post('/transfer', validateRequest(walletTransferSchema), idempotency, controller.transferFunds);
router.get('/dashboard', controller.getDashboard);
router.get('/trend', validateRequest(monthlyTrendQuerySchema), controller.getMonthlyTrend);
router.get('/report/yearly', validateRequest(yearlyReportQuerySchema), controller.getYearlyReport);
router.get('/report', validateRequest(monthlyReportQuerySchema), controller.getMonthlyReport);
router.get('/sync', validateRequest(transactionSyncSchema), controller.syncTransactions);

// General paths
router.post('/', validateRequest(createTransactionSchema), idempotency, controller.createTransaction);
router.get('/', validateRequest(transactionListSchema), controller.getTransactions);

// Parameterized paths last
router.get('/:id', controller.getTransaction);
router.put('/:id', validateRequest(updateTransactionSchema), controller.updateTransaction);
router.delete('/:id', validateRequest(deleteTransactionSchema), controller.deleteTransaction);

export default router;
