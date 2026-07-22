import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({
    summary: 'Add a user to the current tenant company (Admin only)',
  })
  @Roles(Role.ADMIN)
  @Post()
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.createInCompany(companyId, createUserDto);
  }

  @ApiOperation({ summary: 'Get all users in current tenant company' })
  @Get()
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.usersService.findAllInCompany(companyId);
  }

  @ApiOperation({ summary: 'Get user details by ID within current tenant' })
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.usersService.findOneInCompany(id, companyId);
  }
}
