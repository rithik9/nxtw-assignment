const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');
const { generateAccessToken } = require('../src/utils/jwt');

describe('Task and Project Lifecycles Integration Tests', () => {
  let orgA, orgB;
  let adminA, managerA, memberA1, memberA2, adminB;
  let tokenAdminA, tokenManagerA, tokenMemberA1, tokenMemberA2, tokenAdminB;
  let projectA, projectB;
  let task1, task2;

  beforeAll(async () => {
    // 1. Create orgs
    orgA = await prisma.organization.create({ data: { name: 'Org A Tasks' } });
    orgB = await prisma.organization.create({ data: { name: 'Org B Tasks' } });

    // 2. Create users under Org A
    adminA = await prisma.user.create({
      data: {
        email: 'admin.t@example.com',
        password: 'hashedpassword',
        name: 'Admin T',
        role: 'ADMIN',
        orgId: orgA.id,
      },
    });

    managerA = await prisma.user.create({
      data: {
        email: 'manager.t@example.com',
        password: 'hashedpassword',
        name: 'Manager T',
        role: 'MANAGER',
        orgId: orgA.id,
      },
    });

    memberA1 = await prisma.user.create({
      data: {
        email: 'member1.t@example.com',
        password: 'hashedpassword',
        name: 'Member 1 T',
        role: 'MEMBER',
        orgId: orgA.id,
      },
    });

    memberA2 = await prisma.user.create({
      data: {
        email: 'member2.t@example.com',
        password: 'hashedpassword',
        name: 'Member 2 T',
        role: 'MEMBER',
        orgId: orgA.id,
      },
    });

    // 3. Create user under Org B
    adminB = await prisma.user.create({
      data: {
        email: 'admin.tb@example.com',
        password: 'hashedpassword',
        name: 'Admin TB',
        role: 'ADMIN',
        orgId: orgB.id,
      },
    });

    // 4. Generate JWT access tokens
    tokenAdminA = generateAccessToken({ userId: adminA.id });
    tokenManagerA = generateAccessToken({ userId: managerA.id });
    tokenMemberA1 = generateAccessToken({ userId: memberA1.id });
    tokenMemberA2 = generateAccessToken({ userId: memberA2.id });
    tokenAdminB = generateAccessToken({ userId: adminB.id });
  });

  afterAll(async () => {
    // Clean up all data in reverse dependency order
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [adminA.id, managerA.id, memberA1.id, memberA2.id, adminB.id] } },
    });
    
    // clean tasks and projects
    if (projectA || projectB) {
      await prisma.task.deleteMany({
        where: { projectId: { in: [projectA?.id, projectB?.id].filter(Boolean) } },
      });
      await prisma.project.deleteMany({
        where: { id: { in: [projectA?.id, projectB?.id].filter(Boolean) } },
      });
    }

    await prisma.user.deleteMany({
      where: { id: { in: [adminA.id, managerA.id, memberA1.id, memberA2.id, adminB.id] } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: [orgA.id, orgB.id] } },
    });
    await prisma.$disconnect();
  });

  describe('Project Endpoints', () => {
    it('should allow ADMIN to create a project under Org A', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          name: 'Project Alpha',
          description: 'A test project for Org A',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.project.name).toBe('Project Alpha');
      projectA = res.body.data.project;
    });

    it('should reject project creation by a MEMBER', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenMemberA1}`)
        .send({
          name: 'Forbidden Project',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should fetch only projects in Org A for Org A users (verifying org isolation)', async () => {
      // Admin B creates a project under Org B
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenAdminB}`)
        .send({ name: 'Project Beta' });
      
      expect(createRes.status).toBe(201);
      projectB = createRes.body.data.project;

      // Admin A lists projects
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(res.status).toBe(200);
      const names = res.body.data.projects.map((p) => p.name);
      expect(names).toContain('Project Alpha');
      expect(names).not.toContain('Project Beta');
    });
  });

  describe('Task Lifecycle & Status Transitions', () => {
    it('should allow ADMIN of Org A to create a task in project A assigned to Member A1', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          title: 'Implement Auth',
          description: 'Write register and login',
          priority: 'HIGH',
          assigneeId: memberA1.id,
          projectId: projectA.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.task.title).toBe('Implement Auth');
      expect(res.body.data.task.status).toBe('TODO'); // starting status
      task1 = res.body.data.task;
    });

    it('should fail if ADMIN of Org A tries to assign a task to a user of Org B (org boundaries)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          title: 'Illegal Task',
          priority: 'MEDIUM',
          assigneeId: adminB.id, // Org B user
          projectId: projectA.id,
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('should fetch all tasks in Org A for ADMIN of Org A', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${tokenAdminA}`);

      expect(res.status).toBe(200);
      const titles = res.body.data.tasks.map((t) => t.title);
      expect(titles).toContain('Implement Auth');
    });

    it('should show the task in the list for the assignee (Member A1)', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${tokenMemberA1}`);

      expect(res.status).toBe(200);
      const titles = res.body.data.tasks.map((t) => t.title);
      expect(titles).toContain('Implement Auth');
    });

    it('should NOT show the task in the list for a different member (Member A2)', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${tokenMemberA2}`);

      expect(res.status).toBe(200);
      const titles = res.body.data.tasks.map((t) => t.title);
      expect(titles).not.toContain('Implement Auth');
    });

    it('should allow the assignee (Member A1) to transition the task from TODO to IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task1.id}/status`)
        .set('Authorization', `Bearer ${tokenMemberA1}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('IN_PROGRESS');
    });

    it('should reject a transition from IN_PROGRESS directly to DONE (invalid transition flow)', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task1.id}/status`)
        .set('Authorization', `Bearer ${tokenMemberA1}`)
        .send({ status: 'DONE' }); // must go through IN_REVIEW first

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_TRANSITION');
    });

    it('should reject status updates by a different member who is not the assignee', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task1.id}/status`)
        .set('Authorization', `Bearer ${tokenMemberA2}`)
        .send({ status: 'IN_REVIEW' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should allow transitioning from IN_PROGRESS to BLOCKED (valid transition)', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task1.id}/status`)
        .set('Authorization', `Bearer ${tokenMemberA1}`)
        .send({ status: 'BLOCKED' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('BLOCKED');
    });

    it('should allow transitioning out of BLOCKED back to IN_PROGRESS (valid transition)', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task1.id}/status`)
        .set('Authorization', `Bearer ${tokenMemberA1}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('IN_PROGRESS');
    });

    it('should allow transitioning from IN_PROGRESS to IN_REVIEW, then to DONE (complete successful lifecycle)', async () => {
      // 1. IN_PROGRESS -> IN_REVIEW
      let res = await request(app)
        .patch(`/api/tasks/${task1.id}/status`)
        .set('Authorization', `Bearer ${tokenMemberA1}`)
        .send({ status: 'IN_REVIEW' });
      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('IN_REVIEW');

      // 2. IN_REVIEW -> DONE
      res = await request(app)
        .patch(`/api/tasks/${task1.id}/status`)
        .set('Authorization', `Bearer ${tokenMemberA1}`)
        .send({ status: 'DONE' });
      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('DONE');
    });
  });
});
