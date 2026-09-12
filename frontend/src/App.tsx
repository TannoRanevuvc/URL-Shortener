import { ShortenForm } from './components/ShortenForm';
import { StatsForm } from './components/StatsForm';
import { MyLinks } from './components/MyLinks';
import { useLocalLinks } from './hooks/useLocalLinks';
import './app.css';

export default function App() {
  const { links, addLink, removeLink } = useLocalLinks();

  return (
    <div className="page">
      <header className="header">
        <h1>URL Shortener</h1>
        <p className="subtitle">Сокращайте длинные ссылки за секунду</p>
      </header>
      <main className="main">
        <ShortenForm onShorten={addLink} />
        <StatsForm />
      </main>
      <MyLinks links={links} onRemove={removeLink} />
    </div>
  );
}
