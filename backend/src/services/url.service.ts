import { Redis } from 'ioredis';
import { UrlRepository } from '../repositories/url.repository';
import { AppError, CreateUrlResult, StatsResponse, UrlRecord } from '../types';
import { generateUniqueCode } from '../utils/codeGenerator';

const CACHE_TTL = 3600;

export interface UserLinkItem {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  clicks: number;
  uniqueClicks: number;
  createdAt: Date;
}

export class UrlService {
  constructor(
    private readonly repo: UrlRepository,
    private readonly redis: Redis,
    private readonly baseUrl: string,
  ) {}

  async createShortUrl(originalUrl: string, userId: string | null): Promise<CreateUrlResult> {
    let parsed: URL;
    try {
      parsed = new URL(originalUrl);
    } catch {
      throw new AppError(400, 'Invalid URL format');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new AppError(400, 'Only HTTP and HTTPS URLs are allowed');
    }

    const parsedBase = new URL(this.baseUrl);
    if (
      parsed.protocol === parsedBase.protocol &&
      parsed.hostname === parsedBase.hostname &&
      parsed.port === parsedBase.port
    ) {
      throw new AppError(400, 'Circular redirect: cannot shorten a URL that points to this service');
    }

    const shortCode = await generateUniqueCode(this.repo);
    await this.repo.create(shortCode, originalUrl, userId);

    return { shortCode, shortUrl: `${this.baseUrl}/${shortCode}` };
  }

  async resolveShortUrl(code: string, visitorIp: string): Promise<string> {
    const cacheKey = `url:${code}`;

    // Step 1: resolve URL — cache first, then DB
    let originalUrl = await this.redis.get(cacheKey);
    const fromCache = originalUrl !== null;

    if (!fromCache) {
      const record = await this.repo.findByCode(code);
      if (!record) throw new AppError(404, `Short code "${code}" not found`);
      originalUrl = record.original_url;
      await this.redis.set(cacheKey, originalUrl, 'EX', CACHE_TTL);
    }

    // Step 2: track visits — only after confirming code exists
    const visitorsKey = `visits:${code}`;
    const isNewVisitor = (await this.redis.sadd(visitorsKey, visitorIp)) === 1;
    // Set TTL on first visitor so the key doesn't live forever (NX = only if no TTL yet)
    if (isNewVisitor) {
      await this.redis.expire(visitorsKey, 30 * 24 * 3600, 'NX');
    }

    const increment = async () => {
      await this.repo.incrementClicks(code);
      if (isNewVisitor) await this.repo.incrementUniqueClicks(code);
    };

    if (fromCache) {
      increment().catch((err: Error) =>
        console.error('[DB] Failed to increment clicks:', err.message),
      );
    } else {
      await increment();
    }

    return originalUrl as string;
  }

  async getStats(code: string): Promise<StatsResponse> {
    const record = await this.repo.findByCode(code);
    if (!record) throw new AppError(404, `Short code "${code}" not found`);

    return {
      originalUrl: record.original_url,
      shortCode: record.short_code,
      clicks: record.clicks,
      uniqueClicks: record.unique_clicks,
      createdAt: record.created_at,
    };
  }

  async getUserLinks(userId: string): Promise<UserLinkItem[]> {
    const records: UrlRecord[] = await this.repo.findByUserId(userId);
    return records.map((r) => ({
      shortCode: r.short_code,
      shortUrl: `${this.baseUrl}/${r.short_code}`,
      originalUrl: r.original_url,
      clicks: r.clicks,
      uniqueClicks: r.unique_clicks,
      createdAt: r.created_at,
    }));
  }
}
