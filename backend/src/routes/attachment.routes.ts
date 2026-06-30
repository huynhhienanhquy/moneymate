import { Router } from 'express';
import { AttachmentController, ExportController } from '../controllers/attachment.controller';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();
const attachmentController = new AttachmentController();
const exportController = new ExportController();

router.use(authenticate);

router.get('/export/excel', exportController.exportExcel);
router.get('/export/pdf', exportController.exportPdf);
router.post('/transactions/:transactionId', upload.single('file'), attachmentController.upload);
router.get('/transactions/:transactionId', attachmentController.getAttachments);
router.delete('/:id', attachmentController.deleteAttachment);

export default router;
