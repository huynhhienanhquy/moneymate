import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../common/app-error';
import { AttachmentRepository } from '../repositories/attachment.repository';
import { createObjectStorage } from './storage.service';

export class UserService {
  private userRepository = new UserRepository();
  private attachmentRepository = new AttachmentRepository();
  private storage = createObjectStorage();

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
    await this.userRepository.updatePassword(userId, passwordHash);
    return true;
  }

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
