import { Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class CategoryController {
  private categoryService = new CategoryService();

  /**
   * Create category for the category workflow.
   *
   * Use it as the HTTP boundary for the category route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public createCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const category = await this.categoryService.createCategory(userId, req.body);
      return sendSuccess(res, category, 'Category created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Return categories required by the category workflow.
   *
   * Use it as the HTTP boundary for the category route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const categories = await this.categoryService.getCategories(userId);
      return sendSuccess(res, categories, 'Categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Return category required by the category workflow.
   *
   * Use it as the HTTP boundary for the category route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const categoryId = req.params.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const category = await this.categoryService.getCategory(userId, categoryId);
      return sendSuccess(res, category, 'Category retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update category while preserving the category workflow's rules.
   *
   * Use it as the HTTP boundary for the category route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public updateCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const categoryId = req.params.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const category = await this.categoryService.updateCategory(userId, categoryId, req.body);
      return sendSuccess(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete category through the category workflow.
   *
   * Use it as the HTTP boundary for the category route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public deleteCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const categoryId = req.params.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      await this.categoryService.deleteCategory(userId, categoryId);
      return sendSuccess(res, null, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
