import { Module, Global } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import { REDIS_SERVICE } from '../../domain/tokens';

/**
 * RedisModule - Módulo que fornece serviços Redis
 * 
 * @Global() - Torna o módulo global, permitindo usar RedisService em qualquer lugar
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_SERVICE,
      useClass: RedisService,
    },
    RedisService, // Também disponível diretamente
  ],
  exports: [REDIS_SERVICE, RedisService],
})
export class RedisModule {}

