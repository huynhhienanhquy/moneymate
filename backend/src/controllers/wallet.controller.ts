import { Response, NextFunction } from 'express';
import { WalletService } from '../services/wallet.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/app-error';

export class WalletController {
  private walletService = new WalletService();

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
