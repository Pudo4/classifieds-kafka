import { defineConfig } from 'drizzle-kit';

// Deliberately not importing ./src/infrastructure/config.js here:
// drizzle-kit loads this file through its own CJS transform, which doesn't
// follow this project's NodeNext (`.js`-suffixed relative import) module
// resolution, so pulling in our own source tree fails to resolve. `generate`
// (used at dev time) doesn't need a live connection anyway; only `migrate`
// does, and that runs through our normal tsx/Node ESM setup instead.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/drizzle/schema.ts',
  out: './drizzle',
  dbCredentials: {
    host: process.env['POSTGRES_HOST'] ?? 'localhost',
    port: Number(process.env['POSTGRES_PORT'] ?? 5432),
    database: process.env['LISTING_DB_NAME'] ?? 'listings_db',
    user: process.env['LISTING_DB_USER'] ?? 'listing_svc',
    password: process.env['LISTING_DB_PASSWORD'] ?? 'listing_pw',
  },
});
