import { useEffect, useState } from 'react';
import Header from './components/Header';
import LinacSection from './components/LinacSection';
import BoosterSection from './components/BoosterSection';
import { useSSE } from './hooks/useSSE';

export default function App() {
  const { data, connected } = useSSE();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="min-h-screen bg-panel-bg">
      <Header connected={connected} theme={theme} onToggleTheme={toggleTheme} />
      <main className="max-w-[1920px] mx-auto">
        <LinacSection data={data?.linac || null} booster={data?.booster || null} />
        <BoosterSection data={data?.booster || null} />
      </main>
    </div>
  );
}
