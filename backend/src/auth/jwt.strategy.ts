import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_COOKIE } from './auth.cookie';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  companyId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Cookie only. No Authorization header fallback, otherwise a token
      // stolen through XSS could still be replayed by script.
      jwtFromRequest: (req: Request): string | null =>
        (req?.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE] ??
        null,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak valid atau telah dihapus');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
    };
  }
}
