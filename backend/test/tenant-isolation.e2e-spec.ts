import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('SaaS Multi-Tenant & RBAC E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tokenCompanyAAdmin: string;
  let tokenCompanyAMember: string;
  let tokenCompanyBAdmin: string;

  let companyAId: string;
  let companyBId: string;
  let memberAUserId: string;

  let projectAId: string;
  let taskAssignedToMemberAId: string;
  let taskAssignedToAdminAId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Setup Test Fixtures directly in DB
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    // 1. Register Admin Company A
    const resRegA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Company A Corp',
        name: 'Admin A',
        email: 'admin.a@test.com',
        password: 'password123',
        role: 'ADMIN',
      });

    tokenCompanyAAdmin = resRegA.body.data.token;
    companyAId = resRegA.body.data.user.companyId;

    // 2. Register Member Company A
    const resRegAMember = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Company A Corp',
        name: 'Member A',
        email: 'member.a@test.com',
        password: 'password123',
        role: 'MEMBER',
      });

    tokenCompanyAMember = resRegAMember.body.data.token;
    memberAUserId = resRegAMember.body.data.user.id;

    // 3. Register Admin Company B
    const resRegB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Company B Corp',
        name: 'Admin B',
        email: 'admin.b@test.com',
        password: 'password123',
        role: 'ADMIN',
      });

    tokenCompanyBAdmin = resRegB.body.data.token;
    companyBId = resRegB.body.data.user.companyId;

    // 4. Create Project in Company A
    const resProjA = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenCompanyAAdmin}`)
      .send({
        name: 'Company A Secret Project',
        description: 'Top secret data',
      });

    projectAId = resProjA.body.data.id;

    // 5. Create Task 1 (Assigned to Member A)
    const resTask1 = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectAId}/tasks`)
      .set('Authorization', `Bearer ${tokenCompanyAAdmin}`)
      .send({
        title: 'Task Assigned To Member A',
        assigneeId: memberAUserId,
      });

    taskAssignedToMemberAId = resTask1.body.data.id;

    // 6. Create Task 2 (Unassigned / Assigned to Admin)
    const resTask2 = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectAId}/tasks`)
      .set('Authorization', `Bearer ${tokenCompanyAAdmin}`)
      .send({
        title: 'Task Assigned To Admin Only',
      });

    taskAssignedToAdminAId = resTask2.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. TENANT ISOLATION TESTS (Requirement 6.1)', () => {
    it('User Company B CANNOT read Project from Company A (Returns 404/403, NOT 200)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${tokenCompanyBAdmin}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.data).toBeNull();
    });

    it('User Company B CANNOT update Project from Company A (Returns 404/403)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${tokenCompanyBAdmin}`)
        .send({ name: 'Hacked Project Name' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User Company B CANNOT read tasks of Project from Company A (Returns 404/403)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectAId}/tasks`)
        .set('Authorization', `Bearer ${tokenCompanyBAdmin}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. RBAC ENFORCEMENT TESTS (Requirement 4 & 6.2)', () => {
    it('Member CANNOT delete a project (Admin only -> Returns 403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/projects/${projectAId}`)
        .set('Authorization', `Bearer ${tokenCompanyAMember}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Role MEMBER tidak memiliki hak akses');
    });

    it('Member CANNOT update a task assigned to someone else (Returns 403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}/tasks/${taskAssignedToAdminAId}`)
        .set('Authorization', `Bearer ${tokenCompanyAMember}`)
        .send({ status: 'DONE' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Member hanya dapat mengubah task yang di-assign ke dirinya');
    });

    it('Member CAN update a task assigned to themselves (Returns 200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}/tasks/${taskAssignedToMemberAId}`)
        .set('Authorization', `Bearer ${tokenCompanyAMember}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });
  });

  describe('3. INPUT VALIDATION TESTS', () => {
    it('Reject task creation with empty title (Returns 400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectAId}/tasks`)
        .set('Authorization', `Bearer ${tokenCompanyAAdmin}`)
        .send({ title: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
