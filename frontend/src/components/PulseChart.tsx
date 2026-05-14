import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface PulseSeries {
  key: string;
  label: string;
  color: string;
}

interface PulseChartProps {
  title: string;
  data: number[][] | Array<Record<string, number>> | null;
  yLabel: string;
  color?: string;
  yDomain?: [number, number];
  series?: PulseSeries[];
  xDomain?: [number, number];
  xLabel?: string;
  xUnit?: string;
  height?: number;
}

export default function PulseChart({
  title,
  data,
  yLabel,
  color = '#3B82F6',
  yDomain,
  series,
  xDomain,
  xLabel = 'время, мкс',
  xUnit = 'мкс',
  height = 320,
}: PulseChartProps) {
  const chartData = normalizeChartData(data);
  const computedYDomain = yDomain || computeTightDomain(chartData.map(p => p.v));

  return (
    <div className="bg-panel-card border border-panel-border rounded-lg p-3">
      <h4 className="text-sm text-gray-300 mb-2">{title}</h4>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 12, left: 8, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" />
          <XAxis
            dataKey="t"
            type="number"
            domain={xDomain || ['dataMin', 'dataMax']}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            label={{ value: xLabel, position: 'insideBottom', offset: -10, style: { fontSize: 11, fill: '#94A3B8' } }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            domain={computedYDomain}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 2, style: { fontSize: 11, fill: '#94A3B8' } }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111D33', border: '1px solid #1E3050', fontSize: 12 }}
            labelFormatter={(v) => `${v} ${xUnit}`}
          />
          {series && series.length > 0 ? (
            series.map(item => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={item.color}
                dot={false}
                strokeWidth={1.9}
                name={item.label}
                isAnimationActive={false}
              />
            ))
          ) : (
            <Line type="monotone" dataKey="v" stroke={color} dot={false} strokeWidth={1.9} isAnimationActive={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function normalizeChartData(data: number[][] | Array<Record<string, number>> | null): Array<Record<string, number>> {
  if (!data || data.length === 0) {
    return [];
  }
  const first = data[0];
  if (Array.isArray(first)) {
    return (data as number[][]).map(([t, v]) => ({ t, v }));
  }
  return data as Array<Record<string, number>>;
}

function computeTightDomain(values: number[]): [number, number] {
  if (values.length === 0) {
    return [0, 1];
  }

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  const span = Math.max(1e-6, max - min);
  const pad = span * 0.15;
  return [min - pad, max + pad];
}
