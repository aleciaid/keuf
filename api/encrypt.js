import { encrypt } from './lib/crypto.js';
import {
  loadStoredData,
  saveStoredData,
  validatePayload,
  mergeData,
} from './lib/storage.js';

/**
 * POST /api/encrypt
 * Menerima data JSON, mengenkripsi dengan AES-256-CBC, dan mengembalikan URL.
 * 
 * Query params:
 *   ?ingest=true  → Juga langsung simpan data (encrypt + ingest sekaligus)
 * 
 * Response: { success, url, encrypted_token }
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed. Gunakan POST.' });
  }

  console.log(`[${new Date().toISOString()}] POST /api/encrypt`);

  try {
    const payload = req.body;

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Body harus berupa JSON object.',
      });
    }

    // Validasi data
    const validation = validatePayload(payload);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: validation.errors,
      });
    }

    // Enkripsi data
    const encryptedToken = encrypt(payload);
    const baseUrl = process.env.FINTRACK_BASE_URL || 'https://keuf.vercel.app';
    const fullUrl = `${baseUrl}/?l=${encodeURIComponent(encryptedToken)}`;

    // Opsional: langsung ingest data juga
    const shouldIngest = req.query?.ingest === 'true';
    let ingestResult = null;

    if (shouldIngest) {
      const existing = loadStoredData();
      const merged = mergeData(existing, payload);
      const saved = saveStoredData(merged);
      ingestResult = {
        jumlah_transaksi: saved.jumlah_transaksi,
        total_pemasukan: saved.total_pemasukan,
        total_pengeluaran: saved.total_pengeluaran,
        saldo_akhir: saved.saldo_akhir,
      };
      console.log(`[FinTrack] Data encrypted + ingested — ${saved.jumlah_transaksi} transaksi`);
    } else {
      console.log('[FinTrack] Data encrypted (not ingested)');
    }

    return res.status(200).json({
      success: true,
      url: fullUrl,
      encrypted_token: encryptedToken,
      ingested: shouldIngest,
      ...(ingestResult && { data: ingestResult }),
    });
  } catch (err) {
    console.error('[FinTrack] Encrypt error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengenkripsi data',
      error: err.message,
    });
  }
}
