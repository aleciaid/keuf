import { decrypt } from './lib/crypto.js';
import {
  loadStoredData,
  saveStoredData,
  validatePayload,
  mergeData,
} from './lib/storage.js';

/**
 * POST /api/webhook
 * Menerima data transaksi via:
 *   1. Body JSON biasa (POST body)
 *   2. Encrypted URL param: ?l=<aes_encrypted_base64>
 *
 * GET /api/webhook?l=<encrypted>
 * Menerima data via encrypted query parameter (AES-256-CBC)
 * Secret key diambil dari env var: FINTRACK_SECRET_KEY
 */
export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`[${new Date().toISOString()}] ${req.method} /api/webhook`);

  let payload = null;

  try {
    // -------- Cek encrypted query param "l" --------
    const encryptedData = req.query?.l;
    if (encryptedData) {
      console.log('[FinTrack] Decrypting URL parameter (l)...');
      try {
        payload = decrypt(decodeURIComponent(encryptedData));
        console.log('[FinTrack] Decryption berhasil');
      } catch (err) {
        console.error('[FinTrack] Decryption gagal:', err.message);
        return res.status(400).json({
          success: false,
          message: 'Gagal mendekripsi data dari URL',
          error: err.message,
        });
      }
    }

    // -------- Fallback: ambil dari POST body --------
    if (!payload && req.method === 'POST' && req.body) {
      payload = req.body;
    }

    // -------- Tidak ada data --------
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data. Kirim via POST body atau query param ?l=<encrypted>',
      });
    }

    // -------- Validasi --------
    const validation = validatePayload(payload);
    if (!validation.valid) {
      console.log('[FinTrack] Validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: validation.errors,
      });
    }

    // -------- Merge & Save --------
    const existing = loadStoredData();
    const merged = mergeData(existing, payload);
    const saved = saveStoredData(merged);

    console.log(`[FinTrack] Data synced — ${saved.jumlah_transaksi} transaksi total`);

    return res.status(200).json({
      success: true,
      message: 'Data berhasil disinkronkan',
      data: {
        jumlah_transaksi: saved.jumlah_transaksi,
        total_pemasukan: saved.total_pemasukan,
        total_pengeluaran: saved.total_pengeluaran,
        saldo_akhir: saved.saldo_akhir,
      },
    });
  } catch (err) {
    console.error('[FinTrack] Unhandled error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
}
