export interface ShortenResult {
  shortCode: string;
  shortUrl: string;
}

export interface StatsResult {
  originalUrl: string;
  shortCode: string;
  clicks: number;
  createdAt: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  return data as T;
}

export async function shortenUrl(originalUrl: string): Promise<ShortenResult> {
  const res = await fetch('/api/shorten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalUrl }),
  });
  return handleResponse<ShortenResult>(res);
}

export async function getStats(shortCode: string): Promise<StatsResult> {
  const res = await fetch(`/api/stats/${shortCode}`);
  return handleResponse<StatsResult>(res);
}
