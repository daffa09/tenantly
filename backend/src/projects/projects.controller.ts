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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Create project (Admin only)' })
  @Roles(Role.ADMIN)
  @Post()
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(companyId, createProjectDto);
  }

  @ApiOperation({ summary: 'Get all projects in current tenant company' })
  @Get()
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.projectsService.findAll(companyId);
  }

  @ApiOperation({ summary: 'Get project detail by ID within tenant' })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.projectsService.findOne(id, companyId);
  }

  @ApiOperation({ summary: 'Update project (Admin only)' })
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, companyId, updateProjectDto);
  }

  @ApiOperation({ summary: 'Delete project (Admin only)' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.projectsService.remove(id, companyId);
  }
}
