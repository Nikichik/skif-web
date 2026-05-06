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
  const energyDomain = computeTightDomain(chartData.map(point => point.energy), 0.08);
  const currentDomain = computeTightDomain(chartData.map(point => point.current), 0.08);

  return (
    <section className="px-4 py-3">
      <h2 className="text-base font-bold text-white mb-3 border-b border-panel-border pb-2">
        Р‘СѓСЃС‚РµСЂРЅС‹Р№ СЃРёРЅС…СЂРѕС‚СЂРѕРЅ
      </h2>
      <div className="grid grid-cols-[200px_1fr] gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-center gap-3">
            <StatusIndicator label="Р’Р§-СЃРёСЃС‚РµРјР°" status={data?.rfStatus || 'FAULT'} shape="circle" />
            <StatusIndicator label="РњР°РіРЅРёС‚РЅР°СЏ СЃРёСЃС‚РµРјР°" status={data?.magnetStatus || 'FAULT'} shape="square" />
            <StatusIndicator label="Р РµР·РµСЂРІ" status="OK" shape="circle" />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <ValueCard label="Р­РЅРµСЂРіРёСЏ РІРїСѓСЃРєР°" value={data?.injection.energy ?? null} unit="РњСЌР’" />
            <ValueCard label="Р­РЅРµСЂРіРёСЏ РІС‹РїСѓСЃРєР°" value={data?.extraction.energy ?? null} unit="РњСЌР’" />
            <ValueCard label="РўРѕРє РІРїСѓСЃРєР°" value={data?.injection.current ?? null} unit="РјРђ" />
            <ValueCard label="РўРѕРє РІС‹РїСѓСЃРєР°" value={data?.extraction.current ?? null} unit="РјРђ" />
          </div>
        </div>

        <div className="bg-panel-card border border-panel-border rounded-lg p-4">
          <h4 className="text-xs text-gray-400 mb-2">Р­РЅРµСЂРіРёСЏ Рё С‚РѕРє Р·Р° С†РёРєР» Р±СѓСЃС‚РµСЂР°</h4>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 10, right: 40, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" />
              <XAxis
                dataKey="t"
                type="number"
                domain={[0, 1000]}
                tick={{ fontSize: 10, fill: '#64748B' }}
                label={{ value: 'РІСЂРµРјСЏ, РјСЃ', position: 'insideBottom', offset: -10, style: { fontSize: 10, fill: '#64748B' } }}
              />
              <YAxis
                yAxisId="energy"
                orientation="left"
                domain={energyDomain}
                tick={{ fontSize: 10, fill: '#64748B' }}
                label={{ value: 'Р­РЅРµСЂРіРёСЏ (РњСЌР’)', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 10, fill: '#64748B' } }}
              />
              <YAxis
                yAxisId="current"
                orientation="right"
                domain={currentDomain}
                tick={{ fontSize: 10, fill: '#64748B' }}
                label={{ value: 'РўРѕРє (РјРђ)', angle: 90, position: 'insideRight', offset: 0, style: { fontSize: 10, fill: '#64748B' } }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#111D33', border: '1px solid #1E3050', fontSize: 11 }}
                labelFormatter={(v) => `${v} РјСЃ`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine
                yAxisId="energy"
                x={injTimeMs}
                stroke="#22C55E"
                strokeDasharray="5 3"
                label={{ value: 'Р’РїСѓСЃРє', position: 'top', fill: '#22C55E', fontSize: 10 }}
              />
              <ReferenceLine
                yAxisId="energy"
                x={extTimeMs}
                stroke="#EF4444"
                strokeDasharray="5 3"
                label={{ value: 'Р’С‹РїСѓСЃРє', position: 'top', fill: '#EF4444', fontSize: 10 }}
              />
              <Line
                yAxisId="energy"
                type="monotone"
                dataKey="energy"
                stroke="#F59E0B"
                dot={false}
                strokeWidth={2}
                name="Р­РЅРµСЂРіРёСЏ (РњСЌР’)"
                isAnimationActive={false}
              />
              <Line
                yAxisId="current"
                type="monotone"
                dataKey="current"
                stroke="#3B82F6"
                dot={false}
                strokeWidth={2}
                name="РўРѕРє (РјРђ)"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
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
