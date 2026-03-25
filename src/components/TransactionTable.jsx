import { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  Filter,
  X,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';

const PAGE_SIZE = 10;

export default function TransactionTable({ data }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState('tgl');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const history = data?.history || [];

  const filtered = useMemo(() => {
    let result = [...history];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (h) =>
          (h.ket && h.ket.toLowerCase().includes(q)) ||
          h.nominal.toString().includes(q) ||
          h.tipe.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((h) => h.tipe === typeFilter);
    }

    // Date range
    if (dateFrom) {
      result = result.filter((h) => h.tgl >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((h) => h.tgl <= dateTo + ' 23:59:59');
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'tgl') {
        cmp = new Date(a.tgl) - new Date(b.tgl);
      } else if (sortField === 'nominal') {
        cmp = a.nominal - b.nominal;
      } else if (sortField === 'tipe') {
        cmp = a.tipe.localeCompare(b.tipe);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [history, search, typeFilter, sortField, sortDir, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  const hasActiveFilters = search || typeFilter !== 'all' || dateFrom || dateTo;

  // Summary stats
  const totalFiltered = filtered.length;
  const totalIncomeFiltered = filtered
    .filter((h) => h.tipe === 'Pemasukan')
    .reduce((s, h) => s + h.nominal, 0);
  const totalExpenseFiltered = filtered
    .filter((h) => h.tipe === 'Pengeluaran')
    .reduce((s, h) => s + h.nominal, 0);

  if (!data) {
    return (
      <div className="glass-card-solid rounded-3xl p-6 shadow-lg">
        <div className="animate-shimmer h-5 w-48 rounded-lg mb-6" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-shimmer h-12 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      id="transaction-table"
      className="glass-card-solid rounded-3xl shadow-lg overflow-hidden animate-fade-in-up"
      style={{ animationDelay: '400ms' }}
    >
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Riwayat Transaksi</h3>
            <p className="text-xs text-text-muted">{totalFiltered} transaksi ditemukan</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                id="search-transactions"
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Cari transaksi..."
                className="w-full sm:w-56 pl-10 pr-4 py-2.5 bg-surface-secondary rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all"
              />
            </div>

            {/* Filter toggle */}
            <button
              id="btn-toggle-filters"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                showFilters || hasActiveFilters
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-surface-secondary text-text-muted hover:bg-primary-50'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="animate-slide-down flex flex-wrap items-end gap-3 mb-4 p-4 bg-surface-secondary rounded-2xl">
            {/* Type filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted">Tipe</label>
              <select
                id="filter-type"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                className="px-3 py-2 bg-white border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer"
              >
                <option value="all">Semua</option>
                <option value="Pemasukan">Pemasukan</option>
                <option value="Pengeluaran">Pengeluaran</option>
              </select>
            </div>

            {/* Date from */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Dari
              </label>
              <input
                id="filter-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="px-3 py-2 bg-white border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>

            {/* Date to */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Sampai
              </label>
              <input
                id="filter-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className="px-3 py-2 bg-white border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>

            {hasActiveFilters && (
              <button
                id="btn-clear-filters"
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-expense hover:bg-expense-light rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        )}

        {/* Summary strip */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-4 mb-4 text-xs">
            <span className="px-3 py-1.5 bg-income-light text-emerald-700 rounded-lg font-medium">
              Pemasukan: {formatCurrency(totalIncomeFiltered)}
            </span>
            <span className="px-3 py-1.5 bg-expense-light text-rose-700 rounded-lg font-medium">
              Pengeluaran: {formatCurrency(totalExpenseFiltered)}
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-t border-b border-border bg-surface-secondary/50">
              <th className="text-left px-6 py-3">
                <button
                  onClick={() => toggleSort('tgl')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider hover:text-primary-600 transition-colors cursor-pointer"
                >
                  Tanggal
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left px-6 py-3">
                <button
                  onClick={() => toggleSort('tipe')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider hover:text-primary-600 transition-colors cursor-pointer"
                >
                  Tipe
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-right px-6 py-3">
                <button
                  onClick={() => toggleSort('nominal')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider hover:text-primary-600 transition-colors cursor-pointer ml-auto"
                >
                  Nominal
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="text-left px-6 py-3 hidden sm:table-cell">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Keterangan</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-text-muted text-sm">
                  Tidak ada transaksi yang cocok.
                </td>
              </tr>
            ) : (
              pageData.map((tx, i) => (
                <tr key={`${tx.tgl}-${tx.nominal}-${i}`} className="table-row-hover border-b border-border/50 last:border-b-0">
                  <td className="px-6 py-4">
                    <span className="text-sm text-text-primary">{formatDate(tx.tgl)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        tx.tipe === 'Pemasukan'
                          ? 'bg-income-light text-emerald-700'
                          : 'bg-expense-light text-rose-700'
                      }`}
                    >
                      {tx.tipe}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`text-sm font-semibold ${
                        tx.tipe === 'Pemasukan' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {tx.tipe === 'Pemasukan' ? '+' : '-'}{formatCurrency(tx.nominal)}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="text-sm text-text-secondary">{tx.ket || '—'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-xs text-text-muted">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} dari {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              id="btn-prev-page"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-xl hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-text-secondary" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    page === pageNum
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'hover:bg-surface-secondary text-text-secondary'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              id="btn-next-page"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-2 rounded-xl hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
