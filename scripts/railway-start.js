#!/usr/bin/env node

const { execSync } = require('child_process');
const { spawn } = require('child_process');

/**
 * Script de inicialização robusto para Railway
 * 
 * Executa os passos de pré-inicialização (predeploy, drizzle:push)
 * mas não bloqueia o servidor se algum passo falhar.
 * O servidor sempre tentará iniciar.
 */

function runOrContinue(command, description) {
  console.log('');
  console.log(`📋 ${description}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} concluído com sucesso`);
    return true;
  } catch (error) {
    console.warn(`⚠️  ${description} falhou, mas continuando...`);
    console.warn(`   Erro: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando aplicação no Railway...');
  console.log('📋 Variáveis de ambiente disponíveis:');
  console.log(`   PORT: ${process.env.PORT || 'não definido'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ definido' : '❌ não definido'}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ definido' : '❌ não definido'}`);
  console.log(`   RAILWAY_ENVIRONMENT: ${process.env.RAILWAY_ENVIRONMENT || 'não definido'}`);

  // Executar predeploy (não crítico em produção)
  runOrContinue('npm run predeploy', 'Executando verificações de pré-deploy');

  // Executar drizzle:push (pode falhar se DATABASE_URL não estiver configurada)
  runOrContinue('npm run drizzle:push', 'Aplicando migrações do banco de dados');

  // Iniciar servidor (sempre executar)
  console.log('');
  console.log('🌐 Iniciando servidor Node.js...');
  console.log('   Comando: node dist/src/main.js');
  console.log('');

  // Executar o servidor e passar todos os sinais para ele
  const server = spawn('node', ['dist/src/main.js'], {
    stdio: 'inherit',
    env: process.env,
  });

  // Passar sinais para o processo filho
  process.on('SIGTERM', () => {
    console.log('📨 Recebido SIGTERM, encerrando servidor...');
    server.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('📨 Recebido SIGINT, encerrando servidor...');
    server.kill('SIGINT');
  });

  // Aguardar o servidor terminar
  server.on('exit', (code, signal) => {
    console.log(`\n🛑 Servidor encerrado com código ${code}${signal ? ` e sinal ${signal}` : ''}`);
    process.exit(code || 0);
  });

  server.on('error', (error) => {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('❌ Erro fatal no script de inicialização:', error);
  process.exit(1);
});
