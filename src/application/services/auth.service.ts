import { Injectable } from '@nestjs/common';
import { IClientRepository } from '../interfaces/client-repository.interface';
import { IHashService } from '../interfaces/hash-service.interface';
import { ITokenService } from '../interfaces/token-service.interface';
import { IAuditLogger } from '../interfaces/audit-logger.interface';
import { ClientAlreadyExistsException } from '@/domain/exceptions/client-already-exists.exception';
import { InvalidCredentialsException } from '@/domain/exceptions/invalid-credentials.exception';
import { ClientNotFoundException } from '@/domain/exceptions/client-not-found.exception';
import { PinoLoggerService } from '@/infrastructure/logging/pino-logger.service';

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  clientId: string;
  email: string;
  accessToken: string;
  expiresIn: string;
  exp: number;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: {
    email: string;
    clientId: string;
  };
  error?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly clientRepository: IClientRepository,
    private readonly hashService: IHashService,
    private readonly tokenService: ITokenService,
    private readonly auditLogger: IAuditLogger,
    private readonly logger: PinoLoggerService,
  ) {
    this.logger.setContext('AuthService');
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password } = input;

    const existingClient = await this.clientRepository.findByEmail(email, true);
    
    if (existingClient && !existingClient.isDeleted()) {
      throw new ClientAlreadyExistsException(email);
    }
    
    if (existingClient && existingClient.isDeleted()) {
      const hashedPassword = await this.hashService.hash(password);
      const reactivatedClient = await this.clientRepository.reactivate(
        existingClient.id,
        hashedPassword,
      );

      const { token, expiresIn, exp } = await this.tokenService.generateToken({
        clientId: reactivatedClient.id,
        email: reactivatedClient.email,
        authenticated: true,
      });

      await this.auditLogger.log('USER_REACTIVATED', email, reactivatedClient.id);
      this.logger.info(`Cliente reativado: ${email}`, { clientId: reactivatedClient.id });

      return {
        clientId: reactivatedClient.id,
        email: reactivatedClient.email,
        accessToken: token,
        expiresIn,
        exp,
      };
    }

    const hashedPassword = await this.hashService.hash(password);
    const client = await this.clientRepository.create(email, hashedPassword);

    const { token, expiresIn, exp } = await this.tokenService.generateToken({
      clientId: client.id,
      email: client.email,
      authenticated: true,
    });

    await this.auditLogger.log('REGISTER', email, client.id);
    this.logger.info(`Novo cliente registrado: ${email}`, { clientId: client.id });

    return {
      clientId: client.id,
      email: client.email,
      accessToken: token,
      expiresIn,
      exp,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    const client = await this.clientRepository.findByEmail(email);
    if (!client) {
      await this.auditLogger.log('LOGIN_FAILED', email);
      throw new ClientNotFoundException();
    }

    const isPasswordValid = await this.hashService.compare(password, client.password);
    if (!isPasswordValid) {
      await this.auditLogger.log('LOGIN_FAILED', email, client.id);
      throw new InvalidCredentialsException();
    }

    const { token, expiresIn, exp } = await this.tokenService.generateToken({
      clientId: client.id,
      email: client.email,
      authenticated: true,
    });

    await this.auditLogger.log('LOGIN_SUCCESS', email, client.id);
    this.logger.info(`Login bem-sucedido: ${email}`, { clientId: client.id });

    return {
      clientId: client.id,
      email: client.email,
      accessToken: token,
      expiresIn,
      exp,
    };
  }

  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      const payload = await this.tokenService.verifyToken(token);

      const client = await this.clientRepository.findById(payload.clientId);
      if (!client) {
        await this.auditLogger.log('VALIDATE_TOKEN_FAILED', payload.email, payload.clientId);
        return { valid: false, error: 'Cliente não encontrado' };
      }

      await this.auditLogger.log('VALIDATE_TOKEN_SUCCESS', client.email, client.id);

      return {
        valid: true,
        user: {
          email: client.email,
          clientId: client.id,
        },
      };
    } catch (error: any) {
      const decoded = this.tokenService.decodeToken(token);
      const email = decoded?.email || 'unknown';

      await this.auditLogger.log('VALIDATE_TOKEN_FAILED', email);

      return {
        valid: false,
        error: error.message || 'Token inválido',
      };
    }
  }

  async deleteAccount(clientId: string): Promise<{ success: boolean; message: string }> {
    const client = await this.clientRepository.findById(clientId);
    
    if (!client) {
      throw new ClientNotFoundException('Usuário não encontrado');
    }

    await this.clientRepository.softDelete(clientId);
    await this.auditLogger.log('USER_DELETED', client.email, clientId);
    this.logger.info(`Conta deletada: ${client.email}`, { clientId });

    return {
      success: true,
      message: 'Conta deletada com sucesso',
    };
  }
}
