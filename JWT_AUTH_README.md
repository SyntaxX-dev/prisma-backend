# Sistema de Autenticação JWT - Prisma

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```bash
# JWT Configuration
JWT_SECRET=sua-chave-secreta-super-segura-aqui-mude-em-producao
JWT_EXPIRES_IN=24h

# SMTP Configuration (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM_NAME=Prisma
SMTP_FROM_EMAIL=noreply@prisma.com
```

### 2. Instalação das Dependências

As dependências já foram instaladas:

- `@nestjs/jwt` - Para geração e verificação de tokens JWT
- `@nestjs/passport` - Para estratégias de autenticação
- `passport` - Framework de autenticação
- `passport-jwt` - Estratégia JWT para Passport

## Como Usar

### 1. Login

**Endpoint:** `POST /auth/login`

**Body:**

```json
{
  "email": "joao@exemplo.com",
  "password": "minhasenha"
}
```

**Resposta:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "perfil": "ALUNO"
  }
}
```

### 2. Acessar Rota Protegida

**Endpoint:** `GET /auth/profile`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta:**

```json
{
  "id": "uuid-do-usuario",
  "email": "joao@exemplo.com",
  "perfil": "ALUNO"
}
```

## Protegendo Rotas

Para proteger uma rota, use o decorator `@UseGuards(JwtAuthGuard)`:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../infrastructure/auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return user;
  }
}
```

## Obtendo Dados do Usuário

Use o decorator `@CurrentUser()` para obter informações do usuário autenticado:

```typescript
import { CurrentUser } from '../infrastructure/auth/user.decorator';

@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: { sub: string; email: string; role: string }) {
  return {
    id: user.sub,
    email: user.email,
    role: user.role,
  };
}
```

## Estrutura dos Tokens

O token JWT contém:

- `sub`: ID do usuário
- `email`: Email do usuário
- `role`: Papel/função do usuário
- `iat`: Timestamp de criação
- `exp`: Timestamp de expiração

## Segurança

- **JWT_SECRET**: Use uma chave secreta forte e única em produção
- **JWT_EXPIRES_IN**: Configure um tempo de expiração adequado (padrão: 24h)
- **HTTPS**: Sempre use HTTPS em produção
- **Validação**: Valide sempre os tokens em rotas protegidas

## Testando

1. **Registre um usuário:**

   ```bash
   POST /auth/register
   ```

2. **Faça login:**

   ```bash
   POST /auth/login
   ```

3. **Copie o token da resposta**

4. **Acesse rota protegida:**

   ```bash
   GET /auth/profile
   Authorization: Bearer SEU_TOKEN_AQUI
   ```

## Arquivos Implementados

- `src/infrastructure/config/jwt.config.ts` - Configuração JWT
- `src/infrastructure/services/jwt.service.ts` - Serviço JWT
- `src/infrastructure/auth/jwt.strategy.ts` - Estratégia Passport JWT
- `src/infrastructure/auth/jwt-auth.guard.ts` - Guard de autenticação
- `src/infrastructure/auth/user.decorator.ts` - Decorator para usuário atual
- `src/infrastructure/auth/auth.module.ts` - Módulo de autenticação
- `src/application/use-cases/login-user.use-case.ts` - Use case de login atualizado
- `src/presentation/http/controllers/auth.controller.ts` - Controller com endpoints protegidos
