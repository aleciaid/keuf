import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Download,
  Trash2,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import BalanceCards from './components/BalanceCards';
import DonutChart from './components/DonutChart';
import TrendBarChart from './components/TrendBarChart';
import TransactionTable from './components/TransactionTable';

const POLL_INTERVAL = 5000; // Poll setiap 5 detik

export default function App() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  // Fetch data dari API
  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setLastUpdated(new Date());
      } else if (json.success && !json.data) {
        setData(null);
      }
      setIsConnected(true);
    } catch (err) {
      console.error('Gagal fetch data:', err);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    fetchData(true);

    const interval = setInterval(() => fetchData(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => fetchData(true);

  const handleExport = useCallback(() => {
    window.open('/api/export', '_blank');
  }, []);

  const handleClear = useCallback(async () => {
    if (window.confirm('Hapus semua data transaksi? Tindakan ini tidak dapat dibatalkan.')) {
      try {
        await fetch('/api/data', { method: 'DELETE' });
        setData(null);
      } catch (err) {
        console.error('Gagal menghapus data:', err);
      }
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary tracking-tight">FinTrack</h1>
                <p className="text-[10px] text-text-muted -mt-0.5 hidden sm:block">Dashboard Keuangan</p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-2">
              {/* Connection status */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary text-xs">
                {isConnected ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-income" />
                    <span className="text-text-muted hidden sm:inline">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-expense" />
                    <span className="text-text-muted hidden sm:inline">Offline</span>
                  </>
                )}
              </div>

              {/* Refresh */}
              <button
                id="btn-refresh"
                onClick={handleRefresh}
                className="p-2 text-text-secondary hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all cursor-pointer"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {data && (
                <>
                  <button
                    id="btn-export"
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all cursor-pointer"
                    title="Export backup"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  <button
                    id="btn-clear"
                    onClick={handleClear}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-expense hover:bg-expense-light rounded-xl transition-all cursor-pointer"
                    title="Hapus semua data"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Last updated indicator */}
        {lastUpdated && (
          <div className="flex items-center justify-end">
            <p className="text-xs text-text-muted">
              Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
            </p>
          </div>
        )}

        {/* Balance Cards */}
        <section id="section-balance">
          <BalanceCards data={isLoading ? null : data} />
        </section>

        {/* Charts Row */}
        <section id="section-charts" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <DonutChart data={isLoading ? null : data} />
          </div>
          <div className="lg:col-span-3">
            <TrendBarChart data={isLoading ? null : data} />
          </div>
        </section>

        {/* Transaction Table */}
        <section id="section-transactions">
          <TransactionTable data={isLoading ? null : data} />
        </section>

        {/* Empty State */}
        {!isLoading && !data && (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary-100 rounded-3xl flex items-center justify-center">
              <LayoutDashboard className="w-10 h-10 text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Menunggu Data</h2>
            <p className="text-text-muted max-w-md mx-auto mb-4">
              Dashboard akan otomatis menampilkan data ketika payload diterima melalui API endpoint.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-secondary rounded-2xl text-sm">
              <code className="font-mono text-primary-600 text-xs">POST /api/webhook</code>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-text-muted">
              FinTrack © {new Date().getFullYear()} — Dashboard keuangan real-time
            </p>
            <p className="text-xs text-text-muted font-mono">
              API: <span className="text-primary-500">POST /api/webhook</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
