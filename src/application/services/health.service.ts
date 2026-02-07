import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  HealthResponseDto,
  ServiceStatus,
} from '@/presentation/dto/response/health-response.dto';
import { PinoLoggerService } from '@/infrastructure/logging/pino-logger.service';
import { testElasticsearchConnection } from '@/infrastructure/logging/pino.config';

@Injectable()
export class HealthService {
  private readonly POSTGRES_TIMEOUT = 2000; // 2 segundos
  private readonly ELASTICSEARCH_TIMEOUT = 2000; // 2 segundos

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLoggerService,
  ) {
    this.logger.setContext('HealthService');
  }

  async execute(): Promise<HealthResponseDto> {
    const [postgresStatus, elasticsearchStatus] = await Promise.all([
      this.checkPostgres(),
      this.checkElasticsearch(),
    ]);

    const services = {
      postgres: postgresStatus,
      elasticsearch: elasticsearchStatus,
    };

    const status = this.determineOverallStatus(services);

    return {
      status,
      timestamp: new Date().toISOString(),
      services,
      uptime: process.uptime(),
    };
  }

  private async checkPostgres(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      // Query simples para verificar conexão
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        this.timeout(this.POSTGRES_TIMEOUT),
      ]);

      const responseTime = Date.now() - start;
      this.logger.info(`Postgres health check: OK (${responseTime}ms)`, { responseTime });

      return { status: 'ok', responseTime };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Postgres health check failed: ${errorMessage}`, error instanceof Error ? error : undefined);

      return {
        status: 'error',
        error: errorMessage,
      };
    }
  }

  private async checkElasticsearch(): Promise<ServiceStatus> {
    try {
      const result = await Promise.race([
        testElasticsearchConnection(),
        this.timeout(this.ELASTICSEARCH_TIMEOUT),
      ]);

      this.logger.info(`Elasticsearch health check: ${result.status.toUpperCase()}`, {
        responseTime: result.responseTime,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Elasticsearch health check failed: ${errorMessage}`,
        error instanceof Error ? error : undefined,
      );

      return {
        status: 'error',
        message: errorMessage,
      };
    }
  }

  private determineOverallStatus(services: {
    postgres: ServiceStatus;
    elasticsearch: ServiceStatus;
  }): 'healthy' | 'unhealthy' {
    return services.postgres.status === 'ok' ? 'healthy' : 'unhealthy';
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout exceeded')), ms),
    );
  }
}
