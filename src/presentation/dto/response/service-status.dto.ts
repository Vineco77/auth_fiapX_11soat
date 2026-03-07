export interface ServiceStatus {
  status: 'ok' | 'error';
  responseTime?: number;
  error?: string;
}
