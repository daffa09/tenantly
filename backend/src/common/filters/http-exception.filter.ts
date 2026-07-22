import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: any =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      message = exceptionResponse.message || exceptionResponse.error || message;
      if (Array.isArray(message)) {
        message = message.join(', ');
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      data: null,
    });
  }
}
