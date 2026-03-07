import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { HealthController } from './presentation/controllers/health.controller';
import { HealthApiController } from './presentation/controllers/health-api.controller';
import { HealthService } from './application/services/health.service';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { LoggerModule } from './infrastructure/logging/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    AuthModule,
    PrismaModule,
  ],
  controllers: [HealthController, HealthApiController],
  providers: [HealthService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}