const { Client } = require('pg');

async function addProducerEnum() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔌 Conectado ao banco de dados');

    console.log('🔄 Adicionando PRODUCER ao enum subscription_plan...');

    await client.query(
      'ALTER TYPE "public"."subscription_plan" ADD VALUE IF NOT EXISTS \'PRODUCER\';',
    );

    console.log('✅ Enumerador atualizado com sucesso!');
  } catch (error) {
    // Ignorar erro se o valor já existir (embora IF NOT EXISTS deva tratar isso)
    if (error.code === '42710') {
      console.log('⚠️  PRODUCER já existe no enum (ignorado)');
    } else {
      console.error('❌ Erro ao atualizar enum:', error.message);
      console.error(error);
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('🔌 Conexão com banco encerrada');
  }
}

if (require.main === module) {
  // Carregar .env se necessário
  if (!process.env.DATABASE_URL) {
    try {
      require('dotenv').config();
    } catch (e) {
      console.log('⚠️  dotenv não encontrado ou erro ao carregar');
    }
  }

  addProducerEnum();
}
