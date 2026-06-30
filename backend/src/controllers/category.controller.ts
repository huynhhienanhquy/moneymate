import { Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class CategoryController {
  private categoryService = new CategoryService();

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
