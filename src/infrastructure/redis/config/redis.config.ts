/**
 * RedisConfiguration - Configuração de conexão com Redis
 * 
 * O Redis é usado para:
 * 1. Pub/Sub (Publicar/Assinar) - Enviar mensagens em tempo real entre servidores
 * 2. Cache - Armazenar dados temporários para acesso rápido
 * 
 * Por que Redis?
 * - Muito rápido (em memória)
 * - Suporta Pub/Sub nativamente
 * - Ideal para múltiplas instâncias do servidor
 * 
 * Exemplo de uso:
 * - Servidor A recebe mensagem → Publica no Redis
 * - Servidor B escuta Redis → Recebe mensagem → Envia para cliente via WebSocket
 */

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number; // Database number (0-15)
}

export class RedisConfiguration {
  static loadFromEnv(): RedisConfig {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
    };
  }
}

