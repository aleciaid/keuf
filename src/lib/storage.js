const STORAGE_KEY = 'fintrack_data';
const VERSION_KEY = 'fintrack_version';
const CURRENT_VERSION = 1;

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveData(data) {
  const versioned = {
    ...data,
    _version: CURRENT_VERSION,
    _lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(versioned));
  localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION));
  return versioned;
}

export function clearData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(VERSION_KEY);
}

export function exportData() {
  const data = loadData();
  if (!data) return null;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fintrack_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function mergeData(existingData, newPayload) {
  if (!existingData) return newPayload;

  const existingHistory = existingData.history || [];
  const newHistory = newPayload.history || [];

  // Deduplicate by tgl + nominal + ket
  const existingKeys = new Set(
    existingHistory.map(h => `${h.tgl}_${h.nominal}_${h.ket}`)
  );

  const uniqueNew = newHistory.filter(
    h => !existingKeys.has(`${h.tgl}_${h.nominal}_${h.ket}`)
  );

  const mergedHistory = [...existingHistory, ...uniqueNew].sort(
    (a, b) => new Date(b.tgl) - new Date(a.tgl)
  );

  return {
    ...newPayload,
    history: mergedHistory,
    total_pemasukan: mergedHistory
      .filter(h => h.tipe === 'Pemasukan')
      .reduce((sum, h) => sum + h.nominal, 0),
    total_pengeluaran: mergedHistory
      .filter(h => h.tipe === 'Pengeluaran')
      .reduce((sum, h) => sum + h.nominal, 0),
    saldo_akhir:
      mergedHistory
        .filter(h => h.tipe === 'Pemasukan')
        .reduce((sum, h) => sum + h.nominal, 0) -
      mergedHistory
        .filter(h => h.tipe === 'Pengeluaran')
        .reduce((sum, h) => sum + h.nominal, 0),
    jumlah_transaksi: mergedHistory.length,
  };
}
