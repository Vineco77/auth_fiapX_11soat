import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PinoLoggerService } from '../../infrastructure/logging/pino-logger.service';

declare global {
  namespace Express {
    interface Request {
      traceId?: string;
    }
  }
}
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: PinoLoggerService) {
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, headers } = req;
    const startTime = Date.now();

    const traceId = uuidv4();
    req.traceId = traceId;

    this.logger.setTraceId(traceId);

    this.logger.info(`Incoming request: ${method} ${originalUrl}`, {
      method,
      url: originalUrl,
      traceId,
      userAgent: headers['user-agent'],
      ip: req.ip,
      body: this.sanitizeBody(body),
    });

    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      this.logger.http(method, originalUrl, statusCode, responseTime, { traceId });

      if (statusCode >= 500) {
        this.logger.error(`Server error: ${method} ${originalUrl}`, undefined, {
          statusCode,
          responseTime,
          traceId,
        });
      } else if (statusCode >= 400) {
        this.logger.warn(`Client error: ${method} ${originalUrl}`, {
          statusCode,
          responseTime,
          traceId,
        });
      }
    });

    next();
  }

  private sanitizeBody(body: any): any {
    if (!body) return undefined;

    const sanitized = { ...body };
    
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}
