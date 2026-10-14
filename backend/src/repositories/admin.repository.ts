import prisma from '../config/db';

export class AdminRepository {
  /**
   * Find all users in the admin data source.
   *
   * Use it from services that need admin persistence.
   * @returns A promise containing the resulting admin value.
   */
  async findAllUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            transactions: true,
            wallets: true,
          }
        }
      }
    });
  }

  /**
   * Find user by id in the admin data source.
   *
   * Use it from services that need admin persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting admin value.
   */
  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            transactions: true,
            wallets: true,
            budgets: true,
            savingGoals: true,
            recurringTransactions: true,
          }
        }
      }
    });
  }

  /**
   * Update user while preserving the admin workflow's rules.
   *
   * Use it from services that need admin persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param data - The input data required to update user while preserving the admin workflow's rules.
   * @returns A promise containing the resulting admin value.
   */
  async updateUser(id: string, data: { fullName?: string; role?: string }) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.role !== undefined && { role: data.role as any }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      }
    });
  }

  /**
   * Delete user through the admin workflow.
   *
   * Use it from services that need admin persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting admin value.
   */
  async deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}
