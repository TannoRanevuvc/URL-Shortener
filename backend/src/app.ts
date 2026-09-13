import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { pool, initDb } from './config/database';
import { redis } from './config/redis';
import { UrlRepository } from './repositories/url.repository';
import { UrlService } from './services/url.service';
import { UrlController } from './controllers/url.controller';
import { createRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

const repo = new UrlRepository(pool);
const service = new UrlService(repo, redis, process.env.BASE_URL || 'http://localhost:4000');
const controller = new UrlController(service);

app.use(createRouter(controller));
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;

async function start(): Promise<void> {
  await initDb();
  app.listen(PORT, () => {
    console.log(`[Server] listening on port ${PORT}`);
  });
}

start().catch((err: Error) => {
  console.error('[Startup error]', err.message);
  process.exit(1);
});

export { app };
