import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Tenta autenticar, mas não falha se não houver token
    return super.canActivate(context).catch(() => {
      // Se falhar (token inválido ou ausente), permite continuar sem autenticação
      return true;
    });
  }

  handleRequest(err: any, user: any, info: any) {
    // Se houver erro ou não houver usuário, retorna undefined em vez de lançar erro
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}

