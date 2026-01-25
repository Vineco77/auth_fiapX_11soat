import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  HealthResponseDto,
  ServiceStatus,
} from '@/presentation/dto/response/health-response.dto';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly POSTGRES_TIMEOUT = 2000; // 2 segundos

  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<HealthResponseDto> {
    const postgresStatus = await this.checkPostgres();

    const services = {
      postgres: postgresStatus,
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
      this.logger.log(`Postgres health check: OK (${responseTime}ms)`);

      return { status: 'ok', responseTime };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Postgres health check failed: ${errorMessage}`);

      return {
        status: 'error',
        error: errorMessage,
      };
    }
  }

  private determineOverallStatus(services: {
    postgres: ServiceStatus;
  }): 'healthy' | 'unhealthy' {
    // Se Postgres está OK, sistema está healthy
    // Se Postgres está com erro, sistema está unhealthy (sem degraded pois só temos 1 dependência crítica)
    return services.postgres.status === 'ok' ? 'healthy' : 'unhealthy';
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout exceeded')), ms),
    );
  }
}
