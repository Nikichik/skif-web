interface StatusIndicatorProps {
  label: string;
  status: string;
  shape?: 'square' | 'circle';
  value?: string;
}

const statusColors: Record<string, string> = {
  OK: 'bg-status-ok',
  WARN: 'bg-status-warn',
  FAULT: 'bg-status-fault',
};

export default function StatusIndicator({ label, status, shape = 'square', value }: StatusIndicatorProps) {
  const colorClass = statusColors[status] || 'bg-gray-600';
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-md';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-12 h-12 ${shapeClass} ${colorClass} shadow-lg flex items-center justify-center`}>
        {value && <span className="text-xs font-bold text-white">{value}</span>}
      </div>
      <span className="text-[10px] text-gray-400 text-center leading-tight">{label}</span>
    </div>
  );
}
