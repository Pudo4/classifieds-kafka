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
    database: process.env['NOTIFICATION_DB_NAME'] ?? 'notifications_db',
    user: process.env['NOTIFICATION_DB_USER'] ?? 'notification_svc',
    password: process.env['NOTIFICATION_DB_PASSWORD'] ?? 'notification_pw',
  },
});
