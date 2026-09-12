import { ShortenForm } from './components/ShortenForm';
import { StatsForm } from './components/StatsForm';
import './app.css';

export default function App() {
  return (
    <div className="page">
      <header className="header">
        <h1>URL Shortener</h1>
        <p className="subtitle">Сокращайте длинные ссылки за секунду</p>
      </header>
      <main className="main">
        <ShortenForm />
        <StatsForm />
      </main>
    </div>
  );
}
