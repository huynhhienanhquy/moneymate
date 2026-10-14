import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { AppError } from '../common/app-error';

/**
 * Require admin for admin.
 *
 * Use it in the request pipeline when admin processing is required.
 * @param req - The incoming request and its authenticated or validated input.
 * @param _res - The res value required by the operation.
 * @param next - The callback that continues the middleware pipeline or receives an error.
 * @returns Nothing; the operation is complete when the function returns.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Admin access required', 403);
  }
  next();
};
