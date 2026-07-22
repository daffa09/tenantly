import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const existingCompany = await this.prisma.company.findFirst({
      where: { name: dto.companyName },
    });

    if (existingCompany) {
      throw new ConflictException('Nama perusahaan sudah dipakai tenant lain');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const company = await this.prisma.company.create({
      data: { name: dto.companyName },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: Role.ADMIN,
        companyId: company.id,
      },
    });

    const token = this.generateToken(
      user.id,
      user.email,
      user.name,
      user.role,
      user.companyId,
    );

    return {
      message: 'Registrasi berhasil',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          companyName: company.name,
        },
        token,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const token = this.generateToken(
      user.id,
      user.email,
      user.name,
      user.role,
      user.companyId,
    );

    return {
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          companyName: user.company.name,
        },
        token,
      },
    };
  }

  private generateToken(
    userId: string,
    email: string,
    name: string,
    role: string,
    companyId: string,
  ) {
    const payload = { sub: userId, email, name, role, companyId };
    return this.jwtService.sign(payload);
  }
}
