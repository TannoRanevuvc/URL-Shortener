import { customAlphabet } from 'nanoid';
import { UrlRepository } from '../repositories/url.repository';
import { AppError } from '../types';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

export function generateCode(): string {
  return nanoid();
}

export async function generateUniqueCode(repo: UrlRepository): Promise<string> {
  const MAX_ATTEMPTS = 5;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = generateCode();
    const existing = await repo.findByCode(code);
    if (!existing) return code;
  }
  throw new AppError(500, 'Failed to generate a unique short code after multiple attempts');
}
