import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma/prisma.service';
import { JwtPayload } from '@/application/interfaces/token-service.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const client = await this.prisma.client.findFirst({
      where: { 
        id: payload.clientId,
        deletedAt: null,
      },
    });

    if (!client) {
      throw new UnauthorizedException('Cliente não encontrado ou conta deletada');
    }

    return {
      clientId: payload.clientId,
      email: payload.email,
      authenticated: payload.authenticated,
    };
  }
}
