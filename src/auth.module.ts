import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from '@/application/services/auth.service';
import { AuthController } from '@/presentation/controllers/auth.controller';
import { ClientRepository } from '@/infrastructure/database/repositories/client.repository';
import { BcryptHashService } from '@/infrastructure/security/bcrypt-hash.service';
import { JwtTokenService } from '@/infrastructure/security/jwt-token.service';
import { AuditLoggerService } from '@/infrastructure/logging/audit-logger.service';
import { JwtStrategy } from '@/infrastructure/security/jwt.strategy';
import { PrismaModule } from '@/infrastructure/database/prisma/prisma.module';
import { PinoLoggerService } from '@/infrastructure/logging/pino-logger.service';

export const CLIENT_REPOSITORY = 'IClientRepository';
export const HASH_SERVICE = 'IHashService';
export const TOKEN_SERVICE = 'ITokenService';
export const AUDIT_LOGGER = 'IAuditLogger';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    {
      provide: CLIENT_REPOSITORY,
      useClass: ClientRepository,
    },
    {
      provide: HASH_SERVICE,
      useClass: BcryptHashService,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
    {
      provide: AUDIT_LOGGER,
      useClass: AuditLoggerService,
    },
    {
      provide: AuthService,
      useFactory: (clientRepo, hashService, tokenService, auditLogger, logger) => {
        return new AuthService(clientRepo, hashService, tokenService, auditLogger, logger);
      },
      inject: [CLIENT_REPOSITORY, HASH_SERVICE, TOKEN_SERVICE, AUDIT_LOGGER, PinoLoggerService],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
