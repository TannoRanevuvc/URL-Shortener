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

  async create(code: string, originalUrl: string, userId: string | null): Promise<UrlRecord> {
    const { rows } = await this.db.query<UrlRecord>(
      'INSERT INTO urls (short_code, original_url, user_id) VALUES ($1, $2, $3) RETURNING *',
      [code, originalUrl, userId],
    );
    return rows[0];
  }

  async incrementClicks(code: string): Promise<void> {
    await this.db.query('UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1', [code]);
  }

  async incrementUniqueClicks(code: string): Promise<void> {
    await this.db.query('UPDATE urls SET unique_clicks = unique_clicks + 1 WHERE short_code = $1', [code]);
  }

  async findByUserId(userId: string): Promise<UrlRecord[]> {
    const { rows } = await this.db.query<UrlRecord>(
      'SELECT * FROM urls WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
    );
    return rows;
  }
}
