const request = require('supertest');
const app = require('../src/app');
const { getDatabase } = require('../src/db/database');

describe('Authentication API', () => {
  beforeAll(() => {
    // Ensure DB is initialized
    getDatabase();
  });

  const uniqueSuffix = Date.now();
  const testUser = {
    name: 'Auth Test User',
    email: `authtest_${uniqueSuffix}@example.com`,
    password: 'Password123!'
  };

  test('POST /api/auth/register should create a new user and return token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.body.user).toHaveProperty('name', testUser.name);
  });

  test('POST /api/auth/register should reject duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/auth/register should validate missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad@example.com' });

    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login should authenticate valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('POST /api/auth/login should reject incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword!'
      });

    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me should reject requests without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me should return user with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(testUser.email);
  });
});
