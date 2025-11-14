# 🌐 Configuração de Web Push Notifications para Site Web

## ✅ **Perfeito! Você já tem o que precisa!**

O **"Par de chaves"** que você viu no Firebase Console é exatamente o que precisamos para Web Push!

## 📋 **O que você viu no Firebase:**

Na imagem, você viu:
- **Par de chaves**: `BLISPBCewfTmik1bFmvqoaT3kkfqsXEaBeFUAHO_m3dOKESTL0SVdGT_Jz9ntcoiZ6JeFM1_M_mHt9y3xzjETN4`
- **Data da adição**: 14 de nov. de 2025

Essa é a **chave pública VAPID**. Você também precisa da **chave privada**.

## 🔍 **Como Obter a Chave Privada:**

1. **No Firebase Console:**
   - Acesse: https://console.firebase.google.com
   - Vá em: ⚙️ **Project Settings** → **Cloud Messaging**
   - Aba: **"Certificados push da Web"**

2. **Encontrar a Chave Privada:**
   - Você verá o "Par de chaves" que você já tem (chave pública)
   - **Clique no par de chaves** ou no ícone de ações (três pontos)
   - Procure por **"Ver chave privada"** ou **"Private Key"**
   - Copie a chave privada completa

## 🔧 **Configurar no Railway:**

Adicione estas variáveis no Railway:

```
VAPID_PUBLIC_KEY=BLISPBCewfTmik1bFmvqoaT3kkfqsXEaBeFUAHO_m3dOKESTL0SVdGT_Jz9ntcoiZ6JeFM1_M_mHt9y3xzjETN4
VAPID_PRIVATE_KEY=sua-chave-privada-aqui
```

## 📝 **Como Funciona Web Push:**

### **1. Frontend (Navegador):**
- Usuário permite notificações
- Navegador cria uma "subscription" (endpoint + chaves)
- Frontend envia subscription para o backend
- Backend salva subscription no banco

### **2. Backend:**
- Quando usuário está offline e recebe mensagem
- Backend busca subscriptions do usuário no banco
- Backend envia Web Push usando VAPID keys
- Navegador recebe notificação mesmo fechado

### **3. Quando Usuário Volta:**
- Navegador abre
- Busca mensagens não lidas do banco
- Mostra todas as mensagens pendentes

## 🚀 **Próximos Passos:**

### **1. Configurar Variáveis:**
```bash
# No Railway
VAPID_PUBLIC_KEY=BLISPBCewfTmik1bFmvqoaT3kkfqsXEaBeFUAHO_m3dOKESTL0SVdGT_Jz9ntcoiZ6JeFM1_M_mHt9y3xzjETN4
VAPID_PRIVATE_KEY=sua-chave-privada-completa
```

### **2. Criar Tabela de Subscriptions (Futuro):**
```sql
CREATE TABLE user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Frontend - Solicitar Permissão:**
```javascript
// No frontend, solicitar permissão e registrar subscription
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY // Do backend
});

// Enviar subscription para o backend
await fetch('/api/push/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(subscription)
});
```

## ✅ **Verificar se Está Funcionando:**

Após configurar, verifique os logs:

```
[WEB_PUSH] ✅ Web Push inicializado usando VAPID Keys
[WEB_PUSH] 📋 Chave pública: BLISPBCewfTmik1bFmvqoa...
```

## 🎯 **Resumo:**

- ✅ **Chave Pública**: `BLISPBCewfTmik1bFmvqoaT3kkfqsXEaBeFUAHO_m3dOKESTL0SVdGT_Jz9ntcoiZ6JeFM1_M_mHt9y3xzjETN4` (você já tem!)
- ⚠️ **Chave Privada**: Precisa obter no Firebase Console
- ✅ **Backend**: Já configurado para usar VAPID keys
- 📝 **Próximo**: Obter chave privada e configurar no Railway

