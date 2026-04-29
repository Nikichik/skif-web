import { useState, useEffect } from 'react';

interface HeaderProps {
  connected: boolean;
}

export default function Header({ connected }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-panel-card border-b border-panel-border">
      <h1 className="text-xl font-bold tracking-wide text-white">
        СКИФ — Мониторинг инжектора
      </h1>
      <div className="flex items-center gap-6">
        <span className="text-sm text-gray-400">
          {time.toLocaleTimeString('ru-RU')}
        </span>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-status-ok animate-pulse' : 'bg-status-fault'}`} />
          <span className="text-xs text-gray-400">
            {connected ? 'Подключено' : 'Нет связи'}
          </span>
        </div>
      </div>
    </header>
  );
}
