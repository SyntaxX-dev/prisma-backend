#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Executando migrações em produção...');

try {
    // Executar migrações do Drizzle
    console.log('📊 Executando Drizzle migrations...');
    execSync('npm run drizzle:push', { stdio: 'inherit' });

    console.log('✅ Migrações executadas com sucesso!');
    console.log('🌐 Aplicação pronta para produção!');
} catch (error) {
    console.error('❌ Erro ao executar migrações:', error.message);
    process.exit(1);
} 
