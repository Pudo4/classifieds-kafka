import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { ModerationServiceConfig } from '../config.js';
import * as schema from './schema.js';

export function createDb(config: ModerationServiceConfig['db']): ReturnType<typeof drizzle<typeof schema>> {
  const pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
  });
  return drizzle(pool, { schema });
}

export type Db = ReturnType<typeof createDb>;
