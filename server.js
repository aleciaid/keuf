import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'transactions.json');
const PORT = 3001;

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// ------- Helpers -------

function loadStoredData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch {
    console.error('[FinTrack] Error reading data file');
  }
  return null;
}

function saveStoredData(data) {
  const versioned = {
    ...data,
    _lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(versioned, null, 2), 'utf-8');
  return versioned;
}

function validatePayload(data) {
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

function mergeData(existing, incoming) {
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

// ------- API Routes -------

/**
 * POST /api/webhook
 * Menerima payload JSON transaksi, memvalidasi, merge, dan simpan.
 */
app.post('/api/webhook', (req, res) => {
  console.log(`[${new Date().toISOString()}] POST /api/webhook received`);

  const payload = req.body;
  const validation = validatePayload(payload);

  if (!validation.valid) {
    console.log('[FinTrack] Validation failed:', validation.errors);
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: validation.errors,
    });
  }

  const existing = loadStoredData();
  const merged = mergeData(existing, payload);
  const saved = saveStoredData(merged);

  console.log(`[FinTrack] Data synced — ${saved.jumlah_transaksi} transaksi total`);

  return res.json({
    success: true,
    message: 'Data berhasil disinkronkan',
    data: {
      jumlah_transaksi: saved.jumlah_transaksi,
      total_pemasukan: saved.total_pemasukan,
      total_pengeluaran: saved.total_pengeluaran,
      saldo_akhir: saved.saldo_akhir,
    },
  });
});

/**
 * GET /api/data
 * Mengembalikan seluruh data transaksi yang tersimpan.
 */
app.get('/api/data', (req, res) => {
  const data = loadStoredData();
  if (!data) {
    return res.json({ success: true, data: null });
  }
  return res.json({ success: true, data });
});

/**
 * DELETE /api/data
 * Menghapus semua data transaksi.
 */
app.delete('/api/data', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
    return res.json({ success: true, message: 'Data berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/export
 * Download data sebagai file JSON.
 */
app.get('/api/export', (req, res) => {
  const data = loadStoredData();
  if (!data) {
    return res.status(404).json({ success: false, message: 'Belum ada data' });
  }
  const filename = `fintrack_backup_${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/json');
  return res.send(JSON.stringify(data, null, 2));
});

// ------- Start Server -------
app.listen(PORT, () => {
  console.log(`\n  🚀  FinTrack API Server`);
  console.log(`  ➜  Endpoint:  http://localhost:${PORT}/api/webhook`);
  console.log(`  ➜  Data:      http://localhost:${PORT}/api/data`);
  console.log(`  ➜  Export:    http://localhost:${PORT}/api/export\n`);
});
