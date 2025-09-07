const { execSync } = require('child_process');

async function startup() {
    try {
        console.log('🚀 Iniciando setup de produção...');

        console.log('📊 Aplicando migrações...');
        execSync('npm run drizzle:push', { stdio: 'inherit' });

        console.log('👤 Verificando usuário admin...');
        execSync('npm run setup:prod', { stdio: 'inherit' });

        console.log('✅ Setup de produção concluído!');

    } catch (error) {
        console.error('❌ Erro no startup:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    startup();
}

module.exports = { startup };
