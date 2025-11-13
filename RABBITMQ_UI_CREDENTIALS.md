# 🔐 Como Acessar a UI do RabbitMQ - Credenciais

Este guia explica como encontrar as credenciais para acessar a interface web do RabbitMQ.

---

## 🎯 **Depende de Como o RabbitMQ Foi Criado**

### **Opção 1: RabbitMQ via Railway (Template/Docker)**

Se você criou o RabbitMQ usando um template ou Docker na Railway:

#### **Credenciais Padrão:**
```
Username: guest
Password: guest
```

**⚠️ IMPORTANTE:** Se não funcionar, verifique as variáveis de ambiente do serviço RabbitMQ na Railway.

#### **Como Verificar:**
1. No Railway Dashboard, clique no serviço **"RabbitMQ"**
2. Vá em **"Variables"** (Variáveis de Ambiente)
3. Procure por:
   - `RABBITMQ_DEFAULT_USER` ou `RABBITMQ_USER` → Username
   - `RABBITMQ_DEFAULT_PASS` ou `RABBITMQ_PASSWORD` → Password

#### **URL da UI:**
- Geralmente: `http://seu-rabbitmq.railway.app:15672`
- Ou: `https://seu-rabbitmq.railway.app` (se tiver domínio público)

---

### **Opção 2: RabbitMQ via CloudAMQP**

Se você criou o RabbitMQ usando CloudAMQP:

#### **Como Obter Credenciais:**
1. Acesse: https://www.cloudamqp.com
2. Faça login na sua conta
3. Selecione sua instância RabbitMQ
4. Vá em **"Details"** ou **"Connection Info"**
5. Você verá:
   - **Username**: Geralmente o nome da instância ou `guest`
   - **Password**: Senha gerada automaticamente
   - **Management URL**: URL para acessar a UI (ex: `https://xxx.cloudamqp.com`)

#### **URL da UI:**
- Está no dashboard do CloudAMQP
- Formato: `https://nome-da-instancia.cloudamqp.com`
- Ou: `https://nome-da-instancia.cloudamqp.com/#/`

---

### **Opção 3: RabbitMQ via Railway (Serviço Customizado)**

Se você criou um serviço RabbitMQ customizado na Railway:

#### **Como Obter Credenciais:**
1. No Railway Dashboard, clique no serviço **"RabbitMQ"**
2. Vá em **"Variables"** (Variáveis de Ambiente)
3. Procure por variáveis como:
   - `RABBITMQ_DEFAULT_USER`
   - `RABBITMQ_DEFAULT_PASS`
   - `RABBITMQ_USERNAME`
   - `RABBITMQ_PASSWORD`
   - `RABBITMQ_MANAGEMENT_USER`
   - `RABBITMQ_MANAGEMENT_PASSWORD`

#### **Se Não Encontrar nas Variáveis:**
1. Verifique os **logs** do serviço RabbitMQ
2. Procure por mensagens como:
   - `Default user: guest`
   - `Management UI: http://...`
   - `Login credentials: ...`

---

## 🔍 **Método Alternativo: Extrair da URL de Conexão**

Se você tem a `RABBITMQ_URL` nas variáveis de ambiente:

A URL tem o formato: `amqp://username:password@host:port/vhost`

**Exemplo:**
```
RABBITMQ_URL=amqp://admin:senha123@rabbitmq.railway.app:5672/
```

**Credenciais:**
- **Username**: `admin`
- **Password**: `senha123`

**⚠️ NOTA:** A porta da UI geralmente é `15672` (não `5672` que é a porta AMQP)

---

## 🌐 **Como Acessar a UI**

### **1. Descobrir a URL**

#### **Se RabbitMQ está na Railway:**
1. No Railway Dashboard, clique no serviço **"RabbitMQ"**
2. Vá em **"Settings"** → **"Networking"**
3. Procure por **"Public Domain"** ou **"Ports"**
4. A URL geralmente é: `https://seu-rabbitmq.railway.app` ou `http://seu-rabbitmq.railway.app:15672`

#### **Se RabbitMQ está no CloudAMQP:**
- A URL está no dashboard do CloudAMQP
- Formato: `https://nome-instancia.cloudamqp.com`

### **2. Acessar a Interface**

1. Abra a URL no navegador
2. Você verá a tela de login do RabbitMQ
3. Digite:
   - **Username**: (conforme encontrado acima)
   - **Password**: (conforme encontrado acima)
4. Clique em **"Login"**

---

## 🔧 **Se Nada Funcionar**

### **Tentar Credenciais Padrão Comuns:**

1. **guest/guest** (mais comum)
2. **admin/admin**
3. **rabbitmq/rabbitmq**
4. **user/password**

### **Resetar Senha (se possível):**

Se você tem acesso ao container/serviço:

```bash
# Via Railway CLI ou terminal do serviço
docker exec -it rabbitmq-container rabbitmqctl change_password guest nova_senha
```

---

## 📋 **Resumo Rápido**

1. ✅ **Railway Template**: Tente `guest/guest`
2. ✅ **CloudAMQP**: Veja no dashboard
3. ✅ **Railway Custom**: Veja nas variáveis de ambiente
4. ✅ **Extrair da URL**: `amqp://username:password@host`

---

## 🎉 **Pronto!**

Agora você pode acessar a UI do RabbitMQ e ver:
- Filas (Queues)
- Exchanges
- Conexões (Connections)
- Mensagens
- Estatísticas

🚀

