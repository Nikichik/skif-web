interface ValueCardProps {
  label: string;
  value: number | null;
  unit: string;
}

export default function ValueCard({ label, value, unit }: ValueCardProps) {
  return (
    <div className="bg-panel-card border border-panel-border rounded-lg px-4 py-2">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold text-white font-mono">
        {value !== null ? value.toFixed(1) : '—'}
        <span className="text-xs text-gray-400 ml-1">{unit}</span>
      </div>
    </div>
  );
}
