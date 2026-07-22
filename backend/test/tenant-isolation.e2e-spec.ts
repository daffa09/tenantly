import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

interface Envelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
}

interface Entity {
  id: string;
  status?: string;
  updatedAt?: string;
}

const body = <T = null>(res: request.Response) => res.body as Envelope<T>;

const cookieOf = (res: request.Response) =>
  (res.headers['set-cookie'] as unknown as string[])[0];

describe('SaaS Multi-Tenant & RBAC E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let cookieCompanyAAdmin: string;
  let cookieCompanyAMember: string;
  let cookieCompanyBAdmin: string;

  let companyAId: string;
  let companyBId: string;
  let memberAUserId: string;

  let projectAId: string;
  let taskAssignedToMemberAId: string;
  let taskAssignedToAdminAId: string;

  const authCookie = (res: request.Response) => cookieOf(res).split(';')[0];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);

    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    const resRegA = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Company A Corp',
        name: 'Admin A',
        email: 'admin.a@test.com',
        password: 'password123',
      });

    cookieCompanyAAdmin = authCookie(resRegA);
    companyAId = body<{ user: UserPayload }>(resRegA).data.user.companyId;

    const resMemberA = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Cookie', cookieCompanyAAdmin)
      .send({
        name: 'Member A',
        email: 'member.a@test.com',
        password: 'password123',
        role: 'MEMBER',
      });

    memberAUserId = body<UserPayload>(resMemberA).data.id;

    const resLoginMemberA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'member.a@test.com', password: 'password123' });

    cookieCompanyAMember = authCookie(resLoginMemberA);

    const resRegB = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Company B Corp',
        name: 'Admin B',
        email: 'admin.b@test.com',
        password: 'password123',
      });

    cookieCompanyBAdmin = authCookie(resRegB);
    companyBId = body<{ user: UserPayload }>(resRegB).data.user.companyId;

    const resProjA = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Cookie', cookieCompanyAAdmin)
      .send({
        name: 'Company A Secret Project',
        description: 'Top secret data',
      });

    projectAId = body<Entity>(resProjA).data.id;

    const resTask1 = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectAId}/tasks`)
      .set('Cookie', cookieCompanyAAdmin)
      .send({
        title: 'Task Assigned To Member A',
        assigneeId: memberAUserId,
      });

    taskAssignedToMemberAId = body<Entity>(resTask1).data.id;

    const resTask2 = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectAId}/tasks`)
      .set('Cookie', cookieCompanyAAdmin)
      .send({
        title: 'Task Assigned To Admin Only',
      });

    taskAssignedToAdminAId = body<Entity>(resTask2).data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. TENANT ISOLATION TESTS (Requirement 6.1)', () => {
    it('User Company B CANNOT read Project from Company A (Returns 404/403, NOT 200)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectAId}`)
        .set('Cookie', cookieCompanyBAdmin);

      expect(res.status).toBe(404);
      expect(body(res).success).toBe(false);
      expect(body(res).data).toBeNull();
    });

    it('User Company B CANNOT update Project from Company A (Returns 404/403)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}`)
        .set('Cookie', cookieCompanyBAdmin)
        .send({ name: 'Hacked Project Name' });

      expect(res.status).toBe(404);
      expect(body(res).success).toBe(false);
    });

    it('User Company B CANNOT read tasks of Project from Company A (Returns 404/403)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectAId}/tasks`)
        .set('Cookie', cookieCompanyBAdmin);

      expect(res.status).toBe(404);
      expect(body(res).success).toBe(false);
    });

    it('Registration CANNOT join an existing tenant by reusing its name (Returns 409)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          companyName: 'Company A Corp',
          name: 'Impostor',
          email: 'impostor@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(409);
      expect(body(res).success).toBe(false);

      const usersInA = await prisma.user.count({
        where: { companyId: companyAId },
      });
      expect(usersInA).toBe(2);
    });

    it('Registration CANNOT self-assign a role (Returns 400)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          companyName: 'Company C Corp',
          name: 'Role Picker',
          email: 'picker@test.com',
          password: 'password123',
          role: 'ADMIN',
        });

      expect(res.status).toBe(400);
      expect(body(res).success).toBe(false);
    });
  });

  describe('2. RBAC ENFORCEMENT TESTS (Requirement 4 & 6.2)', () => {
    it('Member CANNOT delete a project (Admin only -> Returns 403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/projects/${projectAId}`)
        .set('Cookie', cookieCompanyAMember);

      expect(res.status).toBe(403);
      expect(body(res).success).toBe(false);
      expect(body(res).message).toContain(
        'Role MEMBER tidak memiliki hak akses',
      );
    });

    it('Member CANNOT add a user to the company (Admin only -> Returns 403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Cookie', cookieCompanyAMember)
        .send({
          name: 'Smuggled User',
          email: 'smuggled@test.com',
          password: 'password123',
          role: 'ADMIN',
        });

      expect(res.status).toBe(403);
      expect(body(res).success).toBe(false);
    });

    it('Member CANNOT update a task assigned to someone else (Returns 403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectAId}/tasks/${taskAssignedToAdminAId}`)
        .set('Cookie', cookieCompanyAMember)
        .send({ status: 'DONE' });

      expect(res.status).toBe(403);
      expect(body(res).success).toBe(false);
      expect(body(res).message).toContain(
        'Member hanya dapat mengubah task yang di-assign ke dirinya',
      );
    });

    it('Member CAN update a task assigned to themselves (Returns 200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(
          `/api/v1/projects/${projectAId}/tasks/${taskAssignedToMemberAId}`,
        )
        .set('Cookie', cookieCompanyAMember)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(body(res).success).toBe(true);
      expect(body<Entity>(res).data.status).toBe('IN_PROGRESS');
    });
  });

  describe('3. INPUT VALIDATION TESTS', () => {
    it('Reject task creation with empty title (Returns 400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectAId}/tasks`)
        .set('Cookie', cookieCompanyAAdmin)
        .send({ title: '' });

      expect(res.status).toBe(400);
      expect(body(res).success).toBe(false);
    });
  });

  describe('4. SESSION TESTS', () => {
    it('Login returns the session in an httpOnly cookie, never in the body', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin.b@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(cookieOf(res)).toContain('HttpOnly');
      expect(JSON.stringify(body(res))).not.toContain('eyJ'); // no JWT anywhere in the payload
      expect(body<{ user: UserPayload }>(res).data.user.companyId).toBe(
        companyBId,
      );
    });

    it('Rejects a request without a session cookie (Returns 401)', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/projects');

      expect(res.status).toBe(401);
    });
  });

  describe('5. RACE CONDITION TESTS (optimistic locking)', () => {
    const taskUrl = () =>
      `/api/v1/projects/${projectAId}/tasks/${taskAssignedToAdminAId}`;

    const readUpdatedAt = async () => {
      const res = await request(app.getHttpServer())
        .get(taskUrl())
        .set('Cookie', cookieCompanyAAdmin);

      return body<Entity>(res).data.updatedAt;
    };

    it('Two concurrent updates from the same read: one wins 200, the other is rejected 409', async () => {
      const expectedUpdatedAt = await readUpdatedAt();

      const patch = (status: string) =>
        request(app.getHttpServer())
          .patch(taskUrl())
          .set('Cookie', cookieCompanyAAdmin)
          .send({ status, expectedUpdatedAt });

      const [first, second] = await Promise.all([
        patch('IN_PROGRESS'),
        patch('DONE'),
      ]);

      expect([first.status, second.status].sort()).toEqual([200, 409]);

      const loser = first.status === 409 ? first : second;
      expect(body(loser).message).toContain('sudah diubah orang lain');

      // pemenangnya benar-benar tersimpan — bukan dua-duanya ditolak lalu task tak berubah
      const winner = first.status === 200 ? first : second;
      const after = await request(app.getHttpServer())
        .get(taskUrl())
        .set('Cookie', cookieCompanyAAdmin);

      expect(body<Entity>(after).data.status).toBe(
        body<Entity>(winner).data.status,
      );
    });

    it('A stale token is rejected 409 even without a concurrent request', async () => {
      const stale = await readUpdatedAt();

      const ok = await request(app.getHttpServer())
        .patch(taskUrl())
        .set('Cookie', cookieCompanyAAdmin)
        .send({ title: 'Moved by someone else', expectedUpdatedAt: stale });

      expect(ok.status).toBe(200);

      const res = await request(app.getHttpServer())
        .patch(taskUrl())
        .set('Cookie', cookieCompanyAAdmin)
        .send({ status: 'TODO', expectedUpdatedAt: stale });

      expect(res.status).toBe(409);
      expect(body(res).success).toBe(false);
    });

    it('Update without the token still succeeds — the token is opt-in (Returns 200)', async () => {
      const res = await request(app.getHttpServer())
        .patch(taskUrl())
        .set('Cookie', cookieCompanyAAdmin)
        .send({ status: 'TODO' });

      expect(res.status).toBe(200);
      expect(body<Entity>(res).data.status).toBe('TODO');
    });
  });
});
