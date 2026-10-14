import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../common/app-error';
import { AttachmentRepository } from '../repositories/attachment.repository';
import { createObjectStorage } from './storage.service';

export class UserService {
  private userRepository = new UserRepository();
  private attachmentRepository = new AttachmentRepository();
  private storage = createObjectStorage();

  /**
   * Return profile required by the user workflow.
   *
   * Use it from controllers or jobs that run the user business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting user value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt
    };
  }

  /**
   * Update profile while preserving the user workflow's rules.
   *
   * Use it from controllers or jobs that run the user business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param data - The input data required to update profile while preserving the user workflow's rules.
   * @returns A promise containing the resulting user value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async updateProfile(userId: string, data: { fullName?: string; avatarUrl?: string | null }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    const updatedUser = await this.userRepository.update(userId, data);
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      avatarUrl: updatedUser.avatarUrl
    };
  }

  /**
   * Change password for user.
   *
   * Use it from controllers or jobs that run the user business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param currentPassword - The current password value required by the operation.
   * @param newPassword - The new password value required by the operation.
   * @returns A promise containing the resulting user value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updatePasswordAndRevokeSessions(userId, passwordHash);
    return true;
  }

  /**
   * Delete account through the user workflow.
   *
   * Use it from controllers or jobs that run the user business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param password - The password value required by the operation.
   * @returns A promise that resolves after the operation completes.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async deleteAccount(userId: string, password: string) {
    const user = await this.userRepository.findById(userId);
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new AppError('Password is incorrect', 400);
    }
    const attachmentUrls = await this.attachmentRepository.findUrlsByUserId(userId);
    await this.userRepository.deleteById(userId);
    const cleanup = await Promise.allSettled(attachmentUrls.map((url) => this.storage.remove(url)));
    const failed = cleanup.filter((result) => result.status === 'rejected').length;
    if (failed) console.error('Account attachment cleanup incomplete', { userId, failed });
  }
}
