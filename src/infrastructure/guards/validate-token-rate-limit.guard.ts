import { Injectable, ExecutionContext } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { REDIS_SERVICE } from '../../domain/tokens';
import type { RedisService } from '../../infrastructure/redis/services/redis.service';
import { RateLimitGuard } from './rate-limit.guard';

/**
 * Guard específico para rate limiting do endpoint de validação de token
 * 
 * Limite: 10 requisições por minuto por IP
 */
@Injectable()
export class ValidateTokenRateLimitGuard extends RateLimitGuard {
  constructor(@Inject(REDIS_SERVICE) redisService: RedisService) {
    super(redisService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return super.canActivateWithOptions(context, {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 10, // 10 requisições por minuto
      keyGenerator: (ctx) => {
        const request = ctx.switchToHttp().getRequest();
        const ip = request.ip || request.connection.remoteAddress;
        return `validate_token:${ip}`;
      },
    });
  }
}

