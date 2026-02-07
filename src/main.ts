import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '@/presentation/filters/http-exception.filter';
import { PinoLoggerService } from '@/infrastructure/logging/pino-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const logger = app.get(PinoLoggerService);
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.setContext('Bootstrap');
  logger.info(`Auth Service iniciado na porta ${port}`, { port, environment: process.env.NODE_ENV });
}
bootstrap();