import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({
    example: '2026-01-01T10:00:00.000Z',
    description:
      'Concurrency token: nilai updatedAt task saat klien terakhir membacanya. ' +
      'Kalau task sudah berubah sejak itu, update ditolak 409 alih-alih menimpa.',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expectedUpdatedAt?: Date;
}
