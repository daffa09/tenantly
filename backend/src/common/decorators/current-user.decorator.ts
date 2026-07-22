import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Kept as a class, not an interface: it appears in decorated controller
 * signatures, which need a value at runtime for emitDecoratorMetadata.
 */
export class JwtPayloadUser {
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  companyId: string;
}

/** What JwtStrategy.validate() attaches to every authenticated request. */
export type AuthenticatedRequest = Request & { user?: JwtPayloadUser };

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayloadUser | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
    return data ? user?.[data] : user;
  },
);
