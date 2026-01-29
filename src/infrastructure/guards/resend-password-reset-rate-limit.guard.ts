import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';
import { REDIS_SERVICE } from '../../domain/tokens';
import type { RedisService } from '../../infrastructure/redis/services/redis.service';

/**
 * Guard para rate limiting do reenvio de código de reset de senha
 * 
 * Limite: 3 requisições por 15 minutos por email
 * Isso previne spam e abuso do endpoint de reenvio
 */
@Injectable()
export class ResendPasswordResetRateLimitGuard extends RateLimitGuard {
  constructor(
    @Inject(REDIS_SERVICE)
    protected readonly redisService: RedisService,
  ) {
    super(redisService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Gera chave baseada no email para rate limiting por usuário
    const keyGenerator = (ctx: ExecutionContext) => {
      const req = ctx.switchToHttp().getRequest();
      const email = req.body?.email || 'unknown';
      return `resend_password_reset:${email.toLowerCase()}`;
    };

    // Limite: 3 requisições por 15 minutos (900000 ms)
    return this.canActivateWithOptions(context, {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 3,
      keyGenerator,
    });
  }
}
