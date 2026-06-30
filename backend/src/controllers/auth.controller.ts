import { Request, Response, NextFunction } from 'express';
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
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      
      // Set secure cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      
      return sendSuccess(
        res,
        { user: result.user, accessToken: result.accessToken },
        'Logged in successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const result = await this.authService.refresh(refreshToken);
      
      // Rotate refresh token cookie
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
      
      return sendSuccess(
        res,
        { accessToken: result.accessToken },
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
}
