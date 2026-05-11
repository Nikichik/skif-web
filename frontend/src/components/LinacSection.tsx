import type { LinacData } from '../types';
import StatusIndicator from './StatusIndicator';
import ValueCard from './ValueCard';
import PulseChart from './PulseChart';

interface LinacSectionProps {
  data: LinacData | null;
}

export default function LinacSection({ data }: LinacSectionProps) {
  const kl = data?.klystrons || [];
  const kl1 = kl.find(k => k.id === 'KL1');
  const kl2 = kl.find(k => k.id === 'KL2');
  const kl3 = kl.find(k => k.id === 'KL3');

  const powerData = buildPowerData(kl1?.pulse || null, kl2?.pulse || null, kl3?.pulse || null);
  const phaseData = buildPhaseData(data?.phase || null);
  const rfData = buildRfData(kl1?.pulse || null, kl2?.pulse || null, kl3?.pulse || null);

  return (
    <section className="px-4 py-3">
      <h2 className="text-base font-bold text-white mb-3 border-b border-panel-border pb-2">
        Линейный ускоритель
      </h2>
      <div className="grid grid-cols-[1fr_4fr] gap-4">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            <StatusIndicator label="KL1" status={kl1?.status || 'FAULT'} />
            <StatusIndicator label="KL2" status={kl2?.status || 'FAULT'} />
            <StatusIndicator label="KL3" status={kl3?.status || 'FAULT'} />
            <StatusIndicator label="KL1 LLRF" status={data?.kl1LlrfPowerStatus || 'FAULT'} />
            <StatusIndicator label="KL2 LLRF" status={data?.kl2LlrfPowerStatus || 'FAULT'} />
            <StatusIndicator label="KL3 LLRF" status={data?.kl3LlrfPowerStatus || 'FAULT'} />
            <StatusIndicator label="KL1 ILK" status={data?.kl1PwrIlkStatus || 'FAULT'} />
            <StatusIndicator label="KL2 ILK" status={data?.kl2PwrIlkStatus || 'FAULT'} />
            <StatusIndicator label="KL3 ILK" status={data?.kl3PwrIlkStatus || 'FAULT'} />
            <StatusIndicator label="Системы" status={data?.systemsStatus || 'FAULT'} />
            <StatusIndicator label="Инжектор" status={data?.injectorStatus || 'FAULT'} />
            <StatusIndicator label="ВЧ" status={data?.rfStatus || 'FAULT'} />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <ValueCard label="Ток пушки" value={data?.gunCurrent ?? null} unit="мА" />
            <ValueCard label="Ток линака" value={data?.linacCurrent ?? null} unit="мА" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <PulseChart
            title="Мощность клистронов KL1 / KL2 / KL3"
            data={powerData}
            yLabel="МВт"
            yDomain={[0, 50]}
            series={[
              { key: 'kl1', label: 'KL1', color: '#3B82F6' },
              { key: 'kl2', label: 'KL2', color: '#8B5CF6' },
              { key: 'kl3', label: 'KL3', color: '#06B6D4' },
            ]}
          />
          <PulseChart
            title="Фаза клистронов KL1 / KL2 / KL3"
            data={phaseData}
            yLabel="градусы"
            yDomain={[-180, 180]}
            series={[
              { key: 'ph1', label: 'KL1', color: '#F59E0B' },
              { key: 'ph2', label: 'KL2', color: '#10B981' },
              { key: 'ph3', label: 'KL3', color: '#EF4444' },
            ]}
          />
          <PulseChart
            title="ВЧ система"
            data={rfData}
            yLabel="усл. ед."
            color="#22C55E"
            xDomain={[0, 1]}
            xLabel="время, с"
            xUnit="с"
          />
        </div>
      </div>
    </section>
  );
}

function buildPowerData(kl1: number[][] | null, kl2: number[][] | null, kl3: number[][] | null) {
  if (!kl1 || !kl2 || !kl3) {
    return null;
  }
  const len = Math.min(kl1.length, kl2.length, kl3.length);
  return Array.from({ length: len }, (_, i) => ({
    t: kl1[i][0],
    v: clampTo50(kl1[i][1]),
    kl1: clampTo50(kl1[i][1]),
    kl2: clampTo50(kl2[i][1]),
    kl3: clampTo50(kl3[i][1]),
  }));
}

function buildPhaseData(phase: number[][] | null) {
  if (!phase) {
    return null;
  }
  return phase.map(([t, p]) => ({
    t,
    v: p,
    ph1: p,
    ph2: p + 7,
    ph3: p - 7,
  }));
}

function buildRfData(kl1: number[][] | null, kl2: number[][] | null, kl3: number[][] | null) {
  if (!kl1 || !kl2 || !kl3) {
    return null;
  }
  const len = Math.min(kl1.length, kl2.length, kl3.length);
  return Array.from({ length: len }, (_, i) => {
    const t = len > 1 ? i / (len - 1) : 0;
    const avg = (kl1[i][1] + kl2[i][1] + kl3[i][1]) / 3.0;
    return [t, avg];
  });
}

function clampTo50(value: number) {
  if (value < 0) return 0;
  if (value > 50) return 50;
  return value;
}
