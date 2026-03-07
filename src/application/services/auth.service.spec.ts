import { AuthService } from './auth.service';
import { IClientRepository } from '../interfaces/client-repository.interface';
import { IHashService } from '../interfaces/hash-service.interface';
import { ITokenService, TokenResponse } from '../interfaces/token-service.interface';
import { IAuditLogger } from '../interfaces/audit-logger.interface';
import { PinoLoggerService } from '@/infrastructure/logging/pino-logger.service';
import { Client } from '@/domain/entities/client.entity';
import { ClientAlreadyExistsException } from '@/domain/exceptions/client-already-exists.exception';
import { InvalidCredentialsException } from '@/domain/exceptions/invalid-credentials.exception';
import { ClientNotFoundException } from '@/domain/exceptions/client-not-found.exception';

const makeClient = (overrides: Partial<{
  id: string;
  email: string;
  password: string;
  deletedAt: Date | null;
}> = {}): Client =>
  new Client(
    overrides.id ?? 'client-uuid',
    overrides.email ?? 'test@example.com',
    overrides.password ?? 'hashed-pw',
    overrides.deletedAt ?? null,
    new Date(),
    new Date(),
  );

const makeTokenResponse = (): TokenResponse => ({
  token: 'jwt-token',
  expiresIn: '7d',
  exp: Math.floor(Date.now() / 1000) + 604800,
});

const makeMocks = () => {
  const clientRepository: jest.Mocked<IClientRepository> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    softDelete: jest.fn(),
    reactivate: jest.fn(),
  };
  const hashService: jest.Mocked<IHashService> = {
    hash: jest.fn().mockResolvedValue('hashed-pw'),
    compare: jest.fn(),
  };
  const tokenService: jest.Mocked<ITokenService> = {
    generateToken: jest.fn().mockResolvedValue(makeTokenResponse()),
    verifyToken: jest.fn(),
    decodeToken: jest.fn(),
  };
  const auditLogger: jest.Mocked<IAuditLogger> = {
    log: jest.fn().mockResolvedValue(undefined),
  };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as jest.Mocked<PinoLoggerService>;

  return { clientRepository, hashService, tokenService, auditLogger, logger };
};

describe('AuthService', () => {
  let service: AuthService;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    service = new AuthService(
      mocks.clientRepository,
      mocks.hashService,
      mocks.tokenService,
      mocks.auditLogger,
      mocks.logger,
    );
  });

  // ─────────────────────────────────────────
  // register
  // ─────────────────────────────────────────
  describe('register', () => {
    it('should create a new user and return auth response', async () => {
      const client = makeClient();
      mocks.clientRepository.findByEmail.mockResolvedValue(null);
      mocks.clientRepository.create.mockResolvedValue(client);

      const result = await service.register({ email: client.email, password: 'Password@1' });

      expect(mocks.clientRepository.create).toHaveBeenCalledWith(
        client.email,
        'hashed-pw',
      );
      expect(result.clientId).toBe(client.id);
      expect(result.email).toBe(client.email);
      expect(result.accessToken).toBe('jwt-token');
      expect(mocks.auditLogger.log).toHaveBeenCalledWith('REGISTER', client.email, client.id);
    });

    it('should throw ClientAlreadyExistsException when active client already exists', async () => {
      const client = makeClient();
      mocks.clientRepository.findByEmail.mockResolvedValue(client);

      await expect(
        service.register({ email: client.email, password: 'Password@1' }),
      ).rejects.toThrow(ClientAlreadyExistsException);
    });

    it('should reactivate a previously deleted account', async () => {
      const deletedClient = makeClient({ deletedAt: new Date() });
      const reactivatedClient = makeClient({ deletedAt: null });
      mocks.clientRepository.findByEmail.mockResolvedValue(deletedClient);
      mocks.clientRepository.reactivate.mockResolvedValue(reactivatedClient);

      const result = await service.register({ email: deletedClient.email, password: 'Password@1' });

      expect(mocks.clientRepository.reactivate).toHaveBeenCalledWith(
        deletedClient.id,
        'hashed-pw',
      );
      expect(result.clientId).toBe(reactivatedClient.id);
      expect(mocks.auditLogger.log).toHaveBeenCalledWith(
        'USER_REACTIVATED',
        reactivatedClient.email,
        reactivatedClient.id,
      );
    });
  });

  // ─────────────────────────────────────────
  // login
  // ─────────────────────────────────────────
  describe('login', () => {
    it('should return auth response with valid credentials', async () => {
      const client = makeClient();
      mocks.clientRepository.findByEmail.mockResolvedValue(client);
      mocks.hashService.compare.mockResolvedValue(true);

      const result = await service.login({ email: client.email, password: 'Password@1' });

      expect(result.accessToken).toBe('jwt-token');
      expect(result.clientId).toBe(client.id);
      expect(mocks.auditLogger.log).toHaveBeenCalledWith('LOGIN_SUCCESS', client.email, client.id);
    });

    it('should throw ClientNotFoundException when email does not exist', async () => {
      mocks.clientRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'notfound@example.com', password: 'Password@1' }),
      ).rejects.toThrow(ClientNotFoundException);

      expect(mocks.auditLogger.log).toHaveBeenCalledWith('LOGIN_FAILED', 'notfound@example.com');
    });

    it('should throw InvalidCredentialsException when password is wrong', async () => {
      const client = makeClient();
      mocks.clientRepository.findByEmail.mockResolvedValue(client);
      mocks.hashService.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: client.email, password: 'WrongPassword' }),
      ).rejects.toThrow(InvalidCredentialsException);

      expect(mocks.auditLogger.log).toHaveBeenCalledWith('LOGIN_FAILED', client.email, client.id);
    });
  });

  // ─────────────────────────────────────────
  // validateToken
  // ─────────────────────────────────────────
  describe('validateToken', () => {
    it('should return {valid: true, user} when token is valid and client exists', async () => {
      const client = makeClient();
      mocks.tokenService.verifyToken.mockResolvedValue({
        clientId: client.id,
        email: client.email,
        authenticated: true,
      });
      mocks.clientRepository.findById.mockResolvedValue(client);

      const result = await service.validateToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.user).toEqual({ email: client.email, clientId: client.id });
    });

    it('should return {valid: false} when token is valid but client not found', async () => {
      mocks.tokenService.verifyToken.mockResolvedValue({
        clientId: 'ghost-id',
        email: 'ghost@example.com',
        authenticated: true,
      });
      mocks.clientRepository.findById.mockResolvedValue(null);

      const result = await service.validateToken('valid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cliente não encontrado');
    });

    it('should return {valid: false} when token verification throws', async () => {
      mocks.tokenService.verifyToken.mockRejectedValue(new Error('jwt expired'));
      mocks.tokenService.decodeToken.mockReturnValue(null);

      const result = await service.validateToken('expired-token');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('jwt expired');
    });
  });

  // ─────────────────────────────────────────
  // deleteAccount
  // ─────────────────────────────────────────
  describe('deleteAccount', () => {
    it('should soft delete and return success', async () => {
      const client = makeClient();
      mocks.clientRepository.findById.mockResolvedValue(client);
      mocks.clientRepository.softDelete.mockResolvedValue(undefined);

      const result = await service.deleteAccount(client.id);

      expect(mocks.clientRepository.softDelete).toHaveBeenCalledWith(client.id);
      expect(mocks.auditLogger.log).toHaveBeenCalledWith('USER_DELETED', client.email, client.id);
      expect(result.success).toBe(true);
    });

    it('should throw ClientNotFoundException when client does not exist', async () => {
      mocks.clientRepository.findById.mockResolvedValue(null);

      await expect(service.deleteAccount('non-existent-id')).rejects.toThrow(
        ClientNotFoundException,
      );
    });
  });
});
