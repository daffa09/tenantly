import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayloadUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayloadUser;

    if (!user || !user.role) {
      throw new ForbiddenException('Akses ditolak: User role tidak ditemukan');
    }

    const hasRole = requiredRoles.includes(user.role as Role);
    if (!hasRole) {
      throw new ForbiddenException(`Akses ditolak: Role ${user.role} tidak memiliki hak akses`);
    }

    return true;
  }
}
