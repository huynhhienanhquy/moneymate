import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../common/app-error';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = '';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError('Authentication token is missing', 401);
    }

    const secret = process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key_money_mate_2026';
    const decoded = await new Promise<any>((resolve, reject) => {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) reject(new AppError('Invalid or expired authentication token', 401));
        else resolve(decoded);
      });
    });

    req.user = { id: decoded.userId, email: decoded.email, role: decoded.role || 'USER' };
    next();
  } catch (error) {
    next(error);
  }
};
