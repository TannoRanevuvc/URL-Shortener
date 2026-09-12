import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'urlshortener',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS urls (
      id SERIAL PRIMARY KEY,
      short_code VARCHAR(10) UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      clicks INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      user_id VARCHAR(36) DEFAULT NULL
    )
  `);
  // migrate existing tables that don't have user_id yet
  await pool.query(`
    ALTER TABLE urls ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) DEFAULT NULL
  `);
}
