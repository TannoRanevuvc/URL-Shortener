import { RequestHandler } from 'express';
import { UrlService } from '../services/url.service';

export class UrlController {
  constructor(private readonly service: UrlService) {}

  shorten: RequestHandler = async (req, res, next) => {
    try {
      const { originalUrl } = req.body as { originalUrl: string };
      const result = await this.service.createShortUrl(originalUrl);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  redirect: RequestHandler = async (req, res, next) => {
    try {
      const { shortCode } = req.params;
      const originalUrl = await this.service.resolveShortUrl(shortCode);
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
}
