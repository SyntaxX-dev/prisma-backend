# 📋 Guia de Configuração de Notas Fiscais - Prisma Academy

## 🎯 Objetivo

Este guia te ajuda a configurar a emissão automática de Notas Fiscais de Serviço (NFS-e) para João Pessoa/PB como MEI.

## ⚠️ Modo Teste vs Produção

A integração permite **configuração parcial para testes**. Você pode configurar os dados básicos agora e completar depois.

### Modo Teste
- ✅ Permite configurar sem certificado digital
- ✅ Permite configurar sem código do serviço municipal
- ⚠️ Não emitirá notas reais, mas permite testar o fluxo

### Modo Produção
- ❌ Exige certificado digital (.pfx)
- ❌ Exige código do serviço municipal
- ❌ Exige código do sub-item do serviço
- ✅ Emite notas fiscais reais

---

## 📝 Passo 1: Consultar Requisitos da Prefeitura

**Endpoint:** `GET /invoices/municipal-settings`

**O que faz:** Retorna quais campos são obrigatórios para João Pessoa.

**Exemplo de resposta:**
```json
{
  "authenticationType": "CERTIFICATE",
  "usesServiceListItem": true,
  "specialTaxRegimesList": [
    { "value": "5", "label": "MEI - Simples Nacional" }
  ]
}
```

**O que você precisa anotar:**
- ✅ Tipo de autenticação: `CERTIFICATE` (precisa certificado digital)
- ✅ Usa Service List Item: `true` (precisa código do sub-item)
- ✅ Regime especial para MEI: `"5"`

---

## 📝 Passo 2: Buscar o Código do Serviço Municipal

**Endpoint:** `GET /invoices/municipal-services?description=educacao`

**O que faz:** Lista os serviços disponíveis na prefeitura de JP.

**Exemplo de resposta:**
```json
{
  "data": [
    {
      "id": "123",
      "name": "Serviços de Educação e Ensino",
      "code": "692060100"
    }
  ]
}
```

**O que você precisa anotar:**
- ✅ `id` ou `code` do serviço
- ✅ `name` do serviço

**💡 Dica:** Se não encontrar, tente outras descrições:
- `GET /invoices/municipal-services?description=treinamento`
- `GET /invoices/municipal-services?description=plataforma`
- `GET /invoices/municipal-services?description=informatica`

---

## 📝 Passo 3: Configurar Informações Fiscais (MODO TESTE)

**Endpoint:** `POST /invoices/fiscal-info?isTest=true`

**Campos obrigatórios mínimos:**
```json
{
  "email": "fiscal@prismaacademy.com.br",
  "municipalInscription": "123456",
  "rpsSerie": "1",
  "rpsNumber": 1
}
```

**Campos opcionais (para completar depois):**
```json
{
  "specialTaxRegime": "5",
  "serviceListItem": "01.03",
  "certificateFile": "BASE64_DO_PFX",
  "certificatePassword": "senha_do_certificado",
  "cnae": "8599.60/00"
}
```

**Exemplo completo para teste:**
```bash
curl -X POST http://localhost:3000/invoices/fiscal-info?isTest=true \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fiscal@prismaacademy.com.br",
    "municipalInscription": "SEU_NUMERO_INSCRICAO",
    "rpsSerie": "1",
    "rpsNumber": 1,
    "specialTaxRegime": "5"
  }'
```

**✅ O que acontece:**
- Configura os dados básicos
- Permite testar a integração
- Não emite notas reais (falta certificado)

---

## 📝 Passo 4: Completar Configuração (PRODUÇÃO)

Quando você tiver:
- ✅ Certificado Digital A1 (.pfx)
- ✅ Código do serviço municipal
- ✅ Código do sub-item do serviço

**Endpoint:** `POST /invoices/fiscal-info` (sem `?isTest=true`)

**Exemplo completo:**
```json
{
  "email": "fiscal@prismaacademy.com.br",
  "municipalInscription": "123456",
  "rpsSerie": "1",
  "rpsNumber": 1,
  "specialTaxRegime": "5",
  "serviceListItem": "01.03",
  "municipalServiceCode": "692060100",
  "certificateFile": "BASE64_DO_ARQUIVO_PFX",
  "certificatePassword": "senha_do_certificado",
  "cnae": "8599.60/00"
}
```

**Como converter o .pfx para Base64:**
```bash
# No Linux/Mac
base64 -i certificado.pfx -o certificado_base64.txt

# No Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificado.pfx"))
```

---

## 📝 Passo 5: Configurar Emissão Automática (MODO TESTE)

**Endpoint:** `POST /invoices/auto-invoice?isTest=true`

**Campos obrigatórios mínimos:**
```json
{
  "subscriptionId": "uuid-da-assinatura",
  "effectiveDatePeriod": "ON_PAYMENT_CONFIRMATION"
}
```

**Campos opcionais (para completar depois):**
```json
{
  "municipalServiceCode": "692060100",
  "municipalServiceName": "Serviços de Educação",
  "observations": "Assinatura mensal - Prisma Academy"
}
```

**Exemplo para teste:**
```bash
curl -X POST http://localhost:3000/invoices/auto-invoice?isTest=true \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "uuid-da-assinatura",
    "effectiveDatePeriod": "ON_PAYMENT_CONFIRMATION"
  }'
```

---

## 📝 Passo 6: Completar Emissão Automática (PRODUÇÃO)

Quando você tiver o código do serviço:

**Endpoint:** `POST /invoices/auto-invoice` (sem `?isTest=true`)

```json
{
  "subscriptionId": "uuid-da-assinatura",
  "effectiveDatePeriod": "ON_PAYMENT_CONFIRMATION",
  "municipalServiceCode": "692060100",
  "municipalServiceName": "Serviços de Educação e Ensino",
  "observations": "Assinatura mensal - Prisma Academy - Plano START"
}
```

**Períodos de emissão disponíveis:**
- `ON_PAYMENT_CONFIRMATION` - Ao confirmar pagamento (recomendado)
- `ON_PAYMENT_DUE_DATE` - Na data de vencimento
- `BEFORE_PAYMENT_DUE_DATE` - Antes do vencimento (precisa `daysBeforePaymentDueDate`)
- `ON_NEXT_MONTH` - No próximo mês

---

## ✅ Checklist de Configuração

### Para Teste (Agora)
- [ ] Consultar configurações municipais
- [ ] Configurar informações fiscais básicas (modo teste)
- [ ] Configurar emissão automática básica (modo teste)

### Para Produção (Depois)
- [ ] Obter Certificado Digital A1
- [ ] Buscar código do serviço municipal
- [ ] Buscar código do sub-item do serviço
- [ ] Completar informações fiscais (sem modo teste)
- [ ] Completar emissão automática (sem modo teste)
- [ ] Testar emissão de uma nota real

---

## 🔍 Verificar Configuração

**Ver informações fiscais:**
```bash
GET /invoices/fiscal-info
```

**Ver configuração de NF de uma assinatura:**
```bash
GET /invoices/auto-invoice/{subscriptionId}
```

**Listar notas fiscais emitidas:**
```bash
GET /invoices/subscription/{subscriptionId}
```

---

## 🆘 Dúvidas Frequentes

**Q: Posso configurar sem certificado?**
R: Sim, use `?isTest=true` para configurar parcialmente.

**Q: Como obtenho o certificado digital?**
R: Compre de uma Autoridade Certificadora (Serasa, Certisign, etc.). Custa ~R$100/ano.

**Q: Onde encontro o código do serviço?**
R: Use `GET /invoices/municipal-services?description=educacao` ou consulte a prefeitura de JP.

**Q: O que é o código do sub-item?**
R: É um código complementar ao serviço (ex: "01.03"). Consulte a prefeitura ou tente emitir uma nota manualmente para ver.

**Q: Posso atualizar a configuração depois?**
R: Sim! Use `PUT /invoices/fiscal-info` ou `PUT /invoices/auto-invoice/{subscriptionId}`.

---

## 📞 Próximos Passos

1. **Agora:** Configure em modo teste para validar a integração
2. **Depois:** Obtenha certificado digital e códigos municipais
3. **Finalize:** Complete a configuração em modo produção

Qualquer dúvida, me chame! 🚀

