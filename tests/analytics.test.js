const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');
const { generateAccessToken } = require('../src/utils/jwt');

describe('Analytics Endpoints Integration Tests', () => {
  let org;
  let admin, member;
  let tokenAdmin, tokenMember;
  let project;
  let taskOverdue, taskCompleted, taskNormal;

  beforeAll(async () => {
    // 1. Create org
    org = await prisma.organization.create({ data: { name: 'Org Analytics' } });

    // 2. Create admin and member
    admin = await prisma.user.create({
      data: {
        email: 'admin.an@example.com',
        password: 'hashedpassword',
        name: 'Admin AN',
        role: 'ADMIN',
        orgId: org.id,
      },
    });

    member = await prisma.user.create({
      data: {
        email: 'member.an@example.com',
        password: 'hashedpassword',
        name: 'Member AN',
        role: 'MEMBER',
        orgId: org.id,
      },
    });

    tokenAdmin = generateAccessToken({ userId: admin.id });
    tokenMember = generateAccessToken({ userId: member.id });

    // 3. Create project
    project = await prisma.project.create({
      data: {
        name: 'Analytics Project',
        orgId: org.id,
      },
    });

    // 4. Create tasks with specific stats
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2); // 2 days in the past

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2); // 2 days in the future

    // Overdue task (past due date, not DONE)
    taskOverdue = await prisma.task.create({
      data: {
        title: 'Overdue Task',
        status: 'IN_PROGRESS',
        dueDate: pastDate,
        assigneeId: member.id,
        projectId: project.id,
      },
    });

    // Completed task (marked DONE)
    taskCompleted = await prisma.task.create({
      data: {
        title: 'Completed Task',
        status: 'DONE',
        dueDate: futureDate,
        assigneeId: member.id,
        projectId: project.id,
      },
    });

    // Normal active task (future due date, not DONE)
    taskNormal = await prisma.task.create({
      data: {
        title: 'Active Task',
        status: 'IN_PROGRESS',
        dueDate: futureDate,
        assigneeId: member.id,
        projectId: project.id,
      },
    });
  });

  afterAll(async () => {
    // cleanup
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [admin.id, member.id] } },
    });
    await prisma.task.deleteMany({
      where: { projectId: project.id },
    });
    await prisma.project.delete({
      where: { id: project.id },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [admin.id, member.id] } },
    });
    await prisma.organization.delete({
      where: { id: org.id },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/analytics/overdue', () => {
    it('should allow ADMIN to fetch overdue tasks count and details', async () => {
      const res = await request(app)
        .get('/api/analytics/overdue')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
      expect(res.body.data.tasks[0].title).toBe('Overdue Task');
    });

    it('should reject access if user is MEMBER', async () => {
      const res = await request(app)
        .get('/api/analytics/overdue')
        .set('Authorization', `Bearer ${tokenMember}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/analytics/completion-time', () => {
    it('should allow ADMIN to fetch task completion statistics', async () => {
      const res = await request(app)
        .get('/api/analytics/completion-time')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
      expect(res.body.data.averageCompletionTimeInHours).toBeDefined();
    });

    it('should reject access if user is MEMBER', async () => {
      const res = await request(app)
        .get('/api/analytics/completion-time')
        .set('Authorization', `Bearer ${tokenMember}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });
});
