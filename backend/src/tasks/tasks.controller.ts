import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/v1/projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'Create task in project (Admin only)' })
  @Roles(Role.ADMIN)
  @Post()
  create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayloadUser,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(projectId, user, createTaskDto);
  }

  @ApiOperation({ summary: 'Get all tasks in project' })
  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.tasksService.findAllInProject(projectId, companyId);
  }

  @ApiOperation({ summary: 'Get task detail' })
  @Get(':id')
  findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.tasksService.findOne(projectId, id, companyId);
  }

  @ApiOperation({ summary: 'Update task (Admin or assigned Member)' })
  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadUser,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(projectId, id, user, updateTaskDto);
  }

  @ApiOperation({ summary: 'Delete task (Admin only)' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.tasksService.remove(projectId, id, companyId);
  }
}
