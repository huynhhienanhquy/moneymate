import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'crypto';
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
    return randomBytes(48).toString('base64url');
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async register(data: { email: string; password: string; fullName: string }) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError('Email is already in use', 400);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      email: normalizedEmail,
      fullName: data.fullName,
      passwordHash
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName
    };
  }

  async login(
    email: string,
    password: string,
    session: {
      platform?: 'web' | 'ios' | 'android';
      deviceId?: string;
      deviceName?: string;
      appVersion?: string;
      timezone?: string;
    } = {}
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);
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
    await this.tokenRepository.create({
      userId: user.id,
      tokenHash: this.hashRefreshToken(refreshTokenString),
      tokenFamily: randomUUID(),
      expiresAt,
      platform: session.platform || 'web',
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      appVersion: session.appVersion,
      timezone: session.timezone
    });

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
    if (!token) {
      throw new AppError('Refresh token is invalid or expired', 401);
    }

    const now = new Date();
    const tokenRecord = await this.tokenRepository.consume(this.hashRefreshToken(token), now);
    if (!tokenRecord) throw new AppError('Refresh token is invalid or expired', 401);

    const user = await this.userRepository.findById(tokenRecord.userId);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const newRefreshToken = this.generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.tokenRepository.create({
      userId: user.id,
      tokenHash: this.hashRefreshToken(newRefreshToken),
      tokenFamily: tokenRecord.tokenFamily,
      expiresAt,
      platform: tokenRecord.platform as 'web' | 'ios' | 'android',
      deviceId: tokenRecord.deviceId || undefined,
      deviceName: tokenRecord.deviceName || undefined,
      appVersion: tokenRecord.appVersion || undefined,
      timezone: tokenRecord.timezone || undefined
    });

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(token: string) {
    if (token) await this.tokenRepository.revokeByHash(this.hashRefreshToken(token));
  }

  listSessions(userId: string) {
    return this.tokenRepository.findActiveByUserId(userId);
  }

  async revokeSession(userId: string, sessionId: string) {
    const result = await this.tokenRepository.revokeById(userId, sessionId);
    if (result.count === 0) throw new AppError('Session not found', 404);
  }

  async revokeAllSessions(userId: string) {
    await this.tokenRepository.revokeByUserId(userId);
  }
}
