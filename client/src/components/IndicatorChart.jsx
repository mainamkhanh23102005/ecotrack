import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { formatAxisTick, formatValue } from '../utils/formatters';

function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4 animate-pulse" />
      <div className="h-48 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

export default function IndicatorChart({ indicatorKey, label, data, loading, color = '#3b82f6' }) {
  if (loading) return <SkeletonChart />;

  if (!data?.length) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">{label}</h3>
        <div className="flex-1 flex items-center justify-center h-48 text-gray-400 text-sm">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-600 mb-3">{label}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={60}
            tickFormatter={v => formatAxisTick(v, indicatorKey)}
          />
          <Tooltip
            formatter={(v) => [formatValue(v, indicatorKey), label]}
            labelFormatter={y => `Year: ${y}`}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            dot={false}
            strokeWidth={2}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
