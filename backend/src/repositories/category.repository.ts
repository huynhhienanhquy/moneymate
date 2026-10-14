import prisma from '../config/db';
import { CategoryType, Prisma } from '@prisma/client';

export class CategoryRepository {
  /**
   * Create category for the category workflow.
   *
   * Use it from services that need category persistence.
   * @param data - The input data required to create category for the category workflow.
   * @returns A promise containing the resulting category value.
   */
  async create(data: { userId: string; name: string; type: CategoryType; color?: string; icon?: string }) {
    return prisma.category.create({
      data: {
        userId: data.userId,
        name: data.name,
        type: data.type,
        color: data.color || '#CCCCCC',
        icon: data.icon || 'tag'
      }
    });
  }

  /**
   * Find first in the category data source.
   *
   * Use it from services that need category persistence.
   * @param where - The where value required by the operation.
   * @param orderBy - The order by value required by the operation.
   * @returns A promise containing the resulting category value.
   */
  async findFirst(where: Prisma.CategoryWhereInput, orderBy?: Prisma.CategoryOrderByWithRelationInput) {
    return prisma.category.findFirst({ where, orderBy });
  }

  /**
   * Find by id in the category data source.
   *
   * Use it from services that need category persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting category value.
   */
  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id }
    });
  }

  /**
   * Find by name and user in the category data source.
   *
   * Use it from services that need category persistence.
   * @param name - The name value required by the operation.
   * @param userId - The identifier of the user whose data is being processed.
   * @param type - The operation or report variant to process.
   * @returns A promise containing the resulting category value.
   */
  async findByNameAndUser(name: string, userId: string | null, type: CategoryType) {
    return prisma.category.findFirst({
      where: {
        name,
        type,
        userId
      }
    });
  }

  /**
   * Find all by user id in the category data source.
   *
   * Use it from services that need category persistence.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting category value.
   */
  async findAllByUserId(userId: string) {
    return prisma.category.findMany({
      where: {
        OR: [
          { userId },
          { userId: null }
        ]
      },
      orderBy: [
        { userId: 'asc' }, // System categories (null) first or last
        { name: 'asc' }
      ]
    });
  }

  /**
   * Update category while preserving the category workflow's rules.
   *
   * Use it from services that need category persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @param data - The input data required to update category while preserving the category workflow's rules.
   * @returns A promise containing the resulting category value.
   */
  async update(id: string, data: { name?: string; color?: string; icon?: string }) {
    return prisma.category.update({
      where: { id },
      data
    });
  }

  /**
   * Delete category through the category workflow.
   *
   * Use it from services that need category persistence.
   * @param id - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting category value.
   */
  async delete(id: string) {
    return prisma.category.delete({
      where: { id }
    });
  }
}
