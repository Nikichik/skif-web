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
  if (!data) {
    return null;
  }

  const hasEnergy = data.energy && data.energy.length > 0;
  const hasCurrent = data.current && data.current.length > 0;
  const hasCavVoltage = !!(data.cav1Voltage?.length && data.cav2Voltage?.length && data.cav3Voltage?.length);

  const chartData = hasEnergy
    ? data.energy.map(([t, e], i) => ({
        t: Math.round(t * 1000),
        energy: e,
        current: hasCurrent ? (data.current[i]?.[1] ?? null) : null,
        cav1: hasCavVoltage ? (data.cav1Voltage[i]?.[1] ?? null) : null,
        cav2: hasCavVoltage ? (data.cav2Voltage[i]?.[1] ?? null) : null,
        cav3: hasCavVoltage ? (data.cav3Voltage[i]?.[1] ?? null) : null,
      }))
    : [];

  const injTimeMs = data.injection?.time !== null && data.injection?.time !== undefined
    ? data.injection.time * 1000
    : null;
  const extTimeMs = data.extraction?.time !== null && data.extraction?.time !== undefined
    ? data.extraction.time * 1000
    : null;

  return (
    <section className="px-4 py-3">
      <h2 className="text-xl font-bold text-white mb-3 border-b border-panel-border pb-2">
        Бустерный синхротрон
      </h2>
      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4 items-stretch">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 justify-items-center">
            {data.cav1LlrfModulatorStatus && <StatusIndicator label="CAV1" status={data.cav1LlrfModulatorStatus} />}
            {data.cav2LlrfModulatorStatus && <StatusIndicator label="CAV2" status={data.cav2LlrfModulatorStatus} />}
            {data.cav3LlrfModulatorStatus && <StatusIndicator label="CAV3" status={data.cav3LlrfModulatorStatus} />}
            {data.powerSupplyStatus && <StatusIndicator label="PSON" status={data.powerSupplyStatus} />}
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <ValueCard label="Энергия впуска" value={data.injection?.energy ?? null} unit="МэВ" />
            <ValueCard label="Энергия выпуска" value={data.extraction?.energy ?? null} unit="МэВ" />
            <ValueCard label="Ток впуска" value={data.injection?.current ?? null} unit="мА" />
            <ValueCard label="Ток выпуска" value={data.extraction?.current ?? null} unit="мА" />
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="bg-panel-card border border-panel-border rounded-lg p-4">
            <h4 className="text-sm text-gray-300 mb-2">Энергия, ток и ВЧ за цикл бустера</h4>
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={chartData} margin={{ top: 10, right: 40, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" />
                <XAxis
                  dataKey="t"
                  type="number"
                  domain={[0, 1000]}
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  label={{ value: 'время, мс', position: 'insideBottom', offset: -10, style: { fontSize: 12, fill: '#94A3B8' } }}
                />
                <YAxis
                  yAxisId="energy"
                  orientation="left"
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  label={{ value: 'Энергия (МэВ)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#94A3B8' } }}
                />
                <YAxis
                  yAxisId="current"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  label={{ value: 'Ток (мА)', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#94A3B8' } }}
                />
                {hasCavVoltage && <YAxis yAxisId="voltage" orientation="right" hide />}
                <Tooltip
                  contentStyle={{ backgroundColor: '#111D33', border: '1px solid #1E3050', fontSize: 12 }}
                  labelFormatter={(v) => `${v} мс`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {injTimeMs !== null && (
                  <ReferenceLine
                    yAxisId="energy"
                    x={injTimeMs}
                    stroke="#22C55E"
                    strokeDasharray="5 3"
                    label={{ value: 'Впуск', position: 'top', fill: '#22C55E', fontSize: 11 }}
                  />
                )}
                {extTimeMs !== null && (
                  <ReferenceLine
                    yAxisId="energy"
                    x={extTimeMs}
                    stroke="#EF4444"
                    strokeDasharray="5 3"
                    label={{ value: 'Выпуск', position: 'top', fill: '#EF4444', fontSize: 11 }}
                  />
                )}
                <Line
                  yAxisId="energy"
                  type="monotone"
                  dataKey="energy"
                  stroke="#F59E0B"
                  dot={false}
                  strokeWidth={2.2}
                  name="Энергия (МэВ)"
                  isAnimationActive={false}
                />
                {hasCurrent && (
                  <Line
                    yAxisId="current"
                    type="monotone"
                    dataKey="current"
                    stroke="#3B82F6"
                    dot={false}
                    strokeWidth={2.2}
                    name="Ток (мА)"
                    isAnimationActive={false}
                  />
                )}
                {hasCavVoltage && (
                  <>
                    <Line yAxisId="voltage" type="monotone" dataKey="cav1" stroke="#22C55E" dot={false} strokeWidth={1.4} name="CAV1 Voltage" isAnimationActive={false} />
                    <Line yAxisId="voltage" type="monotone" dataKey="cav2" stroke="#A78BFA" dot={false} strokeWidth={1.4} name="CAV2 Voltage" isAnimationActive={false} />
                    <Line yAxisId="voltage" type="monotone" dataKey="cav3" stroke="#06B6D4" dot={false} strokeWidth={1.4} name="CAV3 Voltage" isAnimationActive={false} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
