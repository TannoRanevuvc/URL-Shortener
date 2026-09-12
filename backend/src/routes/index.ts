import { Router } from 'express';
import { z } from 'zod';
import { UrlController } from '../controllers/url.controller';
import { validateBody } from '../middleware/validate';

const shortenSchema = z.object({
  originalUrl: z.string().min(1, 'originalUrl is required'),
});

export function createRouter(controller: UrlController): Router {
  const router = Router();

  router.post('/api/shorten', validateBody(shortenSchema), controller.shorten);
  router.get('/api/stats/:shortCode', controller.stats);
  router.get('/:shortCode', controller.redirect);

  return router;
}
