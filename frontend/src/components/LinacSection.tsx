import type { LinacData, KlystronData, BoosterData } from '../types';
import StatusIndicator from './StatusIndicator';
import ValueCard from './ValueCard';
import PulseChart from './PulseChart';

interface LinacSectionProps {
  data: LinacData | null;
  booster: BoosterData | null;
}

export default function LinacSection({ data, booster }: LinacSectionProps) {
  if (!data) {
    return null;
  }

  const kl = data.klystrons || [];
  const kl1 = kl.find(k => k.id === 'KL1');
  const kl2 = kl.find(k => k.id === 'KL2');
  const kl3 = kl.find(k => k.id === 'KL3');

  const powerData = buildPowerData(kl1?.pulse || null, kl2?.pulse || null, kl3?.pulse || null);
  const phaseData = buildPhaseData(kl1?.phase || null, kl2?.phase || null, kl3?.phase || null);
  const rfData = buildRfData(booster?.cav1Voltage || [], booster?.cav2Voltage || [], booster?.cav3Voltage || []);

  const statusItems = [
    { label: 'KL1', status: kl1?.status },
    { label: 'KL2', status: kl2?.status },
    { label: 'KL3', status: kl3?.status },
    { label: 'KL1 LLRF', status: data.kl1LlrfPowerStatus },
    { label: 'KL2 LLRF', status: data.kl2LlrfPowerStatus },
    { label: 'KL3 LLRF', status: data.kl3LlrfPowerStatus },
    { label: 'KL1 ILK', status: data.kl1PwrIlkStatus },
    { label: 'KL2 ILK', status: data.kl2PwrIlkStatus },
    { label: 'KL3 ILK', status: data.kl3PwrIlkStatus },
  ].filter(item => !!item.status);

  return (
    <section className="px-4 py-3">
      <h2 className="text-4xl font-bold text-white mb-3 border-b border-panel-border pb-2">
        Линейный ускоритель
      </h2>
      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
        <div className="flex flex-col gap-3">
          {statusItems.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {statusItems.map(item => (
                <StatusIndicator key={item.label} label={item.label} status={item.status!} />
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2 mt-2">
            <ValueCard label="Ток пушки" value={data.gunCurrent ?? null} unit="мА" />
            <ValueCard label="Ток линака" value={data.linacCurrent ?? null} unit="мА" />
          </div>
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-3 gap-3">
          {powerData && (
            <PulseChart
              title="Мощность клистронов KL1 / KL2 / KL3"
              data={powerData}
              yLabel="норм., %"
              yDomain={[0, 100]}
              series={[
                { key: 'kl1', label: 'KL1', color: '#3B82F6' },
                { key: 'kl2', label: 'KL2', color: '#22C55E' },
                { key: 'kl3', label: 'KL3', color: '#F59E0B' },
              ]}
            />
          )}
          {phaseData && (
            <PulseChart
              title="Фаза клистронов"
              data={phaseData}
              yLabel="градусы"
              yDomain={[-180, 180]}
              series={[
                { key: 'ph1', label: 'KL1', color: '#06B6D4' },
                { key: 'ph2', label: 'KL2', color: '#A78BFA' },
                { key: 'ph3', label: 'KL3', color: '#F97316' },
              ]}
            />
          )}
          {rfData && (
            <div className="bg-panel-card border border-panel-border rounded-lg p-3">
              <div className="flex flex-wrap items-center gap-4 mb-2">
                {booster?.cav1LlrfModulatorStatus && <StatusIndicator label="CAV1" status={booster.cav1LlrfModulatorStatus} />}
                {booster?.cav2LlrfModulatorStatus && <StatusIndicator label="CAV2" status={booster.cav2LlrfModulatorStatus} />}
                {booster?.cav3LlrfModulatorStatus && <StatusIndicator label="CAV3" status={booster.cav3LlrfModulatorStatus} />}
                {booster?.powerSupplyStatus && <StatusIndicator label="PSON" status={booster.powerSupplyStatus} />}
              </div>
              <PulseChart
                title="ВЧ система (CAV1 + CAV2 + CAV3)"
                data={rfData}
                yLabel="кВ"
                color="#22C55E"
                xDomain={[0, 1]}
                xLabel="время, с"
                xUnit="с"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function buildPowerData(kl1: number[][] | null, kl2: number[][] | null, kl3: number[][] | null) {
  if (!kl1?.length || !kl2?.length || !kl3?.length) {
    return null;
  }

  const len = Math.min(kl1.length, kl2.length, kl3.length);
  const s1 = movingAverage(kl1.slice(0, len).map(v => Math.abs(v[1])), 15);
  const s2 = movingAverage(kl2.slice(0, len).map(v => Math.abs(v[1])), 15);
  const s3 = movingAverage(kl3.slice(0, len).map(v => Math.abs(v[1])), 15);
  const peak = Math.max(1e-9, ...s1, ...s2, ...s3);

  return Array.from({ length: len }, (_, i) => ({
    t: kl1[i][0],
    v: (s1[i] / peak) * 100,
    kl1: (s1[i] / peak) * 100,
    kl2: (s2[i] / peak) * 100,
    kl3: (s3[i] / peak) * 100,
  }));
}

function buildPhaseData(kl1Phase: number[][] | null, kl2Phase: number[][] | null, kl3Phase: number[][] | null) {
  if (!kl1Phase?.length || !kl2Phase?.length || !kl3Phase?.length) {
    return null;
  }

  const len = Math.min(kl1Phase.length, kl2Phase.length, kl3Phase.length);
  const ph1 = movingAverage(kl1Phase.slice(0, len).map(v => v[1]), 9);
  const ph2 = movingAverage(kl2Phase.slice(0, len).map(v => v[1]), 9);
  const ph3 = movingAverage(kl3Phase.slice(0, len).map(v => v[1]), 9);

  return Array.from({ length: len }, (_, i) => ({
    t: kl1Phase[i][0],
    v: ph1[i],
    ph1: ph1[i],
    ph2: ph2[i],
    ph3: ph3[i],
  }));
}

function buildRfData(c1: number[][], c2: number[][], c3: number[][]) {
  if (!c1?.length || !c2?.length || !c3?.length) {
    return null;
  }

  const len = Math.min(c1.length, c2.length, c3.length);
  const sum = Array.from({ length: len }, (_, i) => c1[i][1] + c2[i][1] + c3[i][1]);
  const smooth = movingAverage(sum, 21);

  return Array.from({ length: len }, (_, i) => ({
    t: c1[i][0],
    v: smooth[i],
  }));
}

function movingAverage(values: number[], windowSize: number) {
  if (windowSize <= 1 || values.length === 0) {
    return values;
  }
  const half = Math.floor(windowSize / 2);
  return values.map((_, i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(values.length - 1, i + half);
    let sum = 0;
    for (let j = start; j <= end; j++) {
      sum += values[j];
    }
    return sum / (end - start + 1);
  });
}
