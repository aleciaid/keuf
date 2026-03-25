import { loadStoredData } from './lib/storage.js';

/**
 * GET /api/export — Download data sebagai file JSON
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const data = loadStoredData();
  if (!data) {
    return res.status(404).json({ success: false, message: 'Belum ada data' });
  }

  const filename = `fintrack_backup_${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(JSON.stringify(data, null, 2));
}
