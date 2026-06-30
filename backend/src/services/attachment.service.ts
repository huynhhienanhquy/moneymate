import { AttachmentRepository } from '../repositories/attachment.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { AppError } from '../common/app-error';
import fs from 'fs';
import path from 'path';

export class AttachmentService {
  private attachmentRepository = new AttachmentRepository();
  private transactionRepository = new TransactionRepository();

  async uploadAttachment(
    userId: string,
    transactionId: string,
    file: Express.Multer.File
  ) {
    const tx = await this.transactionRepository.findById(transactionId);
    if (!tx || tx.userId !== userId) throw new AppError('Transaction not found', 404);

    const url = `/uploads/${file.filename}`;
    return this.attachmentRepository.create({
      transactionId,
      url,
      filename: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
    });
  }

  async getAttachments(userId: string, transactionId: string) {
    const tx = await this.transactionRepository.findById(transactionId);
    if (!tx || tx.userId !== userId) throw new AppError('Transaction not found', 404);
    return this.attachmentRepository.findByTransactionId(transactionId);
  }

  async deleteAttachment(userId: string, id: string) {
    const attachment = await this.attachmentRepository.findById(id);
    if (!attachment) throw new AppError('Attachment not found', 404);

    if (!attachment.transactionId) throw new AppError('Attachment has no linked transaction', 400);
    const tx = await this.transactionRepository.findById(attachment.transactionId);
    if (!tx || tx.userId !== userId) throw new AppError('Unauthorized', 403);

    const filePath = path.join(process.cwd(), 'uploads', path.basename(attachment.url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await this.attachmentRepository.delete(id);
    return true;
  }
}
