A09 Security Logging and Monitoring Failures

Esta categoria foca na capacidade do sistema de registrar eventos criticos e alertar os administradores sobre comportamentos suspeitos em tempo real. Sem isso, uma invasao pode passar despercebida por meses.

Monitoramento Centralizado de Erros

O NestJS utiliza um GlobalExceptionFilter para capturar e registrar erros que ocorrem em qualquer ponto da aplicacao, centralizando a saida no console (stdout).

Exemplo do seu codigo:
this.logger.error(
  `[${method}] ${path} -> ${status}`,
  exception instanceof Error ? exception.stack : undefined,
);

Por que isso e bom:
Padronizacao: Todo erro 400, 401 ou 500 passa pelo mesmo funil de log.
Compatibilidade com Docker: Ao escrever no stdout, ferramentas como Portainer, Railway ou AWS CloudWatch conseguem capturar os logs automaticamente sem configuracao extra no codigo.
Rastreio Basico: Voce sabe qual rota e qual metodo HTTP gerou o erro.

Protecao contra Vazamento de Dados (CWE-532)

O seu filtro de excecoes possui uma logica condicional para esconder detalhes de erros internos quando o ambiente e de producao (isProduction).

Exemplo do seu codigo:
if (this.options.isProduction && status >= 500) {
  message = 'Erro interno do servidor';
  errorName = undefined;
}

Por que isso e bom:
Sanitizacao: Em desenvolvimento, voce ve o stack trace completo. Em producao, o usuario ve apenas uma mensagem generica.
Seguranca por Ocultacao: Impede que atacantes vejam nomes de tabelas, queries SQL falhas ou caminhos de arquivos internos atraves de mensagens de erro detalhadas.

Logs de Auditoria de Negocio (Implementado)

O sistema agora registra explicitamente eventos de negocio criticos para garantir rastreabilidade (Traceability).

O que foi feito:
Implementamos o Logger do NestJS nos principais casos de uso para registrar sucesso em operacoes criticas:

**1. LoginUserUseCase: Registra quem logou**

```typescript
this.logger.log(
  `Login com sucesso: Usuário ${user.id} (${user.email}) - Role: ${user.role || 'STUDENT'}`,
);
```

**2. RegisterUserUseCase: Registra novos usuários**

```typescript
this.logger.log(
  `Novo usuário registrado: ${user.id} (${user.email}) - Role: ${user.role} - Education: ${user.educationLevel}`,
);
```

**3. UpdateUserProfileUseCase: Registra alterações de dados**

```typescript
this.logger.log(
  `Perfil atualizado para usuário ${input.userId}. Campos alterados: ${Object.keys(input).filter(k => k !== 'userId').join(', ')}`
);
```

Por que isso e bom:
Rastreabilidade: Em caso de incidente, voce consegue reconstruir a historia ("O usuario X logou as 10:00 e alterou seu perfil as 10:05").
Detecao de Anomalias: Facilita identificar picos de logins ou criacao de contas em massa (bots) olhando apenas os logs.
Conformidade: Remove o ponto cego onde acoes de sucesso eram invisiveis para a monitoria.

Alertas em Tempo Real

Atualmente, o sistema depende de voce olhar os logs passivamente. Nao ha configuracao nativa no NestJS para enviar alertas ativos (Slack, Email, SMS) quando uma anomalia ocorre.

Risco:
Ataques de Forca Bruta podem gerar milhares de erros 401 no log, mas se ninguem estiver olhando o terminal naquele momento, o ataque continua.
Solucao sugerida para SaaS: Integrar uma ferramenta de observabilidade (como Sentry ou Datadog) ou criar um Interceptor que envia um webhook para o Discord/Slack sempre que ocorrerem >10 erros 401 do mesmo IP em 1 minuto.
