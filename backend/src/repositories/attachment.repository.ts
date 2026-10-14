import prisma from '../config/db';

export class AttachmentRepository {
  /**
   * Create attachment for the attachment workflow.
   *
   * Use it from services that need attachment persistence.
   * @param data - The input data required to create attachment for the attachment workflow.
   * @returns A promise containing the resulting attachment value.
   */
  async create(data: {
    transactionId: string;
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
  }) {
    return prisma.attachment.create({ data });
  }

  /**
   * Find by transaction id in the attachment data source.
   *
   * Use it from services that need attachment persistence.
   * @param transactionId - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting attachment value.
   */
  async findByTransactionId(transactionId: string) {
    return prisma.attachment.findMany({ where: { transactionId } });
  }

  /**
   * Find by id in the attachment data source.
   *
   * Use it from services that need attachment persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting attachment value.
   */
  async findById(id: string) {
    return prisma.attachment.findUnique({ where: { id } });
  }

  /**
   * Find urls by user id in the attachment data source.
   *
   * Use it from services that need attachment persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting attachment value.
   */
  async findUrlsByUserId(userId: string) {
    const attachments = await prisma.attachment.findMany({
      where: { transaction: { userId } },
      select: { url: true }
    });
    return attachments.map(({ url }) => url);
  }

  /**
   * Delete attachment through the attachment workflow.
   *
   * Use it from services that need attachment persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting attachment value.
   */
  async delete(id: string) {
    return prisma.attachment.delete({ where: { id } });
  }
}
