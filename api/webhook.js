import { decrypt } from './lib/crypto.js';
import {
  loadStoredData,
  saveStoredData,
  validatePayload,
  mergeData,
} from './lib/storage.js';

/**
 * Decode base64 token dengan format: base64( KEY|JSON_DATA )
 * Validasi key harus cocok dengan FINTRACK_SECRET_KEY
 */
function decodeBase64Token(token) {
  const secretKey = process.env.FINTRACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('FINTRACK_SECRET_KEY belum di-set');
  }

  // Restore standard base64 from URL-safe
  let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  const decoded = Buffer.from(base64, 'base64').toString('utf-8');
  const separatorIndex = decoded.indexOf('|');

  if (separatorIndex === -1) {
    throw new Error('Format tidak valid: tidak ada separator |');
  }

  const key = decoded.substring(0, separatorIndex);
  const jsonStr = decoded.substring(separatorIndex + 1);

  if (key !== secretKey) {
    throw new Error('Key tidak valid');
  }

  return JSON.parse(jsonStr);
}

/**
 * POST /api/webhook — Body JSON biasa
 * GET/POST /api/webhook?l=<token>
 * 
 * Token bisa berformat:
 *   1. Base64: base64(KEY|JSON)  ← dari n8n
 *   2. AES:    iv_hex:base64url   ← dari tools/generate-url.js
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log(`[${new Date().toISOString()}] ${req.method} /api/webhook`);

  let payload = null;

  try {
    // -------- Cek query param "l" --------
    const token = req.query?.l;
    if (token) {
      const decoded = decodeURIComponent(token);
      console.log('[FinTrack] Decoding token from ?l=...');

      // Deteksi format: AES (iv_hex:data) atau Base64 (KEY|JSON)
      if (decoded.includes(':') && decoded.split(':')[0].length === 32) {
        // Format AES: 32-char hex IV : base64url data
        console.log('[FinTrack] Format: AES-256-CBC');
        try {
          payload = decrypt(decoded);
          console.log('[FinTrack] AES decryption berhasil');
        } catch (err) {
          console.error('[FinTrack] AES decryption gagal:', err.message);
          return res.status(400).json({
            success: false,
            message: 'Gagal mendekripsi data (AES)',
            error: err.message,
          });
        }
      } else {
        // Format Base64: KEY|JSON
        console.log('[FinTrack] Format: Base64 + Key');
        try {
          payload = decodeBase64Token(decoded);
          console.log('[FinTrack] Base64 decode berhasil');
        } catch (err) {
          console.error('[FinTrack] Base64 decode gagal:', err.message);
          return res.status(400).json({
            success: false,
            message: 'Gagal decode data (Base64)',
            error: err.message,
          });
        }
      }
    }

    // -------- Fallback: POST body --------
    if (!payload && req.method === 'POST' && req.body) {
      payload = req.body;
    }

    // -------- Tidak ada data --------
    if (!payload) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data. Kirim via POST body atau ?l=<token>',
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
