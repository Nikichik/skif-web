import type { LinacData, KlystronData } from '../types';
import StatusIndicator from './StatusIndicator';
import ValueCard from './ValueCard';
import PulseChart from './PulseChart';

interface LinacSectionProps {
  data: LinacData | null;
}

export default function LinacSection({ data }: LinacSectionProps) {
  if (!data) {
    return null;
  }

  const kl = data.klystrons || [];
  const kl1 = kl.find(k => k.id === 'KL1');
  const kl2 = kl.find(k => k.id === 'KL2');
  const kl3 = kl.find(k => k.id === 'KL3');

  const powerData = buildPowerData(kl1, kl2, kl3);
  const phaseData = buildPhaseData(kl1?.phase || null, kl2?.phase || null, kl3?.phase || null);
  const rfData = buildRfData(kl1, kl2, kl3);

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
    { label: 'Системы', status: data.systemsStatus },
    { label: 'Инжектор', status: data.injectorStatus },
    { label: 'ВЧ', status: data.rfStatus },
  ].filter(item => !!item.status);

  return (
    <section className="px-4 py-3">
      <h2 className="text-xl font-bold text-white mb-3 border-b border-panel-border pb-2">
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
              yLabel="МВт"
              yDomain={[0, 60]}
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
            <PulseChart
              title="ВЧ система"
              data={rfData}
              yLabel="усл. ед."
              color="#22C55E"
              xDomain={[0, 1]}
              xLabel="время, с"
              xUnit="с"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function buildPowerData(kl1?: KlystronData, kl2?: KlystronData, kl3?: KlystronData) {
  if (
    kl1?.power === null || kl1?.power === undefined ||
    kl2?.power === null || kl2?.power === undefined ||
    kl3?.power === null || kl3?.power === undefined
  ) {
    return null;
  }

  return [
    {
      t: 0,
      v: kl1.power,
      kl1: kl1.power,
      kl2: kl2.power,
      kl3: kl3.power,
    },
    {
      t: 1,
      v: kl1.power,
      kl1: kl1.power,
      kl2: kl2.power,
      kl3: kl3.power,
    },
  ];
}

function buildPhaseData(kl1Phase: number[][] | null, kl2Phase: number[][] | null, kl3Phase: number[][] | null) {
  if (!kl1Phase || !kl2Phase || !kl3Phase || kl1Phase.length === 0 || kl2Phase.length === 0 || kl3Phase.length === 0) {
    return null;
  }

  const len = Math.min(kl1Phase.length, kl2Phase.length, kl3Phase.length);
  return Array.from({ length: len }, (_, i) => ({
    t: kl1Phase[i][0],
    v: kl1Phase[i][1],
    ph1: kl1Phase[i][1],
    ph2: kl2Phase[i][1],
    ph3: kl3Phase[i][1],
  }));
}

function buildRfData(kl1?: KlystronData, kl2?: KlystronData, kl3?: KlystronData) {
  if (
    kl1?.power === null || kl1?.power === undefined ||
    kl2?.power === null || kl2?.power === undefined ||
    kl3?.power === null || kl3?.power === undefined
  ) {
    return null;
  }

  const avg = (kl1.power + kl2.power + kl3.power) / 3.0;
  return [
    [0, avg],
    [1, avg],
  ];
}

