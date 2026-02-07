export interface ServiceStatus {
  status: 'ok' | 'error';
  responseTime?: number;
  error?: string;
  message?: string;
}

export interface HealthResponseDto {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    postgres: ServiceStatus;
    elasticsearch: ServiceStatus;
  };
  uptime: number;
}
