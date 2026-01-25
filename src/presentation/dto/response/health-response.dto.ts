export interface ServiceStatus {
  status: 'ok' | 'error';
  responseTime?: number;
  error?: string;
}

export interface HealthResponseDto {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    postgres: ServiceStatus;
  };
  uptime: number;
}
