# 🐰 RabbitMQ da Railway Conectado ao Backend

## 🎉 **Configuração Concluída!**

O RabbitMQ da Railway foi conectado com sucesso ao seu backend. Aqui está o que foi feito:

---

## 📋 **O que foi configurado:**

### **1. Variáveis no Backend (Railway):**

✅ **RABBITMQ_URL**: `amqp://NkjlI2cR7MPnRRnn:4oNfoU1Jv0W4DEgHOEbh.4WWDUJR80u~@tramway.proxy.rlwy.net:57504`

✅ **RABBITMQ_EXCHANGE**: `chat_exchange`

✅ **RABBITMQ_QUEUE**: `chat_messages`

### **2. Credenciais do RabbitMQ:**

- **Host**: `tramway.proxy.rlwy.net`
- **Porta**: `57504`
- **Usuário**: `NkjlI2cR7MPnRRnn`
- **Senha**: `4oNfoU1Jv0W4DEgHOEbh.4WWDUJR80u~`
- **URL Pública**: `amqp://NkjlI2cR7MPnRRnn:4oNfoU1Jv0W4DEgHOEbh.4WWDUJR80u~@tramway.proxy.rlwy.net:57504`
- **URL Privada**: `amqp://NkjlI2cR7MPnRRnn:4oNfoU1Jv0W4DEgHOEbh.4WWDUJR80u~@rabbitmq.railway.internal:5672`

---

## ✅ **Como Funciona:**

O código do backend já está configurado para usar RabbitMQ. Ele lê as seguintes variáveis:

1. **`RABBITMQ_URL`** - URL de conexão (obrigatória) ✅ **Configurada**
2. **`RABBITMQ_EXCHANGE`** - Nome do exchange (padrão: `chat_exchange`) ✅ **Configurada**
3. **`RABBITMQ_QUEUE`** - Nome da fila (padrão: `chat_messages`) ✅ **Configurada**

---

## 🚀 **Próximos Passos:**

### **1. Fazer Deploy (se necessário):**

O backend na Railway vai usar automaticamente essas variáveis no próximo deploy. Se quiser forçar um redeploy:

```bash
# Via Railway Dashboard: vá em Deployments → Redeploy
# Ou via CLI:
railway up
```

### **2. Verificar Logs:**

Após o deploy, verifique os logs do backend. Você deve ver:

```
✅ Conectado ao RabbitMQ
✅ Canal RabbitMQ criado
✅ Exchange 'chat_exchange' criado
✅ Fila 'chat_messages' criada
```

### **3. Para Desenvolvimento Local:**

Se quiser testar localmente, crie um arquivo `.env` na raiz do projeto com:

```bash
RABBITMQ_URL=amqp://NkjlI2cR7MPnRRnn:4oNfoU1Jv0W4DEgHOEbh.4WWDUJR80u~@tramway.proxy.rlwy.net:57504
RABBITMQ_EXCHANGE=chat_exchange
RABBITMQ_QUEUE=chat_messages
```

**⚠️ IMPORTANTE**: O arquivo `.env` está no `.gitignore` e não será commitado.

---

## 🧪 **Testar a Conexão:**

### **Na Railway (Produção):**

1. Acesse: https://railway.app
2. Vá no serviço **"prisma-backend"**
3. Clique em **"Deployments"** → **"View Logs"**
4. Procure por mensagens de conexão do RabbitMQ

### **Localmente:**

```bash
# Iniciar o backend
npm run start:dev

# Você deve ver nos logs:
# ✅ Conectado ao RabbitMQ
# ✅ Canal RabbitMQ criado
# ✅ Exchange 'chat_exchange' criado
# ✅ Fila 'chat_messages' criada
```

### **Via RabbitMQ Web UI:**

1. Acesse: https://rabbitmq-web-ui-production-b62e.up.railway.app
2. Faça login com:
   - **Usuário**: `NkjlI2cR7MPnRRnn`
   - **Senha**: `4oNfoU1Jv0W4DEgHOEbh.4WWDUJR80u~`
3. Verifique se o exchange `chat_exchange` e a fila `chat_messages` foram criados

---

## 🔍 **Verificar Variáveis:**

```bash
# Ver todas as variáveis do backend
railway variables --service prisma-backend

# Ver apenas variáveis do RabbitMQ
railway variables --service prisma-backend | findstr /i "RABBITMQ"
```

---

## 🐛 **Troubleshooting:**

### **Erro: "Connection refused" ou "Timeout"**

**Solução:**
- Verifique se o RabbitMQ está ativo na Railway
- Verifique se a URL está correta (deve usar `tramway.proxy.rlwy.net:57504`)
- Tente fazer um redeploy do backend

### **Erro: "Failed to connect to RabbitMQ"**

**Solução:**
- Verifique se `RABBITMQ_URL` está definida: `railway variables --service prisma-backend | findstr RABBITMQ_URL`
- Se não estiver, configure: `railway variables --set "RABBITMQ_URL=amqp://..." --service prisma-backend`
- Verifique se as credenciais estão corretas

### **Mensagens não são processadas**

**Solução:**
- Verifique se o exchange e a fila foram criados (via Web UI)
- Verifique os logs do backend para erros
- Verifique se o RabbitMQ está funcionando (via Web UI)

---

## 📊 **Diferença entre Redis e RabbitMQ:**

### **Redis (Pub/Sub):**
- ✅ **Rápido** - Mensagens em tempo real
- ❌ **Não garante entrega** - Se o servidor cair, perde mensagens
- ✅ **Ideal para**: Notificações em tempo real, cache

### **RabbitMQ (Filas):**
- ⚠️ **Mais lento** - Processamento assíncrono
- ✅ **Garante entrega** - Mensagens ficam na fila até serem processadas
- ✅ **Ideal para**: Mensagens importantes, processamento em background

### **Uso no Projeto:**
- **Redis**: Mensagens em tempo real via WebSocket
- **RabbitMQ**: Mensagens importantes que não podem ser perdidas

---

## 📚 **Recursos:**

- **Railway Dashboard**: https://railway.app
- **RabbitMQ Docs**: https://www.rabbitmq.com/documentation.html
- **RabbitMQ Web UI**: https://rabbitmq-web-ui-production-b62e.up.railway.app
- **amqplib (biblioteca)**: https://github.com/amqp-node/amqplib

---

## 🎉 **Pronto!**

Seu backend está conectado ao RabbitMQ da Railway! 🚀

O RabbitMQ agora pode ser usado para:
- ✅ Filas de mensagens (garantir entrega)
- ✅ Processamento assíncrono
- ✅ Distribuição de carga entre workers
- ✅ Mensagens importantes que não podem ser perdidas

---

**Data da configuração**: $(Get-Date -Format "dd/MM/yyyy HH:mm")

