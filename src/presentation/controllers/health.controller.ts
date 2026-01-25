import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { HealthService } from '@/application/services/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('detailed')
  async detailed() {
    try {
      const result = await this.healthService.execute();

      if (result.status === 'unhealthy') {
        throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Health check failed',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
