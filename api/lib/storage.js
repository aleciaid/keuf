import fs from 'fs';
import path from 'path';

// Vercel serverless: use /tmp for writable file storage (ephemeral per invocation)
const DATA_FILE = path.join('/tmp', 'fintrack_transactions.json');

export function loadStoredData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch {
    console.error('[FinTrack] Error reading data file');
  }
  return null;
}

export function saveStoredData(data) {
  const versioned = {
    ...data,
    _lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(versioned, null, 2), 'utf-8');
  return versioned;
}

export function deleteStoredData() {
  if (fs.existsSync(DATA_FILE)) {
    fs.unlinkSync(DATA_FILE);
  }
}

export function validatePayload(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Payload harus berupa objek JSON.'] };
  }
  if (data.mode !== 'rekap') {
    errors.push('Field "mode" harus bernilai "rekap".');
  }
  if (typeof data.total_pemasukan !== 'number') {
    errors.push('Field "total_pemasukan" harus berupa angka.');
  }
  if (typeof data.total_pengeluaran !== 'number') {
    errors.push('Field "total_pengeluaran" harus berupa angka.');
  }
  if (typeof data.saldo_akhir !== 'number') {
    errors.push('Field "saldo_akhir" harus berupa angka.');
  }
  if (!Array.isArray(data.history)) {
    errors.push('Field "history" harus berupa array.');
  } else {
    data.history.forEach((item, i) => {
      if (!item.tgl) errors.push(`history[${i}]: "tgl" wajib diisi.`);
      if (!['Pemasukan', 'Pengeluaran'].includes(item.tipe)) {
        errors.push(`history[${i}]: "tipe" harus "Pemasukan" atau "Pengeluaran".`);
      }
      if (typeof item.nominal !== 'number' || item.nominal < 0) {
        errors.push(`history[${i}]: "nominal" harus angka positif.`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

export function mergeData(existing, incoming) {
  if (!existing) return incoming;

  const existingHistory = existing.history || [];
  const newHistory = incoming.history || [];

  const existingKeys = new Set(
    existingHistory.map((h) => `${h.tgl}_${h.nominal}_${h.ket}`)
  );
  const uniqueNew = newHistory.filter(
    (h) => !existingKeys.has(`${h.tgl}_${h.nominal}_${h.ket}`)
  );

  const merged = [...existingHistory, ...uniqueNew].sort(
    (a, b) => new Date(b.tgl) - new Date(a.tgl)
  );

  const total_pemasukan = merged
    .filter((h) => h.tipe === 'Pemasukan')
    .reduce((s, h) => s + h.nominal, 0);
  const total_pengeluaran = merged
    .filter((h) => h.tipe === 'Pengeluaran')
    .reduce((s, h) => s + h.nominal, 0);

  return {
    ...incoming,
    history: merged,
    total_pemasukan,
    total_pengeluaran,
    saldo_akhir: total_pemasukan - total_pengeluaran,
    jumlah_transaksi: merged.length,
  };
}
