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

const invalidAccessTokenError = () =>
  new AppError('Invalid or expired authentication token', 401, [], 'UNAUTHORIZED');

export const getBearerToken = (authorization?: string | null): string | null => {
  if (!authorization) return null;
  const match = authorization.trim().match(/^Bearer\s+(\S+)$/i);
  return match?.[1] || null;
};

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
