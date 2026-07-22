import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        companyId,
      },
    });

    return {
      message: 'Project berhasil dibuat',
      data: project,
    };
  }

  async findAll(companyId: string) {
    const projects = await this.prisma.project.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Daftar project berhasil diambil',
      data: projects,
    };
  }

  async findOne(id: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        companyId, // Strict tenant scoping
      },
      include: {
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project tidak ditemukan atau tidak milik perusahaan ini');
    }

    return {
      message: 'Detail project berhasil diambil',
      data: project,
    };
  }

  async update(id: string, companyId: string, dto: UpdateProjectDto) {
    // Ensure existence within tenant
    await this.findOne(id, companyId);

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    return {
      message: 'Project berhasil diperbarui',
      data: updated,
    };
  }

  async remove(id: string, companyId: string) {
    // Ensure existence within tenant
    await this.findOne(id, companyId);

    await this.prisma.project.delete({
      where: { id },
    });

    return {
      message: 'Project berhasil dihapus',
      data: null,
    };
  }
}
