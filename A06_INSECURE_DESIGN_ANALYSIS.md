# A06:2025 (OWASP) — Design Inseguro: Análise e Melhorias

## Objetivo

Analisar o projeto em relação à categoria **A06:2025 – Insecure Design**, identificando proteções existentes, pontos de melhoria e recomendações para implementação de design seguro, modelagem de ameaças e validações de lógica de negócios.

---

## 📋 Contexto do A06:2025

O **Design Inseguro** foca em riscos relacionados a falhas de arquitetura e design, não apenas de implementação. Diferencia-se de outras categorias porque:

- **Design inseguro**: Controles de segurança necessários nunca foram criados
- **Implementação insegura**: Controles existem mas têm bugs

**Três partes fundamentais para design seguro:**
1. **Levantamento de Requisitos e Gerenciamento de Recursos**
2. **Criação de um Design Seguro**
3. **Ter um Ciclo de Vida de Desenvolvimento Seguro**

---

## ✅ Proteções Já Implementadas

### 1) Sistema RBAC/ABAC com CASL ✅

**Status:** ✅ **Bem implementado**

O projeto possui um sistema robusto de controle de acesso usando **CASL** (RBAC + ABAC):

```typescript
// src/infrastructure/casl/permissions.ts
export const permissions: Record<Role, PermissionsByRole> = {
  ADMIN: (user, { can, cannot }) => {
    can('manage', 'all');
    // Restrições de segurança explícitas
    cannot('transfer_ownership', 'Community');
    can('transfer_ownership', 'Community', {
      ownerId: { $eq: user.id },
    });
  },
  STUDENT: (user, { can }) => {
    can('get', 'User');
    can('update', 'User', { id: { $eq: user.id } }); // ABAC
    can(['update', 'delete'], 'Community', {
      ownerId: { $eq: user.id },
    }); // ABAC
  },
};
```

**Por que isso é bom:**
- ✅ **Design seguro**: Controle de acesso centralizado e bem definido
- ✅ **Granularidade**: Diferencia ações (create, read, update, delete)
- ✅ **ABAC**: Verifica ownership de recursos (Attribute-Based Access Control)
- ✅ **Princípio do menor privilégio**: Permissões mínimas necessárias
- ✅ **Centralização**: Regras em um único lugar (`permissions.ts`)

**Cenário de proteção:**
```typescript
// STUDENT tenta editar comunidade de outro usuário
const ability = defineAbilityFor({ id: 'user-123', role: 'STUDENT' });
const community = { id: 'comm-456', ownerId: 'user-789' };

if (ability.cannot('update', community)) {
  throw new ForbiddenException(); // ✅ Bloqueado por design
}
```

---

### 2) Validações de Lógica de Negócios ✅

**Status:** ✅ **Bem implementado em pontos críticos**

O projeto valida estados e transições em lógicas críticas:

#### Exemplo 1: Mudança de Plano (Change Plan)

```typescript
// src/application/subscriptions/use-cases/change-plan.use-case.ts
async execute(input: ChangePlanInput): Promise<ChangePlanOutput> {
  // ✅ Validação 1: Assinatura existe
  if (!subscription) {
    throw new NotFoundException('Assinatura não encontrada');
  }

  // ✅ Validação 2: Assinatura está ativa
  if (!subscription.isActive()) {
    throw new BadRequestException(
      'Só é possível mudar de plano com uma assinatura ativa',
    );
  }

  // ✅ Validação 3: Plano válido
  const newPlan = getPlanById(newPlanId);
  if (!newPlan) {
    throw new BadRequestException('Plano inválido');
  }

  // ✅ Validação 4: Não está no mesmo plano
  if (subscription.plan === newPlanId) {
    throw new BadRequestException('Você já está neste plano');
  }

  // ✅ Validação 5: Não tem mudança pendente
  if (subscription.pendingPlanChange) {
    throw new BadRequestException(
      `Já existe uma mudança pendente para o plano ${getPlanById(subscription.pendingPlanChange)?.name}...`,
    );
  }

  // ✅ Lógica de negócio: Upgrade vs Downgrade
  const isUpgrade = isPlanUpgrade(subscription.plan, newPlanId);
  if (isUpgrade && subscription.currentPeriodStart && subscription.currentPeriodEnd) {
    return await this.handleImmediateUpgrade(...);
  }
  // Downgrade aguarda término do período
}
```

**Por que isso é bom:**
- ✅ **Validações em camadas**: Múltiplas verificações antes de executar ação
- ✅ **Estados bem definidos**: Verifica estado atual antes de transição
- ✅ **Prevenção de race conditions**: Bloqueia múltiplas mudanças simultâneas
- ✅ **Lógica de negócio clara**: Upgrade imediato vs downgrade agendado

#### Exemplo 2: Criação de Checkout

```typescript
// src/application/subscriptions/use-cases/create-checkout.use-case.ts
async execute(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
  // ✅ Validação 1: Plano válido
  const plan = getPlanById(planId);
  if (!plan) {
    throw new BadRequestException('Plano inválido');
  }

  // ✅ Validação 2: Não existe assinatura ativa para o email
  const existingSubscription =
    await this.subscriptionRepository.findByCustomerEmail(customerEmail);
  if (existingSubscription && existingSubscription.isActive()) {
    throw new BadRequestException(
      `Já existe uma assinatura ativa para este email...`,
    );
  }
  // ... resto do fluxo
}
```

**Por que isso é bom:**
- ✅ **Prevenção de duplicação**: Evita múltiplas assinaturas ativas
- ✅ **Validação de estado**: Verifica estado antes de criar novo recurso

#### Exemplo 3: Edição de Mensagem (Time Limit)

```typescript
// src/application/messages/use-cases/edit-message.use-case.ts
async execute(input: EditMessageInput): Promise<EditMessageOutput> {
  // ✅ Validação 1: Conteúdo não vazio
  if (!newContent || newContent.trim().length === 0) {
    throw new BadRequestException('O conteúdo da mensagem não pode estar vazio');
  }

  // ✅ Validação 2: Tamanho máximo
  if (newContent.length > 10000) {
    throw new BadRequestException('O conteúdo da mensagem é muito longo...');
  }

  // ✅ Validação 3: Ownership
  if (message.senderId !== userId) {
    throw new ForbiddenException('Você só pode editar suas próprias mensagens');
  }

  // ✅ Validação 4: Time limit (5 minutos)
  const messageAge = now.getTime() - message.createdAt.getTime();
  if (messageAge > this.EDIT_TIME_LIMIT_MS) {
    throw new BadRequestException(
      'Você só pode editar mensagens por até 5 minutos após o envio',
    );
  }
}
```

**Por que isso é bom:**
- ✅ **Validação de ownership**: Verifica propriedade do recurso
- ✅ **Time-based constraints**: Limita janela de edição
- ✅ **Validação de tamanho**: Previne DoS por mensagens muito grandes

---

### 3) Guards de Autenticação e Autorização ✅

**Status:** ✅ **Bem implementado**

O projeto usa guards em múltiplas camadas:

```typescript
// ✅ Guard de autenticação JWT
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@CurrentUser() user: JwtPayload) { ... }

// ✅ Guard de assinatura ativa
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@Get('courses')
async getCourses() { ... }

// ✅ Guard de admin
@UseGuards(JwtAuthGuard, AdminGuard)
@Post('courses')
async createCourse(@Body() dto: CreateCourseDto) { ... }
```

**Por que isso é bom:**
- ✅ **Defense in depth**: Múltiplas camadas de proteção
- ✅ **Separação de responsabilidades**: Cada guard tem função específica
- ✅ **Reutilização**: Guards podem ser aplicados em múltiplos endpoints

---

### 4) Verificação de Estado em Login ✅

**Status:** ✅ **Bem implementado**

O login verifica estado da assinatura antes de permitir acesso:

```typescript
// src/application/use-cases/login-user.use-case.ts
async execute(input: LoginInput): Promise<LoginOutput> {
  // ✅ Validação de credenciais
  const valid = await this.passwordHasher.compare(...);
  if (!valid) {
    throw new UnauthorizedException('Credenciais inválidas');
  }

  // ✅ Verificação de assinatura ativa (exceto admin)
  if (user.role !== 'ADMIN') {
    const subscription = await this.subscriptionRepository.findByUserId(user.id);
    
    if (!subscription) {
      throw new ForbiddenException(
        'Você precisa ter uma assinatura ativa para acessar a plataforma...',
      );
    }

    if (!subscription.hasAccess()) {
      // Mensagem específica baseada no status
      throw new ForbiddenException(statusMessage);
    }
  }
}
```

**Por que isso é bom:**
- ✅ **Validação de estado**: Verifica estado antes de permitir acesso
- ✅ **Mensagens específicas**: Diferencia entre diferentes estados (CANCELLED, OVERDUE, etc.)
- ✅ **Exceção para admin**: Admin pode acessar sem assinatura (design intencional)

---

## ⚠️ Pontos de Melhoria Identificados

### 1) Falta de Modelagem de Ameaças Documentada ❌

**Problema:** Não há documentação formal de modelagem de ameaças (threat modeling).

**Impacto:**
- Desenvolvedores podem não considerar todos os vetores de ataque
- Novos recursos podem ser adicionados sem análise de segurança
- Dificulta identificação proativa de vulnerabilidades

**Recomendação:**

Criar documentação de modelagem de ameaças para fluxos críticos:

```markdown
# Threat Model: Mudança de Plano

## Ativos
- Assinatura do usuário
- Dados de pagamento
- Estado da assinatura

## Ameaças Identificadas
1. **TAMPERING**: Usuário tenta mudar plano sem pagar
   - Mitigação: Validação de assinatura ativa + criação de cobrança

2. **SPOOFING**: Usuário tenta mudar plano de outro usuário
   - Mitigação: JWT valida userId + verificação de ownership

3. **REPUDIATION**: Usuário nega ter solicitado mudança
   - Mitigação: Logs de auditoria + confirmação por email

4. **INFORMATION DISCLOSURE**: Vazamento de informações de outros usuários
   - Mitigação: Validação de userId do JWT (não do body)

5. **DENIAL OF SERVICE**: Múltiplas requisições simultâneas
   - Mitigação: Rate limiting + validação de pendingPlanChange
```

**Onde aplicar:**
- Criar arquivo `docs/threat-models/` com modelos para cada fluxo crítico
- Revisar modelos durante code review
- Atualizar modelos quando adicionar novos recursos

---

### 2) Falta de Testes de Segurança ❌

**Problema:** Não há testes unitários ou de integração focados em segurança.

**Impacto:**
- Vulnerabilidades podem ser introduzidas sem detecção
- Regressões de segurança não são detectadas automaticamente
- Dificulta refatoração segura

**Recomendação:**

Criar testes de segurança para fluxos críticos:

```typescript
// src/application/subscriptions/use-cases/change-plan.use-case.spec.ts
describe('ChangePlanUseCase - Security Tests', () => {
  it('should prevent user from changing another user plan', async () => {
    // Arrange
    const user1 = createUser({ id: 'user-1' });
    const user2 = createUser({ id: 'user-2' });
    const subscription = createSubscription({ userId: user1.id });

    // Act & Assert
    await expect(
      useCase.execute({ userId: user2.id, newPlanId: 'PRO' })
    ).rejects.toThrow(NotFoundException);
  });

  it('should prevent multiple simultaneous plan changes', async () => {
    // Testa race condition
    const promises = [
      useCase.execute({ userId: 'user-1', newPlanId: 'PRO' }),
      useCase.execute({ userId: 'user-1', newPlanId: 'ULTRA' }),
    ];

    const results = await Promise.allSettled(promises);
    const successes = results.filter(r => r.status === 'fulfilled');
    
    expect(successes.length).toBe(1); // Apenas uma deve ter sucesso
  });

  it('should prevent plan change without active subscription', async () => {
    const subscription = createSubscription({ 
      userId: 'user-1',
      status: 'CANCELLED'
    });

    await expect(
      useCase.execute({ userId: 'user-1', newPlanId: 'PRO' })
    ).rejects.toThrow(BadRequestException);
  });
});
```

**Onde aplicar:**
- Criar arquivos `*.spec.ts` para cada use case crítico
- Testar casos de abuso (misuse cases)
- Testar validações de estado e transições
- Integrar no pipeline de CI/CD

---

### 3) Verificações de Plausibilidade Podem Ser Mais Sistemáticas ⚠️

**Status:** ⚠️ **Parcialmente implementado**

**Problema:** Algumas validações existem, mas não são sistemáticas em todas as camadas.

**Exemplo de melhoria:**

Atualmente, algumas validações são feitas apenas no use case:

```typescript
// ✅ Validação existe, mas apenas no use case
async execute(input: ChangePlanInput) {
  if (!subscription.isActive()) {
    throw new BadRequestException(...);
  }
}
```

**Recomendação:** Adicionar validações em múltiplas camadas:

```typescript
// Camada 1: DTO (validação de formato)
class ChangePlanDto {
  @IsEnum(['START', 'PRO', 'ULTRA'])
  newPlanId: PlanType;
}

// Camada 2: Controller (validação de autenticação)
@Post('change-plan')
@UseGuards(JwtAuthGuard) // ✅ Já existe
async changePlan(
  @CurrentUser() user: JwtPayload,
  @Body() dto: ChangePlanDto
) {
  // ✅ userId vem do JWT, não do body
  return this.changePlanUseCase.execute({
    userId: user.sub, // ✅ Seguro
    newPlanId: dto.newPlanId,
  });
}

// Camada 3: Use Case (validação de lógica de negócio)
async execute(input: ChangePlanInput) {
  // ✅ Validações de estado e regras de negócio
  if (!subscription.isActive()) { ... }
  if (subscription.pendingPlanChange) { ... }
}

// Camada 4: Repository (validação de integridade)
async update(subscription: Subscription) {
  // ✅ Validações de integridade referencial
  await this.db.update(subscriptions)
    .set({ ... })
    .where(eq(subscriptions.id, subscription.id));
}
```

**Onde aplicar:**
- Revisar todos os fluxos críticos
- Adicionar validações em múltiplas camadas
- Documentar quais validações são feitas em cada camada

---

### 4) Falta de Documentação de Design Seguro ❌

**Problema:** Não há documentação explicando as decisões de design seguro.

**Impacto:**
- Novos desenvolvedores podem não entender o "porquê" das decisões
- Decisões de segurança podem ser revertidas acidentalmente
- Dificulta onboarding e manutenção

**Recomendação:**

Criar documentação de design seguro:

```markdown
# Design Seguro - Decisões Arquiteturais

## 1. Controle de Acesso (CASL)

**Decisão:** Usar CASL para RBAC/ABAC centralizado

**Por quê:**
- Centraliza todas as regras de permissão
- Facilita manutenção e auditoria
- Suporta ABAC (verificação de ownership)

**O que proteger:**
- Nunca confiar em userId do body da requisição
- Sempre usar userId do JWT validado
- Verificar ownership em use cases críticos

## 2. Validação de Estado

**Decisão:** Validar estado antes de transições

**Por quê:**
- Previne transições inválidas
- Previne race conditions
- Garante integridade de dados

**O que proteger:**
- Verificar estado atual antes de mudar
- Bloquear múltiplas transições simultâneas
- Validar pré-condições explicitamente

## 3. Separação de Responsabilidades

**Decisão:** Validações em múltiplas camadas

**Por quê:**
- Defense in depth
- Cada camada tem responsabilidade específica
- Facilita manutenção

**Camadas:**
1. DTO: Validação de formato
2. Controller: Validação de autenticação
3. Use Case: Validação de lógica de negócio
4. Repository: Validação de integridade
```

**Onde aplicar:**
- Criar arquivo `docs/secure-design-decisions.md`
- Documentar decisões importantes
- Atualizar quando adicionar novos recursos

---

### 5) Falta de Validação de Assinatura em Alguns Endpoints ⚠️

**Status:** ⚠️ **Parcialmente implementado**

**Problema:** Alguns endpoints podem não estar verificando assinatura ativa.

**Recomendação:**

Auditar todos os endpoints e garantir que endpoints que requerem assinatura usem `SubscriptionGuard`:

```typescript
// ✅ Bom exemplo (já implementado)
@Get('courses')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
async getCourses() { ... }

// ⚠️ Verificar se todos os endpoints críticos têm SubscriptionGuard
// Endpoints que devem ter:
// - GET /courses
// - GET /modules
// - GET /videos
// - POST /quiz/generate
// - etc.
```

**Onde aplicar:**
- Auditar todos os controllers
- Adicionar `SubscriptionGuard` onde necessário
- Documentar quais endpoints requerem assinatura

---

### 6) Falta de Rate Limiting em Alguns Endpoints ⚠️

**Status:** ⚠️ **Parcialmente implementado**

**Problema:** Alguns endpoints críticos podem não ter rate limiting.

**Proteções existentes:**
- ✅ `ResendPasswordResetRateLimitGuard` (reenvio de código)
- ✅ `RegisterRateLimitGuard` (registro)
- ✅ `ValidateTokenRateLimitGuard` (validação de token)

**Recomendação:**

Adicionar rate limiting em endpoints críticos:

```typescript
// Exemplo: Rate limiting para mudança de plano
@Post('change-plan')
@UseGuards(JwtAuthGuard, ChangePlanRateLimitGuard) // Novo guard
async changePlan(...) { ... }

// Exemplo: Rate limiting para criação de checkout
@Post('checkout')
@UseGuards(CheckoutRateLimitGuard) // Novo guard
async createCheckout(...) { ... }
```

**Onde aplicar:**
- Identificar endpoints críticos
- Criar guards de rate limiting específicos
- Configurar limites apropriados (ex: 3 mudanças de plano por hora)

---

### 7) Falta de Validação de Integridade em Webhooks ⚠️

**Status:** ⚠️ **Parcialmente implementado**

**Problema:** Webhooks do Asaas podem não estar validando integridade adequadamente.

**Recomendação:**

Adicionar validação de assinatura de webhook:

```typescript
// src/presentation/http/controllers/subscriptions.controller.ts
@Post('webhook')
async handleWebhook(
  @Body() payload: WebhookPayload,
  @Headers('asaas-access-token') token: string,
) {
  // ✅ Validar token do webhook (se Asaas fornecer)
  if (!this.validateWebhookToken(token, payload)) {
    throw new UnauthorizedException('Webhook inválido');
  }

  // ✅ Validar integridade do payload
  if (!this.validateWebhookPayload(payload)) {
    throw new BadRequestException('Payload inválido');
  }

  await this.processWebhookUseCase.execute(payload);
}
```

**Onde aplicar:**
- Verificar se Asaas fornece token de validação
- Implementar validação de assinatura
- Validar integridade do payload

---

## 📊 Resumo: Onde o Projeto Está

### ✅ Pontos Fortes (Já Implementados)

1. **Sistema RBAC/ABAC robusto** - CASL bem implementado
2. **Validações de lógica de negócios** - Múltiplas validações em fluxos críticos
3. **Guards de autenticação/autorização** - Múltiplas camadas de proteção
4. **Verificação de estado** - Login verifica assinatura ativa
5. **Validação de ownership** - ABAC verifica propriedade de recursos
6. **Time-based constraints** - Limites de tempo em edição de mensagens
7. **Prevenção de duplicação** - Evita múltiplas assinaturas ativas

### ⚠️ Pontos de Melhoria

1. **Modelagem de ameaças** - Falta documentação formal
2. **Testes de segurança** - Falta testes focados em segurança
3. **Verificações sistemáticas** - Podem ser mais sistemáticas em todas as camadas
4. **Documentação de design** - Falta documentação de decisões de segurança
5. **Rate limiting** - Alguns endpoints críticos podem não ter
6. **Validação de webhooks** - Pode ser mais robusta

---

## 🎯 Plano de Ação Recomendado

### Prioridade Alta

1. **Criar documentação de modelagem de ameaças**
   - Documentar ameaças para cada fluxo crítico
   - Revisar durante code review
   - Atualizar quando adicionar novos recursos

2. **Adicionar testes de segurança**
   - Testes unitários para use cases críticos
   - Testes de integração para fluxos completos
   - Testes de casos de abuso (misuse cases)

3. **Auditar e adicionar SubscriptionGuard**
   - Listar todos os endpoints que requerem assinatura
   - Adicionar `SubscriptionGuard` onde necessário
   - Documentar quais endpoints requerem assinatura

### Prioridade Média

4. **Sistematizar verificações de plausibilidade**
   - Revisar todos os fluxos críticos
   - Adicionar validações em múltiplas camadas
   - Documentar quais validações são feitas em cada camada

5. **Adicionar rate limiting em endpoints críticos**
   - Identificar endpoints que precisam de rate limiting
   - Criar guards específicos
   - Configurar limites apropriados

6. **Melhorar validação de webhooks**
   - Verificar se Asaas fornece token de validação
   - Implementar validação de assinatura
   - Validar integridade do payload

### Prioridade Baixa

7. **Criar documentação de design seguro**
   - Documentar decisões arquiteturais importantes
   - Explicar "porquê" das decisões
   - Facilitar onboarding e manutenção

---

## 📝 Exemplos de Implementação

### Exemplo 1: Adicionar Rate Limiting para Mudança de Plano

```typescript
// src/infrastructure/guards/change-plan-rate-limit.guard.ts
import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';
import { REDIS_SERVICE } from '../../domain/tokens';
import type { RedisService } from '../../infrastructure/redis/services/redis.service';

@Injectable()
export class ChangePlanRateLimitGuard extends RateLimitGuard {
  constructor(
    @Inject(REDIS_SERVICE)
    protected readonly redisService: RedisService,
  ) {
    super(redisService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const keyGenerator = (ctx: ExecutionContext) => {
      const req = ctx.switchToHttp().getRequest();
      const userId = req.user?.sub || 'unknown';
      return `change_plan:${userId}`;
    };

    // Limite: 3 mudanças por hora por usuário
    return this.canActivateWithOptions(context, {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 3,
      keyGenerator,
    });
  }
}
```

```typescript
// src/presentation/http/controllers/subscriptions.controller.ts
@Post('change-plan')
@UseGuards(JwtAuthGuard, ChangePlanRateLimitGuard) // ✅ Adicionado
async changePlan(
  @CurrentUser() user: JwtPayload,
  @Body() dto: ChangePlanDto,
) {
  return this.changePlanUseCase.execute({
    userId: user.sub,
    newPlanId: dto.newPlanId,
  });
}
```

---

### Exemplo 2: Adicionar Teste de Segurança

```typescript
// src/application/subscriptions/use-cases/change-plan.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ChangePlanUseCase } from './change-plan.use-case';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ChangePlanUseCase - Security Tests', () => {
  let useCase: ChangePlanUseCase;
  let subscriptionRepository: jest.Mocked<SubscriptionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangePlanUseCase,
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: {
            findByUserId: jest.fn(),
            update: jest.fn(),
          },
        },
        // ... outros providers
      ],
    }).compile();

    useCase = module.get<ChangePlanUseCase>(ChangePlanUseCase);
    subscriptionRepository = module.get(SUBSCRIPTION_REPOSITORY);
  });

  describe('Security validations', () => {
    it('should prevent plan change without active subscription', async () => {
      // Arrange
      subscriptionRepository.findByUserId.mockResolvedValue(
        createSubscription({ status: 'CANCELLED' })
      );

      // Act & Assert
      await expect(
        useCase.execute({ userId: 'user-1', newPlanId: 'PRO' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent multiple simultaneous plan changes', async () => {
      // Arrange
      const subscription = createSubscription({ 
        userId: 'user-1',
        status: 'ACTIVE',
        plan: 'START',
      });
      subscriptionRepository.findByUserId.mockResolvedValue(subscription);

      // Act: Tentar duas mudanças simultâneas
      const promises = [
        useCase.execute({ userId: 'user-1', newPlanId: 'PRO' }),
        useCase.execute({ userId: 'user-1', newPlanId: 'ULTRA' }),
      ];

      const results = await Promise.allSettled(promises);

      // Assert: Apenas uma deve ter sucesso
      const successes = results.filter(r => r.status === 'fulfilled');
      expect(successes.length).toBe(1);

      // A segunda deve falhar com "mudança pendente"
      const failures = results.filter(r => r.status === 'rejected');
      expect(failures.length).toBe(1);
      expect(failures[0].reason).toBeInstanceOf(BadRequestException);
    });

    it('should prevent changing to the same plan', async () => {
      // Arrange
      subscriptionRepository.findByUserId.mockResolvedValue(
        createSubscription({ plan: 'PRO' })
      );

      // Act & Assert
      await expect(
        useCase.execute({ userId: 'user-1', newPlanId: 'PRO' })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
```

---

### Exemplo 3: Documentação de Modelagem de Ameaças

```markdown
# Threat Model: Processamento de Webhook do Asaas

## Ativos
- Assinatura do usuário
- Dados de pagamento
- Estado da assinatura
- Token de registro

## Fluxo de Dados
```
Asaas → POST /subscriptions/webhook → ProcessWebhookUseCase → SubscriptionRepository
```

## Ameaças Identificadas

### TAMPERING
**Descrição:** Atacante modifica payload do webhook

**Vetor de Ataque:**
1. Atacante intercepta requisição de webhook
2. Modifica payload para ativar assinatura de outro usuário
3. Sistema ativa assinatura incorreta

**Mitigação:**
- ✅ Validar token de webhook (se Asaas fornecer)
- ✅ Validar integridade do payload
- ✅ Verificar que subscriptionId existe no banco
- ⚠️ **MELHORIA:** Adicionar validação de assinatura HMAC

### SPOOFING
**Descrição:** Atacante envia webhook falso

**Vetor de Ataque:**
1. Atacante envia requisição POST para /subscriptions/webhook
2. Payload falso indica pagamento confirmado
3. Sistema ativa assinatura sem pagamento real

**Mitigação:**
- ✅ Validar origem da requisição (IP whitelist do Asaas)
- ⚠️ **MELHORIA:** Validar assinatura HMAC do payload
- ⚠️ **MELHORIA:** Verificar com Asaas API se pagamento é válido

### REPUDIATION
**Descrição:** Atacante nega ter recebido webhook

**Vetor de Ataque:**
1. Webhook é processado
2. Assinatura é ativada
3. Atacante nega ter recebido o webhook

**Mitigação:**
- ✅ Logs de auditoria de todos os webhooks
- ✅ Idempotência: processar webhook múltiplas vezes não causa problemas
- ✅ Verificar se webhook já foi processado (evitar duplicação)

### INFORMATION DISCLOSURE
**Descrição:** Vazamento de informações sensíveis em logs

**Vetor de Ataque:**
1. Webhook contém dados sensíveis
2. Logs expõem informações
3. Atacante acessa logs e obtém dados

**Mitigação:**
- ✅ Não logar dados sensíveis (senhas, tokens)
- ✅ Logs apenas de eventos e IDs (não dados completos)
- ✅ Reduzir verbosidade de logs em produção

### DENIAL OF SERVICE
**Descrição:** Múltiplos webhooks simultâneos causam sobrecarga

**Vetor de Ataque:**
1. Atacante envia múltiplos webhooks simultaneamente
2. Sistema processa todos
3. Sistema fica sobrecarregado

**Mitigação:**
- ✅ Processamento assíncrono (se possível)
- ✅ Rate limiting no endpoint de webhook
- ✅ Validação de idempotência (evitar processamento duplicado)
```

---

## 🔍 Checklist de Validação

### Design Seguro

- [ ] Documentação de modelagem de ameaças criada para fluxos críticos
- [ ] Testes de segurança implementados para use cases críticos
- [ ] Verificações de plausibilidade sistemáticas em todas as camadas
- [ ] Documentação de decisões de design seguro criada
- [ ] Todos os endpoints que requerem assinatura têm `SubscriptionGuard`
- [ ] Rate limiting implementado em endpoints críticos
- [ ] Validação de webhooks robusta (HMAC, integridade)

### Lógica de Negócios

- [ ] Todas as transições de estado são validadas
- [ ] Race conditions são prevenidas (ex: pendingPlanChange)
- [ ] Validações de ownership em recursos críticos
- [ ] Time-based constraints onde necessário
- [ ] Prevenção de duplicação (ex: múltiplas assinaturas)

### Controle de Acesso

- [ ] CASL configurado corretamente
- [ ] ABAC verifica ownership onde necessário
- [ ] Guards aplicados em todos os endpoints protegidos
- [ ] userId sempre vem do JWT, nunca do body

---

## 📚 Referências

- [OWASP Top 10 2025 - A06: Insecure Design](https://owasp.org/www-project-top-ten/)
- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
- [OWASP ASVS - Secure Design](https://owasp.org/www-project-application-security-verification-standard/)
- [Microsoft Threat Modeling Tool](https://www.microsoft.com/en-us/securityengineering/sdl/threatmodeling)
- [OWASP SAMM - Secure Design](https://owaspsamm.org/model/design/)

---

## Conclusão

O projeto **já possui uma base sólida de design seguro** com:
- ✅ Sistema RBAC/ABAC robusto (CASL)
- ✅ Validações de lógica de negócios em pontos críticos
- ✅ Guards de autenticação/autorização
- ✅ Verificação de estado em login

**Principais melhorias recomendadas:**
1. **Documentação de modelagem de ameaças** (prioridade alta)
2. **Testes de segurança** (prioridade alta)
3. **Sistematização de verificações** (prioridade média)
4. **Rate limiting em endpoints críticos** (prioridade média)

Com essas melhorias, o projeto estará totalmente alinhado com os princípios de **Secure by Design** do A06:2025.

---

## Proteções Implementadas para CWEs Notáveis do A06:2025

O projeto implementa proteções específicas para as CWEs notáveis mencionadas no A06:2025. Esta seção descreve como cada CWE é tratada no código atual.

### CWE-256: Unprotected Storage of Credentials

O projeto protege contra armazenamento desprotegido de credenciais através de múltiplas camadas de segurança. Senhas nunca são armazenadas em texto plano no banco de dados. O sistema utiliza bcrypt com salt automático de 10 rounds para hash de senhas antes do armazenamento. A implementação está em src/infrastructure/services/bcrypt-password-hasher.ts, onde o método hash gera um salt único para cada senha e aplica o algoritmo bcrypt antes de persistir no banco. O campo password_hash na tabela users armazena apenas o hash, nunca a senha em texto plano. Além disso, o sistema não armazena outras credenciais sensíveis como tokens de API ou chaves de acesso em texto plano. Variáveis de ambiente são usadas para secrets como JWT_SECRET, ASAAS_API_KEY e outras credenciais, garantindo que não sejam expostas no código-fonte ou no banco de dados.

### CWE-269: Improper Privilege Management

O projeto implementa um sistema robusto de gerenciamento de privilégios usando CASL para RBAC e ABAC. As permissões são centralizadas em src/infrastructure/casl/permissions.ts, onde cada role tem permissões explícitas definidas. O sistema diferencia ações como create, read, update, delete e manage, permitindo controle granular de acesso. Para STUDENT, as permissões são limitadas apenas ao necessário, seguindo o princípio do menor privilégio. Por exemplo, estudantes podem atualizar apenas seu próprio perfil através de condições ABAC que verificam ownership. Para ADMIN, há permissões amplas mas com restrições de segurança explícitas, como não poder transferir ownership de comunidades que não são suas. O sistema também implementa guards de autenticação e autorização em múltiplas camadas, incluindo JwtAuthGuard para verificar tokens, SubscriptionGuard para verificar assinaturas ativas, e AdminGuard para operações administrativas. A validação de permissões ocorre tanto no nível de guard quanto no nível de use case, garantindo que decisões críticas de acesso sejam validadas em múltiplos pontos.

### CWE-434: Unrestricted Upload of File with Dangerous Type

O projeto implementa validações rigorosas para upload de arquivos em múltiplos pontos do fluxo. Todos os endpoints de upload validam o tipo MIME do arquivo antes de processar. Para upload de imagens de perfil em src/presentation/http/controllers/user-profile.controller.ts, apenas tipos image/jpeg, image/jpg, image/png, e image/webp são permitidos. O tamanho máximo é limitado a 5MB. Para upload de imagens de comunidades, as mesmas validações de tipo e tamanho são aplicadas. Para upload de arquivos em mensagens, o sistema permite apenas imagens e PDFs, com validação de tipo em src/presentation/http/controllers/messages.controller.ts e src/presentation/http/controllers/communities.controller.ts. O tamanho máximo para anexos de mensagens é 10MB. Além das validações no controller, o sistema também valida arquivos no use case antes de processar, como em src/application/messages/use-cases/send-message.use-case.ts, onde cada anexo é validado quanto ao tipo, tamanho e existência no Cloudinary. O CloudinaryService em src/infrastructure/services/cloudinary.service.ts configura allowed_formats explicitamente para cada tipo de upload, garantindo que apenas formatos permitidos sejam aceitos. O sistema também valida a existência do arquivo no Cloudinary antes de criar referências no banco de dados, prevenindo uploads maliciosos ou arquivos que não foram realmente enviados.

### CWE-501: Trust Boundary Violation

O projeto respeita rigorosamente os limites de confiança entre cliente e servidor. O sistema nunca confia em dados enviados pelo cliente para decisões críticas de autenticação ou autorização. O userId sempre é extraído do JWT validado pelo servidor através do decorator @CurrentUser(), nunca do body da requisição. Esta prática está documentada em tcc_broken_access_control_case_study.md e implementada consistentemente em todos os controllers. Por exemplo, em src/presentation/http/controllers/subscriptions.controller.ts, o método changePlan recebe userId do JWT através de @CurrentUser(), não do DTO. O sistema também valida a integridade de tokens JWT em múltiplos pontos, incluindo JwtAuthGuard para endpoints HTTP e WsJwtGuard para conexões WebSocket. A validação de JWT inclui verificação de assinatura usando JWT_SECRET, verificação de expiração configurada para 24 horas, e validação de payload para garantir que campos obrigatórios como sub, email e role estejam presentes. O sistema também implementa validação de entrada em múltiplas camadas, começando com ValidationPipe global que usa whitelist para remover propriedades não declaradas nos DTOs, prevenindo mass assignment attacks. Dados do cliente são validados quanto ao formato antes de serem processados, mas decisões de autorização sempre dependem de dados validados pelo servidor, como o JWT.

### CWE-522: Insufficiently Protected Credentials

O projeto protege credenciais de forma adequada em múltiplas camadas. Senhas são protegidas usando bcrypt com salt automático de 10 rounds, tornando ataques de força bruta computacionalmente inviáveis. O JWT_SECRET é obrigatório e deve ter pelo menos 32 caracteres, com validação que impede o uso de valores padrão ou hardcoded. A configuração está em src/infrastructure/config/jwt.config.ts, onde o sistema falha explicitamente se JWT_SECRET não estiver configurado ou se tiver menos de 32 caracteres. Tokens JWT têm expiração configurada para 24 horas, reduzindo a janela de ataque caso um token seja comprometido. O sistema também usa criptografia em trânsito através de HSTS configurado explicitamente no Helmet, forçando conexões HTTPS e prevenindo downgrade attacks. Variáveis de ambiente são usadas para todos os secrets, incluindo JWT_SECRET, DATABASE_URL, ASAAS_API_KEY, RESEND_API_KEY e outras credenciais sensíveis, garantindo que não sejam expostas no código-fonte. O sistema também valida a integridade de tokens em cada requisição, verificando assinatura e expiração antes de permitir acesso. Para reset de senha, códigos são gerados usando crypto.randomBytes() em vez de Math.random(), garantindo que sejam criptograficamente seguros e imprevisíveis.
