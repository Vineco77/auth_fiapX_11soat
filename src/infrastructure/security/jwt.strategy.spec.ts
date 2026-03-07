import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { JwtPayload } from '@/application/interfaces/token-service.interface';

const mockConfigService = (): jest.Mocked<ConfigService> =>
  ({
    get: jest.fn().mockReturnValue('test-secret-32-chars-long-xxxxxxxxxxx'),
  } as any);

const mockPrismaService = () =>
  ({
    client: {
      findFirst: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>);

const makePayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  clientId: 'uuid-123',
  email: 'test@example.com',
  authenticated: true,
  ...overrides,
});

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: ReturnType<typeof mockPrismaService>;

  beforeEach(() => {
    prisma = mockPrismaService();
    strategy = new JwtStrategy(mockConfigService(), prisma as any);
  });

  describe('validate', () => {
    it('should return user object when client is active', async () => {
      const payload = makePayload();
      (prisma.client.findFirst as jest.Mock).mockResolvedValue({
        id: payload.clientId,
        email: payload.email,
        deletedAt: null,
      });

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        clientId: payload.clientId,
        email: payload.email,
        authenticated: payload.authenticated,
      });
    });

    it('should throw UnauthorizedException when client is not found', async () => {
      (prisma.client.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(strategy.validate(makePayload())).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should query with deletedAt: null to reject deleted accounts', async () => {
      (prisma.client.findFirst as jest.Mock).mockResolvedValue(null);
      const payload = makePayload();

      await strategy.validate(payload).catch(() => null);

      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: { id: payload.clientId, deletedAt: null },
      });
    });
  });
});
