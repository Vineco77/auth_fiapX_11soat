import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default_secret_change_in_production';
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
  }

  async register(registerDto: RegisterDto) {
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
      success: true,
      message: 'Usuário registrado com sucesso',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto) {
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

    // Gerar token JWT - CORREÇÃO AQUI
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn } as jwt.SignOptions, // Type assertion para resolver o erro
    );

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
      access_token: token,
      token_type: 'Bearer',
      expires_in: this.jwtExpiresIn,
      user: {
        email: user.email,
        userId: user.id,
      },
    };
  }

  async validateToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      // Verificar se usuário ainda existe
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        await this.prisma.authLog.create({
          data: {
            email: decoded.email,
            action: 'VALIDATE_TOKEN_FAILED',
            userId: decoded.userId,
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
          userId: user.id,
        },
      };
    } catch (error: any) {
      // Log de validação falha
      let email = 'unknown';
      try {
        const decoded = jwt.decode(token) as any;
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