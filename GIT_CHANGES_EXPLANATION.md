# 📋 Explicação dos Arquivos Criados/Modificados - Sistema de Amizades e Notificações em Tempo Real

## 🎯 Visão Geral

Este documento explica cada arquivo criado ou modificado para implementar:
1. Sistema de pedidos de amizade
2. Sistema de bloqueios
3. Sistema de notificações
4. Notificações em tempo real com Socket.io

---

## 📦 Arquivos de Configuração e Dependências

### `package.json` (MODIFICADO)
**O que foi feito:** Adicionadas dependências do Socket.io

**Mudanças:**
- `socket.io` - Biblioteca principal do Socket.io
- `@nestjs/websockets` - Módulo NestJS para WebSockets
- `@nestjs/platform-socket.io` - Adaptador Socket.io para NestJS

**Por quê:** Essas dependências são necessárias para implementar comunicação em tempo real via WebSocket.

---

## 🗄️ Banco de Dados (Schema e Migrações)

### `src/infrastructure/database/schema.ts` (MODIFICADO)
**O que foi feito:** Adicionadas 4 novas tabelas ao schema do banco de dados

**Tabelas adicionadas:**
1. **`friend_requests`** - Armazena pedidos de amizade
   - `requesterId` - Quem enviou o pedido
   - `receiverId` - Quem recebeu o pedido
   - `status` - PENDING, ACCEPTED, REJECTED

2. **`friendships`** - Armazena amizades estabelecidas
   - `userId1` e `userId2` - Os dois amigos
   - Ordenado para evitar duplicatas (userId1 < userId2)

3. **`blocks`** - Armazena bloqueios entre usuários
   - `blockerId` - Quem bloqueou
   - `blockedId` - Quem foi bloqueado

4. **`notifications`** - Armazena notificações do sistema
   - `type` - Tipo da notificação (FRIEND_REQUEST, FRIEND_ACCEPTED)
   - `title` e `message` - Conteúdo da notificação
   - `isRead` - Se foi lida ou não
   - `relatedUserId` - Usuário relacionado (quem enviou pedido, etc)
   - `relatedEntityId` - ID de outra entidade (pedido de amizade, etc)

**Enums adicionados:**
- `friendRequestStatusEnum` - Status dos pedidos
- `notificationTypeEnum` - Tipos de notificações

**Por quê:** Precisamos persistir essas informações no banco de dados para que:
- Notificações sejam salvas mesmo se o usuário estiver offline
- Histórico de pedidos e amizades seja mantido
- Bloqueios sejam aplicados corretamente

### `drizzle/0014_shallow_maginty.sql` (NOVO)
**O que é:** Migração SQL gerada automaticamente pelo Drizzle

**O que faz:** Cria as tabelas, índices e constraints no banco de dados

**Por quê:** O Drizzle gera automaticamente este arquivo quando detecta mudanças no schema.

### `drizzle/meta/0014_snapshot.json` (NOVO)
**O que é:** Snapshot do estado do schema para o Drizzle

**O que faz:** Armazena o estado atual do schema para comparações futuras

**Por quê:** Permite ao Drizzle detectar mudanças e gerar migrações.

### `drizzle/meta/_journal.json` (MODIFICADO)
**O que foi feito:** Adicionada entrada da nova migração

**Por quê:** O journal mantém histórico de todas as migrações aplicadas.

---

## 🏗️ Arquitetura de Domínio (Entidades e Enums)

### `src/domain/enums/friend-request-status.ts` (NOVO)
**O que é:** Enum para status de pedidos de amizade

**Valores:**
- `PENDING` - Aguardando resposta
- `ACCEPTED` - Aceito
- `REJECTED` - Rejeitado

**Por quê:** Garante que apenas valores válidos sejam usados, evitando erros.

### `src/domain/enums/notification-type.ts` (NOVO)
**O que é:** Enum para tipos de notificações

**Valores:**
- `FRIEND_REQUEST` - Novo pedido de amizade
- `FRIEND_ACCEPTED` - Pedido aceito

**Por quê:** Facilita identificar o tipo de notificação e permite adicionar novos tipos no futuro.

### `src/domain/entities/friend-request.ts` (NOVO)
**O que é:** Entidade que representa um pedido de amizade

**Propriedades:**
- `id` - Identificador único
- `requesterId` - Quem enviou
- `receiverId` - Quem recebeu
- `status` - Status atual
- `createdAt` / `updatedAt` - Timestamps

**Por quê:** Representa o conceito de "pedido de amizade" no domínio da aplicação.

### `src/domain/entities/friendship.ts` (NOVO)
**O que é:** Entidade que representa uma amizade estabelecida

**Propriedades:**
- `id` - Identificador único
- `userId1` e `userId2` - Os dois amigos
- `createdAt` - Quando a amizade foi criada

**Por quê:** Representa o relacionamento de amizade entre dois usuários.

### `src/domain/entities/block.ts` (NOVO)
**O que é:** Entidade que representa um bloqueio

**Propriedades:**
- `id` - Identificador único
- `blockerId` - Quem bloqueou
- `blockedId` - Quem foi bloqueado
- `createdAt` - Quando foi bloqueado

**Por quê:** Permite que usuários bloqueiem outros, impedindo interações.

### `src/domain/entities/notification.ts` (NOVO)
**O que é:** Entidade que representa uma notificação

**Propriedades:**
- `id` - Identificador único
- `userId` - Usuário que recebe a notificação
- `type` - Tipo da notificação
- `title` e `message` - Conteúdo
- `isRead` - Se foi lida
- `relatedUserId` / `relatedEntityId` - Referências a outras entidades
- `createdAt` - Quando foi criada

**Por quê:** Centraliza todas as notificações do sistema em uma única entidade.

---

## 🔌 Repositórios (Interfaces e Implementações)

### `src/domain/repositories/friend-request.repository.ts` (NOVO)
**O que é:** Interface do repositório de pedidos de amizade

**Métodos principais:**
- `create()` - Criar novo pedido
- `findById()` - Buscar por ID
- `findByRequesterAndReceiver()` - Buscar pedido entre dois usuários
- `findByReceiverId()` - Buscar pedidos recebidos
- `findByRequesterId()` - Buscar pedidos enviados
- `updateStatus()` - Atualizar status
- `delete()` - Deletar pedido

**Por quê:** Define o contrato de como acessar dados de pedidos de amizade, seguindo o padrão Repository.

### `src/infrastructure/repositories/friend-request.drizzle.repository.ts` (NOVO)
**O que é:** Implementação do repositório usando Drizzle ORM

**O que faz:** Implementa todos os métodos da interface usando queries SQL através do Drizzle.

**Por quê:** Separa a lógica de acesso a dados da lógica de negócio, facilitando testes e manutenção.

### `src/domain/repositories/friendship.repository.ts` (NOVO)
**O que é:** Interface do repositório de amizades

**Métodos principais:**
- `create()` - Criar amizade (garante userId1 < userId2)
- `findByUsers()` - Verificar se dois usuários são amigos
- `findByUserId()` - Buscar todas as amizades de um usuário
- `delete()` - Remover amizade

**Por quê:** Define como acessar dados de amizades.

### `src/infrastructure/repositories/friendship.drizzle.repository.ts` (NOVO)
**O que é:** Implementação do repositório de amizades

**Destaque:** Garante que `userId1 < userId2` para evitar duplicatas.

**Por quê:** Evita ter duas linhas para a mesma amizade (A-B e B-A).

### `src/domain/repositories/block.repository.ts` (NOVO)
**O que é:** Interface do repositório de bloqueios

**Métodos principais:**
- `create()` - Criar bloqueio
- `findByBlockerAndBlocked()` - Verificar se existe bloqueio
- `findByBlockerId()` - Buscar quem um usuário bloqueou
- `findByBlockedId()` - Buscar quem bloqueou um usuário
- `delete()` - Remover bloqueio

**Por quê:** Define como acessar dados de bloqueios.

### `src/infrastructure/repositories/block.drizzle.repository.ts` (NOVO)
**O que é:** Implementação do repositório de bloqueios

**Por quê:** Implementa a interface usando Drizzle ORM.

### `src/domain/repositories/notification.repository.ts` (NOVO)
**O que é:** Interface do repositório de notificações

**Métodos principais:**
- `create()` - Criar notificação
- `findByUserId()` - Buscar notificações de um usuário
- `markAsRead()` - Marcar como lida
- `markAllAsRead()` - Marcar todas como lidas
- `delete()` - Deletar notificação

**Por quê:** Define como acessar dados de notificações.

### `src/infrastructure/repositories/notification.drizzle.repository.ts` (NOVO)
**O que é:** Implementação do repositório de notificações

**Por quê:** Implementa a interface usando Drizzle ORM.

---

## 🔑 Tokens de Injeção de Dependência

### `src/domain/tokens.ts` (MODIFICADO)
**O que foi feito:** Adicionados 4 novos tokens para injeção de dependência

**Tokens adicionados:**
- `FRIEND_REQUEST_REPOSITORY`
- `FRIENDSHIP_REPOSITORY`
- `BLOCK_REPOSITORY`
- `NOTIFICATION_REPOSITORY`

**Por quê:** O NestJS usa tokens para identificar qual implementação injetar. Isso permite trocar implementações facilmente.

---

## 🏭 Módulos de Infraestrutura

### `src/infrastructure/config/infrastructure.module.ts` (MODIFICADO)
**O que foi feito:** Registrados os novos repositórios no módulo de infraestrutura

**Mudanças:**
- Importados os novos repositórios Drizzle
- Criados providers para cada repositório
- Exportados os repositórios para uso em outros módulos

**Por quê:** O módulo de infraestrutura centraliza todos os repositórios e serviços de baixo nível, permitindo que sejam injetados em qualquer lugar.

---

## 🎯 Use Cases (Lógica de Negócio)

### `src/application/friendships/use-cases/send-friend-request.use-case.ts` (NOVO)
**O que faz:** Lógica para enviar um pedido de amizade

**Validações:**
- Não pode enviar para si mesmo
- Verifica se usuário existe
- Verifica se está bloqueado
- Verifica se já são amigos
- Verifica se já existe pedido pendente

**Ações:**
- Cria pedido no banco
- Cria notificação no banco
- **Envia notificação em tempo real via WebSocket** (se usuário estiver online)

**Por quê:** Centraliza toda a lógica de negócio em um único lugar, facilitando testes e manutenção.

### `src/application/friendships/use-cases/accept-friend-request.use-case.ts` (NOVO)
**O que faz:** Lógica para aceitar um pedido de amizade

**Validações:**
- Verifica se pedido existe
- Verifica se usuário tem permissão
- Verifica se pedido está pendente
- Verifica se já são amigos

**Ações:**
- Cria amizade no banco
- Atualiza status do pedido para ACCEPTED
- Cria notificação para quem enviou
- **Envia notificação em tempo real via WebSocket**

**Por quê:** Garante que todas as regras de negócio sejam seguidas ao aceitar um pedido.

### `src/application/friendships/use-cases/reject-friend-request.use-case.ts` (NOVO)
**O que faz:** Lógica para rejeitar um pedido de amizade

**Validações:**
- Verifica se pedido existe
- Verifica se usuário tem permissão
- Verifica se pedido está pendente

**Ações:**
- Atualiza status para REJECTED
- **Envia notificação em tempo real via WebSocket** para quem enviou

**Por quê:** Permite que usuários rejeitem pedidos de forma controlada.

### `src/application/friendships/use-cases/block-user.use-case.ts` (NOVO)
**O que faz:** Lógica para bloquear um usuário

**Validações:**
- Não pode bloquear a si mesmo
- Verifica se usuário existe
- Verifica se já está bloqueado

**Ações:**
- Remove amizade se existir
- Rejeita pedidos pendentes
- Cria bloqueio no banco

**Por quê:** Implementa a funcionalidade de bloqueio com todas as regras necessárias.

### `src/application/friendships/use-cases/unblock-user.use-case.ts` (NOVO)
**O que faz:** Lógica para desbloquear um usuário

**Por quê:** Permite reverter um bloqueio.

### `src/application/friendships/use-cases/list-friends.use-case.ts` (NOVO)
**O que faz:** Lista todos os amigos de um usuário com paginação

**Por quê:** Permite visualizar a lista de amigos de forma eficiente.

### `src/application/friendships/use-cases/list-friend-requests.use-case.ts` (NOVO)
**O que faz:** Lista pedidos de amizade (enviados ou recebidos)

**Por quê:** Permite visualizar pedidos pendentes.

### `src/application/use-cases/list-notifications.use-case.ts` (NOVO)
**O que faz:** Lista notificações de um usuário com paginação

**Funcionalidades:**
- Filtra por lidas/não lidas
- Conta notificações não lidas
- Ordena por data (mais recentes primeiro)

**Por quê:** Permite que usuários vejam suas notificações.

### `src/application/friendships/friendships.module.ts` (NOVO)
**O que é:** Módulo NestJS que agrupa todos os use cases de amizades

**O que faz:**
- Importa dependências necessárias
- Registra todos os use cases
- Exporta use cases para uso em controllers

**Por quê:** Organiza o código em módulos, facilitando manutenção e testes.

---

## 🌐 WebSocket (Notificações em Tempo Real)

### `src/infrastructure/guards/ws-jwt.guard.ts` (NOVO)
**O que é:** Guard para autenticação JWT em WebSockets

**O que faz:**
- Extrai token do header `Authorization`
- Valida token usando JwtService
- Adiciona dados do usuário ao socket (`client.data.user`)

**Por quê:** WebSockets não usam HTTP padrão, então precisamos de um guard customizado para autenticação.

### `src/infrastructure/websockets/notifications.gateway.ts` (NOVO)
**O que é:** Gateway WebSocket principal

**Funcionalidades:**
- Gerencia conexões WebSocket
- Autentica usuários na conexão
- Mantém mapa de usuários online (`connectedUsers`)
- Emite notificações para usuários específicos
- Evento `ping` para testar conexão

**Métodos principais:**
- `handleConnection()` - Quando usuário conecta
- `handleDisconnect()` - Quando usuário desconecta
- `emitToUser()` - Envia notificação para usuário específico
- `isUserOnline()` - Verifica se usuário está online

**Por quê:** Centraliza toda a lógica de WebSocket em um único lugar.

### `src/infrastructure/websockets/websockets.module.ts` (NOVO)
**O que é:** Módulo NestJS para WebSockets

**O que faz:**
- Registra o `NotificationsGateway`
- Registra o `WsJwtGuard`
- Importa `AuthModule` para usar JwtService

**Por quê:** Organiza componentes WebSocket em um módulo separado.

---

## 🎮 Controllers (Endpoints HTTP)

### `src/presentation/http/controllers/friendships.controller.ts` (NOVO)
**O que é:** Controller REST para operações de amizade

**Endpoints:**
- `POST /friendships/requests` - Enviar pedido
- `POST /friendships/requests/:id/accept` - Aceitar pedido
- `POST /friendships/requests/:id/reject` - Rejeitar pedido
- `GET /friendships/requests` - Listar pedidos
- `GET /friendships` - Listar amigos
- `POST /friendships/block` - Bloquear usuário
- `DELETE /friendships/block/:blockedId` - Desbloquear usuário

**Por quê:** Expõe as funcionalidades via API REST, além das notificações em tempo real.

### `src/presentation/http/controllers/user.controller.ts` (MODIFICADO)
**O que foi feito:** Adicionados endpoints de notificações

**Endpoints adicionados:**
- `GET /users/notifications` - Listar notificações
- `PUT /users/notifications/:id/read` - Marcar como lida
- `PUT /users/notifications/read-all` - Marcar todas como lidas

**Por quê:** Permite que usuários vejam e gerenciem notificações via API REST.

---

## 🔧 Módulos de Apresentação

### `src/presentation/presentation.module.ts` (MODIFICADO)
**O que foi feito:** Adicionado `FriendshipsModule` aos imports

**Por quê:** Permite que o controller de amizades use os use cases.

### `src/application/application.module.ts` (MODIFICADO)
**O que foi feito:** Adicionado `ListNotificationsUseCase` aos providers e exports

**Por quê:** Permite que o controller de usuários use o use case de notificações.

---

## 📚 Documentação

### `SOCKET_IO_NOTIFICATIONS.md` (NOVO)
**O que é:** Documentação completa de como usar Socket.io no frontend

**Conteúdo:**
- Como conectar ao WebSocket
- Todos os eventos disponíveis
- Exemplos de código React
- Tratamento de erros

**Por quê:** Facilita a integração do frontend com o sistema de notificações.

---

## 🔄 Fluxo Completo de uma Notificação

1. **Usuário A envia pedido para Usuário B**
   - `SendFriendRequestUseCase` é chamado
   - Pedido é salvo no banco (`friend_requests`)
   - Notificação é salva no banco (`notifications`)
   - `NotificationsGateway.emitToUser()` é chamado
   - Se Usuário B estiver online, recebe `friend_request` instantaneamente

2. **Usuário B aceita o pedido**
   - `AcceptFriendRequestUseCase` é chamado
   - Amizade é criada no banco (`friendships`)
   - Status do pedido é atualizado
   - Notificação é criada para Usuário A
   - `NotificationsGateway.emitToUser()` é chamado
   - Se Usuário A estiver online, recebe `friend_accepted` instantaneamente

3. **Se usuário estiver offline**
   - Notificação é salva no banco
   - Quando conectar, pode buscar via `GET /users/notifications`
   - Quando conectar ao WebSocket, pode receber notificações pendentes (se implementado)

---

## 🎯 Princípios de Arquitetura Seguidos

1. **Clean Architecture** - Separação clara entre domínio, aplicação e infraestrutura
2. **Repository Pattern** - Abstração do acesso a dados
3. **Use Case Pattern** - Lógica de negócio isolada
4. **Dependency Injection** - Facilita testes e manutenção
5. **Single Responsibility** - Cada classe tem uma responsabilidade única

---

## 📝 Resumo

**Total de arquivos:**
- **Novos:** 30 arquivos
- **Modificados:** 8 arquivos

**Funcionalidades implementadas:**
- ✅ Sistema completo de pedidos de amizade
- ✅ Sistema de bloqueios
- ✅ Sistema de notificações persistidas
- ✅ Notificações em tempo real via WebSocket
- ✅ API REST completa
- ✅ Autenticação JWT em WebSockets

