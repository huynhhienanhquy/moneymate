import prisma from '../config/db';
import { CategoryType } from '@prisma/client';

export class CategoryRepository {
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

  async findFirst(where: { type?: CategoryType }, orderBy?: any) {
    return prisma.category.findFirst({ where, orderBy });
  }

  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id }
    });
  }

  async findByNameAndUser(name: string, userId: string | null, type: CategoryType) {
    return prisma.category.findFirst({
      where: {
        name,
        type,
        userId
      }
    });
  }

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

  async update(id: string, data: { name?: string; color?: string; icon?: string }) {
    return prisma.category.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.category.delete({
      where: { id }
    });
  }
}
