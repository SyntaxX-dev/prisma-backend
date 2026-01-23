# Análise dos Arquivos SBOM Gerados

## O que são os arquivos SBOM?

**SBOM** (Software Bill of Materials) é um inventário completo de todas as dependências do seu projeto, incluindo:
- Dependências diretas (que você instalou explicitamente)
- Dependências transitivas (que suas dependências usam)
- Versões exatas de cada pacote
- Informações de licenciamento
- Hashes de integridade

---

## Arquivos Gerados

### 1. `sbom.json` (270 KB)
- **Formato**: JSON simples gerado pelo `npm ls`
- **Tamanho**: 270.691 bytes
- **Conteúdo**: Árvore completa de dependências em formato hierárquico

### 2. `sbom.cyclonedx.json` (1.5 MB)
- **Formato**: CycloneDX (padrão OWASP/ISO)
- **Tamanho**: 1.549.501 bytes
- **Conteúdo**: Inventário completo no formato padrão da indústria

---

## O que os SBOMs revelam sobre seu projeto?

### 📊 Estatísticas Gerais

- **Projeto**: `prisma-back` v0.0.1
- **Dependências diretas**: 67 pacotes
- **Total de componentes** (incluindo transitivas): **825 pacotes**
- **Data de geração**: 23/01/2026 01:27:26

### 🔍 O que isso significa?

**Antes de ter o SBOM:**
- Você sabia que tinha ~67 dependências diretas
- **NÃO sabia** que na verdade usa **825 pacotes** no total
- Não tinha como rastrear dependências transitivas

**Agora com o SBOM:**
- ✅ Você sabe exatamente quais são todos os 825 pacotes
- ✅ Sabe as versões exatas de cada um
- ✅ Pode rastrear rapidamente se um CVE afeta seu projeto

---

## Exemplo Prático: Por que isso importa?

### Cenário Real: CVE Crítico Descoberto

Imagine que amanhã é anunciado um CVE crítico na biblioteca `lodash` versão 4.17.20.

**Sem SBOM:**
1. Você não sabe se usa `lodash` diretamente
2. Você não sabe se alguma dependência usa `lodash` indiretamente
3. Leva horas ou dias para verificar manualmente
4. Enquanto isso, sua aplicação está vulnerável

**Com SBOM:**
1. Você abre `sbom.cyclonedx.json`
2. Faz uma busca por "lodash"
3. Descobre imediatamente se está usando e em qual versão
4. Corrige em minutos, não dias

### Exemplo de Busca no SBOM

```bash
# Buscar por uma dependência específica
grep -i "lodash" sbom.cyclonedx.json

# Ou usar PowerShell
Select-String -Path sbom.cyclonedx.json -Pattern "lodash" -CaseSensitive:$false
```

---

## Estrutura dos Arquivos

### `sbom.json` (Formato npm ls)

```json
{
  "version": "0.0.1",
  "name": "prisma-back",
  "dependencies": {
    "@casl/ability": {
      "version": "6.8.0",
      "resolved": "https://registry.npmjs.org/...",
      "dependencies": {
        // Dependências transitivas aqui
      }
    }
  }
}
```

**Vantagens:**
- ✅ Formato simples e legível
- ✅ Mostra hierarquia de dependências
- ✅ Fácil de processar com scripts

**Desvantagens:**
- ❌ Não segue padrão da indústria
- ❌ Falta informações de licenciamento detalhadas
- ❌ Não tem hashes de integridade

### `sbom.cyclonedx.json` (Formato CycloneDX)

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.4",
  "components": [
    {
      "type": "library",
      "name": "ability",
      "group": "@casl",
      "version": "6.8.0",
      "licenses": [{"license": {"id": "MIT"}}],
      "purl": "pkg:npm/%40casl/ability@6.8.0",
      "externalReferences": [
        {
          "url": "git+https://github.com/...",
          "type": "vcs"
        }
      ],
      "hashes": [
        {
          "alg": "SHA-512",
          "content": "229b789b3238812827a2615d68f8da2e..."
        }
      ]
    }
  ]
}
```

**Vantagens:**
- ✅ Padrão da indústria (OWASP/ISO)
- ✅ Informações completas (licenças, hashes, URLs)
- ✅ Compatível com ferramentas de segurança
- ✅ Pode ser importado em sistemas de gestão de vulnerabilidades

**Desvantagens:**
- ❌ Arquivo maior (1.5 MB vs 270 KB)
- ❌ Mais complexo de ler manualmente

---

## Top 10 Dependências Principais Identificadas

1. **@casl/ability** v6.8.0 - Sistema de autorização
2. **@ucast/mongo2js** v1.4.0 - Transformação de queries
3. **@ucast/core** v1.10.2 - Core de queries
4. **@ucast/js** v3.0.4 - Queries JavaScript
5. **@ucast/mongo** v2.4.3 - Queries MongoDB
6. **@cyclonedx/cyclonedx-npm** v1.20.0 - Gerador de SBOM
7. **@cyclonedx/cyclonedx-library** v6.13.1 - Biblioteca CycloneDX
8. **ajv-formats-draft2019** v1.6.1 - Validação de formatos
9. **ajv** v6.12.6 - Validador JSON Schema
10. **punycode** v2.3.1 - Codificação de caracteres

---

## Informações de Segurança Reveladas

### Hashes de Integridade

Cada componente no SBOM CycloneDX tem um hash SHA-512. Isso permite:
- ✅ Verificar se um pacote foi modificado
- ✅ Validar integridade durante instalação
- ✅ Detectar pacotes comprometidos

### Licenças

O SBOM mostra as licenças de cada componente:
- **MIT**: Maioria das dependências
- **Apache-2.0**: Algumas bibliotecas
- **UNLICENSED**: Seu projeto

**Por que isso importa?**
- Algumas empresas exigem auditoria de licenças
- Você precisa garantir que não está violando licenças
- Algumas licenças (como GPL) podem ter implicações legais

### Referências Externas

Cada componente tem links para:
- **Repositório Git**: Onde o código fonte está
- **Website**: Documentação oficial
- **Issue Tracker**: Onde reportar bugs
- **Distribuição**: URL do pacote no npm

**Por que isso importa?**
- Você pode verificar rapidamente se um repositório foi comprometido
- Pode verificar se há issues de segurança abertas
- Pode verificar a última atualização do pacote

---

## Como Usar os SBOMs na Prática

### 1. Verificar se uma vulnerabilidade afeta seu projeto

```bash
# Exemplo: Verificar se usa uma biblioteca específica
Select-String -Path sbom.cyclonedx.json -Pattern "express" -CaseSensitive:$false
```

### 2. Contar dependências por tipo

```bash
# Contar quantas dependências são de produção vs desenvolvimento
$sbom = Get-Content sbom.cyclonedx.json -Raw | ConvertFrom-Json
$sbom.components | Group-Object type | Select-Object Name, Count
```

### 3. Listar todas as licenças

```bash
# Ver todas as licenças diferentes usadas
$sbom = Get-Content sbom.cyclonedx.json -Raw | ConvertFrom-Json
$sbom.components | Where-Object { $_.licenses } | 
  ForEach-Object { $_.licenses[0].license.id } | 
  Sort-Object -Unique
```

### 4. Exportar para ferramentas de segurança

O formato CycloneDX é compatível com:
- **OWASP Dependency Track** (gratuito, self-hosted)
- **Snyk** (comercial)
- **GitHub Advanced Security** (comercial)
- **GitLab Dependency Scanning** (comercial)

---

## Comparação: Antes vs Depois

### Antes (Sem SBOM)

❌ **Sem visibilidade**: Você não sabia quantas dependências realmente tinha
❌ **Sem rastreabilidade**: Impossível rastrear dependências transitivas
❌ **Resposta lenta**: Leva horas/dias para responder a CVEs
❌ **Sem auditoria**: Impossível fazer auditoria de segurança completa
❌ **Sem compliance**: Difícil atender requisitos de compliance

### Depois (Com SBOM)

✅ **Visibilidade completa**: Você sabe exatamente quais são os 825 pacotes
✅ **Rastreabilidade total**: Pode rastrear qualquer dependência, direta ou transitiva
✅ **Resposta rápida**: Responde a CVEs em minutos, não dias
✅ **Auditoria facilitada**: Pode fazer auditoria completa de segurança
✅ **Compliance**: Pode atender requisitos de compliance facilmente

---

## Próximos Passos Recomendados

1. **Integrar com OWASP Dependency Track**
   - Instalar Dependency Track (gratuito, self-hosted)
   - Importar o SBOM CycloneDX
   - Receber alertas automáticos de CVEs

2. **Gerar SBOM em cada deploy**
   - Adicionar ao pipeline de CI/CD
   - Armazenar SBOMs históricos
   - Comparar SBOMs entre versões

3. **Configurar alertas**
   - Alertar quando novas vulnerabilidades são descobertas
   - Alertar quando dependências ficam desatualizadas
   - Alertar quando licenças mudam

4. **Revisar periodicamente**
   - Revisar SBOM mensalmente
   - Verificar dependências não utilizadas
   - Atualizar dependências vulneráveis

---

## Comandos Úteis

```bash
# Gerar SBOM novamente
npm run sbom:generate

# Gerar SBOM no formato CycloneDX
npm run sbom:cyclonedx

# Buscar uma dependência específica
Select-String -Path sbom.cyclonedx.json -Pattern "nome-da-biblioteca"

# Contar total de componentes
$sbom = Get-Content sbom.cyclonedx.json -Raw | ConvertFrom-Json
$sbom.components.Count

# Listar todas as versões de uma biblioteca
$sbom = Get-Content sbom.cyclonedx.json -Raw | ConvertFrom-Json
$sbom.components | Where-Object { $_.name -like "*express*" } | 
  Select-Object name, version, group
```

---

## Conclusão

Os arquivos SBOM são como uma "lista de ingredientes" completa do seu software. Eles revelam:

1. **825 componentes** no total (muito mais que os 67 diretos)
2. **Versões exatas** de cada pacote
3. **Licenças** de cada componente
4. **Hashes de integridade** para validação
5. **Referências** para verificação

**Isso é crucial para segurança** porque:
- Permite resposta rápida a CVEs
- Facilita auditorias de segurança
- Atende requisitos de compliance
- Previne ataques de supply chain

**Mantenha os SBOMs atualizados** e gere um novo sempre que:
- Adicionar ou remover dependências
- Fazer deploy para produção
- Atualizar versões de dependências
