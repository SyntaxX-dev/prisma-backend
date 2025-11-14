import 'dotenv/config';

// Carregar .env apenas se não estiver no Railway
// No Railway, as variáveis já estão disponíveis via process.env
if (process.env.RAILWAY_ENVIRONMENT) {
  // Estamos no Railway, não precisa carregar .env
  console.log('[DRIZZLE_CONFIG] Executando no Railway - usando variáveis de ambiente');
} else {
  // Desenvolvimento local, carregar .env
  const dotenv = require('dotenv');
  dotenv.config();
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.trim() === '' || databaseUrl.includes('${{')) {
  console.error('❌ DATABASE_URL não está definida ou contém templates não resolvidos');
  console.error('Configure DATABASE_URL nas variáveis de ambiente do Railway');
  if (!process.env.RAILWAY_ENVIRONMENT) {
    console.error('Para desenvolvimento local, configure DATABASE_URL no arquivo .env');
  }
  process.exit(1);
}

export default {
  schema: './src/infrastructure/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
};
