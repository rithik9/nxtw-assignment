const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // skip if we already have data
  const existingOrg = await prisma.organization.findFirst();
  if (existingOrg) {
    console.log('Seed data already exists, skipping.');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin', 10);

  const org = await prisma.organization.create({
    data: { name: 'Task Tracker' },
  });
  console.log(`Created org: ${org.name} (${org.id})`);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@email.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      orgId: org.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@email.com',
      password: hashedPassword,
      name: 'Manager User',
      role: 'MANAGER',
      orgId: org.id,
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'member@email.com',
      password: hashedPassword,
      name: 'Member User',
      role: 'MEMBER',
      orgId: org.id,
    },
  });

  console.log(`Created users: ${admin.email}, ${manager.email}, ${member.email}`);

  const project = await prisma.project.create({
    data: {
      name: 'Project Alpha',
      description: 'Initial project for the Task Tracker organization',
      orgId: org.id,
    },
  });

  console.log(`Created project: ${project.name} (${project.id})`);
  console.log('Done seeding.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
