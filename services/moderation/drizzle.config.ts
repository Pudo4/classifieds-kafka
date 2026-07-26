import { defineConfig } from 'drizzle-kit';

// See services/listing/drizzle.config.ts for why this doesn't import
// ../src/infrastructure/config.js.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/drizzle/schema.ts',
  out: './drizzle',
  dbCredentials: {
    host: process.env['POSTGRES_HOST'] ?? 'localhost',
    port: Number(process.env['POSTGRES_PORT'] ?? 5432),
    database: process.env['MODERATION_DB_NAME'] ?? 'moderation_db',
    user: process.env['MODERATION_DB_USER'] ?? 'moderation_svc',
    password: process.env['MODERATION_DB_PASSWORD'] ?? 'moderation_pw',
  },
});
