const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');

describe('Auth Endpoints Integration Tests', () => {
  let testUserEmail = 'testuser@example.com';
  let testUserPassword = 'password123';
  let testUserName = 'Test User';
  let testOrgName = 'Test Organization';
  
  let createdUserId;
  let createdOrgId;
  let refreshTokenCookie;
  let accessToken;

  // clean up any preexisting test user before starting
  beforeAll(async () => {
    const existing = await prisma.user.findUnique({ where: { email: testUserEmail } });
    if (existing) {
      await prisma.refreshToken.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
      await prisma.organization.deleteMany({ where: { name: testOrgName } });
    }
  });

  // remove test records after we are finished
  afterAll(async () => {
    if (createdUserId) {
      await prisma.refreshToken.deleteMany({ where: { userId: createdUserId } });
      await prisma.user.delete({ where: { id: createdUserId } });
    }
    if (createdOrgId) {
      await prisma.organization.delete({ where: { id: createdOrgId } });
    }
    await prisma.$disconnect();
  });

  it('should successfully register a new user and organization', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testUserEmail,
        password: testUserPassword,
        name: testUserName,
        orgName: testOrgName,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.email).toBe(testUserEmail);
    expect(res.body.data.user.name).toBe(testUserName);
    
    createdUserId = res.body.data.user.id;
    createdOrgId = res.body.data.user.orgId;
  });

  it('should fail to register with the same email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testUserEmail,
        password: testUserPassword,
        name: testUserName,
        orgName: testOrgName,
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('should fail to register with invalid fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'not-an-email',
        password: 'short',
        name: testUserName,
        orgName: testOrgName,
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should successfully log in and return tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: testUserPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    
    accessToken = res.body.data.accessToken;

    // extract the refresh token cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken=') || c.startsWith('__Host-refreshToken='));
    expect(refreshCookie).toBeDefined();
    
    refreshTokenCookie = refreshCookie.split(';')[0];
  });

  it('should fail to log in with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('should successfully rotate tokens using refresh token cookie', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [refreshTokenCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const newRefreshCookie = cookies.find((c) => c.startsWith('refreshToken=') || c.startsWith('__Host-refreshToken='));
    expect(newRefreshCookie).toBeDefined();
  });

  it('should detect replay attack when using the old refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [refreshTokenCookie]);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('should fail to refresh with an invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=invalidtoken']);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });
});
