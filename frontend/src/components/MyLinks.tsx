import { useState, useCallback } from 'react';
import { getStats, StatsResult } from '../api/client';
import { SavedLink } from '../hooks/useLocalLinks';

interface Props {
  links: SavedLink[];
  onRemove: (shortCode: string) => void;
}

interface StatsMap {
  [shortCode: string]: { data?: StatsResult; loading: boolean; error?: string };
}

export function MyLinks({ links, onRemove }: Props) {
  const [statsMap, setStatsMap] = useState<StatsMap>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchStats = useCallback(async (shortCode: string) => {
    setStatsMap((prev) => ({ ...prev, [shortCode]: { loading: true } }));
    try {
      const data = await getStats(shortCode);
      setStatsMap((prev) => ({ ...prev, [shortCode]: { loading: false, data } }));
    } catch (err) {
      setStatsMap((prev) => ({
        ...prev,
        [shortCode]: { loading: false, error: err instanceof Error ? err.message : 'Ошибка' },
      }));
    }
  }, []);

  const handleCopy = async (shortUrl: string, shortCode: string) => {
    await navigator.clipboard.writeText(shortUrl);
    setCopiedCode(shortCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (links.length === 0) return null;

  return (
    <section className="my-links-section">
      <h2>Мои ссылки</h2>
      <ul className="my-links-list">
        {links.map((link) => {
          const entry = statsMap[link.shortCode];
          return (
            <li key={link.shortCode} className="my-links-item">
              <div className="my-links-main">
                <div className="my-links-urls">
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="my-links-short"
                  >
                    {link.shortUrl}
                  </a>
                  <span className="my-links-original" title={link.originalUrl}>
                    {link.originalUrl}
                  </span>
                </div>
                <div className="my-links-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleCopy(link.shortUrl, link.shortCode)}
                  >
                    {copiedCode === link.shortCode ? 'Скопировано!' : 'Копировать'}
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => fetchStats(link.shortCode)}
                    disabled={entry?.loading}
                  >
                    {entry?.loading ? <span className="spinner spinner-dark" /> : 'Статистика'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => onRemove(link.shortCode)}
                    title="Удалить из списка"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {entry?.data && (
                <div className="my-links-stats">
                  <span>
                    <strong>{entry.data.clicks}</strong> переходов
                  </span>
                  <span>Создано: {new Date(entry.data.createdAt).toLocaleString('ru-RU')}</span>
                </div>
              )}
              {entry?.error && <p className="error">{entry.error}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
