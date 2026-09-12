import { Pool } from 'pg';
import { UrlRecord } from '../types';

export class UrlRepository {
  constructor(private readonly db: Pool) {}

  async findByCode(code: string): Promise<UrlRecord | null> {
    const { rows } = await this.db.query<UrlRecord>(
      'SELECT * FROM urls WHERE short_code = $1',
      [code],
    );
    return rows[0] ?? null;
  }

  async create(code: string, originalUrl: string): Promise<UrlRecord> {
    const { rows } = await this.db.query<UrlRecord>(
      'INSERT INTO urls (short_code, original_url) VALUES ($1, $2) RETURNING *',
      [code, originalUrl],
    );
    return rows[0];
  }

  async incrementClicks(code: string): Promise<void> {
    await this.db.query('UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1', [code]);
  }
}
