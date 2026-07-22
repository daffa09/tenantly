import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode: number;
}

interface ServiceResult<T> {
  message: string;
  data: T;
}

const isServiceResult = <T>(value: unknown): value is ServiceResult<T> =>
  typeof value === 'object' &&
  value !== null &&
  'message' in value &&
  'data' in value;

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ResponseEnvelope<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T | ServiceResult<T>>,
  ): Observable<ResponseEnvelope<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((resData) => ({
        success: true,
        statusCode: response.statusCode,
        message: isServiceResult<T>(resData) ? resData.message : 'Success',
        data: isServiceResult<T>(resData) ? resData.data : resData,
      })),
    );
  }
}
