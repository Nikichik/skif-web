import { useState, useEffect } from 'react';

interface HeaderProps {
  connected: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Header({ connected, theme, onToggleTheme }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-panel-card border-b border-panel-border">
      <h1 className="text-xl font-bold tracking-wide" style={{ color: 'rgb(var(--text-primary))' }}>
        СКИФ - Мониторинг инжектора
      </h1>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleTheme}
          className="px-3 py-1.5 text-xs rounded-md border border-panel-border hover:opacity-90 transition"
          style={{ color: 'rgb(var(--text-primary))', backgroundColor: 'rgb(var(--panel-bg))' }}
        >
          {theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
        </button>
        <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
          {time.toLocaleTimeString('ru-RU')}
        </span>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-status-ok animate-pulse' : 'bg-status-fault'}`} />
          <span className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
            {connected ? 'Подключено' : 'Нет связи'}
          </span>
        </div>
      </div>
    </header>
  );
}
