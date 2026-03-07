import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { PinoLoggerService } from '@/infrastructure/logging/pino-logger.service';
import { ArgumentsHost } from '@nestjs/common';

const makeMockHost = (url = '/test') => {
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const mockRequest = { url };
  return {
    host: {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ArgumentsHost,
    response: mockResponse,
  };
};

const mockLogger = () =>
  ({
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as jest.Mocked<PinoLoggerService>);

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter(mockLogger());
  });

  describe('catch', () => {
    it('should respond with the correct status for an HttpException', () => {
      const { host, response } = makeMockHost();
      const exception = new HttpException('Forbidden access', HttpStatus.FORBIDDEN);

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(response.json).toHaveBeenCalled();
    });

    it('should respond with 500 for a non-HttpException error', () => {
      const { host, response } = makeMockHost();
      const exception = new Error('Unexpected database error');

      filter.catch(exception, host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.json).toHaveBeenCalled();
    });

    it('should include statusCode and message in the response body for HttpException', () => {
      const { host, response } = makeMockHost();
      const exception = new HttpException({ statusCode: 404, message: 'Not found' }, HttpStatus.NOT_FOUND);

      filter.catch(exception, host);

      const body = (response.json as jest.Mock).mock.calls[0][0];
      expect(body).toBeDefined();
    });

    it('should respond with 500 and internal server error message for unknown errors', () => {
      const { host, response } = makeMockHost();
      filter.catch('string error', host);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      const body = (response.json as jest.Mock).mock.calls[0][0];
      expect(body.message).toBe('Internal server error');
    });
  });
});
