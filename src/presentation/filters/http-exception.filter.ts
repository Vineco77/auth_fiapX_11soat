import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLoggerService } from '@/infrastructure/logging/pino-logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLoggerService) {
    this.logger.setContext('HttpExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let responseBody: any;
    let errorMessage = 'Unknown error';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        responseBody = exceptionResponse;
        errorMessage = (exceptionResponse as any).message || exception.message;
      } else {
        responseBody = {
          statusCode: status,
          message: exceptionResponse,
          timestamp: new Date().toISOString(),
        };
        errorMessage = exceptionResponse;
      }
    } else {
      responseBody = {
        statusCode: status,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      };
      errorMessage = exception instanceof Error ? exception.message : 'Unknown error';
    }

    if (request.traceId) {
      this.logger.setTraceId(request.traceId);
      responseBody.traceId = request.traceId;
    }

    if (status >= 500) {
      this.logger.error(
        `HTTP ${status}: ${errorMessage}`,
        exception instanceof Error ? exception : undefined,
        {
          statusCode: status,
          method: request.method,
          url: request.url,
          traceId: request.traceId,
          responseBody,
        },
      );
    } else if (status >= 400) {
      this.logger.warn(`HTTP ${status}: ${errorMessage}`, {
        statusCode: status,
        method: request.method,
        url: request.url,
        traceId: request.traceId,
        responseBody,
      });
    }

    response.status(status).json(responseBody);
  }
}
