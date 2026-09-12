import { RequestHandler } from 'express';
import { UrlService } from '../services/url.service';

export class UrlController {
  constructor(private readonly service: UrlService) {}

  shorten: RequestHandler = async (req, res, next) => {
    try {
      const { originalUrl, userId } = req.body as { originalUrl: string; userId?: string };
      const result = await this.service.createShortUrl(originalUrl, userId ?? null);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  redirect: RequestHandler = async (req, res, next) => {
    try {
      const { shortCode } = req.params;
      const visitorIp =
        (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0].trim() ??
        req.ip ??
        'unknown';
      const originalUrl = await this.service.resolveShortUrl(shortCode, visitorIp);
      res.redirect(302, originalUrl);
    } catch (err) {
      next(err);
    }
  };

  stats: RequestHandler = async (req, res, next) => {
    try {
      const { shortCode } = req.params;
      const data = await this.service.getStats(shortCode);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  userLinks: RequestHandler = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const links = await this.service.getUserLinks(userId);
      res.json(links);
    } catch (err) {
      next(err);
    }
  };
}
