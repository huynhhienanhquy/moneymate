import { Response, NextFunction, Request } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AppError } from '../common/app-error';
import { getJwtAccessSecret } from '../config/env';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Invalid access token error for auth.
 *
 * Use it in the request pipeline when auth processing is required.
 * @returns The resulting auth value for the caller.
 */
const invalidAccessTokenError = () =>
  new AppError('Invalid or expired authentication token', 401, [], 'UNAUTHORIZED');

/**
 * Return bearer token required by the auth workflow.
 *
 * Use it in the request pipeline when auth processing is required.
 * @param authorization - The authorization value required by the operation.
 * @returns The resulting auth value for the caller.
 */
export const getBearerToken = (authorization?: string | null): string | null => {
  if (!authorization) return null;
  const match = authorization.trim().match(/^Bearer\s+(\S+)$/i);
  return match?.[1] || null;
};

/**
 * Verify access token before the auth workflow continues.
 *
 * Use it in the request pipeline when auth processing is required.
 * @param token - The authentication or continuation token used by the operation.
 * @returns The resulting auth value for the caller.
 */
export const verifyAccessToken = (token: string): Promise<AuthenticatedUser> =>
  new Promise((resolve, reject) => {
    jwt.verify(token, getJwtAccessSecret(), { algorithms: ['HS256'] }, (error, decoded) => {
      if (error || typeof decoded === 'string' || !decoded) {
        reject(invalidAccessTokenError());
        return;
      }

      const payload = decoded as JwtPayload;
      if (typeof payload.userId !== 'string' || typeof payload.email !== 'string') {
        reject(invalidAccessTokenError());
        return;
      }

      resolve({
        id: payload.userId,
        email: payload.email,
        role: typeof payload.role === 'string' ? payload.role : 'USER',
      });
    });
  });

/**
 * Authenticate for auth.
 *
 * Use it in the request pipeline when auth processing is required.
 * @param req - The incoming request and its authenticated or validated input.
 * @param res - The response object used to return the operation result.
 * @param next - The callback that continues the middleware pipeline or receives an error.
 * @returns A promise that resolves after the operation completes.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = '';

    const bearerToken = getBearerToken(req.headers.authorization);
    if (bearerToken) {
      token = bearerToken;
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError('Authentication token is missing', 401, [], 'UNAUTHORIZED');
    }

    req.user = await verifyAccessToken(token);
    next();
  } catch (error) {
    next(error);
  }
};
