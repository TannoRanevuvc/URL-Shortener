import { useState, useEffect, useCallback } from 'react';
import { getUserLinks, UserLink } from '../api/client';

interface Props {
  userId: string;
  refreshTrigger: number;
}

export function MyLinks({ userId, refreshTrigger }: Props) {
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserLinks(userId);
      setLinks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks, refreshTrigger]);

  const handleCopy = async (shortUrl: string, shortCode: string) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedCode(shortCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setError('Не удалось скопировать — разрешите доступ к буферу обмена');
    }
  };

  return (
    <section className="my-links-section">
      <div className="my-links-header">
        <h2>Мои ссылки</h2>
        <button className="btn btn-outline" onClick={fetchLinks} disabled={loading}>
          {loading ? <span className="spinner spinner-dark" /> : '↻ Обновить'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {!loading && links.length === 0 && !error && (
        <p className="my-links-empty">Вы ещё не создали ни одной ссылки</p>
      )}

      {links.length > 0 && (
        <ul className="my-links-list">
          {links.map((link) => (
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
                </div>
              </div>
              <div className="my-links-stats">
                <span><strong>{link.clicks}</strong> переходов</span>
                <span><strong>{link.uniqueClicks}</strong> уникальных</span>
                <span>Создано: {new Date(link.createdAt).toLocaleString('ru-RU')}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
