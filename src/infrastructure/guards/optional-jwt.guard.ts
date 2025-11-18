import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Tenta autenticar, mas não falha se não houver token
    const request = context.switchToHttp().getRequest();
    const hasAuthHeader = request.headers?.authorization?.startsWith('Bearer ');

    if (!hasAuthHeader) {
      // Se não houver header de autorização, permite continuar sem autenticação
      return true;
    }

    // Se houver header, tenta autenticar
    // Usar catch para não falhar se o token for inválido
    const result = super.canActivate(context);

    if (result instanceof Promise) {
      return result.catch(() => {
        // Se falhar, permite continuar sem autenticação
        return true;
      });
    }

    return result;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Se houver usuário, retorna (token válido)
    if (user) {
      return user;
    }

    // Se não houver usuário ou houver erro, retorna undefined (mas permite continuar)
    return undefined;
  }
}
