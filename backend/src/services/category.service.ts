import { CategoryRepository } from '../repositories/category.repository';
import { AppError } from '../common/app-error';
import { CategoryType } from '@prisma/client';

export class CategoryService {
  private categoryRepository = new CategoryRepository();

  /**
   * Create category for the category workflow.
   *
   * Use it from controllers or jobs that run the category business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param data - The input data required to create category for the category workflow.
   * @returns A promise containing the resulting category value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
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

  /**
   * Return categories required by the category workflow.
   *
   * Use it from controllers or jobs that run the category business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise containing the resulting category value.
   */
  async getCategories(userId: string) {
    return this.categoryRepository.findAllByUserId(userId);
  }

  /**
   * Return category required by the category workflow.
   *
   * Use it from controllers or jobs that run the category business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param categoryId - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting category value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async getCategory(userId: string, categoryId: string) {
    const category = await this.categoryRepository.findById(categoryId);
    // User can access if it's their own OR if it's a global category (userId is null)
    if (!category || (category.userId !== null && category.userId !== userId)) {
      throw new AppError('Category not found', 404);
    }
    return category;
  }

  /**
   * Update category while preserving the category workflow's rules.
   *
   * Use it from controllers or jobs that run the category business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param categoryId - The stable identifier of the record targeted by the operation.
   * @param data - The input data required to update category while preserving the category workflow's rules.
   * @returns A promise containing the resulting category value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async updateCategory(userId: string, categoryId: string, data: { name?: string; color?: string; icon?: string }) {
    const category = await this.getCategory(userId, categoryId);
    if (category.userId === null) {
      throw new AppError('System categories are read-only and cannot be updated', 403);
    }
    return this.categoryRepository.update(category.id, data);
  }

  /**
   * Delete category through the category workflow.
   *
   * Use it from controllers or jobs that run the category business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param categoryId - The stable identifier of the record targeted by the operation.
   * @returns A promise containing the resulting category value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async deleteCategory(userId: string, categoryId: string) {
    const category = await this.getCategory(userId, categoryId);
    if (category.userId === null) {
      throw new AppError('System categories are read-only and cannot be deleted', 403);
    }
    return this.categoryRepository.delete(category.id);
  }
}
