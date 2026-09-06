import '../helpers/prisma-mock';
import { AdminRepository } from '../../repositories/admin.repository';
import { AttachmentRepository } from '../../repositories/attachment.repository';
import { AdminService } from '../../services/admin.service';

const mockStorageRemove = jest.fn();
jest.mock('../../repositories/admin.repository');
jest.mock('../../repositories/attachment.repository');
jest.mock('../../services/storage.service', () => ({
  createObjectStorage: () => ({ remove: mockStorageRemove, put: jest.fn() }),
}));

const MockAdminRepository = AdminRepository as jest.MockedClass<typeof AdminRepository>;
const MockAttachmentRepository = AttachmentRepository as jest.MockedClass<typeof AttachmentRepository>;

describe('AdminService', () => {
  it('collects attachment URLs before deleting a user and removes the stored objects', async () => {
    const service = new AdminService();
    const admins = MockAdminRepository.mock.instances[0] as jest.Mocked<AdminRepository>;
    const attachments = MockAttachmentRepository.mock.instances[0] as jest.Mocked<AttachmentRepository>;
    admins.findUserById.mockResolvedValue({ id: 'user-1' } as any);
    admins.deleteUser.mockResolvedValue({ id: 'user-1' } as any);
    attachments.findUrlsByUserId.mockResolvedValue(['/uploads/user-1/a.jpg', '/uploads/user-1/b.pdf']);
    mockStorageRemove.mockResolvedValue(undefined);

    await expect(service.deleteUser('user-1')).resolves.toBe(true);

    expect(attachments.findUrlsByUserId).toHaveBeenCalledWith('user-1');
    expect(admins.deleteUser).toHaveBeenCalledWith('user-1');
    expect(mockStorageRemove).toHaveBeenCalledTimes(2);
  });
});
