# 🌐 Configuração Frontend - Web Push Notifications

## 📋 **Configuração do Firebase (Frontend)**

Você recebeu a configuração do Firebase. Use isso no seu frontend:

```javascript
// firebase-config.js ou firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBcmBj8K5--rXYsbkYYNc83A_RPsdCb1sE",
  authDomain: "prisma-59803.firebaseapp.com",
  projectId: "prisma-59803",
  storageBucket: "prisma-59803.firebasestorage.app",
  messagingSenderId: "761068641748",
  appId: "1:761068641748:web:2f0ab330ed1e4898a30a41",
  measurementId: "G-WREXNVQLC6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const messaging = getMessaging(app);

export { app, analytics, messaging };
```

## 🔔 **Implementação Completa de Web Push**

### **1. Service Worker (firebase-messaging-sw.js)**

Crie este arquivo na **raiz pública** do seu frontend (pasta `public/`):

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBcmBj8K5--rXYsbkYYNc83A_RPsdCb1sE",
  authDomain: "prisma-59803.firebaseapp.com",
  projectId: "prisma-59803",
  storageBucket: "prisma-59803.firebasestorage.app",
  messagingSenderId: "761068641748",
  appId: "1:761068641748:web:2f0ab330ed1e4898a30a41",
  measurementId: "G-WREXNVQLC6"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Quando recebe notificação push (navegador fechado)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Nova mensagem';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png', // Seu ícone
    badge: '/badge-72x72.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

### **2. Hook React para Web Push**

```typescript
// hooks/useWebPush.ts
import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase-config';

export function useWebPush() {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Verificar se navegador suporta
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('Este navegador não suporta notificações push');
      return;
    }

    // Verificar permissão atual
    setPermission(Notification.permission);

    // Solicitar permissão e obter token
    async function requestPermission() {
      try {
        const permission = await Notification.requestPermission();
        setPermission(permission);

        if (permission === 'granted') {
          // Obter VAPID key do backend
          const response = await fetch('/api/push/vapid-key');
          const { publicKey } = await response.json();

          // Obter token FCM
          const currentToken = await getToken(messaging, {
            vapidKey: publicKey
          });

          if (currentToken) {
            setToken(currentToken);
            console.log('FCM Token:', currentToken);

            // Enviar token para o backend
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                token: currentToken,
                endpoint: currentToken, // FCM usa token como endpoint
              })
            });
          } else {
            console.log('No registration token available.');
          }
        }
      } catch (error) {
        console.error('Erro ao solicitar permissão:', error);
      }
    }

    // Quando recebe notificação (navegador aberto)
    onMessage(messaging, (payload) => {
      console.log('Mensagem recebida:', payload);
      
      // Mostrar notificação
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'Nova mensagem', {
          body: payload.notification?.body,
          icon: '/icon-192x192.png',
          data: payload.data
        });
      }
    });

    requestPermission();
  }, []);

  return { token, permission };
}
```

### **3. Endpoint no Backend para VAPID Key**

Crie um endpoint no backend para retornar a chave pública VAPID:

```typescript
// src/presentation/http/controllers/push.controller.ts
import { Controller, Get } from '@nestjs/common';
import { FCMPushNotificationService } from '../../../infrastructure/services/fcm-push-notification.service';

@Controller('push')
export class PushController {
  constructor(
    private readonly pushService: FCMPushNotificationService,
  ) {}

  @Get('vapid-key')
  getVapidKey() {
    const publicKey = this.pushService.getVapidPublicKey();
    return { publicKey };
  }
}
```

### **4. Endpoint para Registrar Subscription**

```typescript
// Adicione no PushController
@Post('subscribe')
@UseGuards(JwtAuthGuard)
async subscribe(
  @Request() req: any,
  @Body() body: { token: string; endpoint: string },
) {
  const userId = req.user.sub;
  
  // TODO: Salvar subscription no banco
  // await this.pushSubscriptionRepository.create({
  //   userId,
  //   token: body.token,
  //   endpoint: body.endpoint,
  // });

  return { success: true, message: 'Subscription registrada' };
}
```

## 📦 **Instalação de Dependências (Frontend)**

```bash
npm install firebase
```

## 🚀 **Uso no Componente**

```typescript
// App.tsx ou componente principal
import { useWebPush } from './hooks/useWebPush';

function App() {
  const { token, permission } = useWebPush();

  return (
    <div>
      {permission === 'granted' && (
        <p>✅ Notificações ativadas</p>
      )}
      {permission === 'denied' && (
        <p>❌ Notificações bloqueadas</p>
      )}
      {permission === 'default' && (
        <p>⏳ Aguardando permissão...</p>
      )}
    </div>
  );
}
```

## ✅ **Checklist de Implementação**

### **Frontend:**
- [ ] Instalar `firebase`
- [ ] Criar `firebase-config.js` com sua configuração
- [ ] Criar `firebase-messaging-sw.js` na pasta `public/`
- [ ] Criar hook `useWebPush.ts`
- [ ] Usar hook no componente principal

### **Backend:**
- [ ] Criar endpoint `GET /api/push/vapid-key`
- [ ] Criar endpoint `POST /api/push/subscribe`
- [ ] Criar tabela `user_push_subscriptions` (futuro)
- [ ] Configurar `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` no Railway

## 🎯 **Fluxo Completo**

1. **Usuário abre site** → Frontend solicita permissão
2. **Usuário permite** → Frontend obtém FCM token
3. **Frontend envia token** → Backend salva subscription
4. **Usuário recebe mensagem offline** → Backend envia Web Push
5. **Navegador recebe** → Mostra notificação
6. **Usuário clica** → Abre site e busca mensagens

## 📝 **Próximos Passos**

1. Implementar no frontend usando o código acima
2. Criar endpoints no backend
3. Testar solicitação de permissão
4. Testar recebimento de notificações

