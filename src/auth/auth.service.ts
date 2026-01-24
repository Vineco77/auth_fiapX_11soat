import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ValidateTokenResponseDto } from './dto/validate-token-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default_secret_change_in_production';
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password } = registerDto;

    // Verificar se usuário já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Gerar JWT com payload padronizado
    const payload: JwtPayload = {
      clientId: user.id,
      email: user.email,
      authenticated: true,
    };

    const token = jwt.sign(
      payload,
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn } as jwt.SignOptions,
    );

    // Decodificar para obter exp
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    // Log de registro
    await this.prisma.authLog.create({
      data: {
        email,
        action: 'REGISTER',
        userId: user.id,
      },
    });

    this.logger.log(`Novo usuário registrado: ${email}`);

    return {
      clientId: user.id,
      email: user.email,
      accessToken: token,
      expiresIn: this.jwtExpiresIn,
      exp: decoded.exp,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await this.prisma.authLog.create({
        data: {
          email,
          action: 'LOGIN_FAILED',
        },
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await this.prisma.authLog.create({
        data: {
          email,
          action: 'LOGIN_FAILED',
          userId: user.id,
        },
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Gerar JWT com payload padronizado
    const payload: JwtPayload = {
      clientId: user.id,
      email: user.email,
      authenticated: true,
    };

    const token = jwt.sign(
      payload,
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn } as jwt.SignOptions,
    );

    // Decodificar para obter exp
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    // Log de login bem-sucedido
    await this.prisma.authLog.create({
      data: {
        email,
        action: 'LOGIN_SUCCESS',
        userId: user.id,
      },
    });

    this.logger.log(`Login bem-sucedido: ${email}`);

    return {
      clientId: user.id,
      email: user.email,
      accessToken: token,
      expiresIn: this.jwtExpiresIn,
      exp: decoded.exp,
    };
  }

  async validateToken(token: string): Promise<ValidateTokenResponseDto> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;

      // Verificar se usuário ainda existe
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.clientId },
      });

      if (!user) {
        await this.prisma.authLog.create({
          data: {
            email: decoded.email,
            action: 'VALIDATE_TOKEN_FAILED',
            userId: decoded.clientId,
          },
        });
        return { valid: false, error: 'Usuário não encontrado' };
      }

      // Log de validação bem-sucedida
      await this.prisma.authLog.create({
        data: {
          email: user.email,
          action: 'VALIDATE_TOKEN_SUCCESS',
          userId: user.id,
        },
      });

      return {
        valid: true,
        user: {
          email: user.email,
          clientId: user.id,
        },
      };
    } catch (error: any) {
      // Log de validação falha
      let email = 'unknown';
      try {
        const decoded = jwt.decode(token) as JwtPayload;
        email = decoded?.email || 'unknown';
      } catch (e) {
        console.error('Erro na validação do token: ', e)
      }

      await this.prisma.authLog.create({
        data: {
          email,
          action: 'VALIDATE_TOKEN_FAILED',
        },
      });

      return {
        valid: false,
        error: error.message || 'Token inválido',
      };
    }
  }
}