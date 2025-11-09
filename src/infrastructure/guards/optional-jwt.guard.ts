import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
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
    // Debug
    console.log('[DEBUG] OptionalJwtAuthGuard - err:', err);
    console.log('[DEBUG] OptionalJwtAuthGuard - user:', user);
    console.log('[DEBUG] OptionalJwtAuthGuard - info:', info);
    
    // Se houver erro mas não for erro de token ausente, logar
    if (err && err.message !== 'No auth token') {
      console.log('[DEBUG] OptionalJwtAuthGuard - Erro de autenticação:', err.message);
    }
    
    // Se houver usuário, retorna (token válido)
    if (user) {
      console.log('[DEBUG] OptionalJwtAuthGuard - Usuário autenticado:', user.sub);
      return user;
    }
    
    // Se não houver usuário ou houver erro, retorna undefined (mas permite continuar)
    console.log('[DEBUG] OptionalJwtAuthGuard - Sem autenticação, continuando...');
    return undefined;
  }
}

