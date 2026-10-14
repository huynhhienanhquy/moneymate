import { AttachmentRepository } from '../repositories/attachment.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { AppError } from '../common/app-error';
import { createObjectStorage } from './storage.service';

export class AttachmentService {
  private attachmentRepository = new AttachmentRepository();
  private transactionRepository = new TransactionRepository();
  private storage = createObjectStorage();

  /**
   * To client attachment for attachment.
   *
   * Use it from controllers or jobs that run the attachment business workflow.
   * @param attachment - The attachment value required by the operation.
   * @returns The resulting attachment value for the caller.
   */
  private toClientAttachment<T extends { id: string }>(attachment: T) {
    return { ...attachment, url: `/api/attachments/${attachment.id}/content` };
  }

  /**
   * Upload attachment required by the attachment workflow.
   *
   * Use it from controllers or jobs that run the attachment business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param transactionId - The stable identifier of the record targeted by the operation.
   * @param file - The file-system location or file value used by the operation.
   * @returns A promise containing the resulting attachment value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
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

  /**
   * Return attachments required by the attachment workflow.
   *
   * Use it from controllers or jobs that run the attachment business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param transactionId - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting attachment value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async getAttachments(userId: string, transactionId: string) {
    const tx = await this.transactionRepository.findById(transactionId);
    if (!tx || tx.userId !== userId) throw new AppError('Transaction not found', 404);
    const attachments = await this.attachmentRepository.findByTransactionId(transactionId);
    return attachments.map((attachment) => this.toClientAttachment(attachment));
  }

  /**
   * Download attachment produced by the attachment workflow.
   *
   * Use it from controllers or jobs that run the attachment business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting attachment value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async downloadAttachment(userId: string, id: string) {
    const attachment = await this.attachmentRepository.findById(id);
    if (!attachment?.transactionId) throw new AppError('Attachment not found', 404);
    const tx = await this.transactionRepository.findById(attachment.transactionId);
    if (!tx || tx.userId !== userId) throw new AppError('Attachment not found', 404);
    const data = await this.storage.read(attachment.url);
    return { attachment, data };
  }

  /**
   * Delete attachment through the attachment workflow.
   *
   * Use it from controllers or jobs that run the attachment business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting attachment value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
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
