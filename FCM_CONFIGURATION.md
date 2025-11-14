# 🔔 Configuração do Firebase Cloud Messaging (FCM)

## ⚠️ **IMPORTANTE - Diferença entre as Chaves:**

### **Par de Chaves para Web Push** (o que você viu na imagem):
- `BLISPBCewfTmik1bFmvqoaT3kkfqsXEaBeFUAHO_m3dOKESTL0SVdGT_Jz9ntcoiZ6JeFM1_M_mHt9y3xzjETN4`
- **NÃO é isso que precisamos!**
- Isso é para **Web Push** (notificações no navegador)
- Usado pelo frontend, não pelo backend

### **O que precisamos para o Backend:**
- **Service Account** (API V1 - recomendado) OU
- **Server Key** (API legada - descontinuada)

## 📋 **Como Obter a Service Account Correta:**

## 🔍 **Identificando as Chaves:**

### **Opção 1: Server Key (Método Simples)**

Se você tem uma **Server Key** do Firebase:
- Vá em: Firebase Console → Project Settings → Cloud Messaging
- Procure por **"Server Key"** ou **"Legacy Server Key"**
- Formato: Uma string longa (geralmente começa com `AAAA...`)

**Configure:**
```bash
FCM_SERVER_KEY=sua-server-key-aqui
```

### **Opção 2: Service Account (Método Recomendado)**

Se você tem um **Service Account JSON**:
- Vá em: Firebase Console → Project Settings → Service Accounts
- Clique em **"Generate New Private Key"**
- Baixe o arquivo JSON
- Do JSON, você precisa:
  - `private_key`: A chave privada
  - `client_email`: O email do service account

**Configure:**
```bash
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nOtrj7A7cNE9i5gNeseZdXPt_gbaB-pc0sO4QLykDbHw\n-----END PRIVATE KEY-----"
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
```

## ⚠️ **Importante sobre as Chaves:**

As chaves que você forneceu parecem ser:
- **Chave Privada**: Parte de uma Service Account (precisa do formato completo com `-----BEGIN PRIVATE KEY-----`)
- **Par de Chaves**: Pode ser um token ou chave pública

## 🔧 **Como Configurar:**

### **No Railway (Produção):**

1. Vá no serviço **"prisma-backend"**
2. Clique em **"Variables"**
3. Adicione:

#### **Se usar Server Key:**
```
FCM_SERVER_KEY=sua-server-key-completa
```

#### **Se usar Service Account (RECOMENDADO - API V1):**
```
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_PRIVADA_COMPLETA_AQUI\n-----END PRIVATE KEY-----"
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
```

**⚠️ IMPORTANTE:**
- A chave privada deve incluir `-----BEGIN PRIVATE KEY-----` no início
- A chave privada deve incluir `-----END PRIVATE KEY-----` no final
- Use `\n` para quebras de linha dentro das aspas
- O email deve ser o `client_email` do arquivo JSON

### **Localmente (.env):**

Crie/edite o arquivo `.env` na raiz do projeto:

```bash
# Opção 1: Server Key (API legada - NÃO RECOMENDADO, está desativada)
# FCM_SERVER_KEY=sua-server-key-aqui

# Opção 2: Service Account (API V1 - RECOMENDADO ✅)
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_PRIVADA_COMPLETA_AQUI\n-----END PRIVATE KEY-----"
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
```

## 📖 **Como Obter a Service Account (API V1 - Recomendado):**

Como a **API V1 está ativada** e a **API legada está desativada**, você DEVE usar Service Account:

### **Passo a Passo:**

1. **No Firebase Console:**
   - Acesse: https://console.firebase.google.com
   - Selecione seu projeto
   - Vá em: ⚙️ **Project Settings** → **Cloud Messaging**

2. **Na seção "API Firebase Cloud Messaging (V1)":**
   - Veja a linha **"Conta de serviço"** (Service account)
   - Clique em **"Gerenciar contas de serviço"** (Manage service accounts)

3. **Na página de Service Accounts:**
   - Você verá uma lista de contas de serviço
   - Procure por uma conta relacionada ao Firebase Cloud Messaging
   - Se não existir, clique em **"Gerar nova chave privada"** (Generate New Private Key)
   - Baixe o arquivo JSON

4. **Do arquivo JSON baixado, você precisa:**
   - `private_key`: A chave privada completa (começa com `-----BEGIN PRIVATE KEY-----`)
   - `client_email`: O email da service account (formato: `firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com`)

### **Alternativa - Criar Nova Service Account:**

Se não encontrar uma service account adequada:

1. Vá em: ⚙️ **Project Settings** → **Service Accounts**
2. Clique em **"Gerar nova chave privada"** (Generate New Private Key)
3. Baixe o arquivo JSON
4. Use os valores `private_key` e `client_email` do JSON

## ✅ **Verificar se Está Funcionando:**

Após configurar, verifique os logs ao iniciar o servidor:

```
[FCM] ✅ FCM inicializado usando Server Key
```

ou

```
[FCM] ✅ FCM inicializado usando Service Account (método recomendado)
```

## 🚨 **Segurança:**

- ⚠️ **NUNCA** commite as chaves no Git
- ⚠️ Use variáveis de ambiente
- ⚠️ O arquivo `.env` está no `.gitignore`
- ⚠️ No Railway, use variáveis de ambiente seguras

## 📝 **Próximos Passos:**

1. ✅ Configure a variável de ambiente
2. ✅ Faça deploy (se necessário)
3. ✅ Teste enviando uma mensagem para usuário offline
4. ✅ Verifique os logs para confirmar que FCM está funcionando

