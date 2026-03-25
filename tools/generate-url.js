/**
 * ============================================
 * FinTrack — AES Encryption URL Generator
 * ============================================
 * 
 * Script untuk menggenerate encrypted URL yang bisa dikirim ke dashboard.
 * Menggunakan AES-256-CBC dengan key dari env var FINTRACK_SECRET_KEY
 * 
 * Cara pakai:
 *   set FINTRACK_SECRET_KEY=@SIncem2k && node tools/generate-url.js
 * 
 * Atau kalau sudah di-set di .env:
 *   node --env-file=.env tools/generate-url.js
 * 
 * Dengan custom data:
 *   node --env-file=.env tools/generate-url.js '{"mode":"rekap",...}'
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const BASE_URL = process.env.FINTRACK_BASE_URL || 'https://keuf.vercel.app';

function getSecretKey() {
  const key = process.env.FINTRACK_SECRET_KEY;
  if (!key) {
    console.error('\n[ERROR] FINTRACK_SECRET_KEY belum di-set!');
    console.error('Jalankan dengan:');
    console.error('  node --env-file=.env tools/generate-url.js');
    console.error('  atau');
    console.error('  set FINTRACK_SECRET_KEY=your_key && node tools/generate-url.js\n');
    process.exit(1);
  }
  return key;
}

function deriveKey(passphrase) {
  return crypto.createHash('sha256').update(passphrase).digest();
}

function encrypt(data) {
  const key = deriveKey(getSecretKey());
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonStr = JSON.stringify(data);
  let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // URL-safe base64
  const urlSafe = encrypted
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${iv.toString('hex')}:${urlSafe}`;
}

function decrypt(encoded) {
  const key = deriveKey(getSecretKey());
  const [ivHex, urlSafe] = encoded.split(':');
  const iv = Buffer.from(ivHex, 'hex');

  let base64 = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) base64 += '=';

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(base64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

// --- Sample Data ---
const samplePayload = {
  mode: 'rekap',
  sender: '62895803292514',
  jumlah_transaksi: 3,
  total_pemasukan: 150000,
  total_pengeluaran: 50000,
  saldo_akhir: 100000,
  history: [
    {
      tgl: '2026-03-25 10:00:00',
      ket: 'Gaji freelance',
      nominal: 150000,
      tipe: 'Pemasukan',
    },
    {
      tgl: '2026-03-25 08:00:00',
      ket: 'Beli kopi',
      nominal: 25000,
      tipe: 'Pengeluaran',
    },
    {
      tgl: '2026-03-25 07:30:00',
      ket: 'Bensin motor',
      nominal: 25000,
      tipe: 'Pengeluaran',
    },
  ],
};

// --- Main ---
const customData = process.argv[2];
const payload = customData ? JSON.parse(customData) : samplePayload;
const secretKey = getSecretKey();

console.log('\n===================================================');
console.log('  FinTrack AES-256 URL Generator');
console.log(`  Key: ${secretKey.substring(0, 3)}${'*'.repeat(secretKey.length - 3)}`);
console.log(`  Base URL: ${BASE_URL}`);
console.log('===================================================\n');

console.log('Data Asli:');
console.log(JSON.stringify(payload, null, 2));

const encrypted = encrypt(payload);
console.log('\nEncrypted Token:');
console.log(encrypted);

const fullUrl = `${BASE_URL}/?l=${encodeURIComponent(encrypted)}`;
console.log('\nFull URL:');
console.log(fullUrl);

// Verify by decrypting
const verified = decrypt(encrypted);
console.log('\nVerifikasi Dekripsi:');
console.log(JSON.stringify(verified, null, 2));

console.log('\n---------------------------------------------------');
console.log('Gunakan URL di atas untuk mengirim data ke dashboard');
console.log('Browser akan otomatis ingest data dan menampilkannya');
console.log('---------------------------------------------------\n');
