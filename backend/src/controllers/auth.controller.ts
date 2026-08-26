import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { AppError } from '../common/app-error';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../common/response';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export class AuthController {
  private authService = new AuthService();

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.register(req.body);
      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, platform = 'web', deviceId, deviceName, appVersion, timezone } = req.body;
      const result = await this.authService.login(email, password, {
        platform,
        deviceId,
        deviceName,
        appVersion,
        timezone
      });
      
      // Set secure cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      
      return sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          ...(platform !== 'web' ? { refreshToken: result.refreshToken } : {})
        },
        'Logged in successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bodyRefreshToken = req.body.refreshToken;
      const refreshToken = req.cookies.refreshToken || bodyRefreshToken;
      const result = await this.authService.refresh(refreshToken);
      
      // Rotate refresh token cookie
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      
      return sendSuccess(
        res,
        {
          accessToken: result.accessToken,
          ...(bodyRefreshToken ? { refreshToken: result.refreshToken } : {})
        },
        'Access token refreshed successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }
      
      // Clear cookies
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  };

  public listSessions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new AppError('Unauthorized', 401);
      return sendSuccess(res, await this.authService.listSessions(req.user.id), 'Sessions retrieved');
    } catch (error) { next(error); }
  };

  public revokeSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new AppError('Unauthorized', 401);
      await this.authService.revokeSession(req.user.id, req.params.id);
      return sendSuccess(res, null, 'Session revoked');
    } catch (error) { next(error); }
  };

  public revokeAllSessions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) throw new AppError('Unauthorized', 401);
      await this.authService.revokeAllSessions(req.user.id);
      return sendSuccess(res, null, 'All sessions revoked');
    } catch (error) { next(error); }
  };
}
