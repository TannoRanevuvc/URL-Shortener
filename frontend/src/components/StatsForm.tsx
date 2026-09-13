import { useState } from 'react';
import { getStats, StatsResult } from '../api/client';

export function StatsForm() {
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStats(null);
    setLoading(true);
    try {
      const data = await getStats(code.trim());
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Статистика</h2>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          placeholder="abc123"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          className="input"
          maxLength={10}
        />
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <span className="spinner" /> : 'Получить статистику'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {stats && (
        <div className="stats">
          <div className="stats-row">
            <span className="stats-label">Оригинальный URL</span>
            <a href={stats.originalUrl} target="_blank" rel="noopener noreferrer" className="stats-value link">
              {stats.originalUrl}
            </a>
          </div>
          <div className="stats-row stats-row--double">
            <div>
              <span className="stats-label">Всего переходов</span>
              <span className="stats-value clicks">{stats.clicks}</span>
            </div>
            <div>
              <span className="stats-label">Уникальных</span>
              <span className="stats-value clicks">{stats.uniqueClicks}</span>
            </div>
          </div>
          <div className="stats-row">
            <span className="stats-label">Создано</span>
            <span className="stats-value">
              {new Date(stats.createdAt).toLocaleString('ru-RU')}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
