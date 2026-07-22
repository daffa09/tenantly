import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { NotificationService } from '../notifications/notification.service';
import { Role } from '@prisma/client';
import { JwtPayloadUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async create(projectId: string, user: JwtPayloadUser, dto: CreateTaskDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!project) {
      throw new NotFoundException(
        'Project tidak ditemukan atau tidak berada di perusahaan ini',
      );
    }

    let assigneeUser = null;
    if (dto.assigneeId) {
      assigneeUser = await this.prisma.user.findFirst({
        where: { id: dto.assigneeId, companyId: user.companyId },
      });
      if (!assigneeUser) {
        throw new BadRequestException(
          'Assignee user tidak ditemukan di perusahaan ini',
        );
      }
    }

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        projectId,
        companyId: user.companyId,
        assigneeId: dto.assigneeId,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (assigneeUser) {
      await this.notificationService.dispatchTaskAssigned({
        taskId: task.id,
        taskTitle: task.title,
        assigneeId: assigneeUser.id,
        assigneeEmail: assigneeUser.email,
        companyId: user.companyId,
        assignedBy: user.name,
      });
    }

    return {
      message: 'Task berhasil dibuat',
      data: task,
    };
  }

  async findAllInProject(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
    });

    if (!project) {
      throw new NotFoundException('Project tidak ditemukan di perusahaan ini');
    }

    const tasks = await this.prisma.task.findMany({
      where: { projectId, companyId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Daftar task berhasil diambil',
      data: tasks,
    };
  }

  async findOne(projectId: string, taskId: string, companyId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
        companyId, // Strict tenant scoping
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task tidak ditemukan di perusahaan ini');
    }

    return {
      message: 'Detail task berhasil diambil',
      data: task,
    };
  }

  async update(
    projectId: string,
    taskId: string,
    user: JwtPayloadUser,
    dto: UpdateTaskDto,
  ) {
    const taskRes = await this.findOne(projectId, taskId, user.companyId);
    const existingTask = taskRes.data;

    if (user.role === Role.MEMBER) {
      if (existingTask.assigneeId !== user.id) {
        throw new ForbiddenException(
          'Akses ditolak: Member hanya dapat mengubah task yang di-assign ke dirinya',
        );
      }
    }

    let newAssigneeUser = null;
    if (dto.assigneeId && dto.assigneeId !== existingTask.assigneeId) {
      newAssigneeUser = await this.prisma.user.findFirst({
        where: { id: dto.assigneeId, companyId: user.companyId },
      });
      if (!newAssigneeUser) {
        throw new BadRequestException(
          'Assignee user tidak ditemukan di perusahaan ini',
        );
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        assigneeId: dto.assigneeId,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (newAssigneeUser) {
      await this.notificationService.dispatchTaskAssigned({
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        assigneeId: newAssigneeUser.id,
        assigneeEmail: newAssigneeUser.email,
        companyId: user.companyId,
        assignedBy: user.name,
      });
    }

    return {
      message: 'Task berhasil diperbarui',
      data: updatedTask,
    };
  }

  async remove(projectId: string, taskId: string, companyId: string) {
    await this.findOne(projectId, taskId, companyId);

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return {
      message: 'Task berhasil dihapus',
      data: null,
    };
  }
}
