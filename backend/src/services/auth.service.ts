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

  /**
   * Generate access token for auth.
   *
   * Use it from controllers or jobs that run the auth business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param email - The email value required by the operation.
   * @param role - The role value required by the operation.
   * @returns The resulting auth value for the caller.
   */
  private generateAccessToken(userId: string, email: string, role: string): string {
    return jwt.sign({ userId, email, role }, getJwtAccessSecret(), {
      algorithm: 'HS256',
      expiresIn: '15m',
    });
  }

  /**
   * Generate refresh token for auth.
   *
   * Use it from controllers or jobs that run the auth business workflow.
   * @returns The resulting auth value for the caller.
   */
  private generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  /**
   * Hash refresh token for auth.
   *
   * Use it from controllers or jobs that run the auth business workflow.
   * @param token - The authentication or continuation token used by the operation.
   * @returns The resulting auth value for the caller.
   */
  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Register auth for the auth workflow.
   *
   * Use it from controllers or jobs that run the auth business workflow.
   * @param data - The input data required to register auth for the auth workflow.
   * @returns A promise containing the resulting auth value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
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

  /**
   * Authenticate a user and issue the access and refresh credentials for a new session.
   *
   * Use it from controllers or jobs that run the auth business workflow.
   * @param email - The email value required by the operation.
   * @param password - The password value required by the operation.
   * @param session - The session value required by the operation.
   * @returns A promise containing the resulting auth value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
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

  /**
   * Refresh auth used by the auth workflow.
   *
   * Use it from controllers or jobs that run the auth business workflow.
   * @param token - The authentication or continuation token used by the operation.
   * @returns A promise containing the resulting auth value.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
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
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role
      }
    };
  }

  /**
   * Revoke the supplied refresh token so the session can no longer be renewed.
   *
   * Use it from controllers or jobs that run the auth business workflow.
   * @param token - The authentication or continuation token used by the operation.
   * @returns A promise that resolves after the operation completes.
   */
  async logout(token: string) {
    if (token) await this.tokenRepository.revokeByHash(this.hashRefreshToken(token));
  }

  /**
   * List sessions available to the auth workflow.
   *
   * Use it from controllers or jobs that run the auth business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns The resulting auth value for the caller.
   */
  listSessions(userId: string) {
    return this.tokenRepository.findActiveByUserId(userId);
  }

  /**
   * Revoke session for auth.
   *
   * Use it from controllers or jobs that run the auth business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param sessionId - The stable identifier of the record targeted by the operation.
   * @returns A promise that resolves after the operation completes.
   * @throws {Error} When validation fails or a required dependency cannot complete the operation.
   */
  async revokeSession(userId: string, sessionId: string) {
    const result = await this.tokenRepository.revokeById(userId, sessionId);
    if (result.count === 0) throw new AppError('Session not found', 404);
  }

  /**
   * Revoke all sessions for auth.
   *
   * Use it from controllers or jobs that run the auth business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns A promise that resolves after the operation completes.
   */
  async revokeAllSessions(userId: string) {
    await this.tokenRepository.revokeByUserId(userId);
  }
}
