import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { AppError } from '../common/app-error';

export class AuthService {
  private userRepository = new UserRepository();
  private tokenRepository = new RefreshTokenRepository();

  private generateAccessToken(userId: string, email: string, role: string): string {
    const secret = process.env.JWT_ACCESS_SECRET || 'super_secret_access_token_key_money_mate_2026';
    return jwt.sign({ userId, email, role }, secret, { expiresIn: '15m' });
  }

  private generateRefreshToken(): string {
    // Generate a random standard token string
    return jwt.sign(
      { rand: Math.random().toString(36).substring(2, 15) },
      process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_token_key_money_mate_2026',
      { expiresIn: '7d' }
    );
  }

  async register(data: { email: string; password: string; fullName: string }) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email is already in use', 400);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      email: data.email,
      fullName: data.fullName,
      passwordHash
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName
    };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshTokenString = this.generateRefreshToken();

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
    await this.tokenRepository.create(user.id, refreshTokenString, expiresAt);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role
      },
      accessToken,
      refreshToken: refreshTokenString
    };
  }

  async refresh(token: string) {
    const tokenRecord = await this.tokenRepository.findByToken(token);
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      if (tokenRecord) {
        await this.tokenRepository.deleteByToken(token);
      }
      throw new AppError('Refresh token is invalid or expired', 401);
    }

    const user = await this.userRepository.findById(tokenRecord.userId);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Refresh Token Rotation
    await this.tokenRepository.deleteByToken(token);

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const newRefreshToken = this.generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.tokenRepository.create(user.id, newRefreshToken, expiresAt);

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(token: string) {
    await this.tokenRepository.deleteByToken(token);
  }
}
