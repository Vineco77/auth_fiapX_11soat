import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ITokenService,
  JwtPayload,
  TokenResponse,
} from '@/application/interfaces/token-service.interface';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtTokenService implements ITokenService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(private readonly configService: ConfigService) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 'default_secret_change_in_production';
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
  }

  async generateToken(payload: Omit<JwtPayload, 'exp' | 'iat'>): Promise<TokenResponse> {
    const token = jwt.sign(
      payload,
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn } as jwt.SignOptions,
    );

    const decoded = jwt.decode(token) as jwt.JwtPayload;

    return {
      token,
      expiresIn: this.jwtExpiresIn,
      exp: decoded.exp as number,
    };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    return jwt.verify(token, this.jwtSecret) as JwtPayload;
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
