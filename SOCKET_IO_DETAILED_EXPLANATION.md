# 🔌 Explicação Detalhada do Socket.io - Parte por Parte

## 📋 Índice

1. [Guarda de Autenticação JWT](#1-guarda-de-autenticação-jwt)
2. [Gateway WebSocket](#2-gateway-websocket)
3. [Módulo WebSocket](#3-módulo-websocket)
4. [Integração com Use Cases](#4-integração-com-use-cases)
5. [Fluxo Completo](#5-fluxo-completo)

---

## 1. Guarda de Autenticação JWT

### 📁 Arquivo: `src/infrastructure/guards/ws-jwt.guard.ts`

### 🎯 O que é?
Um **Guard** do NestJS que autentica conexões WebSocket usando JWT. Diferente de HTTP, WebSockets não usam headers HTTP padrão, então precisamos de um guard customizado.

### 📝 Código Explicado:

```typescript
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
```

**O que faz:**
- `@Injectable()` - Permite que o NestJS injete dependências
- `implements CanActivate` - Interface do NestJS para guards
- Injeta `JwtService` para validar tokens

---

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const client: Socket = context.switchToWs().getClient();
  const token = this.extractTokenFromHeader(client);
```

**O que faz:**
- `context.switchToWs()` - Muda o contexto de HTTP para WebSocket
- `getClient()` - Obtém o objeto Socket do cliente conectado
- `extractTokenFromHeader()` - Extrai o token JWT do header

**Por quê:** WebSockets não são HTTP, então precisamos acessar o socket diretamente.

---

```typescript
if (!token) {
  throw new UnauthorizedException('Token não fornecido');
}
```

**O que faz:** Rejeita a conexão se não houver token.

---

```typescript
try {
  const config = JwtConfiguration.loadFromEnv();
  const payload = this.jwtService.verify(token, { secret: config.secret });
  
  // Adicionar payload ao socket para uso posterior
  client.data.user = payload;
  return true;
} catch {
  throw new UnauthorizedException('Token inválido');
}
```

**O que faz:**
1. Carrega configuração JWT do ambiente
2. Verifica se o token é válido usando `jwtService.verify()`
3. **IMPORTANTE:** Adiciona o payload do token em `client.data.user`
4. Retorna `true` se válido, `false` se inválido

**Por quê:** O `client.data.user` será usado depois para identificar qual usuário está conectado.

---

```typescript
private extractTokenFromHeader(client: Socket): string | undefined {
  const authHeader = client.handshake.headers.authorization;
  if (!authHeader) {
    return undefined;
  }

  const [type, token] = authHeader.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
}
```

**O que faz:**
- Acessa `client.handshake.headers` - Headers HTTP da conexão inicial
- Procura por `Authorization: Bearer <token>`
- Extrai apenas o token (sem "Bearer")

**Por quê:** O cliente envia o token no header `Authorization` durante o handshake inicial.

---

## 2. Gateway WebSocket

### 📁 Arquivo: `src/infrastructure/websockets/notifications.gateway.ts`

### 🎯 O que é?
O **Gateway** é o coração do sistema WebSocket. Ele gerencia todas as conexões, autentica usuários e envia notificações.

### 📝 Código Explicado:

```typescript
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://prisma-frontend-rose.vercel.app',
      // ... outros domínios
    ],
    credentials: true,
  },
  namespace: '/notifications',
})
```

**O que faz:**
- `@WebSocketGateway` - Decorator do NestJS que transforma a classe em um gateway WebSocket
- `cors.origin` - Lista de domínios permitidos para conectar
- `credentials: true` - Permite enviar cookies/headers de autenticação
- `namespace: '/notifications'` - Cria um namespace isolado

**Por quê:** 
- CORS protege contra conexões não autorizadas
- Namespace permite múltiplos gateways na mesma aplicação
- URL final: `ws://servidor/notifications`

---

```typescript
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // userId -> socketId
```

**O que faz:**
- `implements OnGatewayConnection` - Interface para quando cliente conecta
- `implements OnGatewayDisconnect` - Interface para quando cliente desconecta
- `@WebSocketServer()` - Injeta o servidor Socket.io
- `connectedUsers` - **Mapa que relaciona userId com socketId**

**Por quê:** 
- O `Map` permite encontrar rapidamente qual socket pertence a qual usuário
- Exemplo: `connectedUsers.get('user-123')` retorna `'socket-abc'`

---

```typescript
constructor(private readonly wsJwtGuard: WsJwtGuard) {}
```

**O que faz:** Injeta o guard de autenticação.

**Por quê:** Precisamos autenticar na conexão.

---

```typescript
async handleConnection(@ConnectedSocket() client: Socket) {
  try {
    // Autenticar usando o guard
    const canActivate = await this.wsJwtGuard.canActivate({
      switchToWs: () => ({
        getClient: () => client,
      }),
      getClass: () => NotificationsGateway,
      getHandler: () => this.handleConnection,
    } as any);
```

**O que faz:**
- `handleConnection` - Chamado automaticamente quando um cliente tenta conectar
- `@ConnectedSocket()` - Decorator que injeta o socket do cliente
- Cria um contexto fake para o guard validar

**Por quê:** O guard espera um `ExecutionContext`, então criamos um objeto que simula isso.

---

```typescript
if (!canActivate) {
  client.disconnect();
  return;
}
```

**O que faz:** Se autenticação falhar, desconecta o cliente.

---

```typescript
const user = client.data.user as JwtPayload;
if (user && user.sub) {
  this.connectedUsers.set(user.sub, client.id);
  this.logger.log(`Usuário conectado: ${user.sub} (socket: ${client.id})`);
  
  // Notificar o cliente que está conectado
  client.emit('connected', { userId: user.sub });
}
```

**O que faz:**
1. Pega o usuário do `client.data.user` (colocado pelo guard)
2. `user.sub` é o ID do usuário (do JWT)
3. **Salva no mapa:** `connectedUsers.set(userId, socketId)`
4. Loga a conexão
5. **Envia evento `connected`** para o cliente confirmar

**Por quê:** 
- O mapa permite encontrar o socket de um usuário depois
- O evento `connected` confirma para o frontend que está autenticado

---

```typescript
async handleDisconnect(@ConnectedSocket() client: Socket) {
  const user = client.data.user as JwtPayload;
  if (user && user.sub) {
    this.connectedUsers.delete(user.sub);
    this.logger.log(`Usuário desconectado: ${user.sub}`);
  }
}
```

**O que faz:**
- Chamado quando cliente desconecta
- Remove do mapa `connectedUsers`
- Loga a desconexão

**Por quê:** Limpa o mapa para não tentar enviar notificações para usuários offline.

---

```typescript
@SubscribeMessage('ping')
handlePing(@ConnectedSocket() client: Socket) {
  return { event: 'pong', data: { timestamp: new Date().toISOString() } };
}
```

**O que faz:**
- `@SubscribeMessage('ping')` - Escuta eventos `ping` do cliente
- Retorna `pong` com timestamp

**Por quê:** Permite testar se a conexão está funcionando.

**Uso no frontend:**
```javascript
socket.emit('ping');
socket.on('pong', (data) => console.log(data));
```

---

```typescript
// Método público para emitir notificações
emitToUser(userId: string, event: string, data: any) {
  const socketId = this.connectedUsers.get(userId);
  if (socketId) {
    this.server.to(socketId).emit(event, data);
    this.logger.log(`Notificação enviada para usuário ${userId}: ${event}`);
    return true;
  }
  this.logger.warn(`Usuário ${userId} não está conectado`);
  return false;
}
```

**O que faz:**
1. **Busca o socketId** do usuário no mapa
2. Se encontrou (`socketId` existe):
   - `this.server.to(socketId)` - Seleciona o socket específico
   - `.emit(event, data)` - Envia o evento com os dados
3. Se não encontrou, loga aviso e retorna `false`

**Por quê:** 
- Este é o método principal usado pelos use cases
- Permite enviar notificações para usuários específicos
- Retorna `false` se usuário estiver offline (notificação fica no banco)

**Exemplo de uso:**
```typescript
gateway.emitToUser('user-123', 'friend_request', {
  message: 'Você recebeu um pedido de amizade'
});
```

---

```typescript
// Método para verificar se usuário está online
isUserOnline(userId: string): boolean {
  return this.connectedUsers.has(userId);
}
```

**O que faz:** Verifica se um usuário está no mapa (online).

**Por quê:** Pode ser útil para mostrar status "online" no frontend.

---

## 3. Módulo WebSocket

### 📁 Arquivo: `src/infrastructure/websockets/websockets.module.ts`

### 📝 Código Explicado:

```typescript
@Module({
  imports: [AuthModule],
  providers: [NotificationsGateway, WsJwtGuard],
  exports: [NotificationsGateway],
})
export class WebSocketsModule {}
```

**O que faz:**
- `imports: [AuthModule]` - Importa AuthModule para usar `JwtService`
- `providers` - Registra o gateway e o guard
- `exports: [NotificationsGateway]` - **Exporta o gateway** para outros módulos usarem

**Por quê:** 
- Outros módulos (como `FriendshipsModule`) precisam injetar o `NotificationsGateway`
- O export permite que seja injetado via `@Optional()` ou `@Inject()`

---

## 4. Integração com Use Cases

### 📁 Arquivos:
- `src/application/friendships/use-cases/send-friend-request.use-case.ts`
- `src/application/friendships/use-cases/accept-friend-request.use-case.ts`
- `src/application/friendships/use-cases/reject-friend-request.use-case.ts`

### 🎯 Como funciona?

#### Passo 1: Injetar o Gateway (Opcional)

```typescript
constructor(
  // ... outros repositórios
  @Optional()
  private readonly notificationsGateway?: NotificationsGateway,
) {}
```

**O que faz:**
- `@Optional()` - Torna a injeção opcional (não quebra se não existir)
- `?` - TypeScript indica que pode ser `undefined`

**Por quê:** 
- Se o WebSocket não estiver configurado, o sistema ainda funciona
- Notificações são salvas no banco mesmo sem WebSocket

---

#### Passo 2: Enviar Notificação em Tempo Real

**Exemplo: Enviar Pedido de Amizade**

```typescript
// Criar notificação no banco
const notification = await this.notificationRepository.create(
  receiverId,
  NotificationType.FRIEND_REQUEST,
  'Novo pedido de amizade',
  `${requester.name} enviou um pedido de amizade para você`,
  requesterId,
  friendRequest.id,
);

// Enviar notificação em tempo real via WebSocket
if (this.notificationsGateway) {
  this.notificationsGateway.emitToUser(receiverId, 'friend_request', {
    id: notification.id,
    type: NotificationType.FRIEND_REQUEST,
    title: notification.title,
    message: notification.message,
    relatedUserId: requesterId,
    relatedEntityId: friendRequest.id,
    requester: {
      id: requester.id,
      name: requester.name,
      profileImage: requester.profileImage,
    },
    createdAt: notification.createdAt,
  });
}
```

**O que faz:**
1. **Primeiro:** Salva notificação no banco (para usuários offline)
2. **Depois:** Se gateway existe, envia em tempo real
3. **Dados enviados:** Informações completas da notificação + dados do usuário

**Por quê:** 
- Banco = persistência (usuário vê depois)
- WebSocket = instantâneo (usuário vê agora)

---

**Exemplo: Aceitar Pedido**

```typescript
// Criar notificação para o requester
const notification = await this.notificationRepository.create(
  friendRequest.requesterId,
  NotificationType.FRIEND_ACCEPTED,
  'Pedido de amizade aceito',
  `${receiver.name} aceitou seu pedido de amizade`,
  friendRequest.receiverId,
  friendship.id,
);

// Enviar notificação em tempo real
if (this.notificationsGateway) {
  this.notificationsGateway.emitToUser(friendRequest.requesterId, 'friend_accepted', {
    // ... dados completos
  });
}
```

**O que faz:** Notifica quem **enviou** o pedido que foi aceito.

---

**Exemplo: Rejeitar Pedido**

```typescript
// Enviar notificação em tempo real para o requester
if (this.notificationsGateway && receiver) {
  this.notificationsGateway.emitToUser(friendRequest.requesterId, 'friend_request_rejected', {
    friendRequestId: friendRequest.id,
    receiverId: friendRequest.receiverId,
    receiver: {
      id: receiver.id,
      name: receiver.name,
      profileImage: receiver.profileImage,
    },
    rejectedAt: new Date(),
  });
}
```

**O que faz:** Notifica quem **enviou** o pedido que foi rejeitado.

**Nota:** Não salva no banco porque rejeição não precisa de histórico.

---

## 5. Fluxo Completo

### 🔄 Cenário: Usuário A envia pedido para Usuário B

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend (Usuário A)                                     │
│    POST /friendships/requests { receiverId: "user-b" }     │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. FriendshipsController                                     │
│    - Recebe requisição                                       │
│    - Chama SendFriendRequestUseCase                         │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SendFriendRequestUseCase                                 │
│    - Validações (não é si mesmo, não está bloqueado, etc)  │
│    - Cria pedido no banco (friend_requests)                 │
│    - Cria notificação no banco (notifications)              │
│    - Chama notificationsGateway.emitToUser()                │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. NotificationsGateway.emitToUser()                        │
│    - Busca socketId no mapa: connectedUsers.get("user-b")  │
│    - Se encontrou:                                          │
│      • this.server.to(socketId).emit('friend_request', ...)│
│    - Se não encontrou:                                      │
│      • Loga aviso (usuário offline)                         │
│      • Notificação fica no banco                            │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend (Usuário B) - Se estiver online                 │
│    socket.on('friend_request', (data) => {                 │
│      // Mostrar notificação na UI                           │
│      showNotification(data);                                │
│    });                                                      │
└─────────────────────────────────────────────────────────────┘
```

---

### 🔄 Cenário: Usuário B está offline

```
1. Pedido é enviado
2. Notificação é salva no banco ✅
3. Gateway tenta enviar, mas usuário não está no mapa
4. Gateway retorna false (usuário offline)
5. Quando Usuário B conectar:
   - Conecta ao WebSocket
   - Busca notificações: GET /users/notifications
   - Recebe todas as notificações não lidas
```

---

## 🎯 Pontos Importantes

### 1. **Mapa de Usuários Conectados**
```typescript
connectedUsers: Map<userId, socketId>
```
- Permite encontrar rapidamente qual socket pertence a qual usuário
- Atualizado na conexão/desconexão

### 2. **Autenticação na Conexão**
- Token JWT é validado **uma vez** na conexão
- Payload é salvo em `client.data.user`
- Não precisa validar a cada mensagem

### 3. **Notificações Duplas**
- **Banco:** Para persistência (usuários offline)
- **WebSocket:** Para tempo real (usuários online)
- Se WebSocket falhar, notificação ainda está no banco

### 4. **Injeção Opcional**
- `@Optional()` permite que sistema funcione sem WebSocket
- Útil para desenvolvimento ou se WebSocket não estiver configurado

### 5. **Namespace Isolado**
- `/notifications` cria um namespace separado
- Permite ter múltiplos gateways na mesma aplicação
- URL: `ws://servidor/notifications`

---

## 📊 Estrutura de Dados

### Mapa de Usuários Conectados
```typescript
connectedUsers = {
  "user-123" => "socket-abc",
  "user-456" => "socket-def",
  "user-789" => "socket-ghi"
}
```

### Eventos Enviados

**friend_request:**
```json
{
  "id": "notification-id",
  "type": "FRIEND_REQUEST",
  "title": "Novo pedido de amizade",
  "message": "João enviou um pedido de amizade para você",
  "relatedUserId": "requester-id",
  "relatedEntityId": "friend-request-id",
  "requester": {
    "id": "requester-id",
    "name": "João Silva",
    "profileImage": "https://..."
  },
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**friend_accepted:**
```json
{
  "id": "notification-id",
  "type": "FRIEND_ACCEPTED",
  "title": "Pedido de amizade aceito",
  "message": "Maria aceitou seu pedido de amizade",
  "relatedUserId": "receiver-id",
  "relatedEntityId": "friendship-id",
  "receiver": { ... },
  "friendship": { ... },
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**friend_request_rejected:**
```json
{
  "friendRequestId": "friend-request-id",
  "receiverId": "receiver-id",
  "receiver": { ... },
  "rejectedAt": "2025-01-01T00:00:00.000Z"
}
```

---

## 🔍 Resumo

1. **Guard (`WsJwtGuard`):** Autentica conexões WebSocket usando JWT
2. **Gateway (`NotificationsGateway`):** Gerencia conexões e envia notificações
3. **Módulo (`WebSocketsModule`):** Organiza e exporta componentes WebSocket
4. **Use Cases:** Integram com gateway para enviar notificações em tempo real
5. **Fluxo:** Cliente conecta → Autentica → Salva no mapa → Use case emite → Gateway envia

**Resultado:** Notificações instantâneas quando usuários estão online! 🚀

