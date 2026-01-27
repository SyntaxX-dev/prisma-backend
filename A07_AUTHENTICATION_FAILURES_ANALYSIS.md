# A07:2025 (OWASP) — Falhas de Autenticação: Análise e Melhorias

## Objetivo

Analisar o projeto em relação à categoria **A07:2025 – Identification and Authentication Failures**, identificando proteções existentes, pontos de melhoria e recomendações para implementação de autenticação segura, prevenção de ataques automatizados e gerenciamento adequado de sessões.

---

## 📋 Contexto do A07:2025

As **Falhas de Autenticação** ocorrem quando um atacante consegue enganar o sistema para ser reconhecido como um usuário legítimo. Esta categoria mantém sua posição em #7 no ranking OWASP Top 10 2025.

**Principais riscos:**
- Ataques automatizados (credential stuffing, password spray)
- Força bruta sem limitação
- Credenciais fracas ou padrão
- Recuperação insegura de senha
- Armazenamento inseguro de senhas
- Falta de MFA
- Sessões inseguras

---

## ✅ Proteções Já Implementadas

### 1) Armazenamento Seguro de Senhas com Bcrypt ✅

**Status:** ✅ **Bem implementado**

O projeto usa bcrypt com salt automático para hash de senhas:

```typescript
// src/infrastructure/services/bcrypt-password-hasher.ts
async hash(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);  // Salt automático de 10 rounds
  return bcrypt.hash(plain, salt);
}

async compare(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

**Por que isso é bom:**
- ✅ **Nunca armazena senhas em texto plano** - conforme A07:2025
- ✅ **Salt automático** - cada senha tem salt único, protege contra rainbow tables
- ✅ **10 rounds** - torna ataques de força bruta computacionalmente inviáveis
- ✅ **Algoritmo seguro** - bcrypt é amplamente aceito e seguro

**Cenário de proteção:**
Se o banco de dados for vazado, as senhas estão protegidas por hash bcrypt. Um atacante precisaria de anos para descobrir senhas fortes usando força bruta, mesmo com o hash em mãos.

---

### 2) Mensagens de Erro Genéricas ✅

**Status:** ✅ **Bem implementado**

O sistema usa mensagens genéricas para prevenir enumeração de contas:

```typescript
// src/application/use-cases/login-user.use-case.ts
async execute(input: LoginInput): Promise<LoginOutput> {
  const user = await this.userRepository.findByEmail(input.email);
  if (!user) {
    throw new UnauthorizedException('Credenciais inválidas'); // ✅ Genérico
  }

  const valid = await this.passwordHasher.compare(...);
  if (!valid) {
    throw new UnauthorizedException('Credenciais inválidas'); // ✅ Genérico
  }
}
```

**Por que isso é bom:**
- ✅ **Previne enumeração de contas** - atacante não sabe se email existe ou se senha está errada
- ✅ **Mensagem única** - mesma mensagem para usuário não encontrado e senha incorreta
- ✅ **Conformidade com NIST 800-63b** - não revela informações sobre existência de contas

**Cenário de proteção:**
Atacante tenta descobrir se um email existe no sistema. Sempre recebe "Credenciais inválidas", independente de o email existir ou não, impedindo enumeração de contas.

---

### 3) Política de Senhas com Validação de Complexidade ✅

**Status:** ✅ **Bem implementado**

O sistema valida força de senhas usando regex e comprimento mínimo:

```typescript
// src/presentation/http/dtos/login.dto.ts
export class LoginDto {
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&)',
  })
  password!: string;
}
```

**Por que isso é bom:**
- ✅ **Comprimento mínimo** - 8 caracteres (pode ser aumentado conforme NIST)
- ✅ **Complexidade** - exige maiúscula, minúscula, número e caractere especial
- ✅ **Validação no DTO** - rejeita senhas fracas antes de processar
- ✅ **Aplicado em múltiplos lugares** - LoginDto, ResetPasswordDto, RegisterUserDto

**Nota:** A política atual usa complexidade (maiúscula, minúscula, número, especial). O NIST 800-63b recomenda priorizar comprimento sobre complexidade, mas a política atual ainda é aceitável e segura.

---

### 4) Gerenciamento de Sessão com JWT ✅

**Status:** ✅ **Bem implementado**

O sistema usa JWT para gerenciamento de sessão com expiração e validação:

```typescript
// src/infrastructure/config/jwt.config.ts
export class JwtConfiguration {
  static loadFromEnv(): JwtConfig {
    const secret = process.env.JWT_SECRET;
    // ✅ Validação obrigatória e tamanho mínimo
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET obrigatório e deve ter 32+ caracteres');
    }
    
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h'; // ✅ Expiração
    return { secret, expiresIn };
  }
}

// src/infrastructure/auth/jwt.strategy.ts
async validate(payload: JwtPayload): Promise<JwtPayload> {
  // ✅ Validação de payload obrigatório
  if (!payload.sub || !payload.email || !payload.role) {
    throw new UnauthorizedException('Token inválido');
  }
  return payload;
}
```

**Por que isso é bom:**
- ✅ **IDs de sessão aleatórios** - JWT gera tokens únicos e imprevisíveis
- ✅ **Expiração configurada** - tokens expiram em 24 horas, reduzindo janela de ataque
- ✅ **Validação de assinatura** - tokens não podem ser forjados sem JWT_SECRET
- ✅ **Não expõe ID na URL** - tokens são enviados via header Authorization
- ✅ **Validação de payload** - garante que tokens têm campos obrigatórios

**Cenário de proteção:**
Atacante intercepta token JWT. Mesmo com o token, não consegue forjar novos tokens sem conhecer JWT_SECRET. Token expira em 24 horas, limitando janela de ataque.

---

### 5) Validação de Tokens JWT em Múltiplos Pontos ✅

**Status:** ✅ **Bem implementado**

O sistema valida tokens em múltiplas camadas:

```typescript
// HTTP endpoints
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@CurrentUser() user: JwtPayload) { ... }

// WebSocket connections
@WebSocketGateway()
export class ChatGateway {
  async handleConnection(@ConnectedSocket() client: Socket) {
    await this.wsJwtGuard.canActivate(...); // ✅ Valida JWT
  }
}

// Validação de payload
async validate(payload: JwtPayload): Promise<JwtPayload> {
  if (!payload.sub || !payload.email || !payload.role) {
    throw new UnauthorizedException('Token inválido'); // ✅ Valida campos
  }
  return payload;
}
```

**Por que isso é bom:**
- ✅ **Validação em HTTP** - JwtAuthGuard protege endpoints REST
- ✅ **Validação em WebSocket** - WsJwtGuard protege conexões WebSocket
- ✅ **Validação de campos** - verifica que payload tem campos obrigatórios
- ✅ **Verificação de expiração** - tokens expirados são rejeitados automaticamente

---

### 6) Sem Credenciais Hardcoded em Código de Produção ✅

**Status:** ✅ **Bem implementado (com ressalvas)**

O sistema não usa credenciais hardcoded em código de produção:

```typescript
// src/infrastructure/config/jwt.config.ts
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET não configurado...'); // ✅ Falha se não configurado
}
// ✅ Sem fallback hardcoded
```

**Ressalva:** Scripts de seed têm credenciais padrão, mas são apenas para desenvolvimento:

```javascript
// scripts/seed-admin.js (apenas para desenvolvimento)
const adminData = {
  email: 'admin@admin.com',
  password: 'Admin123!@#',
};
// ⚠️ Apenas para desenvolvimento - não usado em produção
```

**Por que isso é bom:**
- ✅ **JWT_SECRET obrigatório** - sistema não inicia sem configuração
- ✅ **Validação de tamanho** - exige pelo menos 32 caracteres
- ✅ **Variáveis de ambiente** - todos os secrets vêm de variáveis de ambiente
- ✅ **Sem fallbacks inseguros** - não usa valores padrão se variável não estiver configurada

---

### 7) Recuperação de Senha Segura ✅

**Status:** ✅ **Bem implementado**

O sistema implementa recuperação de senha usando códigos criptograficamente seguros:

```typescript
// src/infrastructure/services/password-reset.service.ts
async generateResetCode(email: string): Promise<string> {
  // ✅ Código gerado com crypto.randomBytes() (não Math.random())
  const code = CryptoUtil.randomNumericCode(6);
  
  // ✅ Expiração de 15 minutos
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);
  
  // ✅ Armazena código com expiração
  this.resetCodes.set(email, { code, expiresAt, email });
  
  // ✅ Envia por email (não SMS ou perguntas de segurança)
  await this.sendResetEmail(user.name, email, code);
}
```

**Por que isso é bom:**
- ✅ **Códigos criptograficamente seguros** - usa crypto.randomBytes(), não Math.random()
- ✅ **Expiração curta** - 15 minutos reduz janela de ataque
- ✅ **Sem perguntas de segurança** - não usa conhecimento baseado (nome do cachorro, etc.)
- ✅ **Reenvio com rate limiting** - previne spam de códigos

---

## ⚠️ Pontos de Melhoria Identificados

### 1) Falta de Rate Limiting no Endpoint de Login ❌

**Problema:** O endpoint `/auth/login` não tem rate limiting implementado atualmente.

**Impacto:**
- Atacantes podem fazer força bruta sem limitação
- Credential stuffing e password spray são viáveis
- Sistema pode ser sobrecarregado com requisições de login

**Recomendação:**

Implementar rate limiting específico para login:

```typescript
// src/infrastructure/guards/login-rate-limit.guard.ts
@Injectable()
export class LoginRateLimitGuard extends RateLimitGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const keyGenerator = (ctx: ExecutionContext) => {
      const req = ctx.switchToHttp().getRequest();
      const email = req.body?.email || 'unknown';
      const ip = req.ip || req.connection.remoteAddress;
      // Rate limit por email E por IP (defense in depth)
      return `login:${email.toLowerCase()}:${ip}`;
    };

    // Limite: 5 tentativas por 15 minutos por email/IP
    return this.canActivateWithOptions(context, {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 5,
      keyGenerator,
    });
  }
}
```

```typescript
// src/presentation/http/controllers/auth.controller.ts
@Post('login')
@UseGuards(LoginRateLimitGuard) // ✅ Adicionar
@HttpCode(HttpStatus.OK)
async login(@Body() body: LoginDto) { ... }
```

**Onde aplicar:**
- Criar `src/infrastructure/guards/login-rate-limit.guard.ts`
- Aplicar guard no endpoint `/auth/login`
- Configurar limites apropriados (5 tentativas por 15 minutos)

---

### 2) Política de Senha Pode Ser Alinhada com NIST 800-63b ⚠️

**Status:** ⚠️ **Parcialmente alinhado**

**Problema:** A política atual prioriza complexidade sobre comprimento, enquanto NIST 800-63b recomenda priorizar comprimento.

**Política atual:**
- Mínimo 8 caracteres
- Exige maiúscula, minúscula, número e caractere especial

**Recomendação NIST 800-63b:**
- Priorizar comprimento (mínimo 8, ideal 12+)
- Não forçar complexidade excessiva
- Não forçar rotação periódica de senhas

**Recomendação:**

Manter política atual (já é segura) ou ajustar para alinhar melhor com NIST:

```typescript
// Opção 1: Manter atual (já é segura)
@MinLength(8)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)

// Opção 2: Alinhar com NIST (priorizar comprimento)
@MinLength(12) // Aumentar comprimento mínimo
// Remover ou simplificar regex de complexidade
```

**Nota:** A política atual é segura e aceitável. A mudança para NIST é opcional e pode ser feita no futuro.

---

### 3) Falta de Verificação contra Lista de Senhas Comuns ⚠️

**Problema:** O sistema não verifica senhas contra listas de senhas comuns ou vazamentos conhecidos.

**Impacto:**
- Usuários podem usar senhas comuns como "Senha123" ou "12345678"
- Senhas vazadas em outros sites podem ser reutilizadas

**Recomendação:**

Integrar verificação contra listas de senhas comuns:

```typescript
// src/infrastructure/services/password-validator.service.ts
@Injectable()
export class PasswordValidatorService {
  private readonly COMMON_PASSWORDS = [
    'password', '12345678', 'senha123', 'admin123',
    // ... lista das 10.000 piores senhas
  ];

  async validatePasswordStrength(password: string): Promise<boolean> {
    // Verificar contra lista de senhas comuns
    if (this.COMMON_PASSWORDS.includes(password.toLowerCase())) {
      throw new BadRequestException(
        'Esta senha é muito comum. Escolha uma senha mais segura.'
      );
    }

    // Opcional: Verificar contra Have I Been Pwned API
    // const isPwned = await this.checkHaveIBeenPwned(password);
    // if (isPwned) {
    //   throw new BadRequestException(
    //     'Esta senha foi encontrada em vazamentos de dados. Escolha uma senha diferente.'
    //   );
    // }

    return true;
  }
}
```

**Onde aplicar:**
- Criar serviço de validação de senha
- Integrar no fluxo de registro e reset de senha
- Opcionalmente integrar com Have I Been Pwned API

---

### 4) Falta de MFA (Autenticação Multifator) ❌

**Problema:** O sistema não implementa MFA (Multi-Factor Authentication).

**Impacto:**
- Apenas senha protege contas (single factor)
- Senhas comprometidas permitem acesso imediato
- Não há camada adicional de proteção

**Recomendação:**

Implementar MFA opcional ou obrigatório para contas sensíveis:

```typescript
// Estrutura sugerida para MFA
interface MFAConfig {
  enabled: boolean;
  method: 'TOTP' | 'SMS' | 'EMAIL';
  secret?: string; // Para TOTP
}

// Endpoint para habilitar MFA
@Post('mfa/enable')
@UseGuards(JwtAuthGuard)
async enableMFA(@CurrentUser() user: JwtPayload) {
  // Gerar secret TOTP
  // Retornar QR code para configurar no app autenticador
}

// Login com MFA
@Post('login')
async login(@Body() body: LoginDto & { mfaCode?: string }) {
  // Validar senha
  // Se MFA habilitado, validar código MFA
  // Gerar token apenas se ambos validarem
}
```

**Onde aplicar:**
- Criar módulo de MFA
- Adicionar campos na tabela users (mfaEnabled, mfaSecret)
- Implementar TOTP (Time-based One-Time Password) usando biblioteca como `speakeasy`
- Adicionar validação de código MFA no login

**Prioridade:** Média (pode ser implementado no futuro)

---

### 5) Logout Não Invalida Token JWT ⚠️

**Status:** ⚠️ **Comportamento esperado de JWT, mas pode ser melhorado**

**Problema:** O logout atual apenas marca usuário como offline, mas não invalida o token JWT. Tokens continuam válidos até expirarem.

**Impacto:**
- Tokens roubados continuam funcionando mesmo após logout
- Não há revogação imediata de tokens

**Recomendação:**

Implementar blacklist de tokens ou usar refresh tokens:

```typescript
// Opção 1: Blacklist de tokens (usando Redis)
@Post('logout')
@UseGuards(JwtAuthGuard)
async logout(@CurrentUser() user: JwtPayload, @Headers('authorization') auth: string) {
  const token = auth.replace('Bearer ', '');
  
  // Adicionar token à blacklist no Redis
  await this.redisService.getClient().setex(
    `blacklist:${token}`,
    24 * 60 * 60, // 24 horas (mesmo tempo de expiração do token)
    '1'
  );
  
  // Marcar usuário como offline
  await this.chatGateway.setUserOffline(user.sub);
  
  return { success: true, message: 'Logout realizado com sucesso' };
}

// Modificar JwtAuthGuard para verificar blacklist
async canActivate(context: ExecutionContext): Promise<boolean> {
  const token = this.extractTokenFromHeader(request);
  
  // Verificar se token está na blacklist
  const isBlacklisted = await this.redisService.getClient().get(`blacklist:${token}`);
  if (isBlacklisted) {
    throw new UnauthorizedException('Token revogado');
  }
  
  // ... resto da validação
}
```

**Onde aplicar:**
- Modificar endpoint de logout para adicionar token à blacklist
- Modificar JwtAuthGuard para verificar blacklist antes de validar token
- Usar Redis para armazenar blacklist (TTL igual ao tempo de expiração do token)

---

### 6) Falta de Timeout de Sessão por Inatividade ⚠️

**Problema:** Tokens JWT têm expiração fixa (24 horas), mas não há timeout por inatividade.

**Impacto:**
- Usuário que esquece de fazer logout mantém sessão ativa por 24 horas
- Em computadores públicos, sessão pode ser usada por terceiros

**Recomendação:**

Implementar refresh tokens com timeout por inatividade:

```typescript
// Estrutura sugerida
interface TokenPair {
  accessToken: string;  // Expira em 15 minutos
  refreshToken: string; // Expira em 7 dias
}

// Login retorna ambos
async login() {
  const accessToken = this.generateToken(payload, '15m');
  const refreshToken = this.generateToken(payload, '7d');
  
  // Armazenar refresh token no banco com lastUsed
  await this.saveRefreshToken(userId, refreshToken);
  
  return { accessToken, refreshToken };
}

// Endpoint para renovar access token
@Post('auth/refresh')
async refresh(@Body() body: { refreshToken: string }) {
  // Validar refresh token
  // Verificar lastUsed (se inativo por 30 minutos, invalidar)
  // Gerar novo access token
}
```

**Onde aplicar:**
- Implementar refresh tokens
- Adicionar tabela refresh_tokens no banco
- Criar endpoint /auth/refresh
- Modificar frontend para renovar tokens automaticamente

**Prioridade:** Baixa (pode ser implementado no futuro)

---

### 7) Seed de Admin com Credenciais Padrão ⚠️

**Status:** ⚠️ **Apenas para desenvolvimento**

**Problema:** Script `scripts/seed-admin.js` cria admin com credenciais padrão.

**Código atual:**
```javascript
const adminData = {
  email: 'admin@admin.com',
  password: 'Admin123!@#',
};
```

**Recomendação:**

Modificar script para usar variáveis de ambiente em produção:

```javascript
// scripts/seed-admin.js
const adminData = {
  email: process.env.ADMIN_EMAIL || 'admin@admin.com',
  password: process.env.ADMIN_PASSWORD || 'Admin123!@#',
};

// Em produção, exigir variáveis de ambiente
if (process.env.NODE_ENV === 'production') {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL e ADMIN_PASSWORD devem ser configurados em produção');
  }
  
  // Validar força da senha
  if (process.env.ADMIN_PASSWORD.length < 12) {
    throw new Error('ADMIN_PASSWORD deve ter pelo menos 12 caracteres em produção');
  }
}
```

**Onde aplicar:**
- Modificar `scripts/seed-admin.js`
- Documentar que credenciais padrão são apenas para desenvolvimento
- Exigir variáveis de ambiente em produção

---

## 📊 Resumo: Onde o Projeto Está

### ✅ Pontos Fortes (Já Implementados)

1. **Armazenamento seguro de senhas** - bcrypt com salt automático
2. **Mensagens de erro genéricas** - previne enumeração de contas
3. **Política de senhas** - validação de complexidade e comprimento
4. **Gerenciamento de sessão JWT** - tokens com expiração e validação
5. **Validação de tokens** - múltiplas camadas de validação
6. **Sem credenciais hardcoded** - JWT_SECRET obrigatório
7. **Recuperação de senha segura** - códigos criptograficamente seguros

### ⚠️ Pontos de Melhoria

1. **Rate limiting no login** - falta implementação (prioridade alta)
2. **Verificação de senhas comuns** - falta integração (prioridade média)
3. **MFA** - não implementado (prioridade média)
4. **Logout com invalidação** - tokens não são revogados (prioridade média)
5. **Timeout por inatividade** - não implementado (prioridade baixa)
6. **Seed de admin** - credenciais padrão apenas para dev (prioridade baixa)

---

## 🎯 Plano de Ação Recomendado

### Prioridade Alta

1. **Implementar rate limiting no endpoint de login**
   - Criar `LoginRateLimitGuard`
   - Aplicar no endpoint `/auth/login`
   - Configurar limite de 5 tentativas por 15 minutos

### Prioridade Média

2. **Implementar verificação de senhas comuns**
   - Criar serviço de validação de senha
   - Integrar lista das 10.000 piores senhas
   - Opcionalmente integrar com Have I Been Pwned API

3. **Implementar logout com invalidação de tokens**
   - Adicionar blacklist de tokens no Redis
   - Modificar JwtAuthGuard para verificar blacklist
   - Invalidar token no logout

4. **Melhorar seed de admin**
   - Exigir variáveis de ambiente em produção
   - Validar força da senha em produção

### Prioridade Baixa

5. **Implementar MFA (opcional)**
   - Adicionar suporte a TOTP
   - Criar endpoints para habilitar/desabilitar MFA
   - Adicionar validação de código MFA no login

6. **Implementar refresh tokens com timeout por inatividade**
   - Criar sistema de refresh tokens
   - Adicionar timeout por inatividade
   - Modificar frontend para renovar tokens

---

## 📝 Exemplos de Implementação

### Exemplo 1: Rate Limiting para Login

```typescript
// src/infrastructure/guards/login-rate-limit.guard.ts
import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';
import { REDIS_SERVICE } from '../../domain/tokens';
import type { RedisService } from '../../infrastructure/redis/services/redis.service';

@Injectable()
export class LoginRateLimitGuard extends RateLimitGuard {
  constructor(
    @Inject(REDIS_SERVICE)
    protected readonly redisService: RedisService,
  ) {
    super(redisService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const keyGenerator = (ctx: ExecutionContext) => {
      const req = ctx.switchToHttp().getRequest();
      const email = req.body?.email || 'unknown';
      const ip = req.ip || req.connection.remoteAddress;
      // Rate limit por email E por IP (defense in depth)
      return `login:${email.toLowerCase()}:${ip}`;
    };

    // Limite: 5 tentativas por 15 minutos
    return this.canActivateWithOptions(context, {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 5,
      keyGenerator,
    });
  }
}
```

```typescript
// src/presentation/http/controllers/auth.controller.ts
import { LoginRateLimitGuard } from '../../../infrastructure/guards/login-rate-limit.guard';

@Post('login')
@UseGuards(LoginRateLimitGuard) // ✅ Adicionar
@HttpCode(HttpStatus.OK)
async login(@Body() body: LoginDto) {
  // ... implementação atual
}
```

---

### Exemplo 2: Validação de Senhas Comuns

```typescript
// src/infrastructure/services/password-validator.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PasswordValidatorService {
  private commonPasswords: Set<string>;

  constructor() {
    // Carregar lista de senhas comuns (pode ser de arquivo ou API)
    const commonPasswordsList = [
      'password', '12345678', 'senha123', 'admin123',
      'password123', '123456789', 'qwerty123', 'abc123',
      // ... lista das 10.000 piores senhas
    ];
    this.commonPasswords = new Set(commonPasswordsList.map(p => p.toLowerCase()));
  }

  async validatePasswordStrength(password: string): Promise<void> {
    // Verificar contra lista de senhas comuns
    if (this.commonPasswords.has(password.toLowerCase())) {
      throw new BadRequestException(
        'Esta senha é muito comum e foi encontrada em vazamentos de dados. Por favor, escolha uma senha mais segura e única.',
      );
    }

    // Opcional: Verificar contra Have I Been Pwned API
    // const pwnedCount = await this.checkHaveIBeenPwned(password);
    // if (pwnedCount > 0) {
    //   throw new BadRequestException(
    //     `Esta senha foi encontrada em ${pwnedCount} vazamentos de dados. Por favor, escolha uma senha diferente.`,
    //   );
    // }
  }

  // Método opcional para verificar Have I Been Pwned
  private async checkHaveIBeenPwned(password: string): Promise<number> {
    // Implementar verificação contra Have I Been Pwned API
    // Usar k-anonymity para não enviar senha completa
    // Retornar número de vezes que senha foi encontrada
    return 0;
  }
}
```

```typescript
// src/application/subscriptions/use-cases/register-with-token.use-case.ts
constructor(
  // ... outros
  private readonly passwordValidator: PasswordValidatorService, // ✅ Adicionar
) {}

async execute(input: RegisterWithTokenInput) {
  // ... validações existentes
  
  // ✅ Validar força da senha
  await this.passwordValidator.validatePasswordStrength(password);
  
  // ... resto do fluxo
}
```

---

### Exemplo 3: Logout com Invalidação de Tokens

```typescript
// src/presentation/http/controllers/auth.controller.ts
@Post('logout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
async logout(
  @CurrentUser() user: JwtPayload,
  @Headers('authorization') auth: string,
) {
  // Extrair token do header
  const token = auth?.replace('Bearer ', '') || '';
  
  if (token && this.redisService) {
    // Adicionar token à blacklist no Redis
    // TTL igual ao tempo de expiração do token (24 horas)
    const ttl = 24 * 60 * 60; // 24 horas em segundos
    await this.redisService.getClient().setex(
      `blacklist:${token}`,
      ttl,
      '1',
    );
  }
  
  // Marcar usuário como offline
  if (this.chatGateway) {
    await this.chatGateway.setUserOffline(user.sub);
  }
  
  return {
    success: true,
    message: 'Logout realizado com sucesso',
  };
}
```

```typescript
// src/infrastructure/auth/jwt.strategy.ts
async validate(payload: JwtPayload, request?: any): Promise<JwtPayload> {
  // Verificar se token está na blacklist (se Redis disponível)
  if (request && this.redisService) {
    const token = this.extractTokenFromRequest(request);
    if (token) {
      const isBlacklisted = await this.redisService
        .getClient()
        .get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token revogado');
      }
    }
  }
  
  // Validação de payload
  if (!payload.sub || !payload.email || !payload.role) {
    throw new UnauthorizedException('Token inválido');
  }
  
  return payload;
}
```

---

## 🔍 Checklist de Validação

### Autenticação

- [ ] Rate limiting implementado no endpoint de login
- [ ] Mensagens de erro genéricas (não revelam se email existe)
- [ ] Política de senhas implementada e validada
- [ ] Senhas nunca armazenadas em texto plano
- [ ] Bcrypt com salt automático configurado
- [ ] JWT com expiração configurada
- [ ] Tokens validados em múltiplas camadas
- [ ] Logout invalida tokens (blacklist)

### Sessão

- [ ] IDs de sessão aleatórios e imprevisíveis
- [ ] Tokens não expostos na URL
- [ ] Expiração de tokens configurada
- [ ] Validação de payload em tokens
- [ ] Timeout por inatividade (opcional)

### Credenciais

- [ ] Sem credenciais hardcoded em produção
- [ ] JWT_SECRET obrigatório e validado
- [ ] Variáveis de ambiente para todos os secrets
- [ ] Seed de admin usa variáveis de ambiente em produção

---

## 📚 Referências

- [OWASP Top 10 2025 - A07: Identification and Authentication Failures](https://owasp.org/www-project-top-ten/)
- [NIST 800-63b - Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
- [Have I Been Pwned API](https://haveibeenpwned.com/API/v3)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## Conclusão

O projeto **já possui uma base sólida de autenticação segura** com:
- ✅ Armazenamento seguro de senhas (bcrypt)
- ✅ Mensagens de erro genéricas
- ✅ Política de senhas
- ✅ Gerenciamento de sessão JWT
- ✅ Validação de tokens

**Principais melhorias recomendadas:**
1. **Rate limiting no login** (prioridade alta)
2. **Verificação de senhas comuns** (prioridade média)
3. **Logout com invalidação de tokens** (prioridade média)
4. **MFA opcional** (prioridade baixa)

Com essas melhorias, o projeto estará totalmente alinhado com os princípios de **autenticação segura** do A07:2025.

---

## Proteções Implementadas para CWEs Notáveis do A07:2025

O projeto implementa proteções específicas para as CWEs notáveis mencionadas no A07:2025. Esta seção descreve como cada CWE é tratada no código atual.

### CWE-259: Uso de Senha Hard-coded

O projeto protege contra uso de senhas hardcoded através de validação obrigatória de variáveis de ambiente e ausência de fallbacks inseguros. O JWT_SECRET é obrigatório e deve ser configurado via variável de ambiente, com validação que impede o uso de valores padrão ou hardcoded. A configuração está em src/infrastructure/config/jwt.config.ts, onde o sistema falha explicitamente se JWT_SECRET não estiver configurado ou se tiver menos de 32 caracteres. O sistema também não usa senhas padrão em código de produção. O script scripts/seed-admin.js tem credenciais padrão, mas são apenas para desenvolvimento e devem ser substituídas por variáveis de ambiente em produção. Todas as outras credenciais sensíveis, como DATABASE_URL, ASAAS_API_KEY, RESEND_API_KEY, são gerenciadas através de variáveis de ambiente, garantindo que não sejam expostas no código-fonte. O sistema também valida a força de senhas através de regex e comprimento mínimo, impedindo uso de senhas muito fracas que poderiam ser consideradas "padrão".

### CWE-287: Autenticação Imprópria

O projeto implementa autenticação adequada através de múltiplas camadas de validação e verificação. O sistema usa JWT para autenticação, com validação de assinatura usando JWT_SECRET obrigatório e de tamanho adequado. Tokens são validados em múltiplos pontos, incluindo JwtAuthGuard para endpoints HTTP e WsJwtGuard para conexões WebSocket. A validação de payload verifica que tokens têm campos obrigatórios como sub, email e role antes de permitir acesso. O sistema também valida credenciais de forma segura, usando bcrypt para comparar senhas sem expor hashes. Mensagens de erro são genéricas para prevenir enumeração de contas, retornando "Credenciais inválidas" tanto para usuário não encontrado quanto para senha incorreta. O sistema também verifica estado da assinatura antes de permitir login, garantindo que apenas usuários com assinatura ativa possam acessar. A autenticação é implementada de forma que não confia em dados do cliente, sempre validando tokens e credenciais no servidor antes de permitir acesso.

### CWE-384: Fixação de Sessão

O projeto protege contra fixação de sessão através de geração de tokens únicos e imprevisíveis para cada login. O sistema usa JWT que são gerados com payload único contendo userId, email e role, garantindo que cada sessão tenha um token diferente. Tokens são gerados usando JWT_SECRET que é único por ambiente, impedindo que tokens de um ambiente funcionem em outro. O sistema também não reutiliza IDs de sessão, gerando novo token a cada login bem-sucedido. Tokens têm expiração configurada para 24 horas, limitando a janela de ataque caso um token seja comprometido. O sistema também valida tokens em cada requisição, verificando assinatura e expiração antes de permitir acesso. Para WebSocket, o sistema valida token na conexão e não permite reutilização de tokens expirados ou inválidos. O logout marca usuário como offline, mas tokens não são invalidados imediatamente, o que pode ser melhorado com implementação de blacklist.

### CWE-798: Uso de Credenciais Hard-coded

O projeto protege contra uso de credenciais hardcoded através de validação obrigatória de variáveis de ambiente e ausência de valores padrão inseguros. O JWT_SECRET é obrigatório e deve ser configurado, com validação que impede o uso de valores padrão ou hardcoded. A configuração está em src/infrastructure/config/jwt.config.ts, onde o sistema falha explicitamente se JWT_SECRET não estiver configurado, forçando configuração adequada em produção. O sistema também valida o tamanho mínimo do JWT_SECRET, exigindo pelo menos 32 caracteres para garantir segurança adequada. Todas as outras credenciais sensíveis são gerenciadas através de variáveis de ambiente, incluindo DATABASE_URL, ASAAS_API_KEY, RESEND_API_KEY, SMTP credentials e outras. O sistema não armazena credenciais em código-fonte, usando sempre variáveis de ambiente que são configuradas no ambiente de deploy. Scripts de seed têm credenciais padrão apenas para desenvolvimento, mas devem ser substituídas por variáveis de ambiente em produção. O sistema também não usa fallbacks inseguros, falhando explicitamente se credenciais críticas não estiverem configuradas, em vez de usar valores padrão que poderiam ser conhecidos.
