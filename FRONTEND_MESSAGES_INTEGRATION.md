# 💬 Guia de Integração Frontend: Sistema de Mensagens

Este guia explica como o frontend deve integrar com o backend para enviar e receber mensagens em tempo real usando Socket.io e os endpoints HTTP.

---

## 📋 **Índice**

1. [Configuração Inicial do Socket.io](#configuração-inicial-do-socketio)
2. [Enviar Mensagem](#enviar-mensagem)
3. [Receber Mensagens em Tempo Real](#receber-mensagens-em-tempo-real)
4. [Buscar Histórico de Mensagens](#buscar-histórico-de-mensagens)
5. [Marcar Mensagens como Lidas](#marcar-mensagens-como-lidas)
6. [Indicador de Digitação](#indicador-de-digitação)
7. [Exemplo Completo](#exemplo-completo)

---

## 🔌 **Configuração Inicial do Socket.io**

### **1. Instalar Dependências**

```bash
npm install socket.io-client
# ou
yarn add socket.io-client
```

### **2. Criar Cliente Socket.io**

```typescript
import { io, Socket } from 'socket.io-client';

// URL do backend (ajuste conforme necessário)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://seu-backend.railway.app';

// Criar conexão Socket.io para chat
const chatSocket = io(`${BACKEND_URL}/chat`, {
  auth: {
    token: 'seu-token-jwt-aqui', // Token JWT do usuário autenticado
  },
  transports: ['websocket', 'polling'], // Fallback para polling se websocket falhar
  reconnection: true, // Reconectar automaticamente
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Eventos de conexão
chatSocket.on('connect', () => {
  console.log('✅ Conectado ao chat via WebSocket');
});

chatSocket.on('disconnect', () => {
  console.log('❌ Desconectado do chat');
});

chatSocket.on('connect_error', (error) => {
  console.error('❌ Erro ao conectar:', error);
});
```

### **3. Alternativa: Usar Header Authorization**

Se preferir enviar o token via header:

```typescript
const chatSocket = io(`${BACKEND_URL}/chat`, {
  extraHeaders: {
    Authorization: `Bearer ${seuTokenJWT}`,
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
});
```

---

## 📤 **Enviar Mensagem**

### **Método 1: Via Endpoint HTTP (Recomendado)**

```typescript
async function sendMessage(receiverId: string, content: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seuTokenJWT}`,
      },
      body: JSON.stringify({
        receiverId,
        content,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem');
    }

    const data = await response.json();
    console.log('✅ Mensagem enviada:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    throw error;
  }
}

// Uso
await sendMessage('id-do-amigo', 'Olá, como vai?');
```

### **Método 2: Via Socket.io (Opcional)**

```typescript
// O backend não tem handler para 'send_message' via socket
// Use o endpoint HTTP acima
```

---

## 📥 **Receber Mensagens em Tempo Real**

### **Escutar Evento 'new_message'**

```typescript
chatSocket.on('new_message', (message) => {
  console.log('📨 Nova mensagem recebida:', message);
  
  // message contém:
  // {
  //   id: string,
  //   senderId: string,
  //   receiverId: string,
  //   content: string,
  //   isRead: boolean,
  //   createdAt: Date
  // }
  
  // Adicionar mensagem à lista/conversa
  adicionarMensagemNaConversa(message);
  
  // Mostrar notificação (opcional)
  mostrarNotificacao(`Nova mensagem de ${message.senderId}`);
});
```

### **Exemplo com React**

```typescript
import { useEffect, useState } from 'react';

function ChatComponent({ friendId }: { friendId: string }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Escutar novas mensagens
    chatSocket.on('new_message', (message) => {
      // Só adicionar se for da conversa atual
      if (message.senderId === friendId || message.receiverId === friendId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Limpar listener ao desmontar
    return () => {
      chatSocket.off('new_message');
    };
  }, [friendId]);

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

---

## 📚 **Buscar Histórico de Mensagens**

### **Endpoint HTTP**

```typescript
async function getMessages(friendId: string, limit = 50, offset = 0) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/messages/conversation/${friendId}?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${seuTokenJWT}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar mensagens');
    }

    const data = await response.json();
    console.log('✅ Mensagens carregadas:', data);
    
    // data contém:
    // {
    //   success: true,
    //   data: {
    //     messages: Array<Message>,
    //     total: number,
    //     hasMore: boolean
    //   }
    // }
    
    return data.data;
  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    throw error;
  }
}

// Uso
const { messages, total, hasMore } = await getMessages('id-do-amigo');
```

### **Exemplo com Paginação**

```typescript
const [messages, setMessages] = useState([]);
const [hasMore, setHasMore] = useState(true);
const [offset, setOffset] = useState(0);

async function loadMoreMessages() {
  if (!hasMore) return;
  
  const data = await getMessages(friendId, 50, offset);
  setMessages((prev) => [...prev, ...data.messages]);
  setHasMore(data.hasMore);
  setOffset((prev) => prev + 50);
}
```

---

## ✅ **Marcar Mensagens como Lidas**

### **Endpoint HTTP**

```typescript
async function markMessagesAsRead(senderId: string) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/messages/read/${senderId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${seuTokenJWT}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao marcar como lida');
    }

    const data = await response.json();
    console.log('✅ Mensagens marcadas como lidas:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao marcar como lida:', error);
    throw error;
  }
}

// Uso: Quando o usuário abrir a conversa
useEffect(() => {
  if (friendId) {
    markMessagesAsRead(friendId);
  }
}, [friendId]);
```

### **Escutar Confirmação de Leitura**

```typescript
// Quando o amigo ler suas mensagens
chatSocket.on('messages_read', (data) => {
  console.log('✅ Mensagens foram lidas:', data);
  // data: { receiverId: string, readAt: Date }
  
  // Atualizar UI para mostrar que mensagens foram lidas
  atualizarStatusLeitura(data.receiverId);
});
```

---

## ⌨️ **Indicador de Digitação**

### **Enviar Indicador**

```typescript
function sendTypingIndicator(receiverId: string, isTyping: boolean) {
  chatSocket.emit('typing', {
    receiverId,
    isTyping,
  });
}

// Quando o usuário começar a digitar
const inputRef = useRef<HTMLInputElement>(null);

inputRef.current?.addEventListener('input', () => {
  sendTypingIndicator(friendId, true);
  
  // Parar de digitar após 2 segundos sem digitar
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    sendTypingIndicator(friendId, false);
  }, 2000);
});
```

### **Receber Indicador**

```typescript
chatSocket.on('typing', (data) => {
  // data: { userId: string, isTyping: boolean }
  
  if (data.userId === friendId) {
    if (data.isTyping) {
      mostrarIndicador('Amigo está digitando...');
    } else {
      esconderIndicador();
    }
  }
});
```

---

## 📊 **Contar Mensagens Não Lidas**

```typescript
async function getUnreadCount() {
  try {
    const response = await fetch(
      `${BACKEND_URL}/messages/unread/count`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${seuTokenJWT}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao contar não lidas');
    }

    const data = await response.json();
    // data: { success: true, data: { unreadCount: number } }
    
    return data.data.unreadCount;
  } catch (error) {
    console.error('❌ Erro ao contar não lidas:', error);
    return 0;
  }
}
```

---

## 🎯 **Exemplo Completo: Componente React**

```typescript
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://seu-backend.railway.app';

function ChatPage({ friendId, token }: { friendId: string; token: string }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar Socket.io
  useEffect(() => {
    const socket = io(`${BACKEND_URL}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Eventos de conexão
    socket.on('connect', () => {
      console.log('✅ Conectado ao chat');
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado do chat');
    });

    // Receber novas mensagens
    socket.on('new_message', (message) => {
      if (message.senderId === friendId || message.receiverId === friendId) {
        setMessages((prev) => [...prev, message]);
        // Atualizar contador de não lidas
        if (message.receiverId === friendId && !message.isRead) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    });

    // Mensagens foram lidas
    socket.on('messages_read', (data) => {
      console.log('✅ Mensagens lidas:', data);
      // Atualizar UI
    });

    // Indicador de digitação
    socket.on('typing', (data) => {
      if (data.userId === friendId) {
        setIsTyping(data.isTyping);
      }
    });

    // Limpar ao desmontar
    return () => {
      socket.off('new_message');
      socket.off('messages_read');
      socket.off('typing');
      socket.disconnect();
    };
  }, [friendId, token]);

  // Carregar histórico
  useEffect(() => {
    async function loadMessages() {
      try {
        const response = await fetch(
          `${BACKEND_URL}/messages/conversation/${friendId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setMessages(data.data.messages);
        
        // Marcar como lidas ao abrir conversa
        await fetch(`${BACKEND_URL}/messages/read/${friendId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      }
    }

    loadMessages();
  }, [friendId, token]);

  // Enviar mensagem
  async function handleSendMessage() {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`${BACKEND_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: friendId,
          content: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        // A mensagem será recebida via WebSocket automaticamente
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }

  // Indicador de digitação
  function handleTyping() {
    if (socketRef.current) {
      socketRef.current.emit('typing', {
        receiverId: friendId,
        isTyping: true,
      });

      // Parar após 2 segundos
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('typing', {
            receiverId: friendId,
            isTyping: false,
          });
        }
      }, 2000);
    }
  }

  return (
    <div>
      <h2>Chat com {friendId}</h2>
      {unreadCount > 0 && <div>Você tem {unreadCount} mensagens não lidas</div>}
      
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.senderId === friendId ? 'Amigo' : 'Você'}:</strong>
            {msg.content}
            {msg.isRead && <span> ✓✓</span>}
          </div>
        ))}
      </div>

      {isTyping && <div>Amigo está digitando...</div>}

      <input
        value={newMessage}
        onChange={(e) => {
          setNewMessage(e.target.value);
          handleTyping();
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage();
          }
        }}
      />
      <button onClick={handleSendMessage}>Enviar</button>
    </div>
  );
}

export default ChatPage;
```

---

## 📝 **Resumo dos Endpoints**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/messages` | Enviar mensagem |
| `GET` | `/messages/conversation/:friendId` | Buscar histórico |
| `PUT` | `/messages/read/:senderId` | Marcar como lida |
| `GET` | `/messages/unread/count` | Contar não lidas |

---

## 🔌 **Resumo dos Eventos Socket.io**

| Evento | Direção | Descrição |
|--------|---------|-----------|
| `connect` | Server → Client | Conectado ao chat |
| `new_message` | Server → Client | Nova mensagem recebida |
| `messages_read` | Server → Client | Mensagens foram lidas |
| `typing` | Client ↔ Server | Indicador de digitação |
| `connected` | Server → Client | Confirmação de conexão |

---

## 🎉 **Pronto!**

Agora você sabe como integrar o frontend com o sistema de mensagens! 🚀

