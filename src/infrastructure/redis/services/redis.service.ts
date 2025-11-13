/**
 * RedisService - Serviço para gerenciar conexão e operações com Redis
 * 
 * Este serviço encapsula todas as operações com Redis:
 * - Pub/Sub: Publicar e assinar mensagens
 * - Cache: Armazenar e recuperar dados temporários
 * 
 * Como funciona o Pub/Sub:
 * 1. Um servidor publica uma mensagem em um "canal" (channel)
 * 2. Outros servidores que estão "assinando" esse canal recebem a mensagem
 * 3. Isso permite que múltiplas instâncias do servidor compartilhem mensagens
 * 
 * Exemplo:
 * - Servidor 1: redis.publish('chat:user123', { message: 'Olá' })
 * - Servidor 2: redis.subscribe('chat:user123') → Recebe a mensagem
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisConfiguration } from '../config/redis.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private publisher: Redis; // Cliente para publicar mensagens
  private subscriber: Redis; // Cliente para assinar mensagens
  private client: Redis; // Cliente geral para cache e outras operações

  constructor() {
    const config = RedisConfiguration.loadFromEnv();

    // Cliente para publicar mensagens (só pode publicar, não pode assinar)
    this.publisher = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        this.logger.warn(`Tentando reconectar ao Redis... (tentativa ${times})`);
        return delay;
      },
    });

    // Cliente para assinar mensagens (só pode assinar, não pode publicar)
    this.subscriber = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Cliente geral para cache e outras operações
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Event listeners para debug
    this.publisher.on('connect', () => {
      this.logger.log('✅ Redis Publisher conectado');
    });

    this.subscriber.on('connect', () => {
      this.logger.log('✅ Redis Subscriber conectado');
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Redis Client conectado');
    });

    this.publisher.on('error', (err) => {
      this.logger.error('❌ Erro no Redis Publisher:', err);
    });

    this.subscriber.on('error', (err) => {
      this.logger.error('❌ Erro no Redis Subscriber:', err);
    });

    this.client.on('error', (err) => {
      this.logger.error('❌ Erro no Redis Client:', err);
    });
  }

  async onModuleInit() {
    // Conecta ao Redis quando o módulo é inicializado
    try {
      await this.publisher.ping();
      await this.subscriber.ping();
      await this.client.ping();
      this.logger.log('✅ Todos os clientes Redis conectados com sucesso');
      console.log('[REDIS] ✅ Todos os clientes Redis conectados com sucesso', {
        timestamp: new Date().toISOString(),
        publisher: 'connected',
        subscriber: 'connected',
        client: 'connected',
      });
    } catch (error) {
      this.logger.error('❌ Erro ao conectar ao Redis:', error);
      console.error('[REDIS] ❌ Erro ao conectar:', error);
    }
  }

  async onModuleDestroy() {
    // Fecha conexões quando o módulo é destruído
    await this.publisher.quit();
    await this.subscriber.quit();
    await this.client.quit();
    this.logger.log('Redis desconectado');
  }

  /**
   * Publica uma mensagem em um canal (Pub)
   * 
   * @param channel - Nome do canal (ex: 'chat:user123')
   * @param message - Mensagem a ser publicada (será convertida para JSON)
   * 
   * Exemplo:
   * redisService.publish('chat:user123', { type: 'new_message', data: {...} })
   */
  async publish(channel: string, message: any): Promise<void> {
    try {
      const messageStr = JSON.stringify(message);
      await this.publisher.publish(channel, messageStr);
      this.logger.debug(`📤 Mensagem publicada no canal: ${channel}`);
      console.log(`[REDIS] ✅ Publicado no canal "${channel}":`, {
        channel,
        messageType: message?.type,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Erro ao publicar no canal ${channel}:`, error);
      console.error(`[REDIS] ❌ Erro ao publicar no canal "${channel}":`, error);
      throw error;
    }
  }

  /**
   * Assina um canal para receber mensagens (Sub)
   * 
   * @param channel - Nome do canal para assinar
   * @param callback - Função chamada quando uma mensagem é recebida
   * 
   * Exemplo:
   * redisService.subscribe('chat:user123', (message) => {
   *   console.log('Nova mensagem:', message)
   * })
   */
  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.logger.debug(`📥 Assinando canal: ${channel}`);

      // Quando recebe uma mensagem no canal
      this.subscriber.on('message', (receivedChannel, messageStr) => {
        if (receivedChannel === channel) {
          try {
            const message = JSON.parse(messageStr);
            console.log(`[REDIS] 📥 Mensagem recebida no canal "${channel}":`, {
              channel: receivedChannel,
              messageType: message?.type,
              timestamp: new Date().toISOString(),
            });
            callback(message);
          } catch (error) {
            this.logger.error(`Erro ao processar mensagem do canal ${channel}:`, error);
            console.error(`[REDIS] ❌ Erro ao processar mensagem do canal "${channel}":`, error);
          }
        }
      });
    } catch (error) {
      this.logger.error(`Erro ao assinar canal ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Cancela assinatura de um canal
   */
  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
    this.logger.debug(`📭 Cancelou assinatura do canal: ${channel}`);
  }

  /**
   * Armazena um valor no cache com TTL (Time To Live)
   * 
   * @param key - Chave do cache
   * @param value - Valor a ser armazenado
   * @param ttlSeconds - Tempo de vida em segundos (opcional)
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const valueStr = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, valueStr);
    } else {
      await this.client.set(key, valueStr);
    }
  }

  /**
   * Recupera um valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    const valueStr = await this.client.get(key);
    if (!valueStr) return null;
    try {
      return JSON.parse(valueStr) as T;
    } catch {
      return valueStr as T;
    }
  }

  /**
   * Remove um valor do cache
   */
  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Retorna o cliente Redis para operações avançadas
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Retorna o cliente Publisher para operações avançadas
   */
  getPublisher(): Redis {
    return this.publisher;
  }

  /**
   * Retorna o cliente Subscriber para operações avançadas
   */
  getSubscriber(): Redis {
    return this.subscriber;
  }
}

