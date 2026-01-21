# A02:2025 (OWASP) — Security Misconfiguration: Correções Aplicadas

## Objetivo

Reduzir o risco associado à categoria **A02:2025 – Security Misconfiguration**, por meio de endurecimento (hardening) de configuração, redução de exposição desnecessária e padronização do tratamento de erros, preservando a disponibilidade do Swagger em produção com controle de acesso por senha.

---

## 1) Proteção do Swagger em Produção (Senha no `/docs`)

### Problema

O endpoint de documentação (`/docs`) estava disponível sem autenticação, o que aumenta a superfície de ataque (enumeração de rotas, modelos e payloads) e se enquadra como uma configuração insegura típica de ambientes produtivos.

### Correção

Foi adicionada autenticação **HTTP Basic Auth** na rota `/docs`, exigindo usuário e senha para acessar o Swagger.

### Onde foi aplicado

- `src/main.ts`

### Variáveis de ambiente

- `SWAGGER_USER`: usuário do Swagger
- `SWAGGER_PASSWORD`: senha do Swagger

> Recomendação: em produção, definir credenciais fortes e manter essas variáveis como segredos na plataforma de deploy (ex.: Railway).

### Benefícios de segurança

- Reduz exposição de informações de API em produção
- Dificulta reconhecimento e enumeração de endpoints por atacantes

### Trecho de código (Antes vs Depois)

**Antes (Swagger sem autenticação)**

```ts
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);
```

**Depois (Swagger com Basic Auth em `/docs`)**

```ts
// Proteção do Swagger via Basic Auth
const swaggerUser = process.env.SWAGGER_USER || 'admin';
const swaggerPassword = process.env.SWAGGER_PASSWORD || 'admin';

app.use(
  '/docs',
  basicAuth({
    challenge: true,
    users: {
      [swaggerUser]: swaggerPassword,
    },
  }),
);

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);
```

---

## 2) Hardening de Headers HTTP (Helmet)

### Problema

Não havia configuração central de headers de segurança, o que é um ponto comum de **security hardening ausente** (mencionado explicitamente em A02).

### Correção

Foi adicionado **Helmet** como middleware global e desativado o header `X-Powered-By`.

### Onde foi aplicado

- `src/main.ts`

### Benefícios de segurança

- Melhora a postura de segurança padrão da aplicação (headers de proteção)
- Reduz exposição de informações sobre tecnologia utilizada

### Trecho de código (Antes vs Depois)

**Antes (sem Helmet / sem hardening centralizado)**

```ts
// Não existia hardening de headers HTTP aqui
```

**Depois (Helmet + desabilitar `X-Powered-By` no Express)**

```ts
app.use(helmet());

const httpAdapter = app.getHttpAdapter();
const instance = httpAdapter.getInstance();
if (instance && typeof instance.disable === 'function') {
  instance.disable('x-powered-by');
}
```

---

## 3) Logs por Ambiente (Menos Verboso em Produção)

### Problema

O logger estava configurado com nível muito detalhado (`debug`/`verbose`) em todos os ambientes, o que pode gerar excesso de informação em produção e aumentar risco de vazamento operacional.

### Correção

O nível de log passou a ser **condicionado ao ambiente**:

- Produção: `error`, `warn`, `log`
- Desenvolvimento: `error`, `warn`, `log`, `debug`, `verbose`

### Onde foi aplicado

- `src/main.ts`

### Benefícios de segurança

- Reduz risco de vazamento de detalhes internos em logs de produção
- Melhora controle de observabilidade sem expor dados desnecessários

### Trecho de código (Antes vs Depois)

**Antes (logger verboso em todos os ambientes)**

```ts
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log', 'debug', 'verbose'],
});
```

**Depois (logger condicionado ao `NODE_ENV`)**

```ts
const isProduction = process.env.NODE_ENV === 'production';

const app = await NestFactory.create(AppModule, {
  logger: isProduction
    ? ['error', 'warn', 'log']
    : ['error', 'warn', 'log', 'debug', 'verbose'],
});
```

---

## 4) Tratamento Global de Erros (Evitar Vazamento de Detalhes)

### Problema

Erros tratados em controllers retornavam `error.message` diretamente ao cliente em diversos endpoints. Isso pode expor detalhes internos (bibliotecas, integrações, mensagens de banco, etc.), o que é um dos pontos citados em A02 (“excessive error messages”, “stack traces”, etc.).

### Correção

Foi criado um filtro global de exceções que:

- Padroniza respostas de erro
- Em produção, para erros \(>= 500\), retorna mensagem genérica **sem detalhes internos**
- Mantém log interno no servidor para diagnóstico

### Onde foi aplicado

- `src/presentation/http/filters/global-exception.filter.ts`
- Registrado globalmente em `src/main.ts`

### Benefícios de segurança

- Reduz vazamento de informações sensíveis para o cliente
- Centraliza governança de erros e facilita auditoria

### Trecho de código (Antes vs Depois)

**Antes (sem filtro global; vazamento dependia de cada controller)**

```ts
// Não existia filtro global registrado em main.ts
```

**Depois (registro do filtro global)**

```ts
app.useGlobalFilters(new GlobalExceptionFilter({ isProduction }));
```

**Depois (implementação do filtro global – resumo)**

```ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : 500;

    // Em produção, evita vazar detalhes para erros >= 500
    let message: string | string[] = 'Erro interno do servidor';
    if (isHttpException) {
      const res = exception.getResponse();
      // extrai message/error do padrão do Nest
      // ...
      if (process.env.NODE_ENV === 'production' && status >= 500) {
        message = 'Erro interno do servidor';
      }
    }

    // Resposta padronizada
    // response.status(status).json({ statusCode, timestamp, path, message })
  }
}
```

---

## 5) Redução de Vazamento de Mensagens de Erro em Controllers

### Problema

Diversos controllers retornavam `error.message` diretamente.

### Correção

Nos controllers ajustados, a mensagem retornada ao cliente passou a ser **condicionada ao ambiente**:

- Produção: mensagem genérica (“Erro ao processar a requisição”)
- Desenvolvimento: mantém `error.message` para facilitar debugging

### Onde foi aplicado

- `src/presentation/http/controllers/courses.controller.ts`
- `src/presentation/http/controllers/modules.controller.ts`
- `src/presentation/http/controllers/progress.controller.ts`
- `src/presentation/http/controllers/communities.controller.ts`
- `src/presentation/http/controllers/messages.controller.ts`

### Benefícios de segurança

- Reduz exposição de detalhes internos em produção
- Mantém ergonomia de desenvolvimento em ambiente local

### Trecho de código (Antes vs Depois)

**Antes (retornava `error.message` diretamente)**

```ts
throw new HttpException(
  {
    success: false,
    message: error.message,
  },
  HttpStatus.BAD_REQUEST,
);
```

**Depois (mensagem genérica em produção; detalhada em dev)**

```ts
throw new HttpException(
  {
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Erro ao processar a requisição'
        : error.message,
  },
  HttpStatus.BAD_REQUEST,
);
```

---

## Checklist de Validação (Operacional)

- Em produção, acessar `/docs` exige autenticação Basic Auth
- Em produção, respostas de erro não retornam stack traces/detalhes internos para o cliente
- Headers de hardening estão ativos (Helmet)
- Níveis de log estão compatíveis com o ambiente (`NODE_ENV=production`)
- Variáveis `SWAGGER_USER` e `SWAGGER_PASSWORD` configuradas como segredo no deploy

