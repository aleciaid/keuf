import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '../lib/utils';

const COLORS = ['#10b981', '#ef4444'];

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent === 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-sm font-semibold"
      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card-solid rounded-xl px-4 py-3 shadow-xl">
        <p className="text-sm font-semibold text-text-primary">{payload[0].name}</p>
        <p className="text-sm text-text-secondary">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function DonutChart({ data }) {
  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Pemasukan', value: data.total_pemasukan || 0 },
      { name: 'Pengeluaran', value: data.total_pengeluaran || 0 },
    ].filter(d => d.value > 0);
  }, [data]);

  if (!data) {
    return (
      <div className="glass-card-solid rounded-3xl p-6 shadow-lg h-full">
        <div className="animate-shimmer h-5 w-40 rounded-lg mb-6" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-shimmer w-48 h-48 rounded-full" />
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="glass-card-solid rounded-3xl p-6 shadow-lg h-full">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Rasio Keuangan</h3>
        <div className="flex items-center justify-center h-64 text-text-muted text-sm">
          Belum ada data transaksi
        </div>
      </div>
    );
  }

  return (
    <div id="chart-donut" className="glass-card-solid rounded-3xl p-6 shadow-lg h-full animate-fade-in-up" style={{ animationDelay: '200ms' }}>
      <h3 className="text-lg font-semibold text-text-primary mb-2">Rasio Keuangan</h3>
      <p className="text-xs text-text-muted mb-4">Perbandingan pemasukan vs pengeluaran</p>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={4}
            dataKey="value"
            labelLine={false}
            label={CustomLabel}
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={COLORS[index % COLORS.length]}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={10}
            formatter={(value) => (
              <span className="text-sm text-text-secondary ml-1">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
