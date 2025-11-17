/**
 * Script para criar o banco de dados PostgreSQL
 * Uso: node scripts/create-database.js
 */

const { Client } = require('pg');

async function createDatabase() {
  // Conectar ao postgres (banco padrão) para criar o banco
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres', // Conecta ao banco padrão primeiro
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Verificar se o banco já existe
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'prisma'"
    );

    if (checkDb.rows.length > 0) {
      console.log('ℹ️  Banco de dados "prisma" já existe');
    } else {
      // Criar o banco
      await client.query('CREATE DATABASE prisma');
      console.log('✅ Banco de dados "prisma" criado com sucesso!');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Não foi possível conectar ao PostgreSQL.');
      console.error('Certifique-se de que o PostgreSQL está rodando na porta 5432');
      console.error('Usuário: postgres, Senha: postgres');
      process.exit(1);
    } else if (error.code === '28P01') {
      console.error('❌ Senha incorreta para o usuário "postgres"');
      console.error('Edite o arquivo .env com a senha correta');
      process.exit(1);
    } else {
      console.error('❌ Erro:', error.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

createDatabase();
