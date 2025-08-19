import { Injectable } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

function createDb(pool: Pool): NodePgDatabase {
  return drizzle(pool as unknown);
}

@Injectable()
export class DrizzleService {
  public readonly db: NodePgDatabase;
  private readonly pool: Pool;

  constructor() {
    dotenv.config();
    const connectionString = process.env.DATABASE_URL;

    const poolConfig: ConstructorParameters<typeof Pool>[0] = connectionString
      ? { connectionString }
      : {
          host: process.env.DB_HOST ?? 'localhost',
          port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
          user: process.env.DB_USER ?? 'postgres',
          password: process.env.DB_PASSWORD ?? 'postgres',
          database: process.env.DB_NAME ?? 'postgres',
        };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const poolInstance: Pool = new Pool(poolConfig as any);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.pool = poolInstance;

    this.db = createDb(this.pool);
  }
}
