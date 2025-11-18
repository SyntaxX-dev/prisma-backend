import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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
      console.log(
        '[WsJwtGuard] Token não encontrado. Headers:',
        client.handshake.headers,
      );
      console.log('[WsJwtGuard] Query:', client.handshake.query);
      console.log('[WsJwtGuard] Auth:', client.handshake.auth);
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const config = JwtConfiguration.loadFromEnv();
      const payload = this.jwtService.verify(token, { secret: config.secret });

      // Adicionar payload ao socket para uso posterior
      client.data.user = payload;
      console.log('[WsJwtGuard] ✅ Token válido para usuário:', payload.sub);
      return true;
    } catch (error) {
      console.log('[WsJwtGuard] ❌ Erro ao verificar token:', error.message);
      throw new UnauthorizedException('Token inválido');
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    // Tentar 1: Header Authorization
    const authHeader = client.handshake.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ') ?? [];
      if (type === 'Bearer' && token) {
        return token;
      }
    }

    // Tentar 2: Query string (?token=...)
    const queryToken = client.handshake.query?.token as string | undefined;
    if (queryToken) {
      return queryToken;
    }

    // Tentar 3: Auth object do Socket.io
    const authToken = (client.handshake.auth as any)?.token as
      | string
      | undefined;
    if (authToken) {
      return authToken;
    }

    return undefined;
  }
}
