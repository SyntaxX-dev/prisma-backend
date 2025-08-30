# 🚀 Deploy no Railway - Guia Completo

## 📋 **Pré-requisitos**

- ✅ Projeto no GitHub
- ✅ Conta no Railway
- ✅ Banco PostgreSQL criado no Railway

## 🔧 **Passo 1: Configurar Variáveis de Ambiente**

No Railway, adicione estas variáveis:

```bash
PGUSER=postgres
POSTGRES_PASSWORD=Prisma2024!@#
PGDATABASE=railway
DATABASE_URL=postgresql://${{PGUSER}}:${{POSTGRES_PASSWORD}}@${{RAILWAY_TCP_PROXY_DOMAIN}}:${{RAILWAY_TCP_PROXY_PORT}}/${{PGDATABASE}}
```

## 🚀 **Passo 2: Deploy do Backend**

1. **Railway Dashboard** → **"New Service"**
2. **"GitHub Repo"** → Selecione seu repositório
3. **"Deploy Now"** → Aguarde conclusão

## 📊 **Passo 3: Executar Migrações**

Após deploy, execute:

```bash
# No terminal do Railway ou localmente
npm run migrate:prod
```

## 🌐 **Passo 4: Testar API**

- **URL**: `https://seu-app.railway.app`
- **Swagger**: `https://seu-app.railway.app/docs`
- **Health Check**: `https://seu-app.railway.app/`

## 🔍 **Endpoints Disponíveis**

- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login com JWT
- `GET /auth/profile` - Perfil (protegido)
- `POST /auth/request-password-reset` - Solicitar redefinição
- `POST /auth/verify-reset-code` - Verificar código
- `POST /auth/reset-password` - Redefinir senha

## ⚠️ **Importante**

- **Porta**: Railway define automaticamente
- **Host**: `0.0.0.0` (já configurado)
- **Banco**: Conecta automaticamente via DATABASE_URL
- **Deploy**: Automático a cada push no GitHub

## 🆘 **Troubleshooting**

- **Erro de conexão**: Verificar DATABASE_URL
- **Migrações falhando**: Executar `npm run migrate:prod`
- **Build falhando**: Verificar logs no Railway

**🎉 Sua API estará rodando em produção!**
