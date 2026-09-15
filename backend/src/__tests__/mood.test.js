/**
 * Mood Routes Integration Tests
 */
const request = require('supertest');
const app = require('../../server');
const { query } = require('../../config/database');

let accessToken;
let userId;
let moodEntryId;

const testUser = {
  email: `mood_test_${Date.now()}@test.com`,
  username: `moodtest_${Date.now()}`.slice(0, 30),
  password: 'TestPass123',
};

const validMoodPayload = {
  mood_score: 7,
  mood_label: 'Great',
  mood_emoji: '😄',
  energy_level: 4,
  anxiety_level: 2,
  sleep_hours: 7.5,
  activities: ['Exercise', 'Reading'],
  notes: 'Feeling good today!',
};

describe('Mood Routes', () => {
  beforeAll(async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);
    accessToken = res.body.data.accessToken;
    userId = res.body.data.user.id;
  });

  afterAll(async () => {
    await query('DELETE FROM users WHERE email = $1', [testUser.email]).catch(() => {});
  });

  describe('POST /api/v1/moods', () => {
    it('creates a mood entry', async () => {
      const res = await request(app)
        .post('/api/v1/moods')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validMoodPayload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.entry.mood_score).toBe(validMoodPayload.mood_score);
      expect(res.body.data.entry.mood_label).toBe(validMoodPayload.mood_label);
      moodEntryId = res.body.data.entry.id;
    });

    it('rejects invalid mood score', async () => {
      await request(app)
        .post('/api/v1/moods')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validMoodPayload, mood_score: 11 })
        .expect(422);
    });

    it('requires authentication', async () => {
      await request(app).post('/api/v1/moods').send(validMoodPayload).expect(401);
    });
  });

  describe('GET /api/v1/moods', () => {
    it('returns mood history', async () => {
      const res = await request(app)
        .get('/api/v1/moods')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.entries)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('supports pagination', async () => {
      const res = await request(app)
        .get('/api/v1/moods?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/v1/moods/today', () => {
    it('returns today\'s mood entry', async () => {
      const res = await request(app)
        .get('/api/v1/moods/today')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.entry).not.toBeNull();
      expect(res.body.data.entry.mood_score).toBe(validMoodPayload.mood_score);
    });
  });

  describe('GET /api/v1/moods/:id', () => {
    it('returns a single mood entry', async () => {
      const res = await request(app)
        .get(`/api/v1/moods/${moodEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.entry.id).toBe(moodEntryId);
    });

    it('returns 404 for unknown id', async () => {
      await request(app)
        .get('/api/v1/moods/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/moods/:id', () => {
    it('updates a mood entry', async () => {
      const res = await request(app)
        .put(`/api/v1/moods/${moodEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ mood_score: 8, notes: 'Updated note' })
        .expect(200);

      expect(res.body.data.entry.mood_score).toBe(8);
      expect(res.body.data.entry.notes).toBe('Updated note');
    });
  });

  describe('GET /api/v1/moods/stats/summary', () => {
    it('returns mood statistics', async () => {
      const res = await request(app)
        .get('/api/v1/moods/stats/summary?period=30')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.trend).toBeDefined();
    });
  });

  describe('DELETE /api/v1/moods/:id', () => {
    it('deletes a mood entry', async () => {
      await request(app)
        .delete(`/api/v1/moods/${moodEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      await request(app)
        .get(`/api/v1/moods/${moodEntryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
