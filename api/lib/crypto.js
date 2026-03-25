import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

/**
 * Get secret key from environment variable.
 * Fallback disediakan untuk development, tapi di production WAJIB set env var.
 */
function getSecretKey() {
  const key = process.env.FINTRACK_SECRET_KEY;
  if (!key) {
    console.warn('[FinTrack] WARNING: FINTRACK_SECRET_KEY belum di-set di environment!');
    throw new Error('FINTRACK_SECRET_KEY environment variable is required');
  }
  return key;
}

/**
 * Derive a 32-byte key from the secret passphrase using SHA-256.
 */
function deriveKey(passphrase) {
  return crypto.createHash('sha256').update(passphrase).digest();
}

/**
 * Encrypt a JSON object into a URL-safe base64 string.
 * Format: iv(hex):encrypted(base64url)
 */
export function encrypt(data) {
  const key = deriveKey(getSecretKey());
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonStr = JSON.stringify(data);
  let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Make base64 URL-safe
  const urlSafeEncrypted = encrypted
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const ivHex = iv.toString('hex');

  return `${ivHex}:${urlSafeEncrypted}`;
}

/**
 * Decrypt a URL-safe base64 string back into a JSON object.
 */
export function decrypt(encoded) {
  const key = deriveKey(getSecretKey());

  const [ivHex, urlSafeEncrypted] = encoded.split(':');
  if (!ivHex || !urlSafeEncrypted) {
    throw new Error('Format enkripsi tidak valid. Harus berformat iv:data');
  }

  const iv = Buffer.from(ivHex, 'hex');

  // Restore standard base64
  let base64 = urlSafeEncrypted.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(base64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}
