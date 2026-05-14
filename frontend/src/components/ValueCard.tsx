interface ValueCardProps {
  label: string;
  value: number | null;
  unit: string;
}

export default function ValueCard({ label, value, unit }: ValueCardProps) {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  return (
    <div className="bg-panel-card border border-panel-border rounded-lg px-4 py-3">
      <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-white font-mono leading-tight">
        {value.toFixed(1)}
        <span className="text-sm text-gray-300 ml-2">{unit}</span>
      </div>
    </div>
  );
}

