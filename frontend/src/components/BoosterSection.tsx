import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, ReferenceLine, Legend
} from 'recharts';
import type { BoosterData } from '../types';
import ValueCard from './ValueCard';

interface BoosterSectionProps {
  data: BoosterData | null;
}

export default function BoosterSection({ data }: BoosterSectionProps) {
  if (!data) {
    return null;
  }

  const hasEnergy = data.energy && data.energy.length > 0;
  const hasCurrent = data.current && data.current.length > 0;

  const chartData = hasEnergy
    ? data.energy.map(([t, e], i) => ({
        t: Math.round(t * 1000),
        energy: Math.max(0, e),
        current: hasCurrent ? Math.max(0, (data.current[i]?.[1] ?? 0)) : null,
      }))
    : [];

  const injTimeMs = data.injection?.time !== null && data.injection?.time !== undefined
    ? data.injection.time * 1000
    : 50;
  const extTimeMs = 400;

  return (
    <section className="px-4 py-1">
      <h2 className="text-2xl font-bold text-white mb-2 border-b border-panel-border pb-2">
        Бустерный синхротрон
      </h2>
      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-3 items-stretch">
        <div className="flex flex-col gap-2">
          <ValueCard label="Энергия впуска" value={data.injection?.energy ?? null} unit="МэВ" />
          <ValueCard label="Энергия выпуска" value={data.extraction?.energy ?? null} unit="МэВ" />
          <ValueCard label="Ток впуска" value={data.injection?.current ?? null} unit="мА" />
          <ValueCard label="Ток выпуска" value={data.extraction?.current ?? null} unit="мА" />
        </div>

        {chartData.length > 0 && (
          <div className="bg-panel-card border border-panel-border rounded-lg p-3">
            <h4 className="text-base text-gray-200 mb-1">Энергия и ток за цикл бустера</h4>
            <ResponsiveContainer width="100%" height={390}>
              <LineChart data={chartData} margin={{ top: 8, right: 40, left: 18, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" />
                <XAxis
                  dataKey="t"
                  type="number"
                  domain={[0, 1000]}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  label={{ value: 'время, мс', position: 'insideBottom', offset: -8, style: { fontSize: 11, fill: '#94A3B8' } }}
                />
                <YAxis
                  yAxisId="energy"
                  orientation="left"
                  domain={[0, 3000]}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  label={{ value: 'Энергия, МэВ', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#94A3B8' } }}
                />
                <YAxis
                  yAxisId="current"
                  orientation="right"
                  domain={[0, 5]}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  label={{ value: 'Ток, мА', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#94A3B8' } }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111D33', border: '1px solid #1E3050', fontSize: 11 }}
                  labelFormatter={(v) => `${v} мс`}
                />
                <Legend wrapperStyle={{ fontSize: 11, bottom: -6 }} />
                <ReferenceLine yAxisId="energy" x={injTimeMs} stroke="#22C55E" strokeDasharray="5 3" />
                <ReferenceLine yAxisId="energy" x={extTimeMs} stroke="#EF4444" strokeDasharray="5 3" />
                <Line
                  yAxisId="energy"
                  type="monotone"
                  dataKey="energy"
                  stroke="#F59E0B"
                  dot={false}
                  strokeWidth={2.0}
                  name="Энергия"
                  isAnimationActive={false}
                />
                {hasCurrent && (
                  <Line
                    yAxisId="current"
                    type="monotone"
                    dataKey="current"
                    stroke="#3B82F6"
                    dot={false}
                    strokeWidth={2.0}
                    name="Ток"
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
