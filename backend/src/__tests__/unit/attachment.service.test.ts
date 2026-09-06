import { AttachmentRepository } from '../../repositories/attachment.repository';
import { TransactionRepository } from '../../repositories/transaction.repository';
import { AttachmentService } from '../../services/attachment.service';

const storage = {
  put: jest.fn(),
  read: jest.fn(),
  remove: jest.fn(),
};

jest.mock('../../repositories/attachment.repository');
jest.mock('../../repositories/transaction.repository');
jest.mock('../../services/storage.service', () => ({
  createObjectStorage: () => storage,
}));

const MockAttachmentRepository = AttachmentRepository as jest.MockedClass<typeof AttachmentRepository>;
const MockTransactionRepository = TransactionRepository as jest.MockedClass<typeof TransactionRepository>;

describe('AttachmentService protected content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockAttachmentRepository.mockClear();
    MockTransactionRepository.mockClear();
  });

  it('returns an authenticated API URL instead of the local storage URL', async () => {
    const service = new AttachmentService();
    const attachments = MockAttachmentRepository.mock.instances[0] as jest.Mocked<AttachmentRepository>;
    const transactions = MockTransactionRepository.mock.instances[0] as jest.Mocked<TransactionRepository>;
    transactions.findById.mockResolvedValue({ id: 'tx-1', userId: 'user-1' } as never);
    storage.put.mockResolvedValue({ key: 'key', url: '/uploads/users/user-1/file.pdf' });
    attachments.create.mockResolvedValue({
      id: 'attachment-1', transactionId: 'tx-1', url: '/uploads/users/user-1/file.pdf',
      filename: 'receipt.pdf', fileType: 'application/pdf', fileSize: 10, createdAt: new Date(),
    });

    const result = await service.uploadAttachment('user-1', 'tx-1', {
      originalname: 'receipt.pdf', mimetype: 'application/pdf', size: 10, buffer: Buffer.from('pdf'),
    } as Express.Multer.File);

    expect(result.url).toBe('/api/attachments/attachment-1/content');
  });

  it('reads content only after checking transaction ownership', async () => {
    const service = new AttachmentService();
    const attachments = MockAttachmentRepository.mock.instances[0] as jest.Mocked<AttachmentRepository>;
    const transactions = MockTransactionRepository.mock.instances[0] as jest.Mocked<TransactionRepository>;
    attachments.findById.mockResolvedValue({
      id: 'attachment-1', transactionId: 'tx-1', url: '/uploads/users/user-1/file.pdf',
      filename: 'receipt.pdf', fileType: 'application/pdf', fileSize: 10, createdAt: new Date(),
    });
    transactions.findById.mockResolvedValue({ id: 'tx-1', userId: 'user-1' } as never);
    storage.read.mockResolvedValue(Buffer.from('protected'));

    await expect(service.downloadAttachment('user-1', 'attachment-1')).resolves.toMatchObject({
      data: Buffer.from('protected'),
    });
    await expect(service.downloadAttachment('other-user', 'attachment-1')).rejects.toMatchObject({ statusCode: 404 });
    expect(storage.read).toHaveBeenCalledTimes(1);
  });
});
