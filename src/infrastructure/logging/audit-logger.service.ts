import { Injectable } from '@nestjs/common';
import {
  IAuditLogger,
  AuditAction,
} from '@/application/interfaces/audit-logger.interface';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class AuditLoggerService implements IAuditLogger {
  constructor(private readonly prisma: PrismaService) {}

  async log(action: AuditAction, email: string, clientId?: string): Promise<void> {
    await this.prisma.authLog.create({
      data: {
        email,
        action,
        clientId,
      },
    });
  }
}
