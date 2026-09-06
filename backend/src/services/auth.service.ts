import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { AppError } from '../common/app-error';
import { getJwtAccessSecret } from '../config/env';

export class AuthService {
  private userRepository = new UserRepository();
  private tokenRepository = new RefreshTokenRepository();

  private generateAccessToken(userId: string, email: string, role: string): string {
    return jwt.sign({ userId, email, role }, getJwtAccessSecret(), {
      algorithm: 'HS256',
      expiresIn: '15m',
    });
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
    const tokenHash = this.hashRefreshToken(token);
    const existingRecord = await this.tokenRepository.findByHash(tokenHash);
    if (!existingRecord || existingRecord.expiresAt < now) {
      throw new AppError('Refresh token is invalid or expired', 401);
    }
    if (existingRecord.revokedAt) {
      await this.tokenRepository.revokeFamily(existingRecord.tokenFamily);
      throw new AppError('Refresh token reuse detected; session family revoked', 401, [], 'REFRESH_TOKEN_REUSED');
    }

    const user = await this.userRepository.findById(existingRecord.userId);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const newRefreshToken = this.generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const rotated = await this.tokenRepository.rotate(tokenHash, now, {
      userId: user.id,
      tokenHash: this.hashRefreshToken(newRefreshToken),
      tokenFamily: existingRecord.tokenFamily,
      expiresAt,
      platform: existingRecord.platform as 'web' | 'ios' | 'android',
      deviceId: existingRecord.deviceId || undefined,
      deviceName: existingRecord.deviceName || undefined,
      appVersion: existingRecord.appVersion || undefined,
      timezone: existingRecord.timezone || undefined
    });
    if (!rotated) {
      // The one-time token was consumed concurrently. Since rotation and child
      // creation are atomic, revoking now also catches the newly issued child.
      await this.tokenRepository.revokeFamily(existingRecord.tokenFamily);
      throw new AppError('Refresh token reuse detected; session family revoked', 401, [], 'REFRESH_TOKEN_REUSED');
    }

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
