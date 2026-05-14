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
      <div className={`w-12 h-12 rounded-full ${colorClass} shadow-lg ring-2 ring-white/10 flex items-center justify-center`}>
        {value && <span className="text-xs font-bold text-white">{value}</span>}
      </div>
      <span className="text-xs text-gray-300 text-center leading-tight">{label}</span>
    </div>
  );
}
