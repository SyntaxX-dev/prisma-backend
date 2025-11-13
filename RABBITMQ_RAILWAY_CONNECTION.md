# 🐰 Como Conectar RabbitMQ ao Backend na Railway

Sim! O RabbitMQ na Railway tem uma interface similar ao Redis para conectar ao backend.

---

## 🔗 **Passo a Passo: Conectar RabbitMQ**

### **1. Abrir o Modal de Conexão**

1. No diagrama da Railway, encontre o serviço **"RabbitMQ"**
2. Clique no serviço **"RabbitMQ"**
3. Procure por um botão ou opção **"Connect"** ou **"..."** (três pontos)
4. Clique em **"Connect to RabbitMQ"** ou similar
5. Um modal similar ao do Redis aparecerá!

### **2. Seguir os 3 Passos no Modal**

O modal mostrará algo como:

#### **Step 1:**
"Create a new variable in the service you want to connect to this database."

#### **Step 2:**
"Assign it the following value:"
```
${{ RabbitMQ.RABBITMQ_URL }}
```
*(ou similar, dependendo do nome do serviço)*

#### **Step 3:**
"Use the variable in your application code."

---

## 📝 **Variáveis que o Código Espera**

O código do backend espera estas variáveis:

```bash
RABBITMQ_URL=amqp://user:password@host:port/vhost
RABBITMQ_EXCHANGE=chat_exchange
RABBITMQ_QUEUE=chat_messages
```

---

## ✅ **Configuração Completa**

### **1. No Modal do RabbitMQ:**

1. Copie o valor sugerido (ex: `${{ RabbitMQ.RABBITMQ_URL }}`)
2. Feche o modal

### **2. No Serviço Backend:**

1. Clique no serviço **"prisma-backend"**
2. Vá em **"Variables"**
3. Clique em **"+ New Variable"**
4. Adicione as variáveis:

```bash
# Variável principal (do modal)
RABBITMQ_URL=${{ RabbitMQ.RABBITMQ_URL }}

# Variáveis opcionais (valores padrão do código)
RABBITMQ_EXCHANGE=chat_exchange
RABBITMQ_QUEUE=chat_messages
```

**⚠️ IMPORTANTE:**
- Se o modal mostrar um nome diferente (ex: `${{ RabbitMQ.AMQP_URL }}`), use esse nome
- Verifique o nome exato do serviço RabbitMQ no Railway (pode ser "RabbitMQ" ou outro nome)

---

## 🔍 **Se o Modal Não Aparecer**

### **Método Alternativo: Criar Manualmente**

1. No serviço **"prisma-backend"** → **"Variables"**
2. Adicione manualmente:

```bash
# Verifique o nome exato do serviço RabbitMQ no Railway
# Pode ser: RabbitMQ, rabbitmq, RabbitMQ-xxx, etc.

# Opção 1: Se o serviço se chama "RabbitMQ"
RABBITMQ_URL=${{ RabbitMQ.RABBITMQ_URL }}

# Opção 2: Se o serviço tem outro nome, use o nome exato
RABBITMQ_URL=${{ NomeDoServico.RABBITMQ_URL }}

# Opção 3: Se não funcionar, tente variáveis individuais
RABBITMQ_URL=${{ RabbitMQ.AMQP_URL }}
# ou
RABBITMQ_URL=${{ RabbitMQ.CLOUDAMQP_URL }}
```

### **Descobrir Nome do Serviço**

1. No diagrama, veja o nome exato do serviço RabbitMQ
2. Pode ser: `RabbitMQ`, `rabbitmq-production`, `RabbitMQ-xxx`, etc.
3. Use esse nome exato na sintaxe `${{ NomeDoServico.VARIAVEL }}`

---

## 🎯 **Variáveis Disponíveis do RabbitMQ**

Dependendo de como o RabbitMQ foi criado na Railway, você pode ter:

### **Se RabbitMQ foi criado como Database:**
```bash
RABBITMQ_URL=${{ RabbitMQ.RABBITMQ_URL }}
# ou
AMQP_URL=${{ RabbitMQ.AMQP_URL }}
```

### **Se RabbitMQ foi criado via Template:**
```bash
RABBITMQ_URL=${{ RabbitMQ.CLOUDAMQP_URL }}
# ou
RABBITMQ_URL=${{ RabbitMQ.AMQP_URL }}
```

### **Variáveis Individuais (se disponíveis):**
```bash
RABBITMQ_HOST=${{ RabbitMQ.RABBITMQ_HOST }}
RABBITMQ_PORT=${{ RabbitMQ.RABBITMQ_PORT }}
RABBITMQ_USER=${{ RabbitMQ.RABBITMQ_USER }}
RABBITMQ_PASSWORD=${{ RabbitMQ.RABBITMQ_PASSWORD }}

# E montar a URL manualmente:
RABBITMQ_URL=amqp://${{ RabbitMQ.RABBITMQ_USER }}:${{ RabbitMQ.RABBITMQ_PASSWORD }}@${{ RabbitMQ.RABBITMQ_HOST }}:${{ RabbitMQ.RABBITMQ_PORT }}/vhost
```

---

## ✅ **Verificar se Funcionou**

### **1. Verificar Variáveis**

1. No **"prisma-backend"** → **"Variables"**
2. Você deve ver `RABBITMQ_URL` com um valor (não vazio)
3. O valor deve começar com `amqp://`

### **2. Verificar Logs**

Após fazer deploy, verifique os logs do backend:

```
✅ Conectado ao RabbitMQ
✅ Canal RabbitMQ criado
✅ Exchange 'chat_exchange' criado
✅ Fila 'chat_messages' criada
```

Se aparecer erro, verifique:
- Se a variável `RABBITMQ_URL` está definida
- Se o valor está correto (formato `amqp://...`)
- Se o RabbitMQ está rodando (status verde)

---

## 🐛 **Troubleshooting**

### **Erro: "Cannot connect to RabbitMQ"**

**Solução:**
1. Verifique se `RABBITMQ_URL` está definida
2. Verifique se o valor começa com `amqp://`
3. Verifique se o RabbitMQ está rodando (status verde no diagrama)

### **Erro: "Variable not found"**

**Solução:**
1. Verifique o nome exato do serviço RabbitMQ
2. Use `${{ NomeExatoDoServico.VARIAVEL }}`
3. Tente variáveis alternativas (`AMQP_URL`, `CLOUDAMQP_URL`, etc.)

### **Modal não aparece**

**Solução:**
1. Crie a variável manualmente usando `${{ RabbitMQ.RABBITMQ_URL }}`
2. Ou use o método de arrastar e soltar (criar dependência)
3. Verifique se o RabbitMQ foi criado corretamente

---

## 📋 **Resumo Rápido**

1. ✅ Clique no **RabbitMQ** → Procure **"Connect"** ou **"..."**
2. ✅ Copie o valor do modal: `${{ RabbitMQ.RABBITMQ_URL }}`
3. ✅ No **backend** → **Variables** → Adicione:
   ```bash
   RABBITMQ_URL=${{ RabbitMQ.RABBITMQ_URL }}
   RABBITMQ_EXCHANGE=chat_exchange
   RABBITMQ_QUEUE=chat_messages
   ```
4. ✅ Deploy e verifique os logs!

---

## 🎉 **Pronto!**

Agora o RabbitMQ está conectado ao backend, assim como o Redis! 🚀

