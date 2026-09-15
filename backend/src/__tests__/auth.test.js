/**
 * Auth Routes Integration Tests
 */
const request = require('supertest');
const app = require('../../server');
const { query } = require('../../config/database');

// Test user fixture
const testUser = {
  email: `test_${Date.now()}@moodlift.test`,
  username: `testuser_${Date.now()}`.slice(0, 30),
  password: 'TestPass123',
  full_name: 'Test User',
};

let accessToken;
let refreshToken;

describe('Auth Routes', () => {
  afterAll(async () => {
    // Cleanup test user
    await query('DELETE FROM users WHERE email = $1', [testUser.email]).catch(() => {});
  });

  describe('POST /api/v1/auth/register', () => {
    it('registers a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.password_hash).toBeUndefined();
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('validates email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: 'not-an-email' })
        .expect(422);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('enforces password strength', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: 'other@test.com', password: 'weak' })
        .expect(422);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('rejects invalid password', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPass123' })
        .expect(401);
    });

    it('rejects non-existent user', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'TestPass123' })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns current user with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('returns 401 without token', async () => {
      await request(app).get('/api/v1/auth/me').expect(401);
    });

    it('returns 401 with invalid token', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('issues new access token from refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
    });

    it('rejects invalid refresh token', async () => {
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: 'invalid' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('blacklists the token', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Token should now be rejected
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });
});
