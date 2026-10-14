import { AdminRepository } from '../repositories/admin.repository';
import { AppError } from '../common/app-error';
import { AttachmentRepository } from '../repositories/attachment.repository';
import { createObjectStorage } from './storage.service';

export class AdminService {
  private adminRepository = new AdminRepository();
  private attachmentRepository = new AttachmentRepository();
  private storage = createObjectStorage();

  /**
   * Return all users required by the admin workflow.
   *
   * Use it from controllers or jobs that run the admin business workflow.
   * @returns A promise containing the resulting admin value.
   */
  async getAllUsers() {
    return this.adminRepository.findAllUsers();
  }

  /**
   * Return user required by the admin workflow.
   *
   * Use it from controllers or jobs that run the admin business workflow.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting admin value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async getUser(id: string) {
    const user = await this.adminRepository.findUserById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  /**
   * Update user while preserving the admin workflow's rules.
   *
   * Use it from controllers or jobs that run the admin business workflow.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param data - The input data required to update user while preserving the admin workflow's rules.
   * @returns A promise containing the resulting admin value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async updateUser(id: string, data: { fullName?: string; role?: string }) {
    const user = await this.adminRepository.findUserById(id);
    if (!user) throw new AppError('User not found', 404);
    return this.adminRepository.updateUser(id, data);
  }

  /**
   * Delete user through the admin workflow.
   *
   * Use it from controllers or jobs that run the admin business workflow.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting admin value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
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
