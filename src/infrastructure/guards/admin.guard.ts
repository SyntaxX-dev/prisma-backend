import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload } from '../../domain/services/auth.service';
import { AUTH_SERVICE } from '../../domain/tokens';
import { Inject } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(AUTH_SERVICE) private readonly authService: any) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const payload: JwtPayload = this.authService.verifyToken(token);
      
      const isAdmin = this.authService.isAdmin(payload);

      if (!isAdmin) {
        throw new ForbiddenException('Acesso negado. Apenas administradores podem acessar este recurso.');
      }

      // Adiciona o payload do usuário ao request para uso posterior
      request.user = payload;

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
