import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export class JwtPayloadUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  companyId: string;
}

export type AuthenticatedRequest = Request & { user?: JwtPayloadUser };

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayloadUser | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
    return data ? user?.[data] : user;
  },
);
