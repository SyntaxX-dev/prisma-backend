import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { REDIS_SERVICE } from '../../domain/tokens';
import type { RedisService } from '../../infrastructure/redis/services/redis.service';

export interface RateLimitOptions {
  windowMs: number; // Janela de tempo em milissegundos
  maxRequests: number; // Máximo de requisições na janela
  keyGenerator?: (context: ExecutionContext) => string; // Função para gerar chave única
}

/**
 * Guard para rate limiting usando Redis
 *
 * Previne abuso de endpoints sensíveis como validação de tokens.
 * 
 * Uso:
 * @UseGuards(new (class extends RateLimitGuard {
 *   async canActivate(context: ExecutionContext): Promise<boolean> {
 *     return super.canActivate(context, {
 *       windowMs: 60000, // 1 minuto
 *       maxRequests: 10,
 *       keyGenerator: (ctx) => {
 *         const request = ctx.switchToHttp().getRequest();
 *         return `key:${request.ip}`;
 *       },
 *     });
 *   }
 * })())
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject(REDIS_SERVICE) protected readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Implementação padrão - deve ser sobrescrita por classes filhas
    return true;
  }

  protected async canActivateWithOptions(
    context: ExecutionContext,
    options: RateLimitOptions,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Gera chave única para o rate limit
    const key = options.keyGenerator
      ? options.keyGenerator(context)
      : this.defaultKeyGenerator(context);

    const redisKey = `rate_limit:${key}`;

    try {
      const client = this.redisService.getClient();
      
      // Busca contador atual
      const current = await client.get(redisKey);
      const count = current ? parseInt(current, 10) : 0;

      // Verifica se excedeu o limite
      if (count >= options.maxRequests) {
        const ttl = await client.ttl(redisKey);
        
        // Adiciona headers informativos
        response.setHeader('X-RateLimit-Limit', options.maxRequests);
        response.setHeader('X-RateLimit-Remaining', 0);
        response.setHeader('X-RateLimit-Reset', Date.now() + (ttl > 0 ? ttl * 1000 : options.windowMs));

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Muitas tentativas. Tente novamente mais tarde.',
            retryAfter: ttl > 0 ? ttl : Math.ceil(options.windowMs / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Incrementa contador
      const ttlSeconds = Math.ceil(options.windowMs / 1000);
      if (count === 0) {
        // Primeira requisição na janela
        await client.setex(redisKey, ttlSeconds, '1');
      } else {
        // Incrementa contador existente usando INCR do Redis
        await client.incr(redisKey);
        // Garante que o TTL está configurado
        await client.expire(redisKey, ttlSeconds);
      }

      // Adiciona headers informativos
      const remaining = options.maxRequests - (count + 1);
      const ttl = await client.ttl(redisKey);
      
      response.setHeader('X-RateLimit-Limit', options.maxRequests);
      response.setHeader('X-RateLimit-Remaining', remaining);
      response.setHeader('X-RateLimit-Reset', Date.now() + (ttl > 0 ? ttl * 1000 : options.windowMs));

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // Se houver erro no Redis, permite a requisição (fail open)
      // Em produção, você pode querer fazer fail closed
      return true;
    }
  }

  /**
   * Gera chave padrão baseada no IP e endpoint
   */
  protected defaultKeyGenerator(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress;
    const path = request.path;
    return `${ip}:${path}`;
  }
}

