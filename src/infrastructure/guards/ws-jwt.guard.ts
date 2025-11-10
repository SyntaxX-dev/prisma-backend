import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtConfiguration } from '../config/jwt.config';
import type { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromHeader(client);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const config = JwtConfiguration.loadFromEnv();
      const payload = this.jwtService.verify(token, { secret: config.secret });
      
      // Adicionar payload ao socket para uso posterior
      client.data.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const authHeader = client.handshake.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

