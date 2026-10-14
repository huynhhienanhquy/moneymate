import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * Request id for request id.
 *
 * Use it in the request pipeline when request id processing is required.
 * @param req - The incoming request and its authenticated or validated input.
 * @param res - The response object used to return the operation result.
 * @param next - The callback that continues the middleware pipeline or receives an error.
 * @returns Nothing; the operation is complete when the function returns.
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header('X-Request-Id');
  const id = incoming && /^[a-zA-Z0-9._-]{1,100}$/.test(incoming) ? incoming : randomUUID();
  res.locals.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
