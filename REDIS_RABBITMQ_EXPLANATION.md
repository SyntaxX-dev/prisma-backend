# 📚 Explicação Detalhada: Redis e RabbitMQ no Código

Este documento explica **cada arquivo e função** relacionada ao Redis e RabbitMQ no projeto.

---

## 📁 **Estrutura de Pastas**

```
src/
├── infrastructure/
│   ├── redis/
│   │   ├── config/
│   │   │   └── redis.config.ts          # Configuração de conexão
│   │   ├── services/
│   │   │   └── redis.service.ts         # Serviço principal
│   │   └── redis.module.ts              # Módulo NestJS
│   │
│   └── rabbitmq/
│       ├── config/
│       │   └── rabbitmq.config.ts       # Configuração de conexão
│       ├── services/
│       │   └── rabbitmq.service.ts      # Serviço principal
│       └── rabbitmq.module.ts            # Módulo NestJS
```

---

## 🔴 **REDIS - Explicação Detalhada**

### **1. `redis.config.ts` - Configuração**

```typescript
export interface RedisConfig {
  host: string;      // Endereço do servidor Redis
  port: number;      // Porta (geralmente 6379)
  password?: string; // Senha (se necessário)
  db?: number;       // Número do banco (0-15)
}
```

**O que faz:**
- Lê variáveis de ambiente (`REDIS_HOST`, `REDIS_PORT`, etc.)
- Retorna configuração pronta para usar

**Por quê:**
- Centraliza configuração em um lugar
- Facilita mudanças (só altera variáveis de ambiente)

---

### **2. `redis.service.ts` - Serviço Principal**

Este é o arquivo mais importante do Redis. Vamos explicar cada parte:

#### **Três Clientes Redis**

```typescript
private publisher: Redis;   // Só publica mensagens
private subscriber: Redis;  // Só assina (recebe) mensagens
private client: Redis;      // Operações gerais (cache)
```

**Por que três clientes?**
- Redis **não permite** que um cliente faça Pub e Sub ao mesmo tempo
- Separar em 3 clientes evita conflitos
- Cada um tem uma função específica

#### **Método `publish()` - Publicar Mensagem**

```typescript
async publish(channel: string, message: any): Promise<void> {
  const messageStr = JSON.stringify(message);
  await this.publisher.publish(channel, messageStr);
}
```

**O que faz:**
- Publica uma mensagem em um "canal" (channel)
- Todos que estão "assinando" esse canal recebem a mensagem

**Exemplo:**
```typescript
// Servidor A publica
redis.publish('chat:user123', { type: 'new_message', data: {...} })

// Servidor B (que está assinando) recebe automaticamente
```

**Por quê:**
- Permite que múltiplas instâncias do servidor compartilhem mensagens
- Se você tiver 3 servidores rodando, todos recebem a mesma mensagem

#### **Método `subscribe()` - Assinar Canal**

```typescript
async subscribe(channel: string, callback: (message: any) => void) {
  await this.subscriber.subscribe(channel);
  this.subscriber.on('message', (receivedChannel, messageStr) => {
    if (receivedChannel === channel) {
      const message = JSON.parse(messageStr);
      callback(message);
    }
  });
}
```

**O que faz:**
- "Escuta" um canal para receber mensagens
- Quando recebe, chama a função `callback`

**Exemplo:**
```typescript
redis.subscribe('chat:user123', (message) => {
  console.log('Nova mensagem recebida:', message);
  // Enviar para cliente via WebSocket
});
```

**Por quê:**
- Permite que servidores diferentes se comuniquem
- Se Servidor A recebe mensagem → Publica no Redis → Servidor B recebe

#### **Métodos de Cache (`set`, `get`, `delete`)**

```typescript
async set(key: string, value: any, ttlSeconds?: number) {
  const valueStr = JSON.stringify(value);
  if (ttlSeconds) {
    await this.client.setex(key, ttlSeconds, valueStr);
  } else {
    await this.client.set(key, valueStr);
  }
}
```

**O que faz:**
- Armazena dados temporários em memória
- `ttlSeconds`: Tempo de vida (expira após X segundos)

**Exemplo:**
```typescript
// Armazenar por 1 hora
redis.set('user:123:online', true, 3600);

// Recuperar
const isOnline = await redis.get('user:123:online');
```

**Por quê:**
- Muito rápido (em memória)
- Útil para cache de dados frequentes

---

### **3. `redis.module.ts` - Módulo NestJS**

```typescript
@Global()
@Module({
  providers: [
    {
      provide: REDIS_SERVICE,
      useClass: RedisService,
    },
  ],
  exports: [REDIS_SERVICE, RedisService],
})
export class RedisModule {}
```

**O que faz:**
- Registra `RedisService` no NestJS
- `@Global()`: Permite usar em qualquer módulo sem importar
- Exporta para outros módulos usarem

---

## 🐰 **RABBITMQ - Explicação Detalhada**

### **1. `rabbitmq.config.ts` - Configuração**

```typescript
export interface RabbitMQConfig {
  url: string;        // URL completa: amqp://user:pass@host:port/vhost
  exchange: string;   // Nome do exchange (rota mensagens)
  queue: string;      // Nome da fila padrão
}
```

**O que faz:**
- Lê variáveis de ambiente
- Retorna configuração pronta

**Conceitos:**
- **Exchange**: Roteador que decide para qual fila enviar
- **Queue**: Fila onde mensagens ficam armazenadas
- **Routing Key**: Chave usada para rotear mensagens

---

### **2. `rabbitmq.service.ts` - Serviço Principal**

#### **Método `onModuleInit()` - Inicialização**

```typescript
async onModuleInit() {
  // 1. Conecta ao RabbitMQ
  this.connection = await amqp.connect(this.config.url);
  
  // 2. Cria um canal
  this.channel = await this.connection.createChannel();
  
  // 3. Cria o exchange
  await this.channel.assertExchange(this.config.exchange, 'direct', {
    durable: true, // Sobrevive a reinicializações
  });
  
  // 4. Cria a fila
  await this.channel.assertQueue(this.config.queue, {
    durable: true, // Fila persiste mesmo se RabbitMQ reiniciar
  });
  
  // 5. Liga fila ao exchange
  await this.channel.bindQueue(this.config.queue, this.config.exchange, 'chat.message');
}
```

**O que faz:**
- Conecta ao RabbitMQ quando o módulo inicia
- Cria estruturas necessárias (exchange, fila)
- `durable: true`: Garante que não sejam perdidas se RabbitMQ reiniciar

**Por quê:**
- Garante que tudo está pronto antes de usar
- Evita erros de "fila não existe"

---

#### **Método `sendToQueue()` - Enviar para Fila**

```typescript
async sendToQueue(queueName: string, message: any) {
  // Garante que a fila existe
  await this.channel.assertQueue(queueName, { durable: true });
  
  // Converte para Buffer
  const messageBuffer = Buffer.from(JSON.stringify(message));
  
  // Envia com persistência
  this.channel.sendToQueue(queueName, messageBuffer, {
    persistent: true, // Mensagem persiste mesmo se RabbitMQ reiniciar
  });
}
```

**O que faz:**
- Envia uma mensagem para uma fila
- `persistent: true`: Garante que não seja perdida

**Exemplo:**
```typescript
// Enviar mensagem offline
rabbitmq.sendToQueue('chat_messages', {
  type: 'offline_message',
  receiverId: 'user123',
  data: { ... }
});
```

**Por quê:**
- Garante entrega mesmo se o servidor cair
- Mensagem fica na fila até ser processada

---

#### **Método `publish()` - Publicar no Exchange**

```typescript
async publish(routingKey: string, message: any) {
  const messageBuffer = Buffer.from(JSON.stringify(message));
  
  this.channel.publish(
    this.config.exchange,
    routingKey,
    messageBuffer,
    { persistent: true }
  );
}
```

**O que faz:**
- Publica no exchange (não diretamente na fila)
- Exchange decide para qual fila enviar baseado no `routingKey`

**Exemplo:**
```typescript
// Publicar com routing key
rabbitmq.publish('chat.message', { userId: '123', content: 'Olá' });

// Exchange roteia para fila baseado na routing key
```

**Por quê:**
- Permite rotear mensagens para múltiplas filas
- Mais flexível que enviar diretamente para fila

---

#### **Método `consume()` - Consumir Mensagens**

```typescript
async consume(queueName: string, callback: (msg) => Promise<void>) {
  await this.channel.consume(queueName, async (msg) => {
    if (!msg) return;
    
    try {
      // Processa mensagem
      await callback(msg);
      
      // Confirma que processou (ACK)
      this.channel.ack(msg);
    } catch (error) {
      // Rejeita mensagem
      this.channel.nack(msg, false, false);
    }
  }, {
    noAck: false, // Não confirma automaticamente
  });
}
```

**O que faz:**
- Pega mensagens da fila e processa
- `ack(msg)`: Confirma que processou (mensagem é removida da fila)
- `nack(msg)`: Rejeita (mensagem volta para fila ou é descartada)

**⚠️ IMPORTANTE:**
- **Sempre** chame `ack()` após processar!
- Se não chamar, mensagem volta para fila

**Exemplo:**
```typescript
rabbitmq.consume('chat_messages', async (msg) => {
  const data = JSON.parse(msg.content.toString());
  
  // Processar mensagem
  await processarMensagemOffline(data);
  
  // Confirmar (IMPORTANTE!)
  // O ack() já é chamado automaticamente pelo serviço
});
```

**Por quê:**
- Garante que mensagens sejam processadas
- Se processamento falhar, mensagem volta para fila

---

## 🔄 **Como Redis e RabbitMQ Trabalham Juntos**

### **Fluxo de uma Mensagem:**

```
1. Usuário A envia mensagem
   ↓
2. Backend salva no PostgreSQL
   ↓
3. Backend verifica se Usuário B está online
   ↓
   ├─ Se ONLINE:
   │   ├─ Envia via WebSocket (tempo real)
   │   └─ Publica no Redis (para outras instâncias)
   │
   └─ Se OFFLINE:
       └─ Envia para RabbitMQ (garante entrega)
           ↓
       Quando B voltar online:
       └─ Consome do RabbitMQ → Envia via WebSocket
```

### **Redis vs RabbitMQ:**

| Característica | Redis | RabbitMQ |
|---------------|-------|----------|
| **Velocidade** | ⚡ Muito rápido | 🐢 Mais lento |
| **Persistência** | ❌ Não garante | ✅ Garante |
| **Uso** | Mensagens em tempo real | Mensagens importantes |
| **Quando usar** | Usuário online | Usuário offline |

---

## 🎯 **Resumo**

### **Redis:**
- ✅ Pub/Sub para mensagens em tempo real
- ✅ Cache para dados temporários
- ✅ Muito rápido
- ❌ Não garante persistência

### **RabbitMQ:**
- ✅ Filas para garantir entrega
- ✅ Processamento assíncrono
- ✅ Confiável
- ❌ Mais lento que Redis

### **Juntos:**
- Redis: Velocidade para usuários online
- RabbitMQ: Confiabilidade para usuários offline

---

## 📖 **Próximos Passos**

1. Configure Redis e RabbitMQ na Railway (veja `RAILWAY_REDIS_RABBITMQ_GUIDE.md`)
2. Teste enviando mensagens
3. Verifique logs para confirmar funcionamento
4. Ajuste conforme necessário

**Agora você entende como tudo funciona!** 🚀

