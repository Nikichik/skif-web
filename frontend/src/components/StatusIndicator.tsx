interface StatusIndicatorProps {
  label: string;
  status: string;
  value?: string;
}

const statusColors: Record<string, string> = {
  OK: 'bg-status-ok',
  WARN: 'bg-status-warn',
  FAULT: 'bg-status-fault',
};

export default function StatusIndicator({ label, status, value }: StatusIndicatorProps) {
  const colorClass = statusColors[status] || 'bg-gray-600';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-10 h-10 rounded-full ${colorClass} shadow-lg ring-2 ring-white/10 flex items-center justify-center`}>
        {value && <span className="text-xs font-bold text-white">{value}</span>}
      </div>
      <span className="text-[10px] text-center leading-tight" style={{ color: 'rgb(var(--text-secondary))' }}>{label}</span>
    </div>
  );
}
