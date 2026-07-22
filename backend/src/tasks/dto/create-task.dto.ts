import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement JWT Auth Guard' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Add Bearer token validation' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ example: 'uuid-user-id', description: 'User ID to assign this task to' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
