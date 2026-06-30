import request from 'supertest';
import app from '../../app';

/**
 * Integration tests for Auth API endpoints.
 * These tests require a running database (moneymate_test).
 * Run: DATABASE_URL=<test_db> npm test
 *
 * Note: For CI environments without a live DB, use the unit tests instead.
 * These are annotated with @integration to allow selective running.
 */

describe('Auth API Integration Tests @integration', () => {
  const baseRoute = '/api/auth';
  const testUser = {
    fullName: 'Integration Test User',
    email: `integration_${Date.now()}@test.com`,
    password: 'TestPassword123!',
  };

  let accessToken: string;
  let refreshToken: string;

  // ─── REGISTER ────────────────────────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('should register a new user and return 201', async () => {
      const res = await request(app)
        .post(`${baseRoute}/register`)
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 400 if email is already registered', async () => {
      const res = await request(app)
        .post(`${baseRoute}/register`)
        .send(testUser)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already/i);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post(`${baseRoute}/register`)
        .send({ ...testUser, email: 'not-an-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 if password is too short', async () => {
      const res = await request(app)
        .post(`${baseRoute}/register`)
        .send({ ...testUser, email: 'short@test.com', password: '123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ─── LOGIN ────────────────────────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('should login successfully and return access token', async () => {
      const res = await request(app)
        .post(`${baseRoute}/login`)
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.headers['set-cookie']).toBeDefined(); // Refresh token cookie

      accessToken = res.body.data.accessToken;
      const rawCookies = res.headers['set-cookie'];
      const cookies: string[] = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
      const rtCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
      if (rtCookie) {
        refreshToken = rtCookie.split(';')[0].split('=')[1];
      }
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post(`${baseRoute}/login`)
        .send({ email: testUser.email, password: 'WrongPassword' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('should return 401 for non-existing email', async () => {
      const res = await request(app)
        .post(`${baseRoute}/login`)
        .send({ email: 'nonexistent@test.com', password: 'somepassword' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ─── REFRESH ──────────────────────────────────────────────────────────────────
  describe('POST /api/auth/refresh', () => {
    it('should return 401 when no refresh token provided', async () => {
      const res = await request(app)
        .post(`${baseRoute}/refresh`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ─── PROTECTED ROUTES ────────────────────────────────────────────────────────
  describe('Protected Route Access (GET /api/users/profile)', () => {
    it('should return 401 without Bearer token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 200 with valid access token', async () => {
      if (!accessToken) {
        console.warn('Skipping: no access token from login test');
        return;
      }

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
    });
  });
});
