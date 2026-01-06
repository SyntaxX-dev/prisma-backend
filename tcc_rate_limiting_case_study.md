# Estudo de Caso: Segurança da Informação no Desenvolvimento Web
## Implementação de Rate Limiting em API NestJS

Este documento apresenta um estudo de caso prático sobre a aplicação de técnicas de segurança da informação em um projeto de backend desenvolvido com NestJS. O foco deste primeiro exemplo é a implementação de **Rate Limiting** (Limitação de Taxa) para proteger endpoints críticos contra abusos, ataques de força bruta (brute-force) e negação de serviço (DDoS).

### 1. Contexto do Problema

No início do desenvolvimento, a prioridade muitas vezes é a funcionalidade em si. O endpoint de autenticação (`/auth/login`) é criado para permitir que usuários entrem no sistema. No entanto, sem proteções adequadas, este endpoint se torna um alvo fácil.

Um atacante pode criar um script que tenta milhares de combinações de senha por segundo para uma conta específica (força bruta) ou disparar milhões de requisições para sobrecarregar o servidor (DDoS na camada de aplicação), tornando o serviço indisponível para usuários legítimos.

### 2. Estado Inicial (Antes)

O código abaixo representa a implementação inicial do `AuthController`. Note que não há nenhum mecanismo nativo impedindo que um usuário ou bot chame o método `login` infinitas vezes em um curto período.

**Arquivo:** `src/presentation/http/controllers/auth.controller.ts`

```typescript
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case';
import { LoginDto } from '../dtos/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUser: LoginUserUseCase) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    // VULNERABILIDADE:
    // Não há controle sobre quantas vezes esta função pode ser chamada.
    // Um atacante pode tentar senhas diferentes milhares de vezes por minuto.
    
    const output = await this.loginUser.execute(body);

    return {
      accessToken: output.accessToken,
      user: {
        id: output.user.id,
        nome: output.user.name,
        email: output.user.email,
      },
    };
  }
}
```

### 3. Estado Após Aplicação de Segurança (Depois)

Para mitigar os riscos, aplicamos a técnica de **Rate Limiting**. No ecossistema NestJS, utilizamos o pacote `@nestjs/throttler`. Esta biblioteca monitora o IP de origem das requisições e bloqueia o acesso temporariamente se o limite definido for excedido.

**Alterações Realizadas:**
1.  Configuração do módulo de Throttler (geralmente no `AppModule`, definindo limites globais).
2.  Aplicação do `ThrottlerGuard` no controlador ou rota específica.
3.  Definição de limites estritos para rotas sensíveis (Login).

**Arquivo:** `src/presentation/http/controllers/auth.controller.ts` (Modificado)

```typescript
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler'; // [1] Importação necessária
import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case';
import { LoginDto } from '../dtos/login.dto';

@Controller('auth')
@UseGuards(ThrottlerGuard) // [2] Aplica a proteção a todas as rotas deste controller
export class AuthController {
  constructor(private readonly loginUser: LoginUserUseCase) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  // [3] Definição Específica mais restritiva para Login:
  // Permite apenas 5 tentativas a cada 60 segundos (1 minuto) por IP.
  // Isso inviabiliza ataques de força bruta rápidos.
  @Throttle({ default: { limit: 5, ttl: 60000 } }) 
  async login(@Body() body: LoginDto) {
    const output = await this.loginUser.execute(body);

    return {
      accessToken: output.accessToken,
      user: {
        id: output.user.id,
        nome: output.user.name,
        email: output.user.email,
      },
    };
  }
}
```

### 4. Análise de Impacto

A aplicação desta técnica traz impactos imediatos na segurança e estabilidade da aplicação:

1.  **Mitigação de Força Bruta (Brute-Force):**
    *   **Antes:** Um atacante poderia testar 10.000 senhas em poucos minutos.
    *   **Depois:** O atacante consegue testar apenas 5 senhas por minuto. Se ele exceder esse limite, receberá um erro `429 Too Many Requests`. Para testar 10.000 senhas, ele levaria aproximadamente 33 horas (considerando esperas), tornando o ataque inviável na prática.

2.  **Proteção de Recursos (Anti-DDoS):**
    *   Rotas de login costumam ser "caras" computacionalmente (envolvem hashing de senha com `bcrypt`, consultas ao banco de dados).
    *   Bloquear requisições excessivas na entrada (antes de processar o hash da senha) economiza CPU e memória do servidor, garantindo que o sistema continue respondendo para outros usuários legítimos mesmo sob ataque.

3.  **Experiência do Usuário Legítimo:**
    *   Para um usuário real, errar a senha 5 vezes em 1 minuto é um comportamento atípico, mas possível. O bloqueio temporário serve também como um aviso de segurança. A configuração pode ser ajustada (ex: 10 tentativas) para equilibrar segurança e usabilidade.

### Conclusão do Primeiro Caso

A introdução do Rate Limiting é uma das medidas de "baixa complexidade e alto impacto" mais eficazes em segurança web. Ela transforma uma API aberta e vulnerável em um sistema resiliente capaz de rejeitar tráfego abusivo automaticamente.
