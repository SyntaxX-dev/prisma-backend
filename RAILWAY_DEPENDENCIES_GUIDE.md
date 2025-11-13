# 🔗 Guia: Criar Dependências (Setas) entre Serviços na Railway

Este guia explica como conectar Redis e RabbitMQ ao backend na Railway, criando as "setas" (dependências) no diagrama.

---

## 🎯 **O que são Dependências na Railway?**

As dependências conectam serviços e fazem com que:
- ✅ Variáveis de ambiente sejam injetadas automaticamente
- ✅ O backend só inicie depois que Redis/RabbitMQ estiverem prontos
- ✅ As "setas" apareçam no diagrama visual

---

## 📋 **Passo a Passo**

### **1. Acessar o Projeto**

1. Acesse: https://railway.app
2. Selecione seu projeto
3. Você verá o diagrama com todos os serviços

### **2. Conectar Redis ao Backend**

#### **Método A: Arrastar e Soltar (Mais Fácil)**

1. No diagrama, encontre o serviço **"prisma-backend"**
2. Clique e segure no serviço **"Redis"**
3. Arraste até o **"prisma-backend"**
4. Solte quando aparecer uma linha conectando os dois
5. ✅ A seta será criada automaticamente!

#### **Método B: Menu de Configuração**

1. Clique no serviço **"prisma-backend"**
2. Vá em **"Settings"** (Configurações)
3. Role até **"Service Dependencies"** ou **"Dependencies"**
4. Clique em **"+ Add Dependency"**
5. Selecione **"Redis"**
6. ✅ A dependência será criada!

### **3. Conectar RabbitMQ ao Backend**

Repita o mesmo processo:

1. **Arraste** o serviço **"RabbitMQ"** até o **"prisma-backend"**
   - **OU**
2. No **"prisma-backend"** → **"Settings"** → **"+ Add Dependency"** → Selecione **"RabbitMQ"**

---

## 🔐 **Variáveis de Ambiente Automáticas**

Após criar as dependências, a Railway **automaticamente** injeta variáveis de ambiente no backend:

### **Variáveis do Redis:**
```bash
REDIS_HOST=containers-us-west-xxx.railway.app
REDIS_PORT=6379
REDIS_PASSWORD=sua-senha
REDIS_URL=redis://:senha@host:port
```

### **Variáveis do RabbitMQ:**
```bash
RABBITMQ_URL=amqp://user:password@host:port/vhost
RABBITMQ_HOST=containers-us-west-xxx.railway.app
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=senha
```

**⚠️ IMPORTANTE:** Verifique se os nomes das variáveis correspondem ao que o código espera!

---

## ✅ **Verificar Dependências**

### **1. Visualmente no Diagrama**

Após criar as dependências, você verá:
- ✅ Setas (linhas tracejadas) conectando Redis → Backend
- ✅ Setas conectando RabbitMQ → Backend
- ✅ As setas apontam do serviço dependente para o que depende

### **2. Nas Configurações**

1. Clique no **"prisma-backend"**
2. Vá em **"Settings"** → **"Dependencies"**
3. Você verá:
   - ✅ Redis (conectado)
   - ✅ RabbitMQ (conectado)

---

## 🔧 **Ajustar Nomes das Variáveis (Se Necessário)**

Se as variáveis automáticas não corresponderem ao que o código espera:

### **1. Verificar Variáveis Disponíveis**

1. No **"prisma-backend"** → **"Variables"**
2. Você verá todas as variáveis injetadas automaticamente
3. Anote os nomes exatos

### **2. Adicionar Variáveis Customizadas**

Se o código espera nomes diferentes, adicione manualmente:

1. No **"prisma-backend"** → **"Variables"**
2. Clique em **"+ New Variable"**
3. Adicione variáveis que referenciam as automáticas:

```bash
# Exemplo: Se o código espera REDIS_HOST mas Railway injeta REDISHOST
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}

# Para RabbitMQ
RABBITMQ_URL=${{RabbitMQ.RABBITMQ_URL}}
```

**Nota:** `${{Servico.VARIAVEL}}` referencia variáveis de outros serviços.

---

## 🎨 **Como Ficará o Diagrama**

Após criar as dependências, o diagrama mostrará:

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ RabbitMQ │     │  Redis   │     │ Postgres │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │ (seta)         │ (seta)        │ (seta)
     │                │                │
     └────────┬───────┴────────────────┘
              │
              ▼
      ┌───────────────┐
      │ prisma-backend│
      └───────────────┘
```

---

## 🐛 **Troubleshooting**

### **Problema: Setas não aparecem**

**Solução:**
1. Recarregue a página (F5)
2. Verifique se as dependências foram criadas em **"Settings" → "Dependencies"**
3. Tente criar novamente arrastando

### **Problema: Variáveis não estão sendo injetadas**

**Solução:**
1. Verifique se as dependências foram criadas corretamente
2. Vá em **"Variables"** do backend e veja se aparecem variáveis do Redis/RabbitMQ
3. Se não aparecerem, adicione manualmente usando `${{Servico.VARIAVEL}}`

### **Problema: Backend não conecta ao Redis/RabbitMQ**

**Solução:**
1. Verifique os logs do backend para ver o erro exato
2. Confirme que os nomes das variáveis no código correspondem aos da Railway
3. Verifique se Redis/RabbitMQ estão rodando (status verde no diagrama)

---

## 📝 **Resumo Rápido**

1. ✅ **Arraste** Redis até o backend (ou use Settings → Dependencies)
2. ✅ **Arraste** RabbitMQ até o backend
3. ✅ **Verifique** as variáveis de ambiente no backend
4. ✅ **Ajuste** nomes se necessário usando `${{Servico.VARIAVEL}}`
5. ✅ **Deploy** e teste!

---

## 🎉 **Pronto!**

Agora seu backend está conectado ao Redis e RabbitMQ, e as setas aparecem no diagrama! 🚀

