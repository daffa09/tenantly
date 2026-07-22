import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService.register', () => {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    company: { findFirst: jest.fn(), create: jest.fn() },
  };

  let service: AuthService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { sign: () => 'signed.jwt.token' } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  const dto = {
    companyName: 'Acme Corp',
    name: 'Impostor',
    email: 'impostor@example.com',
    password: 'password123',
  };

  it('refuses to attach the caller to a company that already exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.company.findFirst.mockResolvedValue({
      id: 'company-acme',
      name: 'Acme Corp',
    });

    await expect(service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('creates a fresh tenant and makes the registrant its admin', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.company.findFirst.mockResolvedValue(null);
    prisma.company.create.mockResolvedValue({
      id: 'company-new',
      name: 'Acme Corp',
    });
    prisma.user.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => ({
        id: 'user-1',
        ...data,
      }),
    );

    const result = await service.register(dto);

    const [created] = prisma.user.create.mock.calls as [
      [{ data: { role: Role; companyId: string } }],
    ];
    expect(created[0].data.role).toBe(Role.ADMIN);
    expect(created[0].data.companyId).toBe('company-new');
    expect(result.data.user.companyId).toBe('company-new');
  });
});
