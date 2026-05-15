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
    { label: 'Клистрон 1', status: kl1?.status },
    { label: 'Клистрон 2', status: kl2?.status },
    { label: 'Клистрон 3', status: kl3?.status },
    { label: 'ВЧ 1', status: data.kl1LlrfPowerStatus },
    { label: 'ВЧ 2', status: data.kl2LlrfPowerStatus },
    { label: 'ВЧ 3', status: data.kl3LlrfPowerStatus },
    { label: 'Блокировка 1', status: data.kl1PwrIlkStatus },
    { label: 'Блокировка 2', status: data.kl2PwrIlkStatus },
    { label: 'Блокировка 3', status: data.kl3PwrIlkStatus },
  ].filter(item => !!item.status);

  return (
    <section className="px-4 py-1">
      <h2 className="text-xl font-bold text-white mb-1 border-b border-panel-border pb-1">
        Линейный ускоритель
      </h2>
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-2">
        <div className="flex flex-col gap-1">
          {statusItems.length > 0 && (
            <div className="grid grid-cols-3 gap-1">
              {statusItems.map(item => (
                <StatusIndicator key={item.label} label={item.label} status={item.status!} />
              ))}
            </div>
          )}
          <div className="flex flex-col gap-1 mt-1">
            <ValueCard label="Ток пушки" value={data.gunCurrent ?? null} unit="мА" />
            <ValueCard label="Ток линака" value={data.linacCurrent ?? null} unit="мА" />
          </div>
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-3 gap-1">
          {powerData && (
            <PulseChart
              title="Мощность клистронов"
              data={powerData}
              yLabel="МВт"
              yDomain={[0, 50]}
              series={[
                { key: 'kl1', label: 'Клистрон 1', color: '#3B82F6' },
                { key: 'kl2', label: 'Клистрон 2', color: '#22C55E' },
                { key: 'kl3', label: 'Клистрон 3', color: '#F59E0B' },
              ]}
              height={175}
            />
          )}
          {phaseData && (
            <PulseChart
              title="Фаза клистронов"
              data={phaseData}
              yLabel="Градусы"
              yDomain={[-180, 180]}
              series={[
                { key: 'ph1', label: 'Клистрон 1', color: '#06B6D4' },
                { key: 'ph2', label: 'Клистрон 2', color: '#A78BFA' },
                { key: 'ph3', label: 'Клистрон 3', color: '#F97316' },
              ]}
              height={175}
            />
          )}
          {rfData && (
            <div className="bg-panel-card border border-panel-border rounded-lg p-1.5">
              <h4 className="text-sm text-gray-300 mb-2">ВЧ система</h4>
              <div className="grid grid-cols-[118px_1fr] gap-1 items-start">
                <div className="grid grid-cols-2 gap-1">
                  {booster?.cav1LlrfModulatorStatus && <StatusIndicator label="Резонатор 1" status={booster.cav1LlrfModulatorStatus} />}
                  {booster?.cav2LlrfModulatorStatus && <StatusIndicator label="Резонатор 2" status={booster.cav2LlrfModulatorStatus} />}
                  {booster?.cav3LlrfModulatorStatus && <StatusIndicator label="Резонатор 3" status={booster.cav3LlrfModulatorStatus} />}
                  {booster?.powerSupplyStatus && <StatusIndicator label="Питание" status={booster.powerSupplyStatus} />}
                </div>
                <PulseChart
                  title=""
                  data={rfData}
                  yLabel="кВт"
                  yDomain={[0, 1]}
                  color="#22C55E"
                  xDomain={[0, 1]}
                  xLabel="время, с"
                  xUnit="с"
                  height={145}
                />
              </div>
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
  const s1 = movingAverage(kl1.slice(0, len).map(v => v[1]), 15);
  const s2 = movingAverage(kl2.slice(0, len).map(v => v[1]), 15);
  const s3 = movingAverage(kl3.slice(0, len).map(v => v[1]), 15);

  return Array.from({ length: len }, (_, i) => ({
    t: kl1[i][0],
    v: clampPowerMw(s1[i]),
    kl1: clampPowerMw(s1[i]),
    kl2: clampPowerMw(s2[i]),
    kl3: clampPowerMw(s3[i]),
  }));
}

function buildPhaseData(kl1Phase: number[][] | null, kl2Phase: number[][] | null, kl3Phase: number[][] | null) {
  if (!kl1Phase?.length || !kl2Phase?.length || !kl3Phase?.length) {
    return null;
  }

  const len = Math.min(kl1Phase.length, kl2Phase.length, kl3Phase.length);
  const ph1 = movingAverage(kl1Phase.slice(0, len).map(v => v[1]), 17);
  const ph2 = movingAverage(kl2Phase.slice(0, len).map(v => v[1]), 17);
  const ph3 = movingAverage(kl3Phase.slice(0, len).map(v => v[1]), 17);

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
  const smooth = movingAverage(sum, 31);
  const max = Math.max(1e-9, ...smooth.map(v => Math.abs(v)));

  return Array.from({ length: len }, (_, i) => ({
    t: c1[i][0],
    v: Math.max(0, Math.min(1, smooth[i] / max)),
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

function clampPowerMw(value: number) {
  if (value < 0) return 0;
  if (value > 50) return 50;
  return value;
}
