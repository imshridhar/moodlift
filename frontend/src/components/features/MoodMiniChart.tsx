// MoodMiniChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: Array<{ date: string; avg_mood: string | number }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-glass px-3 py-2 text-xs shadow-medium">
      <p className="text-[var(--color-text-muted)] mb-0.5">{new Date(label).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
      <p className="font-bold" style={{ color: '#f2751a' }}>Mood: {parseFloat(payload[0].value).toFixed(1)}/10</p>
    </div>
  );
};

export default function MoodMiniChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
        No mood data yet — start checking in!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
        />
        <YAxis domain={[1, 10]} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="avg_mood"
          stroke="#f2751a"
          strokeWidth={2}
          dot={{ fill: '#f2751a', r: 2.5 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
