import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, ReferenceLine, Legend
} from 'recharts';
import type { BoosterData } from '../types';
import StatusIndicator from './StatusIndicator';
import ValueCard from './ValueCard';

interface BoosterSectionProps {
  data: BoosterData | null;
}

export default function BoosterSection({ data }: BoosterSectionProps) {
  const chartData = data
    ? data.energy.map(([t, e], i) => ({
        t: Math.round(t * 1000),
        energy: e,
        current: data.current[i]?.[1] ?? 0,
      }))
    : [];

  const injTimeMs = data ? data.injection.time * 1000 : 50;
  const extTimeMs = 400;

  return (
    <section className="px-4 py-3">
      <h2 className="text-base font-bold text-white mb-3 border-b border-panel-border pb-2">
        Бустерный синхротрон
      </h2>
      <div className="grid grid-cols-[200px_1fr] gap-4 items-stretch">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-center gap-3">
            <StatusIndicator label="CAV1" status={data?.cav1LlrfModulatorStatus || 'FAULT'} shape="circle" />
            <StatusIndicator label="CAV2" status={data?.cav2LlrfModulatorStatus || 'FAULT'} shape="circle" />
            <StatusIndicator label="CAV3" status={data?.cav3LlrfModulatorStatus || 'FAULT'} shape="circle" />
            <StatusIndicator label="PSON" status={data?.powerSupplyStatus || 'FAULT'} shape="square" />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <ValueCard label="Энергия впуска" value={data?.injection.energy ?? null} unit="МэВ" />
            <ValueCard label="Энергия выпуска" value={data?.extraction.energy ?? null} unit="МэВ" />
            <ValueCard label="Ток впуска" value={data?.injection.current ?? null} unit="мА" />
            <ValueCard label="Ток выпуска" value={data?.extraction.current ?? null} unit="мА" />
          </div>
        </div>

        <div className="bg-panel-card border border-panel-border rounded-lg p-4">
          <h4 className="text-xs text-gray-400 mb-2">Энергия и ток за цикл бустера</h4>
          <ResponsiveContainer width="100%" height={520}>
            <LineChart data={chartData} margin={{ top: 10, right: 40, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" />
              <XAxis
                dataKey="t"
                type="number"
                domain={[0, 1000]}
                tick={{ fontSize: 10, fill: '#64748B' }}
                label={{ value: 'время, мс', position: 'insideBottom', offset: -10, style: { fontSize: 10, fill: '#64748B' } }}
              />
              <YAxis
                yAxisId="energy"
                orientation="left"
                domain={[0, 3000]}
                tick={{ fontSize: 10, fill: '#64748B' }}
                label={{ value: 'Энергия (МэВ)', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 10, fill: '#64748B' } }}
              />
              <YAxis
                yAxisId="current"
                orientation="right"
                domain={[0, 5]}
                tick={{ fontSize: 10, fill: '#64748B' }}
                label={{ value: 'Ток (мА)', angle: 90, position: 'insideRight', offset: 0, style: { fontSize: 10, fill: '#64748B' } }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111D33', border: '1px solid #1E3050', fontSize: 11 }}
                labelFormatter={(v) => `${v} мс`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine
                yAxisId="energy"
                x={injTimeMs}
                stroke="#22C55E"
                strokeDasharray="5 3"
                label={{ value: 'Впуск', position: 'top', fill: '#22C55E', fontSize: 10 }}
              />
              <ReferenceLine
                yAxisId="energy"
                x={extTimeMs}
                stroke="#EF4444"
                strokeDasharray="5 3"
                label={{ value: 'Выпуск', position: 'top', fill: '#EF4444', fontSize: 10 }}
              />
              <Line
                yAxisId="energy"
                type="monotone"
                dataKey="energy"
                stroke="#F59E0B"
                dot={false}
                strokeWidth={2}
                name="Энергия (МэВ)"
                isAnimationActive={false}
              />
              <Line
                yAxisId="current"
                type="monotone"
                dataKey="current"
                stroke="#3B82F6"
                dot={false}
                strokeWidth={2}
                name="Ток (мА)"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
