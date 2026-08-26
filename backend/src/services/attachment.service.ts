import { AttachmentRepository } from '../repositories/attachment.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { AppError } from '../common/app-error';
import { createObjectStorage } from './storage.service';

export class AttachmentService {
  private attachmentRepository = new AttachmentRepository();
  private transactionRepository = new TransactionRepository();
  private storage = createObjectStorage();

  async uploadAttachment(
    userId: string,
    transactionId: string,
    file: Express.Multer.File
  ) {
    const tx = await this.transactionRepository.findById(transactionId);
    if (!tx || tx.userId !== userId) throw new AppError('Transaction not found', 404);

    const stored = await this.storage.put(`users/${userId}/transactions/${transactionId}`, file);
    try {
      return await this.attachmentRepository.create({
        transactionId,
        url: stored.url,
        filename: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
      });
    } catch (error) {
      await this.storage.remove(stored.url).catch(() => undefined);
      throw error;
    }
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

    await this.storage.remove(attachment.url);
    await this.attachmentRepository.delete(id);
    return true;
  }
}
