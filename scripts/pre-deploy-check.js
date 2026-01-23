#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando segurança antes do deploy...\n');

// Verificar se .nvmrc existe e validar versão do Node.js
const nvmrcPath = path.join(__dirname, '..', '.nvmrc');
if (fs.existsSync(nvmrcPath)) {
  const nvmrcVersion = fs.readFileSync(nvmrcPath, 'utf8').trim();
  const nodeVersion = process.version;
  const expectedMajor = nvmrcVersion.split('.')[0];
  const actualMajor = nodeVersion.split('.')[0].replace('v', '');
  
  if (actualMajor !== expectedMajor) {
    console.error(`❌ Versão do Node.js incorreta. Esperado: v${expectedMajor}.x.x, Atual: ${nodeVersion}`);
    console.error(`   Use: nvm use (ou instale Node.js ${nvmrcVersion})`);
    process.exit(1);
  }
  console.log(`✅ Versão do Node.js correta: ${nodeVersion}\n`);
}

// Executar auditoria de segurança
try {
  console.log('📋 Executando auditoria de segurança...');
  execSync('npm audit --audit-level=moderate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ Auditoria passou!\n');
} catch (error) {
  console.error('\n❌ Auditoria falhou! Corrija as vulnerabilidades antes de fazer deploy.');
  console.error('   Execute: npm audit fix (ou npm audit para ver detalhes)');
  process.exit(1);
}

// Gerar SBOM (opcional, não bloqueia se falhar)
try {
  console.log('📦 Gerando SBOM...');
  execSync('npm run sbom:generate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('✅ SBOM gerado em sbom.json\n');
} catch (error) {
  console.warn('⚠️  Falha ao gerar SBOM, mas continuando...\n');
}

console.log('✅ Todas as verificações de segurança passaram!');
console.log('🚀 Pronto para deploy.\n');
