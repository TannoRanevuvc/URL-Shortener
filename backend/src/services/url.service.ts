import { Redis } from 'ioredis';
import { UrlRepository } from '../repositories/url.repository';
import { AppError, CreateUrlResult, StatsResponse } from '../types';
import { generateUniqueCode } from '../utils/codeGenerator';

const CACHE_TTL = 3600;

export class UrlService {
  constructor(
    private readonly repo: UrlRepository,
    private readonly redis: Redis,
    private readonly baseUrl: string,
  ) {}

  async createShortUrl(originalUrl: string): Promise<CreateUrlResult> {
    let parsed: URL;
    try {
      parsed = new URL(originalUrl);
    } catch {
      throw new AppError(400, 'Invalid URL format');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new AppError(400, 'Only HTTP and HTTPS URLs are allowed');
    }

    if (originalUrl.startsWith(this.baseUrl)) {
      throw new AppError(400, 'Circular redirect: cannot shorten a URL that points to this service');
    }

    const shortCode = await generateUniqueCode(this.repo);
    await this.repo.create(shortCode, originalUrl);

    return { shortCode, shortUrl: `${this.baseUrl}/${shortCode}` };
  }

  async resolveShortUrl(code: string): Promise<string> {
    const cacheKey = `url:${code}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      // Increment clicks async — don't block the redirect
      this.repo.incrementClicks(code).catch((err: Error) =>
        console.error('[DB] Failed to increment clicks:', err.message),
      );
      return cached;
    }

    const record = await this.repo.findByCode(code);
    if (!record) throw new AppError(404, `Short code "${code}" not found`);

    await this.redis.set(cacheKey, record.original_url, 'EX', CACHE_TTL);
    await this.repo.incrementClicks(code);

    return record.original_url;
  }

  async getStats(code: string): Promise<StatsResponse> {
    const record = await this.repo.findByCode(code);
    if (!record) throw new AppError(404, `Short code "${code}" not found`);

    return {
      originalUrl: record.original_url,
      shortCode: record.short_code,
      clicks: record.clicks,
      createdAt: record.created_at,
    };
  }
}
