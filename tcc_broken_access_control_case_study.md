# Estudo de Caso: Segurança da Informação no Desenvolvimento Web

## Correção de Broken Access Control - Validação de Identidade do Usuário

Este documento apresenta um estudo de caso prático sobre a correção de uma vulnerabilidade crítica de **Broken Access Control** (Controle de Acesso Quebrado) em um projeto de backend desenvolvido com NestJS. Esta vulnerabilidade está classificada como **#1 no OWASP Top 10** de 2021, sendo a categoria de risco mais crítica em aplicações web modernas.

### 1. Contexto do Problema

Durante o desenvolvimento de aplicações web, é comum criar endpoints que manipulam dados do usuário. No entanto, uma falha crítica pode ocorrer quando o sistema **aceita o identificador do usuário (userID) diretamente do corpo da requisição** ao invés de extraí-lo do token de autenticação (JWT).

Esta é uma vulnerabilidade de **Broken Access Control** que permite que um usuário autenticado manipule dados de outros usuários simplesmente alterando o `userID` na requisição. Um atacante não precisa ser um hacker experiente - basta abrir as ferramentas de desenvolvedor do navegador e modificar o payload da requisição.

### 2. Estado Inicial (Antes)

O código abaixo representa a implementação vulnerável de um endpoint que registra o progresso de conclusão de vídeo de um usuário. Note que o `userId` é aceito diretamente do DTO (Data Transfer Object) sem qualquer validação de identidade.

**Arquivo:** `src/presentation/http/dtos/test-video-completion.dto.ts`

```typescript
export class TestVideoCompletionDto {
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @IsDateString()
  @IsNotEmpty()
  completedAt: string;

  // ⚠️ VULNERABILIDADE CRÍTICA:
  // O userId é recebido do cliente, permitindo que qualquer usuário
  // envie o ID de outro usuário e modifique seus dados!
  @IsOptional()
  @IsString()
  userId?: string;
}
```

**Arquivo:** `src/presentation/http/controllers/progress.controller.ts` (Vulnerável)

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { TestVideoCompletionDto } from '../dtos/test-video-completion.dto';

@Controller('progress')
export class ProgressController {
  constructor(
    private readonly testVideoCompletionUseCase: TestVideoCompletionUseCase,
  ) {}

  @Post('test/video-completion')
  async testVideoCompletion(@Body() testDto: TestVideoCompletionDto) {
    // ❌ VULNERABILIDADE: Use userId do body se fornecido
    // Isso permite que qualquer usuário autenticado modifique
    // o progresso de vídeo de QUALQUER outro usuário!
    const userId = testDto.userId || user.sub;
    const completedAt = new Date(testDto.completedAt);

    const result = await this.testVideoCompletionUseCase.execute({
      userId,  // Pode ser o ID de outro usuário!
      videoId: testDto.videoId,
      completedAt: completedAt,
    });

    return result;
  }
}
```

### 3. Cenário de Ataque Real

Um atacante autenticado pode explorar essa vulnerabilidade de forma trivial:

**Passo 1:** O atacante faz login normalmente e obtém seu próprio JWT.

**Passo 2:** Ele intercepta a requisição legítima (usando DevTools, Postman, etc.):

```json
POST /progress/test/video-completion
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "videoId": "abc123",
  "completedAt": "2026-01-08T15:00:00Z",
  "userId": "user_123"  // ID da vítima, não do atacante!
}
```

**Passo 3:** O servidor aceita o `userId` do body e modifica os dados da vítima, sem verificar se o token JWT pertence a esse usuário.

**Resultado:** O atacante pode marcar vídeos como assistidos para outros usuários, corrompendo dados de progresso, estatísticas de aprendizado, certificados de conclusão, etc.

### 4. Estado Após Aplicação de Segurança (Depois)

Para corrigir a vulnerabilidade, aplicamos o princípio fundamental de segurança: **"Nunca confie em dados fornecidos pelo cliente para validação de identidade ou autorização"**.

**Alterações Realizadas:**

1. **Remover o campo `userId` do DTO** - O cliente não deve ter permissão para especificar o ID do usuário.
2. **Extrair o `userId` exclusivamente do JWT** - Usar o decorator `@CurrentUser()` para obter o usuário autenticado.
3. **Validar a propriedade do recurso** - Garantir que operações só afetam dados do próprio usuário.

**Arquivo:** `src/presentation/http/dtos/test-video-completion.dto.ts` (Corrigido)

```typescript
export class TestVideoCompletionDto {
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @IsDateString()
  @IsNotEmpty()
  completedAt: string;

  // ✅ CORRIGIDO: Campo userId REMOVIDO do DTO
  // O servidor não aceita mais este valor do cliente
}
```

**Arquivo:** `src/presentation/http/controllers/progress.controller.ts` (Corrigido)

```typescript
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../../../domain/interfaces/jwt-payload.interface';
import { TestVideoCompletionDto } from '../dtos/test-video-completion.dto';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    private readonly testVideoCompletionUseCase: TestVideoCompletionUseCase,
  ) {}

  @Post('test/video-completion')
  async testVideoCompletion(
    @Body() testDto: TestVideoCompletionDto,
    @CurrentUser() user: JwtPayload,
  ) {

    const completedAt = new Date(testDto.completedAt);

    const result = await this.testVideoCompletionUseCase.execute({
      userId: user.sub,
      videoId: testDto.videoId,
      completedAt: completedAt,
    });

    return result;
  }
}
```

**Implementação do Decorator `@CurrentUser()`:**

```typescript
// src/presentation/http/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../../domain/interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    // O JwtAuthGuard já validou o token e anexou os dados em request.user
    return request.user;
  },
);
```

### 5. Análise de Impacto

A correção desta vulnerabilidade tem impactos cruciais na segurança da aplicação:

#### 5.1 **Antes da Correção:**

- ❌ **Escalação Horizontal de Privilégios**: Qualquer usuário autenticado pode modificar dados de qualquer outro usuário.
- ❌ **Violação de Integridade de Dados**: Registros de progresso, conquistas e certificados podem ser corrompidos.
- ❌ **Violação de Privacidade**: Atacantes podem inferir a existência de outros usuários testando IDs.
- ❌ **Não-conformidade com LGPD**: Usuários podem acessar/modificar dados pessoais de terceiros.
- ❌ **Impacto em Auditoria**: Logs mostrariam ações realizadas por um usuário em nome de outro.

#### 5.2 **Depois da Correção:**

- ✅ **Controle de Acesso Garantido**: Cada usuário só pode afetar seus próprios dados.
- ✅ **Fonte Única de Verdade**: O JWT validado pelo servidor é a única fonte para identidade.
- ✅ **Auditoria Confiável**: Todas as ações são rastreadas com o userId correto do JWT.
- ✅ **Conformidade com Segurança**: Alinhamento com OWASP Top 10 e boas práticas.
- ✅ **Confiança Zero (Zero Trust)**: Dados do cliente nunca são confiados para autenticação/autorização.

### 6. Princípios de Segurança Aplicados

Esta correção demonstra a aplicação de princípios fundamentais de segurança:

1. **Princípio do Menor Privilégio**: Usuários devem ter acesso apenas aos seus próprios recursos.

2. **Validação no Servidor (Server-Side Validation)**: Nunca confiar em dados enviados pelo cliente para decisões críticas de segurança.

3. **Defense in Depth (Defesa em Profundidade)**:
   - Camada 1: Autenticação via JWT (`JwtAuthGuard`)
   - Camada 2: Extração segura de identidade (`@CurrentUser()`)
   - Camada 3: Validação de propriedade no Use Case (ABAC com CASL)

4. **Separação de Responsabilidades**:
   - DTO: Define apenas dados de negócio (videoId, completedAt)
   - Auth Guard: Valida a autenticação
   - Decorator: Extrai identidade do token
   - Use Case: Aplica regras de negócio e autorização

### 7. Checklist de Verificação para Desenvolvedores

Use esta checklist ao implementar endpoints que manipulam dados de usuários:

- [ ] O endpoint está protegido com `@UseGuards(JwtAuthGuard)`?
- [ ] O `userId` está sendo extraído do `@CurrentUser()` decorator?
- [ ] O DTO **NÃO** contém campos `userId`, `userID`, `user_id` ou similares?
- [ ] O Use Case valida que o usuário tem permissão para acessar o recurso?
- [ ] Logs de auditoria registram o `userId` do JWT, não do body?
- [ ] Testes de segurança verificam que usuários não podem afetar dados de outros?

### Conclusão

A vulnerabilidade de **Broken Access Control** devido à aceitação de `userId` do corpo da requisição é uma das falhas mais críticas e, paradoxalmente, uma das mais fáceis de evitar. A correção envolve simplesmente **confiar no token de autenticação validado pelo servidor** ao invés de aceitar dados fornecidos pelo cliente.

Esta mudança representa a diferença entre:

- Uma aplicação onde **qualquer usuário pode ser qualquer usuário**
- Uma aplicação onde **cada usuário só pode ser ele mesmo**

Para um sistema em produção, esta não é apenas uma melhoria de segurança - é um **requisito fundamental** para a integridade, privacidade e conformidade legal da aplicação.

---

**Classificação OWASP:** A01:2021 - Broken Access Control  
**Severidade:** 🔴 **CRÍTICA**  
**Status:** ✅ **Corrigido**  
**Data da Correção:** 2026-01-08
