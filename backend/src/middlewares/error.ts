import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/app-error';
import { sendError } from '../common/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors, err.code);
  }

  // Unhandled server errors
  console.error('UNHANDLED ERROR: ', err);
  
  const message = process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';
  return sendError(
    res,
    message,
    500,
    process.env.NODE_ENV === 'development' ? [err.stack] : [],
    'INTERNAL_ERROR'
  );
};
