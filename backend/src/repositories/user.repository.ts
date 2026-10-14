import prisma from '../config/db';

export class UserRepository {
  /**
   * Find by email in the user data source.
   *
   * Use it from services that need user persistence.
   * @param email - The email value required by the operation.
   * @returns A promise containing the resulting user value.
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * Find by id in the user data source.
   *
   * Use it from services that need user persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting user value.
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  /**
   * Create user for the user workflow.
   *
   * Use it from services that need user persistence.
   * @param data - The input data required to create user for the user workflow.
   * @returns A promise containing the resulting user value.
   */
  async create(data: { email: string; passwordHash: string; fullName: string }) {
    return prisma.user.create({
      data
    });
  }

  /**
   * Update user while preserving the user workflow's rules.
   *
   * Use it from services that need user persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param data - The input data required to update user while preserving the user workflow's rules.
   * @returns A promise containing the resulting user value.
   */
  async update(id: string, data: { fullName?: string; avatarUrl?: string | null }) {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  /**
   * Update password while preserving the user workflow's rules.
   *
   * Use it from services that need user persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param passwordHash - The password hash value required by the operation.
   * @returns A promise containing the resulting user value.
   */
  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  /**
   * Update password and revoke sessions while preserving the user workflow's rules.
   *
   * Use it from services that need user persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param passwordHash - The password hash value required by the operation.
   * @returns A promise containing the resulting user value.
   */
  async updatePasswordAndRevokeSessions(id: string, passwordHash: string) {
    return prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { passwordHash } });
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }

  /**
   * Delete by id through the user workflow.
   *
   * Use it from services that need user persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting user value.
   */
  async deleteById(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}
