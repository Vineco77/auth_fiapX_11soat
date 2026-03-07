import { Controller, Get } from '@nestjs/common';
import { ServiceStatus } from '../dto/response/service-status.dto';

@Controller()
export class HealthApiController {
  @Get('healthAPI')
  async checkHealth(): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    return {
      status: 'ok',
      responseTime: Date.now() - startTime,
    };
  }
}
