import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface PulseChartProps {
  title: string;
  data: number[][] | null;
  yLabel: string;
  color?: string;
  yDomain?: [number, number];
}

export default function PulseChart({ title, data, yLabel, color = '#3B82F6', yDomain }: PulseChartProps) {
  const chartData = data?.map(([t, v]) => ({ t, v })) || [];

  return (
    <div className="bg-panel-card border border-panel-border rounded-lg p-3">
      <h4 className="text-xs text-gray-400 mb-2">{title}</h4>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 9, fill: '#64748B' }}
            label={{ value: 'время, мкс', position: 'insideBottom', offset: -10, style: { fontSize: 9, fill: '#64748B' } }}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#64748B' }}
            domain={yDomain || ['auto', 'auto']}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 9, fill: '#64748B' } }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111D33', border: '1px solid #1E3050', fontSize: 11 }}
            labelFormatter={(v) => `${v} мкс`}
          />
          <Line type="monotone" dataKey="v" stroke={color} dot={false} strokeWidth={1.5} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
