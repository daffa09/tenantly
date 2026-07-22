import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Get all users in current tenant company' })
  @Get()
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.usersService.findAllInCompany(companyId);
  }

  @ApiOperation({ summary: 'Get user details by ID within current tenant' })
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.usersService.findOneInCompany(id, companyId);
  }
}
