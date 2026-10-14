import { Response } from 'express';

/**
 * Send a successful API result using the shared response envelope.
 *
 * Use it to keep shared response behavior consistent across application layers.
 * @param res - The response object used to return the operation result.
 * @param data - The input data required to send a successful api result using the shared response envelope.
 * @param message - The human-readable outcome message returned to the caller.
 * @param statusCode - The HTTP status code associated with the response or error.
 * @returns The resulting response value for the caller.
 */
export const sendSuccess = (res: Response, data: any, message: string = 'Success', statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    requestId: res.locals.requestId
  });
};

/**
 * Send a failed API result using the shared error envelope.
 *
 * Use it to keep shared response behavior consistent across application layers.
 * @param res - The response object used to return the operation result.
 * @param message - The human-readable outcome message returned to the caller.
 * @param statusCode - The HTTP status code associated with the response or error.
 * @param errors - Optional validation or domain details that explain the failure.
 * @param code - The stable machine-readable code used to classify the outcome.
 * @returns The resulting response value for the caller.
 */
export const sendError = (res: Response, message: string, statusCode: number = 400, errors: any[] = [], code: string = 'REQUEST_FAILED') => {
  return res.status(statusCode).json({
    success: false,
    code,
    message,
    errors,
    requestId: res.locals.requestId
  });
};
