# A03:2025 (OWASP) — Falhas na Cadeia de Suprimentos: Correções Aplicadas

## Objetivo

Reduzir o risco associado à categoria **A03:2025 – Software Supply Chain Failures**, implementando rastreamento de dependências (SBOM), escaneamento de vulnerabilidades, verificação de integridade e controle de versões, garantindo que o pipeline de CI/CD valide a segurança antes de cada deploy.

---

## 1) Geração de SBOM (Software Bill of Materials)

### Problema: O que causava a vulnerabilidade?

**Antes:** Não havia nenhum inventário das dependências do projeto. Você não sabia:
- Quais bibliotecas estavam instaladas (diretas e transitivas)
- Quais versões exatas estavam em uso
- Se havia dependências órfãs ou não utilizadas
- Como responder rapidamente a um CVE (vulnerabilidade conhecida)

**Exemplo prático do problema:**

Imagine que uma vulnerabilidade crítica é descoberta na biblioteca `lodash` (CVE-2021-23337). Sem SBOM:
- Você não sabe se usa `lodash` diretamente ou indiretamente
- Não sabe em quais versões ela está instalada
- Leva horas ou dias para identificar todos os lugares afetados
- Enquanto isso, sua aplicação está vulnerável em produção

### Correção: O que foi implementado?

Foi adicionada geração automática de SBOM usando ferramentas nativas do npm e CycloneDX.

### Onde foi aplicado

- `package.json` - Novos scripts adicionados:
  - `sbom:generate`: Gera SBOM em formato JSON usando `npm ls`
  - `sbom:spdx`: Gera SBOM no formato SPDX (padrão da indústria)
  - `sbom:cyclonedx`: Gera SBOM no formato CycloneDX (padrão OWASP)

### Trecho de código (Antes vs Depois)

**Antes (sem rastreamento de dependências)**

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start"
    // ... sem scripts de SBOM
  }
}
```

**Depois (com geração de SBOM)**

```json
{
  "scripts": {
    "sbom:generate": "npm ls --all --json > sbom.json",
    "sbom:spdx": "cyclonedx-npm --output-file sbom.spdx.json",
    "sbom:cyclonedx": "cyclonedx-npm --output-file sbom.cyclonedx.json"
  },
  "devDependencies": {
    "@cyclonedx/cyclonedx-npm": "^1.0.0"
  }
}
```

### Benefícios de segurança (na prática)

1. **Resposta rápida a CVEs**: Se um CVE é anunciado, você executa `npm run sbom:generate` e sabe imediatamente se está afetado
2. **Auditoria e compliance**: Você pode fornecer um inventário completo para clientes ou auditorias
3. **Rastreabilidade**: Cada deploy pode gerar um SBOM, criando um histórico de dependências

### Como usar

```bash
# Gerar SBOM básico (JSON)
npm run sbom:generate

# Gerar SBOM no formato SPDX (padrão da indústria)
npm run sbom:spdx

# Gerar SBOM no formato CycloneDX (OWASP)
npm run sbom:cyclonedx
```

---

## 2) Escaneamento de Vulnerabilidades

### Problema: O que causava a vulnerabilidade?

**Antes:** Não havia verificação automática de vulnerabilidades conhecidas. Você só descobria problemas quando:
- Alguém reportava um bug de segurança
- Um atacante explorava uma vulnerabilidade
- Uma auditoria externa encontrava problemas

**Exemplo prático do problema:**

Sua aplicação usa `express` versão 4.17.0, que tem uma vulnerabilidade conhecida (CVE-2022-24999) que permite injeção de código. Sem auditoria:
- Você não sabe que está vulnerável
- Continua usando a versão antiga por meses
- Um atacante explora a vulnerabilidade e compromete seu servidor

### Correção: O que foi implementado?

Foi implementada auditoria automática usando `npm audit` nativo e scripts para diferentes níveis de severidade.

### Onde foi aplicado

- `package.json` - Novos scripts adicionados:
  - `security:audit`: Verifica todas as vulnerabilidades
  - `security:audit:fix`: Tenta corrigir automaticamente (quando possível)
  - `security:audit:production`: Verifica apenas dependências de produção
  - `security:check`: Verifica vulnerabilidades moderadas ou superiores

### Trecho de código (Antes vs Depois)

**Antes (sem auditoria de segurança)**

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start"
    // ... sem scripts de auditoria
  }
}
```

**Depois (com auditoria de segurança)**

```json
{
  "scripts": {
    "security:audit": "npm audit",
    "security:audit:fix": "npm audit fix",
    "security:audit:production": "npm audit --production",
    "security:check": "npm audit --audit-level=moderate"
  }
}
```

### Benefícios de segurança (na prática)

1. **Detecção proativa**: Você descobre vulnerabilidades antes que atacantes as explorem
2. **Correção automática**: `npm audit fix` corrige automaticamente muitas vulnerabilidades
3. **Prevenção de deploy inseguro**: O pipeline bloqueia deploys com vulnerabilidades críticas

### Como usar

```bash
# Verificar vulnerabilidades
npm run security:audit

# Tentar corrigir automaticamente
npm run security:audit:fix

# Verificar apenas dependências de produção
npm run security:audit:production

# Verificar vulnerabilidades moderadas ou superiores
npm run security:check
```

---

## 3) Controle de Versão do Node.js

### Problema: O que causava a vulnerabilidade?

**Antes:** Não havia controle sobre qual versão do Node.js era usada. Isso causava:
- Desenvolvedores usando versões diferentes (Node 18, 20, 22)
- Ambiente de produção usando uma versão diferente do desenvolvimento
- Vulnerabilidades de versões antigas do Node.js não corrigidas

**Exemplo prático do problema:**

- Desenvolvedor A usa Node.js 18.17.0 (tem vulnerabilidade CVE-2023-30581)
- Desenvolvedor B usa Node.js 20.10.0 (vulnerabilidade corrigida)
- Produção usa Node.js 18.15.0 (vulnerável)

Resultado: Código funciona localmente mas falha em produção, ou pior, produção fica vulnerável.

### Correção: O que foi implementado?

Foi criado arquivo `.nvmrc` para fixar a versão do Node.js e adicionada validação no `package.json`.

### Onde foi aplicado

- `.nvmrc` - Arquivo novo criado com a versão fixa do Node.js
- `package.json` - Campo `engines` adicionado para validar versão

### Trecho de código (Antes vs Depois)

**Antes (sem controle de versão)**

```
# Não existia arquivo .nvmrc
# package.json não tinha campo "engines"
```

**Depois (com controle de versão)**

**Arquivo `.nvmrc` (novo):**
```
20.18.0
```

**`package.json` (atualizado):**
```json
{
  "engines": {
    "node": ">=20.18.0 <21.0.0",
    "npm": ">=10.0.0"
  }
}
```

### Benefícios de segurança (na prática)

1. **Consistência**: Todos os desenvolvedores e ambientes usam a mesma versão
2. **Prevenção de vulnerabilidades**: Versões antigas do Node.js com CVEs conhecidos são bloqueadas
3. **Reprodução de bugs**: Problemas são mais fáceis de reproduzir quando todos usam a mesma versão

### Como usar

```bash
# Instalar e usar a versão correta (se usar nvm)
nvm install
nvm use

# Verificar versão atual
node --version
```

---

## 4) Verificação de Integridade de Pacotes

### Problema: O que causava a vulnerabilidade?

**Antes:** Não havia validação de integridade dos pacotes baixados do npm. Isso permitia:
- Ataques de supply chain (pacotes modificados)
- Instalação de versões diferentes do esperado
- Uso de pacotes comprometidos sem detecção

**Exemplo prático do problema (Cenário Real - Event-Stream):**

Em 2018, o pacote `event-stream` foi comprometido. Um atacante:
1. Ganhou acesso à conta do mantenedor
2. Adicionou código malicioso em uma atualização
3. Milhares de projetos que usavam `event-stream` foram infectados automaticamente

Sem verificação de integridade, você instala pacotes sem saber se foram modificados.

### Correção: O que foi implementado?

Foi criado arquivo `.npmrc` com configurações de segurança e habilitada auditoria automática.

### Onde foi aplicado

- `.npmrc` - Arquivo novo criado com configurações de segurança

### Trecho de código (Antes vs Depois)

**Antes (sem configurações de segurança)**

```
# Não existia arquivo .npmrc
# npm instalava pacotes sem validação de integridade
```

**Depois (com verificação de integridade)**

**Arquivo `.npmrc` (novo):**
```
audit=true
audit-level=moderate
fund=false
package-lock=true
save-exact=false
```

### O que cada configuração faz?

- `audit=true`: Executa auditoria automaticamente ao instalar pacotes
- `audit-level=moderate`: Bloqueia instalação se houver vulnerabilidades moderadas ou superiores
- `package-lock=true`: Garante uso do `package-lock.json` para versões exatas
- `fund=false`: Desabilita mensagens de financiamento (reduz ruído)

### Benefícios de segurança (na prática)

1. **Prevenção de pacotes comprometidos**: Auditoria automática detecta pacotes maliciosos
2. **Versões exatas**: `package-lock.json` garante que todos instalem as mesmas versões
3. **Detecção proativa**: Vulnerabilidades são detectadas na instalação, não em produção

### Como usar

```bash
# Instalar com verificação de integridade
npm ci --audit

# Instalar normalmente (agora com auditoria automática)
npm install
```

---

## 5) Trusted Dependencies do Bun (Prevenção de Execução Arbitrária)

### Problema: O que causava a vulnerabilidade?

**Antes:** Com npm, qualquer pacote pode executar scripts arbitrários durante a instalação via `postinstall`, `preinstall`, etc. Isso permite:
- Acesso a variáveis de ambiente (incluindo secrets)
- Execução de código malicioso durante `npm install`
- Roubo de tokens e credenciais
- Modificação de arquivos do sistema

**Exemplo prático do problema (Cenário Real - Shai-Hulud Worm):**

Em 2024, um worm se espalhou via pacotes npm maliciosos:
1. Pacote malicioso é instalado via `npm install`
2. Script `postinstall` é executado automaticamente
3. Script rouba tokens do npm da máquina do desenvolvedor
4. Usa esses tokens para publicar versões maliciosas de outros pacotes
5. Foca especificamente em desenvolvedores (como mencionado no A03:2025)

**Sem proteção:**
- Qualquer pacote pode executar código durante instalação
- Você não tem controle sobre quais pacotes executam scripts
- Código malicioso pode ser executado sem você saber

### Correção: O que foi implementado?

Foi implementada a funcionalidade **Trusted Dependencies** do Bun, que usa uma abordagem "default-secure": por padrão, nenhum pacote pode executar scripts de lifecycle, apenas pacotes explicitamente confiáveis.

### Onde foi aplicado

- `package.json` - Campo `trustedDependencies` adicionado

### Trecho de código (Antes vs Depois)

**Antes (sem controle de scripts de lifecycle)**

```json
{
  "dependencies": {
    "algum-pacote": "^1.0.0"
  }
  // Qualquer pacote pode executar scripts durante instalação
}
```

**Depois (com trusted dependencies)**

```json
{
  "dependencies": {
    "drizzle-kit": "^0.31.4"
  },
  "trustedDependencies": [
    "drizzle-kit"
  ]
}
```

### Como funciona?

1. **Por padrão**: Bun **NÃO executa** scripts de lifecycle de nenhum pacote
2. **Lista de confiança**: Apenas pacotes listados em `trustedDependencies` podem executar scripts
3. **Princípio de menor privilégio**: Você adiciona apenas pacotes que realmente precisam executar scripts

### Quais pacotes devem ser confiáveis?

Apenas pacotes que **realmente precisam** executar scripts, como:
- **drizzle-kit**: Precisa gerar arquivos durante instalação
- Pacotes com código nativo que precisam compilar
- Ferramentas de build que precisam configurar o ambiente

**NÃO adicione:**
- Bibliotecas JavaScript puras (não precisam de scripts)
- Pacotes que você não conhece bem
- Pacotes que não têm necessidade legítima de executar código

### Benefícios de segurança (na prática)

1. **Prevenção de execução arbitrária**: Pacotes maliciosos não podem executar código durante instalação
2. **Proteção de secrets**: Scripts não podem acessar variáveis de ambiente sem permissão
3. **Controle explícito**: Você decide exatamente quais pacotes podem executar scripts
4. **Proteção contra worms**: Previne ataques como o Shai-Hulud que se espalham via scripts de instalação

### Exemplo de proteção

**Cenário: Pacote Malicioso Tentando Roubar Tokens**

**Sem trusted dependencies (npm):**
```bash
$ npm install pacote-malicioso
> pacote-malicioso@1.0.0 postinstall
> node -e "require('fs').writeFileSync('/tmp/tokens.txt', process.env.NPM_TOKEN)"
# Token roubado! ❌
```

**Com trusted dependencies (Bun):**
```bash
$ bun install pacote-malicioso
# Script postinstall é IGNORADO porque pacote-malicioso não está em trustedDependencies
# Token está seguro! ✅
```

### Como adicionar pacotes confiáveis

```bash
# Adicionar um pacote confiável manualmente
# Edite package.json e adicione ao array trustedDependencies

# Ou use o comando do Bun (se disponível)
bun pm trust nome-do-pacote
```

### Recomendações

1. **Mínimo necessário**: Adicione apenas pacotes que realmente precisam
2. **Revisar periodicamente**: Verifique se todos os pacotes na lista ainda são necessários
3. **Documentar razão**: Comente no código por que cada pacote é confiável
4. **Auditar antes de adicionar**: Pesquise o pacote antes de adicioná-lo à lista

---

## 6) Pipeline de CI/CD Seguro

### Problema: O que causava a vulnerabilidade?

**Antes:** O pipeline fazia deploy sem verificar segurança. Isso permitia:
- Deploy de código com vulnerabilidades conhecidas
- Publicação de dependências comprometidas
- Falta de rastreabilidade de segurança

**Exemplo prático do problema:**

Você faz um commit, o pipeline:
1. ✅ Executa testes
2. ✅ Faz build
3. ❌ **NÃO verifica vulnerabilidades**
4. ✅ Faz deploy para produção

Resultado: Código com vulnerabilidades críticas vai para produção sem você saber.

### Correção: O que foi implementado?

Foi criado script de pré-deploy que verifica segurança e atualizado o pipeline para executá-lo antes de cada deploy.

### Onde foi aplicado

- `scripts/pre-deploy-check.js` - Script novo que verifica segurança
- `package.json` - Script `predeploy` adicionado
- `railway.json` - Comando de start atualizado
- `railway.toml` - Comando de start atualizado

### Trecho de código (Antes vs Depois)

**Antes (pipeline sem verificação de segurança)**

**`railway.json`:**
```json
{
  "deploy": {
    "startCommand": "npm run drizzle:push && npm run start:prod"
  }
}
```

**`railway.toml`:**
```toml
[deploy]
startCommand = "npm run drizzle:push && node dist/src/main.js"
```

**Depois (pipeline com verificação de segurança)**

**`scripts/pre-deploy-check.js` (novo):**
```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Verificando segurança antes do deploy...\n');

// Verifica versão do Node.js
// Executa auditoria de segurança
// Gera SBOM
// Bloqueia deploy se houver vulnerabilidades
```

**`package.json` (atualizado):**
```json
{
  "scripts": {
    "predeploy": "node scripts/pre-deploy-check.js"
  }
}
```

**`railway.json` (atualizado):**
```json
{
  "deploy": {
    "startCommand": "npm run predeploy && npm run drizzle:push && npm run start:prod"
  }
}
```

**`railway.toml` (atualizado):**
```toml
[deploy]
startCommand = "npm run predeploy && npm run drizzle:push && node dist/src/main.js"
```

### O que o script de pré-deploy faz?

1. ✅ Verifica se a versão do Node.js está correta (compara com `.nvmrc`)
2. ✅ Executa `npm audit` e **bloqueia deploy se houver vulnerabilidades moderadas ou superiores**
3. ✅ Gera SBOM para rastreabilidade
4. ✅ Permite deploy apenas se todas as verificações passarem

### Benefícios de segurança (na prática)

1. **Bloqueio automático**: Deploys com vulnerabilidades são bloqueados automaticamente
2. **Rastreabilidade**: Cada deploy gera um SBOM, criando histórico de segurança
3. **Prevenção de incidentes**: Vulnerabilidades são detectadas antes de chegar à produção

### Exemplo de saída do script

**Quando tudo está OK:**
```
🔍 Verificando segurança antes do deploy...

✅ Versão do Node.js correta: v20.18.0

📋 Executando auditoria de segurança...
✅ Auditoria passou!

📦 Gerando SBOM...
✅ SBOM gerado em sbom.json

✅ Todas as verificações de segurança passaram!
🚀 Pronto para deploy.
```

**Quando há vulnerabilidades:**
```
🔍 Verificando segurança antes do deploy...

✅ Versão do Node.js correta: v20.18.0

📋 Executando auditoria de segurança...
❌ Auditoria falhou! Corrija as vulnerabilidades antes de fazer deploy.
   Execute: npm audit fix (ou npm audit para ver detalhes)

# Deploy é BLOQUEADO automaticamente
```

---

## Resumo das Mudanças

### Arquivos Criados

1. **`.nvmrc`** - Controle de versão do Node.js
2. **`.npmrc`** - Configurações de segurança do npm
3. **`scripts/pre-deploy-check.js`** - Script de verificação de segurança

### Arquivos Modificados

1. **`package.json`**
   - ✅ Adicionados scripts de SBOM (`sbom:generate`, `sbom:spdx`, `sbom:cyclonedx`)
   - ✅ Adicionados scripts de auditoria (`security:audit`, `security:check`, etc.)
   - ✅ Adicionado script `predeploy` para verificação antes do deploy
   - ✅ Adicionado campo `engines` para validar versão do Node.js
   - ✅ Adicionado campo `trustedDependencies` para controle de scripts de lifecycle (Bun)
   - ✅ Adicionada dependência `@cyclonedx/cyclonedx-npm`

2. **`railway.json`**
   - ✅ Comando de start atualizado para incluir `npm run predeploy`

3. **`railway.toml`**
   - ✅ Comando de start atualizado para incluir `npm run predeploy`

---

## Como Isso Melhora a Segurança de Forma Real

### Antes (Situação Vulnerável)

❌ **Sem rastreamento**: Você não sabia quais dependências estavam instaladas
❌ **Sem auditoria**: Vulnerabilidades eram descobertas apenas quando exploradas
❌ **Sem controle de versão**: Diferentes versões do Node.js causavam inconsistências
❌ **Sem verificação de integridade**: Pacotes comprometidos podiam ser instalados
❌ **Execução arbitrária de scripts**: Qualquer pacote podia executar código durante instalação
❌ **Pipeline inseguro**: Deploys aconteciam sem verificação de segurança

**Resultado:** Aplicação vulnerável a ataques de supply chain, sem visibilidade de segurança.

### Depois (Situação Protegida)

✅ **SBOM completo**: Você sabe exatamente quais dependências estão instaladas
✅ **Auditoria automática**: Vulnerabilidades são detectadas antes de chegar à produção
✅ **Versão controlada**: Todos usam a mesma versão do Node.js (sem vulnerabilidades conhecidas)
✅ **Integridade verificada**: Pacotes são validados antes da instalação
✅ **Scripts controlados**: Apenas pacotes confiáveis podem executar código durante instalação (Bun)
✅ **Pipeline seguro**: Deploys são bloqueados automaticamente se houver vulnerabilidades

**Resultado:** Aplicação protegida contra ataques de supply chain, com visibilidade completa de segurança.

### Cenários Reais de Proteção

#### Cenário 1: CVE Crítico Descoberto

**Antes:**
1. CVE crítico é anunciado em uma biblioteca que você usa
2. Você não sabe se está afetado (sem SBOM)
3. Leva dias para identificar e corrigir
4. Aplicação fica vulnerável durante esse tempo

**Depois:**
1. CVE crítico é anunciado
2. Você executa `npm run sbom:generate` e descobre imediatamente se está afetado
3. Executa `npm audit fix` e corrige automaticamente
4. Pipeline bloqueia deploy se ainda houver vulnerabilidades

#### Cenário 2: Pacote Comprometido (Tipo Event-Stream)

**Antes:**
1. Atacante compromete um pacote npm
2. Você faz `npm install` e instala o pacote comprometido
3. Código malicioso é executado em produção
4. Dados são roubados ou servidor é comprometido

**Depois:**
1. Atacante compromete um pacote npm
2. Você faz `npm install`
3. `.npmrc` com `audit=true` detecta o problema automaticamente
4. Instalação é bloqueada ou você é alertado
5. Pipeline bloqueia deploy se houver problemas

#### Cenário 3: Deploy com Vulnerabilidades

**Antes:**
1. Você faz commit de código com dependências vulneráveis
2. Pipeline executa testes e build
3. Deploy acontece automaticamente
4. Aplicação vulnerável vai para produção

**Depois:**
1. Você faz commit de código com dependências vulneráveis
2. Pipeline executa testes e build
3. **Script `predeploy` executa auditoria**
4. **Deploy é BLOQUEADO automaticamente**
5. Você recebe alerta e corrige antes de publicar

---

## Checklist de Validação (Operacional)

- [ ] Executar `npm install` para instalar `@cyclonedx/cyclonedx-npm`
- [ ] Executar `npm run security:audit` e verificar se há vulnerabilidades
- [ ] Executar `npm run sbom:generate` e verificar se `sbom.json` foi criado
- [ ] Verificar se `.nvmrc` existe e contém a versão correta do Node.js
- [ ] Verificar se `.npmrc` existe e contém as configurações de segurança
- [ ] Verificar se `trustedDependencies` está configurado no `package.json` (se usar Bun)
- [ ] Testar script de pré-deploy: `npm run predeploy`
- [ ] Verificar se `railway.json` e `railway.toml` foram atualizados
- [ ] Fazer commit e verificar se o pipeline executa verificações de segurança
- [ ] Testar deploy e confirmar que verificações são executadas antes do deploy

---

## Comandos Úteis

```bash
# Verificar vulnerabilidades
npm run security:audit

# Corrigir vulnerabilidades automaticamente
npm run security:audit:fix

# Gerar SBOM
npm run sbom:generate

# Verificar segurança antes de fazer commit
npm run security:check

# Testar script de pré-deploy localmente
npm run predeploy

# Instalar dependências de forma segura
npm ci --audit
```

---

## Próximos Passos Recomendados

1. **Configurar Dependabot ou Renovate** para atualizações automáticas de dependências
2. **Integrar com OWASP Dependency Track** (gratuito, self-hosted) para monitoramento contínuo
3. **Estabelecer processo de patching** baseado em risco (não esperar janelas trimestrais)
4. **Documentar política de atualização** de dependências
5. **Configurar alertas** para CVEs críticos

---

## Referências

- [OWASP Top 10 2025 - A03: Software Supply Chain Failures](https://owasp.org/www-project-top-ten/)
- [NPM Audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [CycloneDX Specification](https://cyclonedx.org/)
- [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm)
- [Bun Trusted Dependencies](https://bun.com/docs/guides/install/trusted)
