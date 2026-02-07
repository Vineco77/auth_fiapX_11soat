import { Injectable } from '@nestjs/common';
import { Logger } from 'pino';
import { createPinoLogger } from './pino.config';

@Injectable()
export class PinoLoggerService {
  private logger: Logger;
  private context?: string;
  private traceId?: string;

  constructor() {
    this.logger = createPinoLogger();
  }

  setContext(context: string): void {
    this.context = context;
  }

  setTraceId(traceId: string): void {
    this.traceId = traceId;
  }

  getLogger(): Logger {
    return this.logger;
  }

  private getBaseLogObject(additionalData?: Record<string, any>) {
    return {
      context: this.context,
      traceId: this.traceId,
      ...additionalData,
    };
  }

  info(message: string, data?: Record<string, any>): void {
    this.logger.info(this.getBaseLogObject(data), message);
  }

  warn(message: string, data?: Record<string, any>): void {
    this.logger.warn(this.getBaseLogObject(data), message);
  }

  error(message: string, error?: Error, data?: Record<string, any>): void {
    this.logger.error(
      this.getBaseLogObject({
        ...data,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : undefined,
      }),
      message,
    );
  }

  audit(action: string, email: string, clientId?: string, data?: Record<string, any>): void {
    this.logger.info(
      this.getBaseLogObject({
        ...data,
        action,
        email,
        clientId,
        category: 'AUDIT',
      }),
      `[AUDIT] ${action} - ${email}`,
    );
  }

  http(method: string, url: string, statusCode: number, responseTime: number, data?: Record<string, any>): void {
    this.logger.info(
      this.getBaseLogObject({
        ...data,
        method,
        url,
        statusCode,
        responseTime,
        category: 'HTTP',
      }),
      `${method} ${url} ${statusCode} - ${responseTime}ms`,
    );
  }

  log(message: string, context?: string): void {
    const originalContext = this.context;
    if (context) {
      this.context = context;
    }
    this.info(message);
    this.context = originalContext;
  }
}
