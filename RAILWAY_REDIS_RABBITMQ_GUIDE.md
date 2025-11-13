# 🚀 Guia Completo: Redis e RabbitMQ na Railway

Este guia explica passo a passo como configurar Redis e RabbitMQ na Railway para o sistema de mensagens em tempo real.

---

## 📋 **Índice**

1. [O que são Redis e RabbitMQ?](#o-que-são-redis-e-rabbitmq)
2. [Por que usar ambos?](#por-que-usar-ambos)
3. [Configurando Redis na Railway](#configurando-redis-na-railway)
4. [Configurando RabbitMQ na Railway](#configurando-rabbitmq-na-railway)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Testando a Conexão](#testando-a-conexão)

---

## 🔍 **O que são Redis e RabbitMQ?**

### **Redis**
- **O que é**: Banco de dados em memória (muito rápido)
- **Uso no projeto**: Pub/Sub para mensagens em tempo real entre servidores
- **Vantagem**: Extremamente rápido, ideal para comunicação em tempo real
- **Desvantagem**: Não garante persistência (se cair, perde dados)

### **RabbitMQ**
- **O que é**: Message Broker (gerenciador de filas de mensagens)
- **Uso no projeto**: Garantir entrega de mensagens importantes
- **Vantagem**: Garante que mensagens não sejam perdidas
- **Desvantagem**: Mais lento que Redis

### **Por que usar ambos?**
- **Redis**: Para velocidade (mensagens em tempo real)
- **RabbitMQ**: Para confiabilidade (mensagens importantes que não podem ser perdidas)

---

## 🎯 **Configurando Redis na Railway**

### **Passo 1: Criar Serviço Redis**

1. Acesse o **Railway Dashboard**: https://railway.app
2. Selecione seu projeto
3. Clique em **"+ New"** → **"Database"**
4. Selecione **"Add Redis"**

### **Passo 2: Obter Credenciais**

Após criar o Redis, você verá:

- **REDIS_HOST**: Host do Redis (ex: `containers-us-west-xxx.railway.app`)
- **REDIS_PORT**: Porta (geralmente `6379`)
- **REDIS_PASSWORD**: Senha (gerada automaticamente)
- **REDIS_URL**: URL completa (opcional)

### **Passo 3: Adicionar Variáveis de Ambiente**

No seu serviço backend (não no Redis), adicione as variáveis:

1. Vá em **"Variables"** do seu serviço backend
2. Adicione:

```bash
REDIS_HOST=containers-us-west-xxx.railway.app
REDIS_PORT=6379
REDIS_PASSWORD=sua-senha-aqui
REDIS_DB=0
```

**⚠️ IMPORTANTE**: Substitua pelos valores reais do seu Redis!

---

## 🐰 **Configurando RabbitMQ na Railway**

### **Passo 1: Criar Serviço RabbitMQ**

1. No **Railway Dashboard**, clique em **"+ New"** → **"Database"**
2. Procure por **"RabbitMQ"** ou **"Add RabbitMQ"**
3. Se não encontrar, use **"Add Plugin"** e procure por RabbitMQ

**⚠️ NOTA**: A Railway pode não ter RabbitMQ nativamente. Alternativas:

#### **Opção A: Usar CloudAMQP (Recomendado)**
1. Acesse: https://www.cloudamqp.com
2. Crie uma conta gratuita (plano "Little Lemur" - gratuito)
3. Crie uma instância RabbitMQ
4. Copie a URL de conexão (formato: `amqp://user:pass@host:port/vhost`)

#### **Opção B: Usar Railway Plugin (se disponível)**
1. No Railway, vá em **"Plugins"**
2. Procure por **"RabbitMQ"**
3. Instale o plugin

### **Passo 2: Obter Credenciais**

Se usar CloudAMQP:
- A URL completa estará no dashboard
- Formato: `amqp://user:password@host:port/vhost`

Se usar Railway:
- As credenciais estarão nas variáveis de ambiente do serviço

### **Passo 3: Adicionar Variáveis de Ambiente**

No seu serviço backend, adicione:

```bash
RABBITMQ_URL=amqp://user:password@host:port/vhost
RABBITMQ_EXCHANGE=chat_exchange
RABBITMQ_QUEUE=chat_messages
```

**⚠️ IMPORTANTE**: Substitua pela URL real do seu RabbitMQ!

---

## 🔐 **Variáveis de Ambiente Completas**

No seu serviço backend na Railway, você deve ter:

```bash
# Redis
REDIS_HOST=containers-us-west-xxx.railway.app
REDIS_PORT=6379
REDIS_PASSWORD=sua-senha-redis
REDIS_DB=0

# RabbitMQ
RABBITMQ_URL=amqp://user:password@host:port/vhost
RABBITMQ_EXCHANGE=chat_exchange
RABBITMQ_QUEUE=chat_messages

# Outras variáveis existentes
DATABASE_URL=postgresql://...
JWT_SECRET=...
# ... etc
```

---

## ✅ **Testando a Conexão**

### **1. Verificar Logs do Backend**

Após fazer deploy, verifique os logs:

```bash
# No Railway Dashboard → Seu serviço → "Deployments" → "View Logs"
```

Você deve ver:

```
✅ Redis Publisher conectado
✅ Redis Subscriber conectado
✅ Redis Client conectado
✅ Conectado ao RabbitMQ
✅ Canal RabbitMQ criado
✅ Exchange 'chat_exchange' criado
✅ Fila 'chat_messages' criada
```

### **2. Testar via API**

Envie uma mensagem via API:

```bash
POST /messages
Authorization: Bearer seu-token-jwt
{
  "receiverId": "id-do-amigo",
  "content": "Olá, teste!"
}
```

### **3. Verificar WebSocket**

Conecte ao WebSocket:

```javascript
const socket = io('https://seu-backend.railway.app/chat', {
  auth: {
    token: 'seu-token-jwt'
  }
});

socket.on('connected', (data) => {
  console.log('Conectado ao chat!', data);
});

socket.on('new_message', (message) => {
  console.log('Nova mensagem:', message);
});
```

---

## 🐛 **Troubleshooting**

### **Erro: "Redis não conectado"**

**Solução:**
1. Verifique se as variáveis `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` estão corretas
2. Verifique se o Redis está rodando no Railway
3. Verifique os logs do backend para ver o erro específico

### **Erro: "RabbitMQ não conectado"**

**Solução:**
1. Verifique se `RABBITMQ_URL` está no formato correto: `amqp://user:pass@host:port/vhost`
2. Se usar CloudAMQP, verifique se a instância está ativa
3. Verifique os logs do backend

### **Mensagens não chegam em tempo real**

**Solução:**
1. Verifique se o WebSocket está conectado
2. Verifique se o Redis está funcionando (logs)
3. Verifique se ambos os usuários estão online

### **Mensagens são perdidas**

**Solução:**
1. Verifique se o RabbitMQ está configurado corretamente
2. Mensagens offline devem ir para RabbitMQ
3. Verifique os logs do RabbitMQ

---

## 📚 **Recursos Adicionais**

- **Redis Docs**: https://redis.io/docs/
- **RabbitMQ Docs**: https://www.rabbitmq.com/documentation.html
- **CloudAMQP**: https://www.cloudamqp.com/docs/
- **Railway Docs**: https://docs.railway.app/

---

## 🎉 **Pronto!**

Agora seu sistema de mensagens está configurado com:
- ✅ Redis para mensagens em tempo real
- ✅ RabbitMQ para garantir entrega
- ✅ WebSocket para comunicação bidirecional
- ✅ Banco de dados para histórico

**Sua aplicação está pronta para trocar mensagens em tempo real!** 🚀

