import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

const cards = [
  {
    id: 'saldo',
    label: 'Saldo Akhir',
    key: 'saldo_akhir',
    icon: Wallet,
    gradient: 'from-primary-500 to-indigo-600',
    bgLight: 'bg-primary-50',
    textColor: 'text-primary-700',
    iconBg: 'bg-white/20',
  },
  {
    id: 'pemasukan',
    label: 'Total Pemasukan',
    key: 'total_pemasukan',
    icon: TrendingUp,
    gradient: 'from-emerald-500 to-green-600',
    bgLight: 'bg-income-light',
    textColor: 'text-emerald-700',
    iconBg: 'bg-white/20',
  },
  {
    id: 'pengeluaran',
    label: 'Total Pengeluaran',
    key: 'total_pengeluaran',
    icon: TrendingDown,
    gradient: 'from-rose-500 to-red-600',
    bgLight: 'bg-expense-light',
    textColor: 'text-rose-700',
    iconBg: 'bg-white/20',
  },
];

export default function BalanceCards({ data }) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass-card-solid rounded-3xl p-6 shadow-lg">
            <div className="animate-shimmer h-4 w-24 rounded-lg mb-3" />
            <div className="animate-shimmer h-8 w-36 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const value = data[card.key] ?? 0;
        return (
          <div
            key={card.id}
            id={`card-${card.id}`}
            className="animate-fade-in-up group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-100`} />

            {/* Decorative circles */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />

            {/* Content */}
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-white/80">{card.label}</p>
                <div className={`${card.iconBg} p-2.5 rounded-xl backdrop-blur-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                {formatCurrency(value)}
              </p>
              {card.id === 'saldo' && data.jumlah_transaksi !== undefined && (
                <p className="text-xs text-white/60 mt-2">
                  {data.jumlah_transaksi} transaksi
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
