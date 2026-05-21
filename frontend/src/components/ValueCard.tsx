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
      <div className="text-xs uppercase tracking-wider" style={{ color: 'rgb(var(--text-secondary))' }}>{label}</div>
      <div className="text-2xl font-bold font-mono leading-tight" style={{ color: 'rgb(var(--text-primary))' }}>
        {value.toFixed(1)}
        <span className="text-sm ml-2" style={{ color: 'rgb(var(--text-secondary))' }}>{unit}</span>
      </div>
    </div>
  );
}

