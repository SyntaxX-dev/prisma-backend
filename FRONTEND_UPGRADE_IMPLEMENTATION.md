# Implementação de Upgrade de Plano no Frontend

## 📋 Visão Geral

O backend implementou um sistema de **upgrade imediato com cálculo proporcional**. Quando um usuário faz upgrade de plano, o sistema:

1. Calcula automaticamente o crédito dos dias não utilizados do plano atual
2. Subtrai esse crédito do valor do novo plano
3. Aplica o novo plano imediatamente
4. Reinicia o período de cobrança a partir de agora
5. Cria uma cobrança no Asaas (se houver valor a pagar)

## 🔌 Endpoint

**POST** `/subscriptions/change-plan`

### Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "newPlanId": "PRO" | "ULTRA"
}
```

**Valores aceitos:** `"START"`, `"PRO"`, `"ULTRA"`

### Response de Sucesso (200)

#### Caso 1: Upgrade Imediato (com cálculo proporcional)

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Upgrade para o plano Pro realizado com sucesso!\n\n📊 Cálculo do upgrade:\n   • Plano atual: Start (R$ 12,90/mês)\n   • Novo plano: Pro (R$ 21,90/mês)\n   • Período atual: 01/01/2026 até 31/01/2026\n   • Dias utilizados: 17 de 30 dias\n   • Dias restantes: 13 dias\n\n💰 Crédito aplicado: R$ 5,59\n   Foi subtraído R$ 5,59 da fatura deste mês em virtude dos 13 dias que não foram usados da fatura anterior.\n\n💳 Valor a pagar: R$ 16,31\n   (Valor do novo plano: R$ 21,90 - Crédito: R$ 5,59)\n\n🔗 Acesse o link de pagamento para concluir: https://sandbox.asaas.com/i/...\n\n📅 Novo período iniciado: 24/01/2026 até 24/02/2026",
    "currentPlan": {
      "id": "START",
      "name": "Start"
    },
    "newPlan": {
      "id": "PRO",
      "name": "Pro",
      "price": 21.9
    },
    "effectiveDate": "2026-01-24T03:00:00.000Z",
    "isUpgrade": true,
    "proratedAmount": 21.9,
    "unusedDays": 13,
    "creditAmount": 5.59,
    "paymentUrl": "https://sandbox.asaas.com/i/...",
    "pixQrCode": {
      "encodedImage": "data:image/png;base64,...",
      "payload": "00020126580014br.gov.bcb.pix...",
      "expirationDate": "2026-01-24T04:00:00.000Z"
    }
  }
}
```

#### Caso 2: Downgrade ou Mudança Agendada

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Mudança para o plano Start agendada. A mudança será efetivada no próximo ciclo de cobrança.",
    "currentPlan": {
      "id": "PRO",
      "name": "Pro"
    },
    "newPlan": {
      "id": "START",
      "name": "Start",
      "price": 12.9
    },
    "effectiveDate": "2026-02-24T03:00:00.000Z",
    "isUpgrade": false
  }
}
```

### Response de Erro (400)

```json
{
  "statusCode": 400,
  "message": "Você já está neste plano"
}
```

## 🎨 O que o Frontend Deve Fazer

### 1. **Detectar se é Upgrade Imediato**

Verifique se a resposta contém:
- `isUpgrade: true`
- `creditAmount` presente
- `paymentUrl` presente (se houver valor a pagar)

### 2. **Exibir Modal/Toast de Confirmação**

Mostre uma mensagem clara explicando o upgrade:

```typescript
if (response.data.isUpgrade && response.data.creditAmount) {
  // É upgrade imediato com cálculo proporcional
  showUpgradeConfirmation({
    currentPlan: response.data.currentPlan.name,
    newPlan: response.data.newPlan.name,
    creditAmount: response.data.creditAmount,
    unusedDays: response.data.unusedDays,
    amountToPay: response.data.newPlan.price - response.data.creditAmount,
    paymentUrl: response.data.paymentUrl,
    pixQrCode: response.data.pixQrCode
  });
}
```

### 3. **Componente de Confirmação de Upgrade**

Crie um componente que exiba:

#### Informações Obrigatórias:
- ✅ **Plano atual** → **Novo plano**
- ✅ **Crédito aplicado**: R$ X,XX (X dias não utilizados)
- ✅ **Valor a pagar**: R$ X,XX (ou "Crédito cobre totalmente")
- ✅ **Novo período**: Data início → Data fim

#### Exemplo de UI:

```
┌─────────────────────────────────────────┐
│  ✅ Upgrade Realizado com Sucesso!      │
├─────────────────────────────────────────┤
│                                         │
│  📊 Detalhes do Upgrade:                │
│                                         │
│  Plano Atual: Start (R$ 12,90/mês)     │
│  Novo Plano: Pro (R$ 21,90/mês)        │
│                                         │
│  Período: 01/01/2026 até 31/01/2026    │
│  • Dias utilizados: 17 de 30 dias      │
│  • Dias restantes: 13 dias              │
│                                         │
│  💰 Crédito Aplicado: R$ 5,59          │
│  Foi subtraído R$ 5,59 da fatura deste │
│  mês em virtude dos 13 dias que não    │
│  foram usados da fatura anterior.      │
│                                         │
│  💳 Valor a Pagar: R$ 16,31             │
│  (R$ 21,90 - R$ 5,59)                   │
│                                         │
│  📅 Novo Período:                       │
│  24/01/2026 até 24/02/2026             │
│                                         │
│  [Ir para Pagamento]                    │
└─────────────────────────────────────────┘
```

### 4. **Redirecionar para Pagamento**

Se `paymentUrl` estiver presente:

```typescript
if (response.data.paymentUrl) {
  // Opção 1: Redirecionar diretamente
  window.open(response.data.paymentUrl, '_blank');
  
  // Opção 2: Mostrar modal com QR Code PIX (se disponível)
  if (response.data.pixQrCode) {
    showPixPaymentModal({
      qrCode: response.data.pixQrCode.encodedImage,
      payload: response.data.pixQrCode.payload,
      amount: response.data.newPlan.price - response.data.creditAmount,
      expirationDate: response.data.pixQrCode.expirationDate
    });
  }
}
```

### 5. **Atualizar Estado da Aplicação**

Após upgrade bem-sucedido:

```typescript
// Atualizar informações do usuário
updateUserSubscription({
  plan: response.data.newPlan.id,
  planName: response.data.newPlan.name,
  periodStart: response.data.effectiveDate,
  periodEnd: calculatePeriodEnd(response.data.effectiveDate), // +30 dias
});

// Recarregar dados da assinatura
await fetchSubscriptionDetails();
```

### 6. **Tratamento de Erros**

```typescript
try {
  const response = await changePlan(newPlanId);
  // Sucesso - mostrar confirmação
} catch (error) {
  if (error.response?.status === 400) {
    const message = error.response.data.message;
    
    // Erros comuns:
    // - "Você já está neste plano"
    // - "Já existe uma mudança pendente..."
    // - "Só é possível mudar de plano com uma assinatura ativa"
    
    showErrorToast(message);
  } else {
    showErrorToast('Erro ao processar mudança de plano. Tente novamente.');
  }
}
```

## 📝 Exemplo de Implementação React

```typescript
// hooks/useChangePlan.ts
import { useState } from 'react';
import { api } from '../services/api';

export function useChangePlan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePlan = async (newPlanId: 'START' | 'PRO' | 'ULTRA') => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/subscriptions/change-plan', {
        newPlanId,
      });

      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao mudar de plano';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { changePlan, loading, error };
}
```

```typescript
// components/UpgradeConfirmationModal.tsx
interface UpgradeConfirmationProps {
  data: {
    currentPlan: { id: string; name: string };
    newPlan: { id: string; name: string; price: number };
    creditAmount?: number;
    unusedDays?: number;
    paymentUrl?: string;
    pixQrCode?: {
      encodedImage: string;
      payload: string;
      expirationDate: string;
    };
    effectiveDate: string;
  };
  onClose: () => void;
  onGoToPayment: (url: string) => void;
}

export function UpgradeConfirmationModal({
  data,
  onClose,
  onGoToPayment,
}: UpgradeConfirmationProps) {
  const amountToPay = data.creditAmount
    ? data.newPlan.price - data.creditAmount
    : data.newPlan.price;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <Modal onClose={onClose}>
      <div className="upgrade-confirmation">
        <h2>✅ Upgrade Realizado com Sucesso!</h2>

        <div className="upgrade-details">
          <h3>📊 Detalhes do Upgrade</h3>
          
          <div className="plan-comparison">
            <div>
              <strong>Plano Atual:</strong> {data.currentPlan.name} 
              (R$ {data.currentPlan.price?.toFixed(2) || 'N/A'}/mês)
            </div>
            <div>→</div>
            <div>
              <strong>Novo Plano:</strong> {data.newPlan.name} 
              (R$ {data.newPlan.price.toFixed(2)}/mês)
            </div>
          </div>

          {data.unusedDays && (
            <div className="period-info">
              <p>
                <strong>Dias restantes:</strong> {data.unusedDays} dias
              </p>
            </div>
          )}

          {data.creditAmount && (
            <div className="credit-info">
              <h4>💰 Crédito Aplicado: R$ {data.creditAmount.toFixed(2)}</h4>
              <p>
                Foi subtraído R$ {data.creditAmount.toFixed(2)} da fatura deste mês 
                em virtude dos {data.unusedDays} dias que não foram usados da fatura anterior.
              </p>
            </div>
          )}

          {data.paymentUrl && (
            <div className="payment-info">
              {amountToPay > 0 ? (
                <>
                  <h4>💳 Valor a Pagar: R$ {amountToPay.toFixed(2)}</h4>
                  <p>
                    (Valor do novo plano: R$ {data.newPlan.price.toFixed(2)} - 
                    Crédito: R$ {data.creditAmount?.toFixed(2) || '0,00'})
                  </p>
                </>
              ) : (
                <h4>✅ O crédito cobre totalmente o novo plano!</h4>
              )}
            </div>
          )}

          <div className="new-period">
            <h4>📅 Novo Período</h4>
            <p>
              {formatDate(data.effectiveDate)} até{' '}
              {formatDate(
                new Date(
                  new Date(data.effectiveDate).setMonth(
                    new Date(data.effectiveDate).getMonth() + 1
                  )
                ).toISOString()
              )}
            </p>
          </div>
        </div>

        <div className="actions">
          {data.paymentUrl && amountToPay > 0 && (
            <button
              onClick={() => onGoToPayment(data.paymentUrl!)}
              className="btn-primary"
            >
              {data.pixQrCode ? 'Ver QR Code PIX' : 'Ir para Pagamento'}
            </button>
          )}
          <button onClick={onClose} className="btn-secondary">
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

```typescript
// pages/SubscriptionSettings.tsx
import { useChangePlan } from '../hooks/useChangePlan';
import { UpgradeConfirmationModal } from '../components/UpgradeConfirmationModal';

export function SubscriptionSettings() {
  const { changePlan, loading, error } = useChangePlan();
  const [upgradeData, setUpgradeData] = useState(null);

  const handleUpgrade = async (newPlanId: 'PRO' | 'ULTRA') => {
    try {
      const result = await changePlan(newPlanId);
      
      if (result.isUpgrade && result.creditAmount !== undefined) {
        // É upgrade imediato - mostrar modal
        setUpgradeData(result);
      } else {
        // Downgrade ou mudança agendada - apenas toast
        showSuccessToast(result.message);
      }
    } catch (err) {
      // Erro já tratado no hook
    }
  };

  return (
    <>
      {/* Seu componente de configurações */}
      
      {upgradeData && (
        <UpgradeConfirmationModal
          data={upgradeData}
          onClose={() => setUpgradeData(null)}
          onGoToPayment={(url) => {
            window.open(url, '_blank');
            setUpgradeData(null);
          }}
        />
      )}
    </>
  );
}
```

## 🎯 Checklist de Implementação

- [ ] Criar hook `useChangePlan` para chamar o endpoint
- [ ] Criar componente `UpgradeConfirmationModal` para exibir detalhes
- [ ] Implementar lógica para detectar upgrade vs downgrade
- [ ] Exibir cálculo proporcional de forma clara
- [ ] Mostrar crédito aplicado e valor a pagar
- [ ] Implementar redirecionamento para pagamento (se necessário)
- [ ] Mostrar QR Code PIX (se disponível)
- [ ] Atualizar estado da aplicação após upgrade
- [ ] Tratar erros adequadamente
- [ ] Adicionar loading states
- [ ] Testar fluxo completo

## 🔍 Campos Importantes da Response

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `isUpgrade` | `boolean` | Indica se é upgrade (true) ou downgrade (false) |
| `creditAmount` | `number?` | Valor do crédito aplicado (só presente em upgrades) |
| `unusedDays` | `number?` | Dias não utilizados (só presente em upgrades) |
| `paymentUrl` | `string?` | URL para pagamento (só presente se houver valor a pagar) |
| `pixQrCode` | `object?` | QR Code PIX (só presente se método for PIX e houver valor) |
| `effectiveDate` | `string` | Data de início do novo período |
| `message` | `string` | Mensagem explicativa completa |

## ⚠️ Observações Importantes

1. **Upgrade é imediato**: O plano muda na hora, não no próximo ciclo
2. **Downgrade é agendado**: Só entra em vigor no próximo ciclo
3. **Crédito só em upgrades**: Downgrades não têm cálculo proporcional
4. **Pagamento pode ser zero**: Se o crédito cobrir totalmente o novo plano
5. **PIX opcional**: QR Code só vem se método de pagamento for PIX

## 📱 Exemplo de Fluxo Completo

```
1. Usuário clica em "Fazer Upgrade para Pro"
   ↓
2. Frontend chama POST /subscriptions/change-plan
   ↓
3. Backend calcula crédito e cria cobrança
   ↓
4. Frontend recebe resposta com detalhes
   ↓
5. Frontend mostra modal explicativo
   ↓
6. Usuário vê:
   - Crédito de R$ X,XX aplicado
   - Valor a pagar: R$ Y,YY
   - Novo período
   ↓
7. Usuário clica em "Ir para Pagamento"
   ↓
8. Redireciona para Asaas ou mostra QR Code PIX
   ↓
9. Após pagamento, webhook atualiza status
   ↓
10. Frontend atualiza interface com novo plano
```

## 🎨 Sugestões de UI/UX

1. **Destaque visual** para o crédito aplicado (verde/positivo)
2. **Breakdown claro** do cálculo (mostrar passo a passo)
3. **Botão de ação** bem visível para pagamento
4. **Informação de período** clara e destacada
5. **Feedback imediato** após upgrade (toast de sucesso)

---

**Nota**: O backend já faz todo o cálculo e processamento. O frontend só precisa exibir as informações de forma clara e guiar o usuário para o pagamento (se necessário).
