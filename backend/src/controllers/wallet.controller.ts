import { Response, NextFunction } from 'express';
import { WalletService } from '../services/wallet.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class WalletController {
  private walletService = new WalletService();

  /**
   * Create wallet for the wallet workflow.
   *
   * Use it as the HTTP boundary for the wallet route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public createWallet = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const wallet = await this.walletService.createWallet(userId, req.body);
      return sendSuccess(res, wallet, 'Wallet created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Return wallets required by the wallet workflow.
   *
   * Use it as the HTTP boundary for the wallet route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getWallets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const wallets = await this.walletService.getWallets(userId);
      return sendSuccess(res, wallets, 'Wallets retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Return wallet required by the wallet workflow.
   *
   * Use it as the HTTP boundary for the wallet route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public getWallet = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const walletId = req.params.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const wallet = await this.walletService.getWallet(userId, walletId);
      return sendSuccess(res, wallet, 'Wallet retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update wallet while preserving the wallet workflow's rules.
   *
   * Use it as the HTTP boundary for the wallet route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public updateWallet = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const walletId = req.params.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      const wallet = await this.walletService.updateWallet(userId, walletId, req.body);
      return sendSuccess(res, wallet, 'Wallet updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete wallet through the wallet workflow.
   *
   * Use it as the HTTP boundary for the wallet route.
   * @param req - The incoming request and its authenticated or validated input.
   * @param res - The response object used to return the operation result.
   * @param next - The callback that continues the middleware pipeline or receives an error.
   * @returns A promise that resolves after the response is sent or an error is forwarded.
   */
  public deleteWallet = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const walletId = req.params.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }
      await this.walletService.deleteWallet(userId, walletId);
      return sendSuccess(res, null, 'Wallet deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
