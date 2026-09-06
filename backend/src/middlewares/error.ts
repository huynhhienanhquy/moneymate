import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/app-error';
import { sendError } from '../common/response';
import multer from 'multer';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors, err.code);
  }

  if (err instanceof multer.MulterError) {
    const isTooLarge = err.code === 'LIMIT_FILE_SIZE';
    return sendError(
      res,
      isTooLarge ? 'File size exceeds the 5 MB limit' : err.message,
      isTooLarge ? 413 : 400,
      [],
      err.code,
    );
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
