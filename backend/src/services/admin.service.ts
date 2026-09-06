import { AdminRepository } from '../repositories/admin.repository';
import { AppError } from '../common/app-error';
import { AttachmentRepository } from '../repositories/attachment.repository';
import { createObjectStorage } from './storage.service';

export class AdminService {
  private adminRepository = new AdminRepository();
  private attachmentRepository = new AttachmentRepository();
  private storage = createObjectStorage();

  async getAllUsers() {
    return this.adminRepository.findAllUsers();
  }

  async getUser(id: string) {
    const user = await this.adminRepository.findUserById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updateUser(id: string, data: { fullName?: string; role?: string }) {
    const user = await this.adminRepository.findUserById(id);
    if (!user) throw new AppError('User not found', 404);
    return this.adminRepository.updateUser(id, data);
  }

  async deleteUser(id: string) {
    const user = await this.adminRepository.findUserById(id);
    if (!user) throw new AppError('User not found', 404);
    const attachmentUrls = await this.attachmentRepository.findUrlsByUserId(id);
    await this.adminRepository.deleteUser(id);
    const cleanup = await Promise.allSettled(attachmentUrls.map((url) => this.storage.remove(url)));
    const failed = cleanup.filter((result) => result.status === 'rejected').length;
    if (failed) console.error('Admin user attachment cleanup incomplete', { userId: id, failed });
    return true;
  }
}
