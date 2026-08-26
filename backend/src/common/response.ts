import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message: string = 'Success', statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    requestId: res.locals.requestId
  });
};

export const sendError = (res: Response, message: string, statusCode: number = 400, errors: any[] = [], code: string = 'REQUEST_FAILED') => {
  return res.status(statusCode).json({
    success: false,
    code,
    message,
    errors,
    requestId: res.locals.requestId
  });
};
