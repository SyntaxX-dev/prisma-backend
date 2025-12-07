# Integração Asaas - Prisma Academy

## Configuração

Adicione as seguintes variáveis de ambiente:

```env
# Asaas - Gateway de Pagamentos
# Ambiente: 'sandbox' ou 'production'
ASAAS_ENVIRONMENT=sandbox

# Chave da API (obtenha em https://www.asaas.com/customerApiSettings)
# Sandbox: começa com $aact_hmlg_
# Produção: começa com $aact_
ASAAS_API_KEY=sua_chave_api_aqui

# Token para validação de webhooks (opcional, mas recomendado)
# Você pode gerar qualquer string segura
ASAAS_WEBHOOK_TOKEN=seu_token_webhook_aqui

# URL do frontend (para links nos emails)
FRONTEND_URL=http://localhost:3000
```

## URLs do Asaas

| Ambiente   | URL Base                          |
| ---------- | --------------------------------- |
| Sandbox    | https://api-sandbox.asaas.com/v3  |
| Produção   | https://api.asaas.com/v3          |

## Endpoints Criados

### Públicos (sem autenticação)

| Método | Rota                          | Descrição                        |
| ------ | ----------------------------- | -------------------------------- |
| GET    | /subscriptions/plans          | Lista planos disponíveis         |
| POST   | /subscriptions/checkout       | Cria checkout de assinatura      |
| POST   | /subscriptions/webhook        | Recebe webhooks do Asaas         |
| POST   | /subscriptions/validate-token | Valida token de registro         |
| POST   | /subscriptions/register       | Registra usuário com token       |

### Protegidos (requer autenticação)

| Método | Rota                              | Descrição                           |
| ------ | --------------------------------- | ----------------------------------- |
| GET    | /subscriptions/me                 | Dados da assinatura do usuário      |
| GET    | /subscriptions/check-access       | Verifica acesso e limites de IA     |
| POST   | /subscriptions/cancel             | Cancela assinatura                  |
| POST   | /subscriptions/change-plan        | Solicita mudança de plano           |
| POST   | /subscriptions/cancel-plan-change | Cancela mudança de plano pendente   |

## Fluxo de Assinatura

1. **Checkout**: Usuário escolhe plano → POST /subscriptions/checkout
2. **Pagamento**: Usuário paga via PIX ou Cartão
3. **Webhook**: Asaas notifica pagamento → POST /subscriptions/webhook
4. **Email**: Sistema envia link de registro para o email
5. **Registro**: Usuário acessa link e completa cadastro → POST /subscriptions/register
6. **Login**: Usuário faz login normalmente

## Planos

| Plano | Preço   | Limite IA              |
| ----- | ------- | ---------------------- |
| START | R$12.90 | Apenas demonstração    |
| PRO   | R$21.90 | 10 gerações/dia        |
| ULTRA | R$41.90 | Ilimitado              |

## Configuração do Webhook no Asaas

1. Acesse o painel do Asaas
2. Vá em Integrações → Webhooks
3. Adicione a URL: `https://seu-dominio.com/subscriptions/webhook`
4. Selecione os eventos:
   - PAYMENT_CONFIRMED
   - PAYMENT_RECEIVED
   - PAYMENT_OVERDUE
   - SUBSCRIPTION_INACTIVATED
   - SUBSCRIPTION_DELETED

## Testando no Sandbox

O Asaas Sandbox permite simular pagamentos. Acesse:
https://sandbox.asaas.com

Para simular pagamento PIX confirmado:
1. Crie um checkout
2. No painel Sandbox, vá na cobrança
3. Clique em "Confirmar pagamento"

## Emissão de Notas Fiscais (NFS-e)

### Endpoints de NFS-e (Admin apenas)

| Método | Rota                                    | Descrição                              |
| ------ | --------------------------------------- | -------------------------------------- |
| GET    | /invoices/municipal-settings            | Requisitos da prefeitura               |
| GET    | /invoices/municipal-services            | Lista serviços municipais              |
| GET    | /invoices/fiscal-info                   | Informações fiscais configuradas       |
| POST   | /invoices/fiscal-info                   | Configura informações fiscais          |
| POST   | /invoices/auto-invoice                  | Configura emissão automática           |
| GET    | /invoices/auto-invoice/:subscriptionId  | Configuração de NF da assinatura       |
| PUT    | /invoices/auto-invoice/:subscriptionId  | Atualiza configuração de NF            |
| DELETE | /invoices/auto-invoice/:subscriptionId  | Remove configuração de NF              |
| GET    | /invoices/subscription/:subscriptionId  | Lista NFs de uma assinatura            |
| GET    | /invoices                               | Lista todas as notas fiscais           |
| GET    | /invoices/:invoiceId                    | Busca uma nota fiscal                  |
| POST   | /invoices                               | Agenda uma nota fiscal                 |
| POST   | /invoices/:invoiceId/issue              | Emite NF imediatamente                 |
| POST   | /invoices/:invoiceId/cancel             | Cancela uma nota fiscal                |

### Configuração para João Pessoa/PB (MEI)

A prefeitura de João Pessoa exige:
- **Autenticação**: Certificado Digital (A1 ou A3)
- **Regime Especial**: "5" (MEI - Simples Nacional)
- **Inscrição Municipal**: Número da inscrição (somente números)
- **Código do Serviço**: Código do sub-item do serviço (ex: "01.03")

### Passo a Passo para Configurar

1. **Obter o Certificado Digital** (.pfx ou .p12)

2. **Consultar configurações municipais**:
```bash
GET /invoices/municipal-settings
```

3. **Buscar o código do serviço**:
```bash
GET /invoices/municipal-services?description=educacao
```

4. **Configurar informações fiscais**:
```json
POST /invoices/fiscal-info
{
  "email": "fiscal@prismaacademy.com.br",
  "municipalInscription": "123456",
  "rpsSerie": "1",
  "rpsNumber": 1,
  "specialTaxRegime": "5",
  "serviceListItem": "01.03",
  "certificateFile": "BASE64_DO_ARQUIVO_PFX",
  "certificatePassword": "senha_do_certificado"
}
```

5. **Configurar emissão automática para assinaturas**:
```json
POST /invoices/auto-invoice
{
  "subscriptionId": "uuid-da-assinatura",
  "municipalServiceCode": "codigo_do_servico",
  "effectiveDatePeriod": "ON_PAYMENT_CONFIRMATION",
  "observations": "Assinatura mensal - Prisma Academy"
}
```

## Estrutura de Arquivos

```
src/infrastructure/asaas/
├── asaas.module.ts           # Módulo NestJS
├── config/
│   └── asaas.config.ts       # Configuração
├── constants/
│   └── plans.constants.ts    # Definição dos planos
├── services/
│   ├── asaas-http-client.service.ts   # Cliente HTTP base
│   ├── asaas-customer.service.ts      # Gerenciamento de clientes
│   ├── asaas-subscription.service.ts  # Gerenciamento de assinaturas
│   ├── asaas-payment.service.ts       # Gerenciamento de pagamentos
│   ├── asaas-webhook.service.ts       # Processamento de webhooks
│   └── asaas-invoice.service.ts       # Emissão de Notas Fiscais
└── types/
    ├── customer.types.ts     # Tipos de cliente
    ├── subscription.types.ts # Tipos de assinatura
    ├── payment.types.ts      # Tipos de pagamento
    ├── webhook.types.ts      # Tipos de webhook
    └── invoice.types.ts      # Tipos de nota fiscal
```

