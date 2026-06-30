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

  async delete(id: string) {
    return prisma.attachment.delete({ where: { id } });
  }
}
