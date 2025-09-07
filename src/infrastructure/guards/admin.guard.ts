import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService, JwtPayload } from '../services/auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const payload: JwtPayload | null = await this.authService.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException('Token inválido');
    }

    const isAdmin = await this.authService.isAdmin(payload);

    if (!isAdmin) {
      throw new ForbiddenException('Acesso negado. Apenas administradores podem acessar este recurso.');
    }

    // Adiciona o payload do usuário ao request para uso posterior
    request.user = payload;

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
