import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let responseBody: any;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        responseBody = exceptionResponse;
      } else {
        responseBody = {
          statusCode: status,
          message: exceptionResponse,
          timestamp: new Date().toISOString(),
        };
      }
    } else {
      responseBody = {
        statusCode: status,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      };
    }

    this.logger.error(`Status: ${status} Error: ${JSON.stringify(responseBody)}`);

    response.status(status).json(responseBody);
  }
}
