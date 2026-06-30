import { AdminRepository } from '../repositories/admin.repository';
import { AppError } from '../common/app-error';

export class AdminService {
  private adminRepository = new AdminRepository();

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
    await this.adminRepository.deleteUser(id);
    return true;
  }
}
