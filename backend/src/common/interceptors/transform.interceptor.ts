import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode: number;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((resData) => {
        let message = 'Success';
        let data = resData;

        if (resData && typeof resData === 'object' && 'message' in resData && 'data' in resData) {
          message = resData.message;
          data = resData.data;
        }

        return {
          success: true,
          statusCode: response.statusCode,
          message,
          data,
        };
      }),
    );
  }
}
