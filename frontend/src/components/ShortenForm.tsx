import { useState } from 'react';
import { shortenUrl, ShortenResult } from '../api/client';

interface Props {
  onShorten?: (result: ShortenResult & { originalUrl: string }) => void;
}

export function ShortenForm({ onShorten }: Props) {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setCopied(false);
    setLoading(true);
    try {
      const data = await shortenUrl(url.trim());
      setResult(data);
      onShorten?.({ ...data, originalUrl: url.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="card">
      <h2>Сократить ссылку</h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          placeholder="https://example.com/very/long/url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="input"
        />
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <span className="spinner" /> : 'Сократить'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          <p className="result-label">Ваша короткая ссылка:</p>
          <div className="result-row">
            <a href={result.shortUrl} target="_blank" rel="noopener noreferrer" className="short-link">
              {result.shortUrl}
            </a>
            <button onClick={handleCopy} className="btn btn-secondary">
              {copied ? 'Скопировано!' : 'Копировать'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
