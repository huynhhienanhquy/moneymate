import { CategoryRepository } from '../repositories/category.repository';
import { AppError } from '../common/app-error';
import { CategoryType } from '@prisma/client';

export class CategoryService {
  private categoryRepository = new CategoryRepository();

  async createCategory(userId: string, data: { name: string; type: CategoryType; color?: string; icon?: string }) {
    // Check if user already has a category with this name and type
    const existing = await this.categoryRepository.findByNameAndUser(data.name, userId, data.type);
    if (existing) {
      throw new AppError(`Category named '${data.name}' already exists for this type`, 400);
    }

    // Check system global categories too to avoid overlapping names
    const systemExisting = await this.categoryRepository.findByNameAndUser(data.name, null, data.type);
    if (systemExisting) {
      throw new AppError(`'${data.name}' is a system default category and cannot be duplicated`, 400);
    }

    return this.categoryRepository.create({
      userId,
      name: data.name,
      type: data.type,
      color: data.color,
      icon: data.icon
    });
  }

  async getCategories(userId: string) {
    return this.categoryRepository.findAllByUserId(userId);
  }

  async getCategory(userId: string, categoryId: string) {
    const category = await this.categoryRepository.findById(categoryId);
    // User can access if it's their own OR if it's a global category (userId is null)
    if (!category || (category.userId !== null && category.userId !== userId)) {
      throw new AppError('Category not found', 404);
    }
    return category;
  }

  async updateCategory(userId: string, categoryId: string, data: { name?: string; color?: string; icon?: string }) {
    const category = await this.getCategory(userId, categoryId);
    if (category.userId === null) {
      throw new AppError('System categories are read-only and cannot be updated', 403);
    }
    return this.categoryRepository.update(category.id, data);
  }

  async deleteCategory(userId: string, categoryId: string) {
    const category = await this.getCategory(userId, categoryId);
    if (category.userId === null) {
      throw new AppError('System categories are read-only and cannot be deleted', 403);
    }
    return this.categoryRepository.delete(category.id);
  }
}
