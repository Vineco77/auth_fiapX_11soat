import pino from 'pino';
import { Client } from '@elastic/elasticsearch';

const elasticsearchClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  maxRetries: 3,
  requestTimeout: 5000,
  sniffOnStart: false,
});

const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX || 'auth-service-logs';

const elasticsearchStream = {
  write: async (msg: string) => {
    try {
      const log = JSON.parse(msg);
      
      if (!log['@timestamp']) {
        log['@timestamp'] = new Date().toISOString();
      }

      await elasticsearchClient.index({
        index: ELASTICSEARCH_INDEX,
        body: log,
      });
    } catch (error) {
      console.error('[ELASTICSEARCH OFFLINE] Fallback to console:', msg);
      
      if (error instanceof Error && !error.message.includes('logged')) {
        console.error(`[ELASTICSEARCH ERROR] ${error.message}`);
        (error as any).message += ' (logged)';
      }
    }
  },
};

export const pinoConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  
  timestamp: () => `,"@timestamp":"${new Date().toISOString()}"`,
  
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
    log: (object: Record<string, any>) => {
      return {
        ...object,
        service: 'auth-service',
        environment: process.env.NODE_ENV || 'development',
      };
    },
  },

  serializers: {
    req: (req: any) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers?.host,
        'user-agent': req.headers?.['user-agent'],
        'content-type': req.headers?.['content-type'],
      },
      traceId: req.traceId,
    }),
    res: (res: any) => ({
      statusCode: res.statusCode,
      headers: {
        'content-type': res.headers?.['content-type'],
      },
    }),
    err: (err: any) => ({
      type: err.constructor?.name,
      message: err.message,
      stack: err.stack,
    }),
  },
};

export const createPinoLogger = () => {
  const logger = pino(pinoConfig, pino.multistream([
    { level: 'info', stream: elasticsearchStream as any },
    
    ...(process.env.NODE_ENV === 'development'
      ? [{ level: 'info', stream: process.stdout }]
      : []),
  ]));

  return logger;
};

export const testElasticsearchConnection = async (): Promise<{
  status: 'ok' | 'error';
  message?: string;
  responseTime?: number;
}> => {
  const startTime = Date.now();
  
  try {
    const response = await elasticsearchClient.cluster.health({
      timeout: '2s',
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.status === 'red' ? 'error' : 'ok',
      responseTime,
      message: response.status === 'red' ? 'Cluster unhealthy' : undefined,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
    };
  }
};

export { elasticsearchClient };
