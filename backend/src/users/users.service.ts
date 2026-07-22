import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAllInCompany(companyId: string) {
    const users = await this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        createdAt: true,
      },
    });

    return {
      message: 'Daftar user berhasil diambil',
      data: users,
    };
  }

  async findOneInCompany(id: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan atau tidak berada di perusahaan ini');
    }

    return {
      message: 'Detail user berhasil diambil',
      data: user,
    };
  }
}
