import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '@/application/services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const mockAuthService = () => ({
  register: jest.fn(),
  login: jest.fn(),
  validateToken: jest.fn(),
  deleteAccount: jest.fn(),
});

describe('AuthController', () => {
  let controller: AuthController;
  let authService: ReturnType<typeof mockAuthService>;

  beforeEach(async () => {
    authService = mockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should call authService.register and return the result', async () => {
      const dto = { email: 'test@example.com', password: 'Password@1' };
      const expected = { clientId: 'uuid', email: dto.email, accessToken: 'jwt', expiresIn: '7d', exp: 1234 };
      authService.register.mockResolvedValue(expected);

      const result = await controller.register(dto as any);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const dto = { email: 'test@example.com', password: 'Password@1' };
      const expected = { clientId: 'uuid', email: dto.email, accessToken: 'jwt', expiresIn: '7d', exp: 1234 };
      authService.login.mockResolvedValue(expected);

      const result = await controller.login(dto as any);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('validateToken', () => {
    it('should return {valid: false} when Authorization header is missing', async () => {
      const result = await controller.validateToken(undefined);
      expect(result).toEqual({ valid: false, error: 'Token não fornecido' });
    });

    it('should return {valid: false} when header does not start with Bearer', async () => {
      const result = await controller.validateToken('Basic sometoken');
      expect(result).toEqual({ valid: false, error: 'Token não fornecido' });
    });

    it('should call authService.validateToken with the extracted token', async () => {
      const token = 'my-jwt-token';
      authService.validateToken.mockResolvedValue({ valid: true, user: { email: 'test@example.com', clientId: 'uuid' } });

      const result = await controller.validateToken(`Bearer ${token}`);

      expect(authService.validateToken).toHaveBeenCalledWith(token);
      expect(result).toHaveProperty('valid', true);
    });
  });

  describe('deleteAccount', () => {
    it('should call authService.deleteAccount with the clientId from request', async () => {
      const req = { user: { clientId: 'client-uuid' } };
      authService.deleteAccount.mockResolvedValue({ success: true, message: 'Conta deletada com sucesso' });

      const result = await controller.deleteAccount(req as any);

      expect(authService.deleteAccount).toHaveBeenCalledWith('client-uuid');
      expect(result).toHaveProperty('success', true);
    });
  });
});
