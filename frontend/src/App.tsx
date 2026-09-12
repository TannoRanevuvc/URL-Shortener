import { useState } from 'react';
import { ShortenForm } from './components/ShortenForm';
import { StatsForm } from './components/StatsForm';
import { MyLinks } from './components/MyLinks';
import { useUserId } from './hooks/useUserId';
import './app.css';

export default function App() {
  const userId = useUserId();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="page">
      <header className="header">
        <h1>URL Shortener</h1>
        <p className="subtitle">Сокращайте длинные ссылки за секунду</p>
      </header>
      <main className="main">
        <ShortenForm userId={userId} onShorten={() => setRefreshTrigger((n) => n + 1)} />
        <StatsForm />
      </main>
      <MyLinks userId={userId} refreshTrigger={refreshTrigger} />
    </div>
  );
}
