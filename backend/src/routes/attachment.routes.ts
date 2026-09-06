import { Router } from 'express';
import { AttachmentController, ExportController } from '../controllers/attachment.controller';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { validateRequest } from '../middlewares/validate';
import { monthlyReportQuerySchema } from '../validators/transaction.validator';

const router = Router();
const attachmentController = new AttachmentController();
const exportController = new ExportController();

router.use(authenticate);

router.get('/export/excel', validateRequest(monthlyReportQuerySchema), exportController.exportExcel);
router.get('/export/pdf', validateRequest(monthlyReportQuerySchema), exportController.exportPdf);
router.post('/transactions/:transactionId', upload.single('file'), attachmentController.upload);
router.get('/transactions/:transactionId', attachmentController.getAttachments);
router.get('/:id/content', attachmentController.downloadAttachment);
router.delete('/:id', attachmentController.deleteAttachment);

export default router;
