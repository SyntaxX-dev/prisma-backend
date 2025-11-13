/**
 * RabbitMQService - Serviço para gerenciar conexão e operações com RabbitMQ
 * 
 * Este serviço encapsula todas as operações com RabbitMQ:
 * - Criar filas e exchanges
 * - Enviar mensagens para filas (Producer)
 * - Consumir mensagens de filas (Consumer)
 * 
 * Como funciona:
 * 1. Producer envia mensagem → RabbitMQ armazena na fila
 * 2. Consumer pega mensagem da fila → Processa → Confirma (ACK)
 * 3. Se Consumer não confirmar, mensagem volta para fila
 * 
 * Conceitos:
 * - Exchange: Roteador que decide para qual fila enviar a mensagem
 * - Queue: Fila onde mensagens ficam armazenadas
 * - Routing Key: Chave usada para rotear mensagens
 * - ACK: Confirmação de que mensagem foi processada
 * 
 * Exemplo:
 * - Enviar: rabbitmq.sendToQueue('chat_messages', { userId: '123', message: 'Olá' })
 * - Consumir: rabbitmq.consume('chat_messages', (msg) => { processar(msg) })
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { RabbitMQConfiguration, RabbitMQConfig } from '../config/rabbitmq.config';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.ConfirmChannel | null = null;
  private config: RabbitMQConfig;

  constructor() {
    this.config = RabbitMQConfiguration.loadFromEnv();
  }

  async onModuleInit() {
    try {
      // Conecta ao RabbitMQ
      const conn = await amqp.connect(this.config.url);
      this.connection = conn as any; // Type assertion para evitar problemas de tipo
      this.logger.log('✅ Conectado ao RabbitMQ');
      console.log('[RABBITMQ] ✅ Conectado ao RabbitMQ', {
        url: this.config.url,
        timestamp: new Date().toISOString(),
      });

      if (!this.connection) {
        throw new Error('Falha ao conectar ao RabbitMQ');
      }

      // Cria um canal (channel) para operações
      const ch = await (this.connection as any).createConfirmChannel();
      this.channel = ch;
      this.logger.log('✅ Canal RabbitMQ criado');
      console.log('[RABBITMQ] ✅ Canal RabbitMQ criado');

      if (!this.channel) {
        throw new Error('Falha ao criar canal RabbitMQ');
      }

      // Cria o exchange (rota mensagens)
      await this.channel.assertExchange(this.config.exchange, 'direct', {
        durable: true, // Sobrevive a reinicializações
      });
      this.logger.log(`✅ Exchange '${this.config.exchange}' criado`);

      // Cria a fila padrão
      await this.channel.assertQueue(this.config.queue, {
        durable: true, // Fila persiste mesmo se RabbitMQ reiniciar
      });
      this.logger.log(`✅ Fila '${this.config.queue}' criada`);

      // Liga a fila ao exchange com routing key
      await this.channel.bindQueue(this.config.queue, this.config.exchange, 'chat.message');
      this.logger.log('✅ Fila ligada ao exchange');

      // Event listeners para reconexão
      this.connection.on('error', (err) => {
        this.logger.error('❌ Erro na conexão RabbitMQ:', err);
      });

      this.connection.on('close', () => {
        this.logger.warn('⚠️ Conexão RabbitMQ fechada. Tentando reconectar...');
        // Em produção, implementar lógica de reconexão
      });
    } catch (error) {
      this.logger.error('❌ Erro ao conectar ao RabbitMQ:', error);
      // Não lança erro para não quebrar a aplicação se RabbitMQ não estiver disponível
    }
  }

  async onModuleDestroy() {
    // Fecha conexões quando o módulo é destruído
    try {
      if (this.channel) {
        await this.channel.close();
        this.logger.log('Canal RabbitMQ fechado');
      }
      if (this.connection) {
        await (this.connection as any).close();
        this.logger.log('Conexão RabbitMQ fechada');
      }
    } catch (error) {
      this.logger.error('Erro ao fechar conexão RabbitMQ:', error);
    }
  }

  /**
   * Envia uma mensagem para uma fila
   * 
   * @param queueName - Nome da fila
   * @param message - Mensagem a ser enviada (será convertida para Buffer)
   * @param options - Opções adicionais (persistência, etc)
   * 
   * Exemplo:
   * rabbitmq.sendToQueue('chat_messages', { userId: '123', content: 'Olá' })
   */
  async sendToQueue(queueName: string, message: any, options?: amqp.Options.Publish): Promise<boolean> {
    if (!this.channel) {
      throw new Error('Canal RabbitMQ não está disponível');
    }

    try {
      // Garante que a fila existe
      await this.channel.assertQueue(queueName, { durable: true });

      // Converte mensagem para Buffer
      const messageBuffer = Buffer.from(JSON.stringify(message));

      // Envia mensagem com opções de persistência
      const sent = this.channel.sendToQueue(
        queueName,
        messageBuffer,
        {
          persistent: true, // Mensagem persiste mesmo se RabbitMQ reiniciar
          ...options,
        },
      );

      if (sent) {
        this.logger.debug(`📤 Mensagem enviada para fila: ${queueName}`);
        console.log(`[RABBITMQ] ✅ Mensagem enviada para fila "${queueName}":`, {
          queueName,
          messageType: message?.type,
          timestamp: new Date().toISOString(),
        });
      } else {
        this.logger.warn(`⚠️ Fila ${queueName} está cheia, mensagem não foi enviada`);
        console.warn(`[RABBITMQ] ⚠️ Fila "${queueName}" está cheia, mensagem não foi enviada`);
      }

      return sent;
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem para fila ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Publica uma mensagem no exchange (rota para múltiplas filas)
   * 
   * @param routingKey - Chave de roteamento
   * @param message - Mensagem a ser publicada
   * 
   * Exemplo:
   * rabbitmq.publish('chat.message', { userId: '123', content: 'Olá' })
   */
  async publish(routingKey: string, message: any, options?: amqp.Options.Publish): Promise<boolean> {
    if (!this.channel) {
      throw new Error('Canal RabbitMQ não está disponível');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));

      const sent = this.channel.publish(
        this.config.exchange,
        routingKey,
        messageBuffer,
        {
          persistent: true,
          ...options,
        },
      );

      if (sent) {
        this.logger.debug(`📤 Mensagem publicada no exchange com routing key: ${routingKey}`);
        console.log(`[RABBITMQ] ✅ Mensagem publicada no exchange:`, {
          exchange: this.config.exchange,
          routingKey,
          messageType: message?.type,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.warn(`[RABBITMQ] ⚠️ Falha ao publicar no exchange`);
      }

      return sent;
    } catch (error) {
      this.logger.error(`Erro ao publicar mensagem no exchange:`, error);
      throw error;
    }
  }

  /**
   * Consome mensagens de uma fila
   * 
   * @param queueName - Nome da fila
   * @param callback - Função chamada para cada mensagem recebida
   * @param options - Opções (autoAck, etc)
   * 
   * IMPORTANTE: Sempre chame msg.ack() após processar a mensagem!
   * Se não chamar, a mensagem volta para a fila.
   * 
   * Exemplo:
   * rabbitmq.consume('chat_messages', async (msg) => {
   *   const data = JSON.parse(msg.content.toString())
   *   await processarMensagem(data)
   *   msg.ack() // Confirma que processou
   * })
   */
  async consume(
    queueName: string,
    callback: (msg: amqp.ConsumeMessage) => Promise<void> | void,
    options?: amqp.Options.Consume,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Canal RabbitMQ não está disponível');
    }

    try {
      // Garante que a fila existe
      await this.channel.assertQueue(queueName, { durable: true });

      // Consome mensagens da fila
      await this.channel.consume(
        queueName,
        async (msg) => {
          if (!msg) return;

          try {
            const messageContent = JSON.parse(msg.content.toString());
            console.log(`[RABBITMQ] 📥 Mensagem recebida da fila "${queueName}":`, {
              queueName,
              messageType: messageContent?.type,
              timestamp: new Date().toISOString(),
            });
            
            // Processa mensagem
            await callback(msg);
            
            // Confirma que processou (ACK)
            // Se não chamar ack(), mensagem volta para fila
            this.channel!.ack(msg);
            console.log(`[RABBITMQ] ✅ Mensagem processada e confirmada (ACK) da fila "${queueName}"`);
          } catch (error) {
            this.logger.error(`Erro ao processar mensagem da fila ${queueName}:`, error);
            console.error(`[RABBITMQ] ❌ Erro ao processar mensagem da fila "${queueName}":`, error);
            // Rejeita mensagem e não volta para fila (ou volta, dependendo da opção)
            this.channel!.nack(msg, false, false);
          }
        },
        {
          noAck: false, // Não confirma automaticamente (precisamos chamar ack() manualmente)
          ...options,
        },
      );

      this.logger.log(`📥 Consumindo mensagens da fila: ${queueName}`);
    } catch (error) {
      this.logger.error(`Erro ao consumir fila ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Retorna o canal RabbitMQ para operações avançadas
   */
  getChannel(): amqp.ConfirmChannel | null {
    return this.channel;
  }

  /**
   * Retorna a conexão RabbitMQ para operações avançadas
   */
  getConnection(): amqp.Connection | null {
    return this.connection;
  }
}

