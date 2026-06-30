import '../helpers/prisma-mock';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../services/auth.service';
import { Role } from '@prisma/client';
import { UserRepository } from '../../repositories/user.repository';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import { AppError } from '../../common/app-error';

// Mock the repositories
jest.mock('../../repositories/user.repository');
jest.mock('../../repositories/refresh-token.repository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const MockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;
const MockTokenRepository = RefreshTokenRepository as jest.MockedClass<typeof RefreshTokenRepository>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockTokenRepo: jest.Mocked<RefreshTokenRepository>;

  beforeEach(() => {
    MockUserRepository.mockClear();
    MockTokenRepository.mockClear();
    authService = new AuthService();
    mockUserRepo = MockUserRepository.mock.instances[0] as jest.Mocked<UserRepository>;
    mockTokenRepo = MockTokenRepository.mock.instances[0] as jest.Mocked<RefreshTokenRepository>;
  });

  // ─── REGISTER ────────────────────────────────────────────────────────────────
  describe('register()', () => {
    it('should create a new user successfully', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      mockUserRepo.create.mockResolvedValue({
        id: 'uuid-123',
        email: 'test@example.com',
        fullName: 'Test User',
        passwordHash: 'hashedPassword123',
        avatarUrl: null,
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).toEqual({
        id: 'uuid-123',
        email: 'test@example.com',
        fullName: 'Test User',
      });
    });

    it('should throw AppError if email already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: 'existing-id',
        email: 'test@example.com',
        fullName: 'Existing User',
        passwordHash: 'hash',
        avatarUrl: null,
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        authService.register({ email: 'test@example.com', password: 'pass123', fullName: 'Test' })
      ).rejects.toThrow(AppError);

      await expect(
        authService.register({ email: 'test@example.com', password: 'pass123', fullName: 'Test' })
      ).rejects.toThrow('Email is already in use');
    });
  });

  // ─── LOGIN ────────────────────────────────────────────────────────────────────
  describe('login()', () => {
    const mockUser = {
      id: 'uuid-123',
      email: 'test@example.com',
      fullName: 'Test User',
      passwordHash: 'hashedPassword123',
      avatarUrl: null,
      role: Role.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should login successfully and return tokens', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-access-token');
      mockTokenRepo.create.mockResolvedValue({
        id: 'token-id',
        userId: 'uuid-123',
        token: 'mock-refresh-token',
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(result.user).toMatchObject({ id: 'uuid-123', email: 'test@example.com' });
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw AppError for invalid email', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(authService.login('unknown@example.com', 'password123'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw AppError for incorrect password', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid email or password');
    });
  });

  // ─── LOGOUT ───────────────────────────────────────────────────────────────────
  describe('logout()', () => {
    it('should call deleteByToken on the repository', async () => {
      mockTokenRepo.deleteByToken.mockResolvedValue(null);
      await authService.logout('some-refresh-token');
      expect(mockTokenRepo.deleteByToken).toHaveBeenCalledWith('some-refresh-token');
    });
  });

  // ─── REFRESH ──────────────────────────────────────────────────────────────────
  describe('refresh()', () => {
    it('should throw AppError for expired/invalid refresh token', async () => {
      const expiredDate = new Date(Date.now() - 1000); // 1 second in the past
      mockTokenRepo.findByToken.mockResolvedValue({
        id: 'token-id',
        userId: 'uuid-123',
        token: 'expired-token',
        expiresAt: expiredDate,
        createdAt: new Date(),
      });
      mockTokenRepo.deleteByToken.mockResolvedValue(null);

      await expect(authService.refresh('expired-token'))
        .rejects.toThrow('Refresh token is invalid or expired');
    });

    it('should throw AppError when token not found in database', async () => {
      mockTokenRepo.findByToken.mockResolvedValue(null);

      await expect(authService.refresh('non-existent-token'))
        .rejects.toThrow('Refresh token is invalid or expired');
    });
  });
});
