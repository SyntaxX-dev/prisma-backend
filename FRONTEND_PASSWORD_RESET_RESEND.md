# Implementação de Reenvio de Código de Reset de Senha no Frontend

## 📋 Visão Geral

O backend implementou um endpoint para **reenviar o código de redefinição de senha** por email. Quando um usuário solicita o reenvio:

1. O código anterior é **invalidado automaticamente**
2. Um **novo código de 6 dígitos** é gerado
3. O novo código tem **nova expiração de 15 minutos**
4. O código é **enviado por email** para o usuário

## 🔌 Endpoint

**POST** `/auth/resend-password-reset-code`

### Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "email": "usuario@exemplo.com"
}
```

**Campo obrigatório:**
- `email` (string): Email do usuário que solicitou o reset

### Response de Sucesso (200)

```json
{
  "message": "Código de redefinição reenviado para seu email",
  "email": "usuario@exemplo.com"
}
```

### Response de Erro (404)

```json
{
  "message": "Usuário não encontrado"
}
```

### Response de Rate Limit (429)

```json
{
  "statusCode": 429,
  "message": "Muitas tentativas. Tente novamente mais tarde.",
  "retryAfter": 900
}
```

**Nota:** O rate limit permite **3 requisições por 15 minutos por email**. O campo `retryAfter` indica quantos segundos aguardar antes de tentar novamente (900 = 15 minutos).

## 🎨 O que o Frontend Deve Fazer

### 1. **Botão de Reenvio**

Adicione um botão "Reenviar código" na tela de verificação de código:

```typescript
// Exemplo de componente React
<button 
  onClick={handleResendCode}
  disabled={isResending || rateLimitActive}
>
  {isResending ? 'Enviando...' : 'Reenviar código'}
</button>
```

### 2. **Chamada da API**

```typescript
// hooks/useResendPasswordResetCode.ts
import { useState } from 'react';
import { api } from '../services/api';

export function useResendPasswordResetCode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitActive, setRateLimitActive] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const resendCode = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/resend-password-reset-code', {
        email,
      });

      return response.data;
    } catch (err: any) {
      // Tratar erro 429 (Rate Limit)
      if (err.response?.status === 429) {
        const retryAfterSeconds = err.response.data.retryAfter || 900;
        setRateLimitActive(true);
        setRetryAfter(retryAfterSeconds);
        
        // Desativar rate limit após o tempo de espera
        setTimeout(() => {
          setRateLimitActive(false);
          setRetryAfter(null);
        }, retryAfterSeconds * 1000);
        
        throw new Error(
          `Muitas tentativas. Aguarde ${Math.ceil(retryAfterSeconds / 60)} minutos antes de tentar novamente.`
        );
      }
      
      const message = err.response?.data?.message || 'Erro ao reenviar código';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { resendCode, loading, error, rateLimitActive, retryAfter };
}
```

### 3. **Componente de Verificação de Código**

```typescript
// components/PasswordResetCodeVerification.tsx
import { useState, useEffect } from 'react';
import { useResendPasswordResetCode } from '../hooks/useResendPasswordResetCode';
import { toast } from 'react-toastify'; // ou sua biblioteca de toast

interface PasswordResetCodeVerificationProps {
  email: string;
  onCodeVerified: () => void;
}

export function PasswordResetCodeVerification({
  email,
  onCodeVerified,
}: PasswordResetCodeVerificationProps) {
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { resendCode, loading, error, rateLimitActive, retryAfter } = 
    useResendPasswordResetCode();

  // Countdown para reenvio
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Countdown para rate limit
  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev && prev > 0) {
            return prev - 1;
          }
          return null;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  const handleResendCode = async () => {
    try {
      await resendCode(email);
      toast.success('Código reenviado com sucesso! Verifique seu email.');
      setCountdown(60); // 60 segundos antes de poder reenviar novamente
    } catch (err: any) {
      toast.error(err.message || 'Erro ao reenviar código');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="password-reset-verification">
      <h2>Verificação de Código</h2>
      <p>
        Enviamos um código de 6 dígitos para <strong>{email}</strong>
      </p>

      <div className="code-input">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          className="code-field"
        />
      </div>

      <div className="resend-section">
        <p>Não recebeu o código?</p>
        <button
          onClick={handleResendCode}
          disabled={loading || countdown > 0 || rateLimitActive}
          className="resend-button"
        >
          {loading && 'Enviando...'}
          {!loading && countdown > 0 && `Aguarde ${formatTime(countdown)}`}
          {!loading && countdown === 0 && rateLimitActive && retryAfter && (
            `Aguarde ${formatTime(retryAfter)}`
          )}
          {!loading && countdown === 0 && !rateLimitActive && 'Reenviar código'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {rateLimitActive && retryAfter && (
        <div className="rate-limit-warning">
          ⚠️ Muitas tentativas. Aguarde {formatTime(retryAfter)} antes de tentar novamente.
        </div>
      )}
    </div>
  );
}
```

### 4. **Fluxo Completo de Reset de Senha**

```typescript
// pages/PasswordResetPage.tsx
import { useState } from 'react';
import { PasswordResetRequest } from '../components/PasswordResetRequest';
import { PasswordResetCodeVerification } from '../components/PasswordResetCodeVerification';
import { PasswordResetForm } from '../components/PasswordResetForm';

type Step = 'request' | 'verify' | 'reset';

export function PasswordResetPage() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');

  const handleRequestSent = (userEmail: string) => {
    setEmail(userEmail);
    setStep('verify');
  };

  const handleCodeVerified = () => {
    setStep('reset');
  };

  const handlePasswordReset = () => {
    // Redirecionar para login ou mostrar mensagem de sucesso
    window.location.href = '/login';
  };

  return (
    <div className="password-reset-page">
      {step === 'request' && (
        <PasswordResetRequest onRequestSent={handleRequestSent} />
      )}
      
      {step === 'verify' && (
        <PasswordResetCodeVerification
          email={email}
          onCodeVerified={handleCodeVerified}
        />
      )}
      
      {step === 'reset' && (
        <PasswordResetForm
          email={email}
          onPasswordReset={handlePasswordReset}
        />
      )}
    </div>
  );
}
```

## 📝 Exemplo de Integração com API

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratar erros de rate limit
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      // Rate limit excedido
      const retryAfter = error.response.data.retryAfter || 900;
      error.retryAfter = retryAfter;
    }
    return Promise.reject(error);
  }
);

export { api };
```

## 🎯 Checklist de Implementação

- [ ] Criar hook `useResendPasswordResetCode` para chamar o endpoint
- [ ] Adicionar botão "Reenviar código" na tela de verificação
- [ ] Implementar countdown visual (60 segundos) antes de permitir novo reenvio
- [ ] Tratar erro 429 (Rate Limit) com mensagem clara
- [ ] Mostrar countdown do rate limit quando ativo
- [ ] Desabilitar botão durante loading e rate limit
- [ ] Exibir toast/notificação de sucesso ao reenviar
- [ ] Garantir que código anterior seja invalidado (backend faz isso)
- [ ] Testar fluxo completo de reenvio
- [ ] Testar rate limiting (3 tentativas em 15 minutos)

## 🔍 Campos Importantes da Response

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `message` | `string` | Mensagem de sucesso ou erro |
| `email` | `string` | Email para o qual o código foi enviado |
| `statusCode` | `number?` | Código HTTP (429 para rate limit) |
| `retryAfter` | `number?` | Segundos para aguardar antes de tentar novamente (só em 429) |

## ⚠️ Observações Importantes

1. **Código anterior é invalidado**: Quando um novo código é enviado, o código anterior deixa de funcionar
2. **Nova expiração**: Cada novo código tem 15 minutos de validade a partir do momento do envio
3. **Rate limiting**: Máximo de 3 reenvios por email a cada 15 minutos
4. **Segurança**: O rate limit é por email, não por IP, prevenindo abuso
5. **UX**: Recomenda-se adicionar um countdown visual (60 segundos) antes de permitir novo reenvio para melhorar UX

## 📱 Exemplo de Fluxo Completo

```
1. Usuário esqueceu senha
   ↓
2. Solicita reset: POST /auth/request-password-reset
   ↓
3. Recebe código por email
   ↓
4. Código expira ou não recebeu
   ↓
5. Usuário clica em "Reenviar código"
   ↓
6. Frontend chama: POST /auth/resend-password-reset-code
   ↓
7. Backend invalida código anterior
   ↓
8. Backend gera novo código
   ↓
9. Backend envia novo código por email
   ↓
10. Frontend mostra mensagem de sucesso
   ↓
11. Usuário recebe novo código no email
   ↓
12. Usuário usa novo código para verificar
   ↓
13. Código verificado: POST /auth/verify-reset-code
   ↓
14. Usuário redefine senha: POST /auth/reset-password
```

## 🎨 Sugestões de UI/UX

1. **Botão desabilitado durante countdown**: Mostrar "Aguarde X:XX" com countdown
2. **Feedback visual**: Toast de sucesso ao reenviar código
3. **Aviso de rate limit**: Mensagem clara quando rate limit está ativo
4. **Indicação de novo código**: Informar que o código anterior foi invalidado
5. **Loading state**: Mostrar spinner ou texto "Enviando..." durante requisição

## 🔐 Segurança

- ✅ Rate limiting por email (3 requisições / 15 minutos)
- ✅ Código anterior invalidado automaticamente
- ✅ Código criptograficamente seguro (6 dígitos)
- ✅ Expiração de 15 minutos por código
- ✅ Validação de email no backend

---

**Nota**: O backend já faz toda a validação e invalidação de códigos. O frontend só precisa chamar o endpoint e tratar as respostas adequadamente.
