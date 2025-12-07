import { Injectable, ExecutionContext } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { REDIS_SERVICE } from '../../domain/tokens';
import type { RedisService } from '../../infrastructure/redis/services/redis.service';
import { RateLimitGuard } from './rate-limit.guard';

/**
 * Guard específico para rate limiting do endpoint de registro
 * 
 * Limite: 5 tentativas por hora por IP
 */
@Injectable()
export class RegisterRateLimitGuard extends RateLimitGuard {
  constructor(@Inject(REDIS_SERVICE) redisService: RedisService) {
    super(redisService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return super.canActivateWithOptions(context, {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 5, // 5 tentativas por hora
      keyGenerator: (ctx) => {
        const request = ctx.switchToHttp().getRequest();
        const ip = request.ip || request.connection.remoteAddress;
        return `register:${ip}`;
      },
    });
  }
}

