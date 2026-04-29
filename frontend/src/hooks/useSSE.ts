import { useState, useEffect, useRef, useCallback } from 'react';
import type { MonitorSnapshot } from '../types';

export function useSSE() {
  const [data, setData] = useState<MonitorSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource('/api/stream');
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const snapshot: MonitorSnapshot = JSON.parse(event.data);
        setData(snapshot);
        setConnected(true);
      } catch (e) {
        console.error('SSE parse error', e);
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    fetch('/api/current')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {});

    connect();

    return () => {
      esRef.current?.close();
    };
  }, [connect]);

  return { data, connected };
}
