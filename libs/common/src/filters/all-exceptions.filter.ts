import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp(); //req, res
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR; // 500 ERR
    let message = 'internal server error';
    let errorCode = 'SYSTEM_ERROR';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const resResponse = exception.getResponse();
      message =
        typeof resResponse === 'object'
          ? (resResponse as any).message
          : exception.message;
      errorCode = `HTTP_${statusCode}`;
    } else if (exception instanceof Error) {
      this.logger.error(
        `Critical error: ${exception.message}`,
        exception.stack,
      );
      message = 'An unexception error occurred. Please try again later.';
    }

    response.status(statusCode).json({
      statusCode,
      message,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
