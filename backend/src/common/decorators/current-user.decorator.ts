import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class JwtPayloadUser {
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  companyId: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayloadUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayloadUser;
    return data ? user?.[data] : user;
  },
);
