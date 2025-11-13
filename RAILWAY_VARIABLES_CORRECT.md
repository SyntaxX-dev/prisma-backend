# ✅ Variáveis Corretas para Railway

## 🔴 **Problema Identificado**

O Redis está tentando conectar usando `REDISHOST` que resolve para IPv6, mas está falhando. A solução é usar `REDIS_PUBLIC_URL` que já está configurada corretamente.

---

## ✅ **Variáveis Corretas para o Backend**

### **No serviço "prisma-backend" na Railway, use estas variáveis:**

```json
{
  // Redis - USAR REDIS_PUBLIC_URL
  "REDIS_URL": "${{REDIS_PUBLIC_URL}}",
  
  // OU se REDIS_PUBLIC_URL não funcionar, use:
  "REDIS_URL": "redis://default:ecalrpiCrXlLJIFccuWzZsgFBqCFiUhd@${{RAILWAY_TCP_PROXY_DOMAIN}}:${{RAILWAY_TCP_PROXY_PORT}}",
  
  // RabbitMQ - USAR RABBITMQ_PRIVATE_URL
  "RABBITMQ_URL": "${{RABBITMQ_PRIVATE_URL}}",
  
  // OU montar manualmente:
  "RABBITMQ_URL": "amqp://NkjlI2cR7MPnRRnn:4oNfoU1Jv0W4DEgHOEbh.4WWDUJR80u~@${{RAILWAY_PRIVATE_DOMAIN}}:5672",
  
  // Opcionais (valores padrão)
  "RABBITMQ_EXCHANGE": "chat_exchange",
  "RABBITMQ_QUEUE": "chat_messages",
  
  // Outras variáveis existentes...
}
```

---

## 🔧 **Como Corrigir**

### **1. No Railway Dashboard:**

1. Vá no serviço **"prisma-backend"**
2. Clique em **"Variables"**
3. **Edite ou adicione:**

#### **Para Redis:**
```
REDIS_URL = ${{REDIS_PUBLIC_URL}}
```

**OU** se `REDIS_PUBLIC_URL` não funcionar, use:
```
REDIS_URL = redis://default:ecalrpiCrXlLJIFccuWzZsgFBqCFiUhd@${{RAILWAY_TCP_PROXY_DOMAIN}}:${{RAILWAY_TCP_PROXY_PORT}}
```

#### **Para RabbitMQ:**
```
RABBITMQ_URL = ${{RABBITMQ_PRIVATE_URL}}
```

**OU** se não funcionar, use:
```
RABBITMQ_URL = amqp://NkjlI2cR7MPnRRnn:4oNfoU1Jv0W4DEgHOEbh.4WWDUJR80u~@${{RAILWAY_PRIVATE_DOMAIN}}:5672
```

#### **Opcionais:**
```
RABBITMQ_EXCHANGE = chat_exchange
RABBITMQ_QUEUE = chat_messages
```

---

## 🗑️ **Variáveis que Pode Remover (Não São Mais Necessárias)**

Você pode **remover** estas variáveis do backend (elas são do serviço Redis/RabbitMQ, não do backend):

```json
{
  // ❌ REMOVER do backend (são do serviço Redis)
  "REDISHOST": "${{RAILWAY_PRIVATE_DOMAIN}}",
  "REDISPASSWORD": "${{REDIS_PASSWORD}}",
  "REDISPORT": "6379",
  "REDISUSER": "default",
  
  // ❌ REMOVER do backend (são do serviço RabbitMQ)
  "RABBITMQ_DEFAULT_PASS": "4oNfoU1Jv0W4DEgHOEbh.4WWDUJR80u~",
  "RABBITMQ_DEFAULT_USER": "NkjlI2cR7MPnRRnn",
  "RABBITMQ_NODENAME": "rabbit@rabbitmq",
  "RABBITMQ_PRIVATE_URL": "amqp://..."
}
```

**⚠️ IMPORTANTE:** Essas variáveis devem ficar **apenas no serviço Redis/RabbitMQ**, não no backend!

---

## ✅ **Variáveis Finais no Backend**

```json
{
  // ... outras variáveis existentes ...
  
  // Redis
  "REDIS_URL": "${{REDIS_PUBLIC_URL}}",
  
  // RabbitMQ
  "RABBITMQ_URL": "${{RABBITMQ_PRIVATE_URL}}",
  "RABBITMQ_EXCHANGE": "chat_exchange",
  "RABBITMQ_QUEUE": "chat_messages",
  
  // ... resto das variáveis ...
}
```

---

## 🎯 **Por Que Usar REDIS_PUBLIC_URL?**

1. ✅ **Já está configurada corretamente** no serviço Redis
2. ✅ **Usa TCP Proxy** (mais confiável que IPv6 direto)
3. ✅ **Inclui senha** na URL
4. ✅ **Formato correto**: `redis://user:password@host:port`

---

## 🎯 **Por Que Usar RABBITMQ_PRIVATE_URL?**

1. ✅ **Já está configurada corretamente** no serviço RabbitMQ
2. ✅ **Usa domínio privado** (mais seguro)
3. ✅ **Inclui credenciais** na URL
4. ✅ **Formato correto**: `amqp://user:password@host:port`

---

## 📝 **Resumo das Mudanças**

1. ✅ **Adicionar** `REDIS_URL = ${{REDIS_PUBLIC_URL}}` no backend
2. ✅ **Adicionar** `RABBITMQ_URL = ${{RABBITMQ_PRIVATE_URL}}` no backend
3. ✅ **Remover** variáveis individuais (`REDISHOST`, `REDISPASSWORD`, etc.) do backend
4. ✅ **Manter** essas variáveis apenas nos serviços Redis/RabbitMQ

---

## 🚀 **Após Fazer as Mudanças**

Após atualizar as variáveis e fazer deploy, você deve ver:

```
[REDIS] ✅ Todos os clientes Redis conectados com sucesso
[RABBITMQ] ✅ Conectado ao RabbitMQ
[RABBITMQ] ✅ Canal RabbitMQ criado
[RABBITMQ] ✅ Exchange 'chat_exchange' criado
[RABBITMQ] ✅ Fila 'chat_messages' criada
```

---

## 🎉 **Pronto!**

Agora o Redis e RabbitMQ devem conectar corretamente! 🚀

