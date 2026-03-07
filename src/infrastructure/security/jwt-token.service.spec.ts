import { JwtTokenService } from './jwt-token.service';
import { ConfigService } from '@nestjs/config';

const JWT_SECRET = 'test-secret-32-chars-long-xxxxxxxxxxx';
const JWT_EXPIRES_IN = '7d';

const makeConfigService = (): jest.Mocked<ConfigService> =>
  ({
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'JWT_SECRET') return JWT_SECRET;
      if (key === 'JWT_EXPIRES_IN') return JWT_EXPIRES_IN;
      return defaultValue;
    }),
  } as any);

describe('JwtTokenService', () => {
  let service: JwtTokenService;

  beforeEach(() => {
    service = new JwtTokenService(makeConfigService());
  });

  describe('generateToken', () => {
    it('should return token, expiresIn, and exp', async () => {
      const payload = { clientId: 'uuid-123', email: 'test@example.com', authenticated: true };
      const result = await service.generateToken(payload);

      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.expiresIn).toBe(JWT_EXPIRES_IN);
      expect(typeof result.exp).toBe('number');
      expect(result.exp).toBeGreaterThan(Date.now() / 1000);
    });
  });

  describe('verifyToken', () => {
    it('should return payload for a valid token', async () => {
      const payload = { clientId: 'uuid-123', email: 'test@example.com', authenticated: true };
      const { token } = await service.generateToken(payload);
      const decoded = await service.verifyToken(token);

      expect(decoded.clientId).toBe(payload.clientId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.authenticated).toBe(payload.authenticated);
    });

    it('should throw for an invalid token', async () => {
      await expect(service.verifyToken('invalid.token.here')).rejects.toThrow();
    });

    it('should throw for a token signed with a different secret', async () => {
      const otherService = new JwtTokenService({
        get: jest.fn((key: string) => {
          if (key === 'JWT_SECRET') return 'different-secret-32-chars-long-xxx';
          if (key === 'JWT_EXPIRES_IN') return '7d';
          return undefined;
        }),
      } as any);
      const { token } = await otherService.generateToken({
        clientId: 'uuid-999',
        email: 'other@example.com',
        authenticated: true,
      });

      await expect(service.verifyToken(token)).rejects.toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should return payload without verifying signature', async () => {
      const payload = { clientId: 'uuid-123', email: 'test@example.com', authenticated: true };
      const { token } = await service.generateToken(payload);
      const decoded = service.decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.clientId).toBe(payload.clientId);
      expect(decoded!.email).toBe(payload.email);
    });

    it('should return null for a completely invalid token string', () => {
      const result = service.decodeToken('not-a-jwt-at-all-xxxxx');
      expect(result).toBeNull();
    });
  });
});
