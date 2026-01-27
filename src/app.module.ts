import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PresentationModule } from './presentation/presentation.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { RabbitMQModule } from './infrastructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Módulo para agendamento de tarefas (cron jobs)
    PresentationModule,
    RedisModule, // Módulo global para Redis
    RabbitMQModule, // Módulo global para RabbitMQ
  ],
})
export class AppModule { }
