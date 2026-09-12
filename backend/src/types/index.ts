export interface UrlRecord {
  id: number;
  short_code: string;
  original_url: string;
  clicks: number;
  unique_clicks: number;
  created_at: Date;
  user_id: string | null;
}

export interface CreateUrlResult {
  shortCode: string;
  shortUrl: string;
}

export interface StatsResponse {
  originalUrl: string;
  shortCode: string;
  clicks: number;
  uniqueClicks: number;
  createdAt: Date;
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
