import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Bob Wijaya' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'bob@acme.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8, maxLength: 72 })
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72) // bcrypt silently truncates past 72 bytes
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.MEMBER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
// No companyId here on purpose: the tenant comes from the caller's JWT.
