import { loadStoredData, deleteStoredData } from './lib/storage.js';

/**
 * GET  /api/data — Mengembalikan seluruh data transaksi
 * DELETE /api/data — Menghapus semua data transaksi
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const data = loadStoredData();
    if (!data) {
      return res.status(200).json({ success: true, data: null });
    }
    return res.status(200).json({ success: true, data });
  }

  if (req.method === 'DELETE') {
    try {
      deleteStoredData();
      return res.status(200).json({ success: true, message: 'Data berhasil dihapus' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
