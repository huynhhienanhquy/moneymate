import { AttachmentRepository } from '../repositories/attachment.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { AppError } from '../common/app-error';
import { createObjectStorage } from './storage.service';

export class AttachmentService {
  private attachmentRepository = new AttachmentRepository();
  private transactionRepository = new TransactionRepository();
  private storage = createObjectStorage();

  private toClientAttachment<T extends { id: string }>(attachment: T) {
    return { ...attachment, url: `/api/attachments/${attachment.id}/content` };
  }

  async uploadAttachment(
    userId: string,
    transactionId: string,
    file: Express.Multer.File
  ) {
    const tx = await this.transactionRepository.findById(transactionId);
    if (!tx || tx.userId !== userId) throw new AppError('Transaction not found', 404);

    const stored = await this.storage.put(`users/${userId}/transactions/${transactionId}`, file);
    try {
      const attachment = await this.attachmentRepository.create({
        transactionId,
        url: stored.url,
        filename: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
      });
      return this.toClientAttachment(attachment);
    } catch (error) {
      await this.storage.remove(stored.url).catch(() => undefined);
      throw error;
    }
  }

  async getAttachments(userId: string, transactionId: string) {
    const tx = await this.transactionRepository.findById(transactionId);
    if (!tx || tx.userId !== userId) throw new AppError('Transaction not found', 404);
    const attachments = await this.attachmentRepository.findByTransactionId(transactionId);
    return attachments.map((attachment) => this.toClientAttachment(attachment));
  }

  async downloadAttachment(userId: string, id: string) {
    const attachment = await this.attachmentRepository.findById(id);
    if (!attachment?.transactionId) throw new AppError('Attachment not found', 404);
    const tx = await this.transactionRepository.findById(attachment.transactionId);
    if (!tx || tx.userId !== userId) throw new AppError('Attachment not found', 404);
    const data = await this.storage.read(attachment.url);
    return { attachment, data };
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
