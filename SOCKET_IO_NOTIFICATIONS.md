# Socket.io - Notificações em Tempo Real

## 📋 Visão Geral

O sistema de notificações em tempo real foi implementado usando **Socket.io** para enviar notificações instantâneas quando:
- Um pedido de amizade é enviado
- Um pedido de amizade é aceito
- Um pedido de amizade é rejeitado

## 🔌 Endpoint WebSocket

**URL:** `ws://seu-servidor/notifications` (ou `wss://` para HTTPS)

**Namespace:** `/notifications`

## 🔐 Autenticação

O WebSocket requer autenticação JWT. O token deve ser enviado no header `Authorization`:

```
Authorization: Bearer seu-token-jwt-aqui
```

## 📡 Eventos Disponíveis

### Eventos que o Cliente Recebe:

#### 1. `connected`
Emitido quando o cliente se conecta com sucesso.

```javascript
socket.on('connected', (data) => {
  console.log('Conectado!', data);
  // { userId: "uuid-do-usuario" }
});
```

#### 2. `friend_request`
Emitido quando o usuário recebe um pedido de amizade.

```javascript
socket.on('friend_request', (data) => {
  console.log('Novo pedido de amizade!', data);
  /*
  {
    id: "notification-id",
    type: "FRIEND_REQUEST",
    title: "Novo pedido de amizade",
    message: "João enviou um pedido de amizade para você",
    relatedUserId: "requester-id",
    relatedEntityId: "friend-request-id",
    requester: {
      id: "requester-id",
      name: "João Silva",
      profileImage: "https://..."
    },
    createdAt: "2025-01-01T00:00:00.000Z"
  }
  */
});
```

#### 3. `friend_accepted`
Emitido quando um pedido de amizade enviado pelo usuário é aceito.

```javascript
socket.on('friend_accepted', (data) => {
  console.log('Pedido aceito!', data);
  /*
  {
    id: "notification-id",
    type: "FRIEND_ACCEPTED",
    title: "Pedido de amizade aceito",
    message: "Maria aceitou seu pedido de amizade",
    relatedUserId: "receiver-id",
    relatedEntityId: "friendship-id",
    receiver: {
      id: "receiver-id",
      name: "Maria Santos",
      profileImage: "https://..."
    },
    friendship: {
      id: "friendship-id",
      userId1: "user-1-id",
      userId2: "user-2-id",
      createdAt: "2025-01-01T00:00:00.000Z"
    },
    createdAt: "2025-01-01T00:00:00.000Z"
  }
  */
});
```

#### 4. `friend_request_rejected`
Emitido quando um pedido de amizade enviado pelo usuário é rejeitado.

```javascript
socket.on('friend_request_rejected', (data) => {
  console.log('Pedido rejeitado!', data);
  /*
  {
    friendRequestId: "friend-request-id",
    receiverId: "receiver-id",
    receiver: {
      id: "receiver-id",
      name: "Maria Santos",
      profileImage: "https://..."
    },
    rejectedAt: "2025-01-01T00:00:00.000Z"
  }
  */
});
```

### Eventos que o Cliente Pode Enviar:

#### `ping`
Envia um ping para testar a conexão.

```javascript
socket.emit('ping');
socket.on('pong', (data) => {
  console.log('Pong recebido!', data);
  // { event: 'pong', data: { timestamp: '2025-01-01T00:00:00.000Z' } }
});
```

## 💻 Exemplo de Implementação no Frontend (React)

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3006';
const token = localStorage.getItem('token'); // Seu token JWT

export function useNotifications() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    // Conectar ao WebSocket
    const newSocket = io(`${API_URL}/notifications`, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
    });

    // Evento de conexão
    newSocket.on('connect', () => {
      console.log('Conectado ao WebSocket');
      setIsConnected(true);
    });

    // Evento de desconexão
    newSocket.on('disconnect', () => {
      console.log('Desconectado do WebSocket');
      setIsConnected(false);
    });

    // Evento quando conectado com sucesso (autenticado)
    newSocket.on('connected', (data) => {
      console.log('Autenticado:', data);
    });

    // Receber pedido de amizade
    newSocket.on('friend_request', (data) => {
      console.log('Novo pedido de amizade:', data);
      setNotifications((prev) => [data, ...prev]);
      
      // Mostrar notificação na UI
      showNotification({
        title: data.title,
        message: data.message,
        type: 'info',
      });
    });

    // Receber confirmação de aceitação
    newSocket.on('friend_accepted', (data) => {
      console.log('Pedido aceito:', data);
      setNotifications((prev) => [data, ...prev]);
      
      showNotification({
        title: data.title,
        message: data.message,
        type: 'success',
      });
    });

    // Receber confirmação de rejeição
    newSocket.on('friend_request_rejected', (data) => {
      console.log('Pedido rejeitado:', data);
      
      showNotification({
        title: 'Pedido rejeitado',
        message: `${data.receiver.name} rejeitou seu pedido de amizade`,
        type: 'warning',
      });
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, [token]);

  return {
    socket,
    isConnected,
    notifications,
  };
}

// Função auxiliar para mostrar notificação (exemplo)
function showNotification({ title, message, type }: any) {
  // Implementar sua lógica de notificação aqui
  // Ex: usar react-toastify, react-hot-toast, etc.
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
}
```

## 🔧 Configuração no Frontend

### 1. Instalar Socket.io Client

```bash
npm install socket.io-client
# ou
yarn add socket.io-client
```

### 2. Criar Hook de Notificações

Crie um hook customizado (como o exemplo acima) para gerenciar a conexão WebSocket.

### 3. Usar no Componente

```typescript
import { useNotifications } from './hooks/useNotifications';

function App() {
  const { socket, isConnected, notifications } = useNotifications();

  return (
    <div>
      <p>Status: {isConnected ? 'Conectado' : 'Desconectado'}</p>
      <p>Notificações: {notifications.length}</p>
    </div>
  );
}
```

## 🚨 Tratamento de Erros

```typescript
socket.on('connect_error', (error) => {
  console.error('Erro ao conectar:', error);
  // Token inválido ou servidor offline
});

socket.on('error', (error) => {
  console.error('Erro no WebSocket:', error);
});
```

## 📝 Notas Importantes

1. **Token JWT**: O token deve ser válido e não expirado
2. **Reconexão Automática**: Socket.io reconecta automaticamente em caso de desconexão
3. **Fallback**: Socket.io usa polling como fallback se WebSocket não estiver disponível
4. **CORS**: O servidor já está configurado para aceitar conexões do frontend

## 🧪 Testando

1. Conecte ao WebSocket com um token válido
2. Envie um pedido de amizade de outro usuário
3. Você deve receber a notificação `friend_request` instantaneamente
4. Aceite ou rejeite o pedido
5. O outro usuário receberá `friend_accepted` ou `friend_request_rejected`

## 🔄 Fluxo Completo

1. **Usuário A envia pedido para Usuário B**
   - Usuário B recebe `friend_request` (se estiver online)

2. **Usuário B aceita o pedido**
   - Usuário A recebe `friend_accepted` (se estiver online)

3. **Usuário B rejeita o pedido**
   - Usuário A recebe `friend_request_rejected` (se estiver online)

## 📚 Recursos Adicionais

- [Documentação Socket.io](https://socket.io/docs/v4/)
- [Socket.io Client API](https://socket.io/docs/v4/client-api/)

