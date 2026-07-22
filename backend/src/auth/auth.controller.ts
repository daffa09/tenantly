import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  CurrentUser,
  JwtPayloadUser,
} from '../common/decorators/current-user.decorator';
import { clearAuthCookie, setAuthCookie } from './auth.cookie';

// Credential endpoints get a tighter budget than the global one: 5 attempts
// per minute per IP is plenty for a human and useless for a password guesser.
const CREDENTIAL_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary: 'Register a new tenant company and its first admin',
  })
  @Throttle(CREDENTIAL_THROTTLE)
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { message, data } = await this.authService.register(dto);
    setAuthCookie(res, data.token);
    return { message, data: { user: data.user } };
  }

  @ApiOperation({ summary: 'Login user' })
  @Throttle(CREDENTIAL_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { message, data } = await this.authService.login(dto);
    setAuthCookie(res, data.token);
    return { message, data: { user: data.user } };
  }

  @ApiOperation({ summary: 'Logout and clear the session cookie' })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res);
    return { message: 'Logout berhasil', data: null };
  }

  @ApiOperation({ summary: 'Get current logged-in user profile' })
  @ApiCookieAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@CurrentUser() user: JwtPayloadUser) {
    return {
      message: 'Profile retrieved',
      data: user,
    };
  }
}
