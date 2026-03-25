import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getDailyAggregates, formatCurrency, formatDateShort } from '../lib/utils';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card-solid rounded-xl px-4 py-3 shadow-xl space-y-1">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-text-secondary">{entry.name}:</span>
            <span className="text-xs font-medium text-text-primary">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrendBarChart({ data }) {
  const chartData = useMemo(() => {
    if (!data?.history) return [];
    return getDailyAggregates(data.history).map((d) => ({
      ...d,
      label: formatDateShort(d.date),
    }));
  }, [data]);

  if (!data) {
    return (
      <div className="glass-card-solid rounded-3xl p-6 shadow-lg h-full">
        <div className="animate-shimmer h-5 w-48 rounded-lg mb-6" />
        <div className="animate-shimmer h-64 rounded-2xl" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="glass-card-solid rounded-3xl p-6 shadow-lg h-full">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Tren Harian</h3>
        <div className="flex items-center justify-center h-64 text-text-muted text-sm">
          Belum ada data transaksi
        </div>
      </div>
    );
  }

  return (
    <div id="chart-trend" className="glass-card-solid rounded-3xl p-6 shadow-lg h-full animate-fade-in-up" style={{ animationDelay: '300ms' }}>
      <h3 className="text-lg font-semibold text-text-primary mb-2">Tren Harian</h3>
      <p className="text-xs text-text-muted mb-4">Pemasukan & pengeluaran per hari</p>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barCategoryGap="20%" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(v) =>
              v >= 1_000_000 ? `${v / 1_000_000}jt` : v >= 1000 ? `${v / 1000}rb` : v
            }
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-text-secondary ml-1">{value}</span>
            )}
          />
          <Bar
            name="Pemasukan"
            dataKey="pemasukan"
            fill="#10b981"
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            name="Pengeluaran"
            dataKey="pengeluaran"
            fill="#ef4444"
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
