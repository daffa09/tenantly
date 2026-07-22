import { PrismaClient, Role, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with Multi-Tenant fixtures...');

  // Clean DB
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Company A: Acme Corp
  const companyA = await prisma.company.create({
    data: { name: 'Acme Corp' },
  });

  const adminA = await prisma.user.create({
    data: {
      name: 'Alice (Acme Admin)',
      email: 'admin@acme.com',
      password: passwordHash,
      role: Role.ADMIN,
      companyId: companyA.id,
    },
  });

  const memberA = await prisma.user.create({
    data: {
      name: 'Bob (Acme Member)',
      email: 'member@acme.com',
      password: passwordHash,
      role: Role.MEMBER,
      companyId: companyA.id,
    },
  });

  const projectA1 = await prisma.project.create({
    data: {
      name: 'Acme Redesign',
      description: 'Main web redesign project for Acme Corp',
      companyId: companyA.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Design Wireframes',
      description: 'Create Figma wireframes for landing page',
      status: TaskStatus.IN_PROGRESS,
      companyId: companyA.id,
      projectId: projectA1.id,
      assigneeId: memberA.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Setup CI/CD Pipeline',
      description: 'Setup GitHub actions',
      status: TaskStatus.TODO,
      companyId: companyA.id,
      projectId: projectA1.id,
      assigneeId: adminA.id,
    },
  });

  // 2. Company B: Stark Industries
  const companyB = await prisma.company.create({
    data: { name: 'Stark Industries' },
  });

  const adminB = await prisma.user.create({
    data: {
      name: 'Tony Stark (Stark Admin)',
      email: 'admin@stark.com',
      password: passwordHash,
      role: Role.ADMIN,
      companyId: companyB.id,
    },
  });

  const memberB = await prisma.user.create({
    data: {
      name: 'Peter Parker (Stark Member)',
      email: 'member@stark.com',
      password: passwordHash,
      role: Role.MEMBER,
      companyId: companyB.id,
    },
  });

  const projectB1 = await prisma.project.create({
    data: {
      name: 'Jarvis Protocol',
      description: 'AI defense and automation system',
      companyId: companyB.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Calibrate Arc Reactor',
      description: 'Optimize power output',
      status: TaskStatus.DONE,
      companyId: companyB.id,
      projectId: projectB1.id,
      assigneeId: memberB.id,
    },
  });

  console.log('✅ Seeding complete!');
  console.log('=====================================================');
  console.log('Company A (Acme Corp):');
  console.log('  Admin:  admin@acme.com / password123');
  console.log('  Member: member@acme.com / password123');
  console.log('Company B (Stark Industries):');
  console.log('  Admin:  admin@stark.com / password123');
  console.log('  Member: member@stark.com / password123');
  console.log('=====================================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
