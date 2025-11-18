import { Module, Global } from '@nestjs/common';
import { RabbitMQService } from './services/rabbitmq.service';
import { RABBITMQ_SERVICE } from '../../domain/tokens';

/**
 * RabbitMQModule - Módulo que fornece serviços RabbitMQ
 *
 * @Global() - Torna o módulo global, permitindo usar RabbitMQService em qualquer lugar
 */
@Global()
@Module({
  providers: [
    {
      provide: RABBITMQ_SERVICE,
      useClass: RabbitMQService,
    },
    RabbitMQService, // Também disponível diretamente
  ],
  exports: [RABBITMQ_SERVICE, RabbitMQService],
})
export class RabbitMQModule {}
