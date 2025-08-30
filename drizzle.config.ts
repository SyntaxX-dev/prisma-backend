import 'dotenv/config';

export default {
  schema: './src/infrastructure/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgres://postgres:postgres@localhost:5432/postgres',
  },
};
