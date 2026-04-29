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

  return (
    <section className="px-4 py-3">
      <h2 className="text-base font-bold text-white mb-3 border-b border-panel-border pb-2">
        Линейный ускоритель
      </h2>
      <div className="grid grid-cols-[1fr_2.5fr_1.5fr] gap-4">
        {/* Left — indicators */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            <StatusIndicator label="KL1" status={kl1?.status || 'FAULT'} />
            <StatusIndicator label="KL2" status={kl2?.status || 'FAULT'} />
            <StatusIndicator label="KL3" status={kl3?.status || 'FAULT'} />
            <StatusIndicator label="Системы" status={data?.systemsStatus || 'FAULT'} />
            <StatusIndicator label="Инжектор" status={data?.injectorStatus || 'FAULT'} />
            <StatusIndicator label="ВЧ" status={data?.rfStatus || 'FAULT'} />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <ValueCard label="Ток пушки" value={data?.gunCurrent ?? null} unit="мА" />
            <ValueCard label="Ток линака" value={data?.linacCurrent ?? null} unit="мА" />
          </div>
        </div>

        {/* Center — klystron pulse charts */}
        <div className="flex flex-col gap-2">
          <PulseChart title="Мощность KL1" data={kl1?.pulse || null} yLabel="МВт" color="#3B82F6" />
          <PulseChart title="Мощность KL2" data={kl2?.pulse || null} yLabel="МВт" color="#8B5CF6" />
          <PulseChart title="Мощность KL3" data={kl3?.pulse || null} yLabel="МВт" color="#06B6D4" />
        </div>

        {/* Right — phase chart */}
        <div>
          <PulseChart
            title="Фаза"
            data={data?.phase || null}
            yLabel="градусы"
            color="#F59E0B"
            yDomain={[-180, 180]}
          />
        </div>
      </div>
    </section>
  );
}
