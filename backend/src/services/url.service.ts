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
    const visitorsKey = `visits:${code}`;

    const [cached, isNewVisitor] = await Promise.all([
      this.redis.get(cacheKey),
      this.redis.sadd(visitorsKey, visitorIp).then((added) => added === 1),
    ]);

    const incrementAll = async (originalUrl: string) => {
      await this.repo.incrementClicks(code);
      if (isNewVisitor) await this.repo.incrementUniqueClicks(code);
      return originalUrl;
    };

    if (cached) {
      incrementAll(cached).catch((err: Error) =>
        console.error('[DB] Failed to increment clicks:', err.message),
      );
      return cached;
    }

    const record = await this.repo.findByCode(code);
    if (!record) throw new AppError(404, `Short code "${code}" not found`);

    await this.redis.set(cacheKey, record.original_url, 'EX', CACHE_TTL);
    await incrementAll(record.original_url);

    return record.original_url;
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
