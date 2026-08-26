import prisma from '../config/db';

export class AttachmentRepository {
  async create(data: {
    transactionId: string;
    url: string;
    filename: string;
    fileType: string;
    fileSize: number;
  }) {
    return prisma.attachment.create({ data });
  }

  async findByTransactionId(transactionId: string) {
    return prisma.attachment.findMany({ where: { transactionId } });
  }

  async findById(id: string) {
    return prisma.attachment.findUnique({ where: { id } });
  }

  async findUrlsByUserId(userId: string) {
    const attachments = await prisma.attachment.findMany({
      where: { transaction: { userId } },
      select: { url: true }
    });
    return attachments.map(({ url }) => url);
  }

  async delete(id: string) {
    return prisma.attachment.delete({ where: { id } });
  }
}
