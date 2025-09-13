# Sistema de Notificações e Badges

Este documento descreve o sistema de notificações e badges implementado na plataforma Prisma.

## Funcionalidades

### 1. Sistema de Notificações

- O sistema verifica automaticamente se o usuário tem informações pendentes no perfil
- Quando há campos obrigatórios vazios, uma notificação é exibida no frontend
- A notificação inclui uma mensagem personalizada indicando quais campos estão faltando

### 2. Sistema de Badges

- Usuários recebem badges baseados no seu foco de estudo:
  - **ENEM**: Badge "ENEM_BADGE"
  - **CONCURSO**: Badge específico do concurso (ex: "PRF_BADGE", "ESA_BADGE")
  - **FACULDADE**: Badge específico do curso (ex: "MEDICINA_BADGE", "DIREITO_BADGE")
  - **ENSINO_MEDIO**: Badge "ENSINO_MEDIO_BADGE"

### 3. Campos Obrigatórios

- **Básicos**: idade, nível de educação, foco de estudo
- **Específicos por foco**:
  - CONCURSO: tipo de concurso
  - FACULDADE: curso de faculdade

## Endpoints Disponíveis

### 1. Verificar Notificações

```
GET /profile/notifications
Authorization: Bearer <token>
```

**Resposta:**

```json
{
  "hasNotification": true,
  "missingFields": ["idade", "foco de estudo"],
  "message": "Complete seu perfil adicionando sua idade e foco de estudo.",
  "badge": "ENEM_BADGE"
}
```

### 2. Atualizar Perfil

```
PUT /profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "João Silva",
  "age": 25,
  "educationLevel": "HIGH_SCHOOL",
  "userFocus": "ENEM",
  "contestType": "PRF",
  "collegeCourse": "MEDICINA"
}
```

**Resposta:**

```json
{
  "success": true,
  "message": "Perfil atualizado com sucesso",
  "badge": "ENEM_BADGE",
  "hasNotification": false,
  "missingFields": []
}
```

### 3. Listar Concursos Disponíveis

```
GET /options/contests
```

**Resposta:**

```json
{
  "contests": [
    {
      "value": "PRF",
      "label": "PRF - Polícia Rodoviária Federal",
      "description": "Concurso para Polícia Rodoviária Federal"
    },
    {
      "value": "ESA",
      "label": "ESA - Escola de Sargentos das Armas",
      "description": "Concurso para Escola de Sargentos das Armas"
    }
  ]
}
```

### 4. Listar Cursos de Faculdade

```
GET /options/college-courses
```

**Resposta:**

```json
{
  "courses": [
    {
      "value": "MEDICINA",
      "label": "Medicina",
      "description": "Curso de Medicina"
    },
    {
      "value": "DIREITO",
      "label": "Direito",
      "description": "Curso de Direito"
    }
  ]
}
```

### 5. Login com Notificações

```
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Resposta:**

```json
{
  "accessToken": "jwt_token_aqui",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "usuario@email.com",
    "role": "STUDENT"
  },
  "notification": {
    "hasNotification": true,
    "missingFields": ["idade", "foco de estudo"],
    "message": "Complete seu perfil adicionando sua idade e foco de estudo.",
    "badge": null
  }
}
```

## Enums Disponíveis

### UserFocus

- `ENEM`
- `CONCURSO`
- `ENSINO_MEDIO`
- `FACULDADE`

### ContestType

- `PRF`, `ESA`, `DATAPREV`, `POLICIA_CIVIL`, `POLICIA_MILITAR`, `BOMBEIROS`
- `TJ`, `MP`, `TRF`, `TRE`, `TRT`, `INSS`, `IBGE`
- `ANAC`, `ANATEL`, `BACEN`, `CVM`, `SUSEP`, `PREVIC`
- `OUTROS`

### CollegeCourse

- `MEDICINA`, `ENGENHARIA`, `DIREITO`, `ADMINISTRACAO`, `CONTABILIDADE`
- `PSICOLOGIA`, `PEDAGOGIA`, `ENFERMAGEM`, `FARMACIA`, `FISIOTERAPIA`
- `ODONTOLOGIA`, `VETERINARIA`, `ARQUITETURA`, `CIENCIA_COMPUTACAO`
- `SISTEMAS_INFORMACAO`, `JORNALISMO`, `PUBLICIDADE`, `MARKETING`
- `ECONOMIA`, `RELACOES_INTERNACIONAIS`, `OUTROS`

## Migração do Banco de Dados

Para aplicar as mudanças no banco de dados, execute:

```bash
npx drizzle-kit push
```

## Como Usar no Frontend

1. **Verificar notificações**: Após o login, verifique o campo `notification.hasNotification`
2. **Exibir notificação**: Se `hasNotification` for `true`, exiba o ícone de notificação pulsando
3. **Mostrar mensagem**: Use o campo `notification.message` para exibir a mensagem de notificação
4. **Atualizar perfil**: Use o endpoint `PUT /profile` para atualizar as informações do usuário
5. **Exibir badge**: Use o campo `badge` para exibir a insígnia do usuário

## Exemplo de Implementação no Frontend

```typescript
// Verificar se há notificação após login
if (loginResponse.notification.hasNotification) {
  // Exibir ícone de notificação pulsando
  showNotificationIcon(true);
  
  // Exibir mensagem de notificação
  showNotificationMessage(loginResponse.notification.message);
  
  // Redirecionar para página de perfil
  redirectToProfile();
}

// Exibir badge do usuário
if (loginResponse.notification.badge) {
  displayUserBadge(loginResponse.notification.badge);
}
```
