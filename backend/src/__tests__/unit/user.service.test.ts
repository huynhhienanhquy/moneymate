import bcrypt from 'bcryptjs';
import { UserRepository } from '../../repositories/user.repository';
import { UserService } from '../../services/user.service';

jest.mock('../../repositories/user.repository');
jest.mock('../../repositories/attachment.repository');
jest.mock('../../services/storage.service', () => ({
  createObjectStorage: () => ({ remove: jest.fn() }),
}));
jest.mock('bcryptjs');

const MockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

describe('UserService password changes', () => {
  it('updates the password and revokes all refresh sessions atomically', async () => {
    const service = new UserService();
    const users = MockUserRepository.mock.instances[0] as jest.Mocked<UserRepository>;
    users.findById.mockResolvedValue({ id: 'user-1', passwordHash: 'old-hash' } as never);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
    users.updatePasswordAndRevokeSessions.mockResolvedValue(undefined);

    await expect(service.changePassword('user-1', 'old-password', 'new-password')).resolves.toBe(true);
    expect(users.updatePasswordAndRevokeSessions).toHaveBeenCalledWith('user-1', 'new-hash');
    expect(users.updatePassword).not.toHaveBeenCalled();
  });
});
