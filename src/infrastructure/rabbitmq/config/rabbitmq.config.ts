/**
 * RabbitMQConfiguration - Configuração de conexão com RabbitMQ
 *
 * O RabbitMQ é usado para:
 * 1. Filas de Mensagens - Garantir entrega de mensagens mesmo se o servidor cair
 * 2. Processamento Assíncrono - Processar tarefas pesadas em background
 * 3. Distribuição de Carga - Distribuir trabalho entre múltiplos workers
 *
 * Por que RabbitMQ?
 * - Garante entrega de mensagens (persistência)
 * - Suporta múltiplos workers processando a mesma fila
 * - Confiável e robusto
 *
 * Diferença entre Redis Pub/Sub e RabbitMQ:
 * - Redis Pub/Sub: Rápido, mas não garante entrega (se o servidor cair, perde mensagens)
 * - RabbitMQ: Mais lento, mas garante entrega (mensagens ficam na fila até serem processadas)
 *
 * Uso no projeto:
 * - Mensagens importantes vão para RabbitMQ (garantir entrega)
 * - Notificações em tempo real vão para Redis (velocidade)
 */

export interface RabbitMQConfig {
  url: string; // Ex: amqp://user:password@host:port
  exchange: string; // Nome do exchange (rota mensagens)
  queue: string; // Nome da fila padrão
}

export class RabbitMQConfiguration {
  static loadFromEnv(): RabbitMQConfig {
    return {
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      exchange: process.env.RABBITMQ_EXCHANGE || 'chat_exchange',
      queue: process.env.RABBITMQ_QUEUE || 'chat_messages',
    };
  }
}
