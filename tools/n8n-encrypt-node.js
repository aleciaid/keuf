/**
 * ============================================
 * FinTrack — n8n Code Node
 * Encode data ke Base64 + Key @SIncem2k
 * ============================================
 * 
 * Format: base64( KEY|JSON_DATA )
 * Server akan decode base64, validasi key, dan proses data.
 * 
 * Tempel script ini di n8n Code Node (JavaScript).
 */

// ──────── KONFIGURASI ────────
const SECRET_KEY = '@SIncem2k';
const BASE_URL = 'https://keuf.vercel.app';

// ──────── PROSES DATA ────────
const items = $input.all();
const results = [];

for (const item of items) {
  const payload = item.json;

  // Format: KEY|JSON_STRING → base64
  const raw = SECRET_KEY + '|' + JSON.stringify(payload);
  const encoded = Buffer.from(raw, 'utf-8').toString('base64');

  // URL-safe base64
  const urlSafe = encoded
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const fullUrl = `${BASE_URL}/?l=${urlSafe}`;

  results.push({
    json: {
      url: fullUrl,
      token: urlSafe,
      original_data: payload,
      timestamp: new Date().toISOString(),
    }
  });
}

return results;
