/**
 * Neon HTTP driver. Same pattern as Even-CDMSS — single shared instance,
 * tagged-template usage (sql`SELECT ...`).
 *
 * Reuses the CDMSS Neon DB per PRD §7.2. Portal tables live in v9 namespace;
 * CDMSS tables (app_settings, traces, chunks, etc.) untouched.
 */
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export const sql = neon(process.env.DATABASE_URL);
