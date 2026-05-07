import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, Legend, ReferenceLine
} from 'recharts';
import type { BoosterData } from '../types';
import StatusIndicator from './StatusIndicator';
import ValueCard from './ValueCard';

interface BoosterSectionProps {
  data: BoosterData | null;
}

export default function BoosterSection({ data }: BoosterSectionProps) {
  const chartData = buildRfChartData(data);
  const yDomain = computeTightDomain(chartData.flatMap(point => [point.rf1, point.rf2, point.rf3]), 0.1);

  const rf1Status = toActivityStatus(data?.bd1);
  const rf2Status = toActivityStatus(data?.bd2);
  const rf3Status = toActivityStatus(data?.bf);

  const injTimeMs = data ? data.injection.time * 1000 : 50;
  const extTimeMs = 400;

  return (
    <section className="px-4 py-3">
      <h2 className="text-base font-bold text-white mb-3 border-b border-panel-border pb-2">
        Бустерный синхротрон
      </h2>

      <div className="grid grid-cols-[220px_1fr] gap-4 items-stretch">
        <div className="flex flex-col gap-4">
          <div className="bg-panel-card border border-panel-border rounded-lg p-3">
            <h4 className="text-xs text-gray-400 mb-3">Состояние ВЧ-систем</h4>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <StatusIndicator label="ВЧ-1" status={data?.rfStatus || 'FAULT'} shape="circle" />
              <StatusIndicator label="ВЧ-2" status={data?.rfStatus || 'FAULT'} shape="circle" />
              <StatusIndicator label="ВЧ-3" status={data?.rfStatus || 'FAULT'} shape="circle" />
            </div>
            <h4 className="text-xs text-gray-400 mb-3">Активность каналов</h4>
            <div className="grid grid-cols-3 gap-3">
              <StatusIndicator label="Канал 1" status={rf1Status} shape="circle" />
              <StatusIndicator label="Канал 2" status={rf2Status} shape="circle" />
              <StatusIndicator label="Канал 3" status={rf3Status} shape="circle" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <ValueCard label="Энергия впуска" value={data?.injection.energy ?? null} unit="МэВ" />
            <ValueCard label="Энергия выпуска" value={data?.extraction.energy ?? null} unit="МэВ" />
            <ValueCard label="Ток впуска" value={data?.injection.current ?? null} unit="мА" />
            <ValueCard label="Ток выпуска" value={data?.extraction.current ?? null} unit="мА" />
          </div>
        </div>

        <div className="bg-panel-card border border-panel-border rounded-lg p-4">
          <h4 className="text-xs text-gray-400 mb-2">ВЧ-системы резонаторов бустера (3 кривые)</h4>
          <ResponsiveContainer width="100%" height={620}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" />
              <XAxis
                dataKey="t"
                type="number"
                domain={[0, 1000]}
                tick={{ fontSize: 10, fill: '#64748B' }}
                label={{ value: 'время, мс', position: 'insideBottom', offset: -10, style: { fontSize: 10, fill: '#64748B' } }}
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 10, fill: '#64748B' }}
                label={{ value: 'амплитуда', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748B' } }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111D33', border: '1px solid #1E3050', fontSize: 11 }}
                labelFormatter={(v) => `${v} мс`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine
                x={injTimeMs}
                stroke="#22C55E"
                strokeDasharray="5 3"
                label={{ value: 'Впуск', position: 'top', fill: '#22C55E', fontSize: 10 }}
              />
              <ReferenceLine
                x={extTimeMs}
                stroke="#EF4444"
                strokeDasharray="5 3"
                label={{ value: 'Выпуск', position: 'top', fill: '#EF4444', fontSize: 10 }}
              />
              <Line type="monotone" dataKey="rf1" stroke="#F59E0B" dot={false} strokeWidth={1.8} name="ВЧ-1" isAnimationActive={false} />
              <Line type="monotone" dataKey="rf2" stroke="#3B82F6" dot={false} strokeWidth={1.8} name="ВЧ-2" isAnimationActive={false} />
              <Line type="monotone" dataKey="rf3" stroke="#A855F7" dot={false} strokeWidth={1.8} name="ВЧ-3" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function buildRfChartData(data: BoosterData | null) {
  if (!data) {
    return [];
  }
  const len = Math.min(data.bd1.length, data.bd2.length, data.bf.length);
  return Array.from({ length: len }, (_, i) => ({
    t: Math.round((data.bd1[i][0] ?? 0) * 1000),
    rf1: data.bd1[i][1] ?? 0,
    rf2: data.bd2[i][1] ?? 0,
    rf3: data.bf[i][1] ?? 0,
  }));
}

function toActivityStatus(signal: number[][] | undefined): string {
  if (!signal || signal.length < 4) {
    return 'FAULT';
  }
  const values = signal.map(p => p[1] ?? 0);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) / values.length;
  const std = Math.sqrt(variance);

  if (std > 20) return 'OK';
  if (std > 5) return 'WARN';
  return 'FAULT';
}

function computeTightDomain(values: number[], paddingRatio: number): [number, number] {
  if (values.length === 0) {
    return [0, 1];
  }

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  const span = Math.max(1e-6, max - min);
  const pad = Math.max(1e-6, span * paddingRatio);
  return [min - pad, max + pad];
}
