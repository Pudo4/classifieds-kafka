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
    database: process.env['ENGAGEMENT_DB_NAME'] ?? 'engagement_db',
    user: process.env['ENGAGEMENT_DB_USER'] ?? 'engagement_svc',
    password: process.env['ENGAGEMENT_DB_PASSWORD'] ?? 'engagement_pw',
  },
});
