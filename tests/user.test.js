const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');
const { generateAccessToken } = require('../src/utils/jwt');

describe('User Management and RBAC Integration Tests', () => {
  let orgA, orgB;
  let adminA, memberA, adminB;
  let tokenAdminA, tokenMemberA, tokenAdminB;

  beforeAll(async () => {
    // 1. Create two organizations to test isolation
    orgA = await prisma.organization.create({ data: { name: 'Org A' } });
    orgB = await prisma.organization.create({ data: { name: 'Org B' } });

    // 2. Create users under Org A
    adminA = await prisma.user.create({
      data: {
        email: 'admin.a@example.com',
        password: 'hashedpassword',
        name: 'Admin A',
        role: 'ADMIN',
        orgId: orgA.id,
      },
    });

    memberA = await prisma.user.create({
      data: {
        email: 'member.a@example.com',
        password: 'hashedpassword',
        name: 'Member A',
        role: 'MEMBER',
        orgId: orgA.id,
      },
    });

    // 3. Create user under Org B
    adminB = await prisma.user.create({
      data: {
        email: 'admin.b@example.com',
        password: 'hashedpassword',
        name: 'Admin B',
        role: 'ADMIN',
        orgId: orgB.id,
      },
    });

    // 4. Generate JWT access tokens
    tokenAdminA = generateAccessToken({ userId: adminA.id });
    tokenMemberA = generateAccessToken({ userId: memberA.id });
    tokenAdminB = generateAccessToken({ userId: adminB.id });
  });

  afterAll(async () => {
    // Clean up created records in reverse dependency order
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [adminA.id, memberA.id, adminB.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminA.id, memberA.id, adminB.id] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [orgA.id, orgB.id] } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/users (List Org Users)', () => {
    it('should allow ADMIN of Org A to fetch all users in Org A (verifying org isolation)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeDefined();
      
      // should contain Admin A and Member A
      const emails = res.body.data.users.map((u) => u.email);
      expect(emails).toContain(adminA.email);
      expect(emails).toContain(memberA.email);
      
      // should NOT contain Admin B (Org B isolation)
      expect(emails).not.toContain(adminB.email);
    });

    it('should reject access if user is MEMBER of Org A', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenMemberA}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should reject access if no authentication token is provided', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('PATCH /api/users/:id/role (Update Role)', () => {
    it('should allow ADMIN of Org A to update the role of a MEMBER in Org A to MANAGER', async () => {
      const res = await request(app)
        .patch(`/api/users/${memberA.id}/role`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ role: 'MANAGER' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('MANAGER');

      // verify database persistence
      const user = await prisma.user.findUnique({ where: { id: memberA.id } });
      expect(user.role).toBe('MANAGER');
    });

    it('should fail to update role if role field is missing or invalid', async () => {
      const res = await request(app)
        .patch(`/api/users/${memberA.id}/role`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ role: 'SUPERUSER' }); // invalid role

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should fail if ADMIN of Org A tries to update a user in Org B (org boundary violation)', async () => {
      const res = await request(app)
        .patch(`/api/users/${adminB.id}/role`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ role: 'MANAGER' });

      // should not be found/accessible
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('should reject access if a non-ADMIN user tries to update roles', async () => {
      const res = await request(app)
        .patch(`/api/users/${memberA.id}/role`)
        .set('Authorization', `Bearer ${tokenMemberA}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });
});
