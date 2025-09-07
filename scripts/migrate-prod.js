
const { execSync } = require('child_process');

console.log('🚀 Executando setup completo de produção...');

try {
    console.log('📊 Executando Drizzle migrations...');
    execSync('npm run drizzle:push', { stdio: 'inherit' });

    console.log('👤 Verificando usuário admin...');
    execSync('npm run setup:prod', { stdio: 'inherit' });

    console.log('✅ Setup de produção concluído!');
    console.log('🌐 Aplicação pronta para produção!');
} catch (error) {
    console.error('❌ Erro no setup de produção:', error.message);
    process.exit(1);
} 
