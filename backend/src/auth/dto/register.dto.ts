import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'Acme Corp',
    description: 'Name of the NEW tenant to create',
  })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@acme.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8, maxLength: 72 })
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72) // bcrypt silently truncates past 72 bytes
  password: string;
}
// The registering user is always the ADMIN of the tenant they just created.
// `role` is deliberately absent: with forbidNonWhitelisted a client sending
// it gets a 400 instead of silently escalating.
