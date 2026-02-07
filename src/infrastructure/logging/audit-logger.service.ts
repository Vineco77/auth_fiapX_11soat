import { Injectable } from '@nestjs/common';
import {
  IAuditLogger,
  AuditAction,
} from '@/application/interfaces/audit-logger.interface';
import { PinoLoggerService } from './pino-logger.service';

@Injectable()
export class AuditLoggerService implements IAuditLogger {
  constructor(private readonly logger: PinoLoggerService) {
    this.logger.setContext('AuditLogger');
  }

  async log(action: AuditAction, email: string, clientId?: string): Promise<void> {
    this.logger.audit(action, email, clientId);
  }
}
