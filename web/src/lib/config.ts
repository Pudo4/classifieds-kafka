/**
 * Default matches the project-wide convention (`BFF_HTTP_PORT` defaults to
 * 3000, see services/bff/src/infrastructure/config.ts). On a machine where
 * port 3000 is already taken by something else, set `VITE_BFF_URL` in
 * `web/.env.local` to match whatever port `bff` was actually started on
 * (see README's phase 7 note on this exact conflict).
 */
export const BFF_BASE_URL: string = import.meta.env['VITE_BFF_URL'] ?? 'http://localhost:3000';
