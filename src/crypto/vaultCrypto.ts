/**
 * =========================================================================
 * CÓDIGO CRÍTICO PROTEGIDO - NO MODIFICAR NI ALTERAR
 * Motor criptográfico de Bóveda Segura (PBKDF2 + AES-GCM 256-bit).
 * Prohibido modificar o alterar este archivo sin autorización explícita.
 * =========================================================================
 * Cryptographic engine for Bóveda Segura using Web Crypto API.
 * Uses PBKDF2 (100,000 rounds, SHA-256) + AES-GCM (256-bit).
 */

export const TEST_VERIFICATION_STRING = 'VAULT_VERIFY_KEY_OK';

export function bufToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuf(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) return new Uint8Array(0);
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}

/**
 * Derives a 256-bit AES-GCM key from user PIN and cryptographic salt
 */
export async function deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Exports raw key bytes for backup or recovery escrow wrapping
 */
export async function exportMasterKeyRaw(key: CryptoKey): Promise<ArrayBuffer> {
  return await window.crypto.subtle.exportKey('raw', key);
}

/**
 * Imports raw 256-bit AES-GCM master key
 */
export async function importMasterKeyRaw(rawBytes: ArrayBuffer): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    'raw',
    rawBytes,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derives a key for wrapping the master key for email recovery escrow
 */
export async function deriveRecoveryWrapKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 50000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Creates random 16-byte salt
 */
export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Creates random 12-byte IV for AES-GCM
 */
export function generateIV(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Encrypts an ArrayBuffer payload using AES-GCM
 */
export async function encryptBuffer(
  buffer: ArrayBuffer,
  key: CryptoKey
): Promise<{ iv: number[]; data: ArrayBuffer }> {
  const iv = generateIV();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    buffer
  );

  return {
    iv: Array.from(iv),
    data: encrypted,
  };
}

/**
 * Decrypts an ArrayBuffer using AES-GCM and stored IV
 */
export async function decryptBuffer(
  encryptedData: ArrayBuffer,
  ivArray: number[],
  key: CryptoKey
): Promise<ArrayBuffer> {
  const iv = new Uint8Array(ivArray);
  return await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encryptedData
  );
}

/**
 * Creates verification token for verifying PIN validity during unlock
 */
export async function createVerificationPayload(key: CryptoKey): Promise<{ ivHex: string; cipherHex: string }> {
  const iv = generateIV();
  const testBytes = new TextEncoder().encode(TEST_VERIFICATION_STRING);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    testBytes
  );

  return {
    ivHex: bufToHex(iv),
    cipherHex: bufToHex(new Uint8Array(encrypted)),
  };
}

/**
 * Verifies if a given CryptoKey correctly decrypts the verification token
 */
export async function verifyKey(
  key: CryptoKey,
  ivHex: string,
  cipherHex: string
): Promise<boolean> {
  try {
    const iv = hexToBuf(ivHex);
    const cipher = hexToBuf(cipherHex);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      cipher as BufferSource
    );
    const str = new TextDecoder().decode(decrypted);
    return str === TEST_VERIFICATION_STRING;
  } catch {
    return false;
  }
}

/**
 * Stores the Duress PIN securely using PBKDF2 + AES-GCM verification tokens instead of plaintext
 */
export async function saveDuressPinHash(pin: string): Promise<void> {
  const salt = generateSalt();
  const key = await deriveKeyFromPin(pin, salt);
  const payload = await createVerificationPayload(key);
  localStorage.setItem('vault_duress_salt', bufToHex(salt));
  localStorage.setItem('vault_duress_iv', payload.ivHex);
  localStorage.setItem('vault_duress_cipher', payload.cipherHex);
  localStorage.setItem('vault_duress_pin_active', 'true');
  localStorage.removeItem('vault_duress_pin');
}

/**
 * Clears all Duress PIN tokens and plaintext legacy key
 */
export function clearDuressPinHash(): void {
  localStorage.setItem('vault_duress_pin_active', 'false');
  localStorage.removeItem('vault_duress_pin');
  localStorage.removeItem('vault_duress_salt');
  localStorage.removeItem('vault_duress_iv');
  localStorage.removeItem('vault_duress_cipher');
}

/**
 * Verifies if an entered PIN matches the configured Duress PIN (supports transparent migration from legacy plaintext)
 */
export async function verifyDuressPinHash(pinToVerify: string): Promise<boolean> {
  try {
    if (localStorage.getItem('vault_duress_pin_active') !== 'true') {
      return false;
    }

    // Legacy migration check if a plaintext duress PIN still exists
    const legacyPlain = localStorage.getItem('vault_duress_pin');
    if (legacyPlain) {
      await saveDuressPinHash(legacyPlain);
      return pinToVerify === legacyPlain;
    }

    const saltHex = localStorage.getItem('vault_duress_salt');
    const ivHex = localStorage.getItem('vault_duress_iv');
    const cipherHex = localStorage.getItem('vault_duress_cipher');

    if (!saltHex || !ivHex || !cipherHex) {
      return false;
    }

    const salt = hexToBuf(saltHex);
    const key = await deriveKeyFromPin(pinToVerify, salt);
    return await verifyKey(key, ivHex, cipherHex);
  } catch {
    return false;
  }
}

/**
 * Checks if a given buffer starts with known magic bytes of unencrypted media (images, videos, audio, PDF, archives, docs)
 */
export function checkIsUnencryptedMedia(buffer: ArrayBuffer | Uint8Array | null | undefined): boolean {
  if (!buffer) return false;
  const byteLen = buffer instanceof Uint8Array ? buffer.byteLength : buffer.byteLength;
  if (byteLen < 2) return false;

  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer, 0, Math.min(byteLen, 32));

  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  // GIF: 47 49 46 38 ('GIF8')
  if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true;
  // WEBP / RIFF (WAV, AVI, WEBP): 52 49 46 46 ('RIFF')
  if (bytes.length >= 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return true;
  // MP4 / MOV / 3GP / M4A / QuickTime: 'ftyp', 'moov', 'mdat'
  if (bytes.length >= 8) {
    const s = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (s === 'ftyp' || s === 'moov' || s === 'mdat' || s === 'free' || s === 'skip' || s === 'wide') return true;
  }
  // PDF: 25 50 44 46 ('%PDF')
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return true;
  // MP3: 'ID3' (49 44 33) or sync word FF FB / FF F3 / FF F2
  if (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return true;
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] === 0xfb || bytes[1] === 0xf3 || bytes[1] === 0xf2)) return true;
  // WebM / Matroska / MKV: 1A 45 DF A3
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return true;
  // ZIP / APK / DOCX / XLSX / PPTX / JAR: 50 4B 03 04 / 50 4B 05 06 / 50 4B 07 08 ('PK..')
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)) return true;
  // RAR: 52 61 72 21 ('Rar!')
  if (bytes.length >= 4 && bytes[0] === 0x52 && bytes[1] === 0x61 && bytes[2] === 0x72 && bytes[3] === 0x21) return true;
  // 7Z: 37 7A BC AF 27 1C ('7z..')
  if (bytes.length >= 6 && bytes[0] === 0x37 && bytes[1] === 0x7a && bytes[2] === 0xbc && bytes[3] === 0xaf) return true;
  // GZIP: 1F 8B
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) return true;
  // OGG: 4F 67 67 53 ('OggS')
  if (bytes.length >= 4 && bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return true;
  // FLAC: 66 4C 61 43 ('fLaC')
  if (bytes.length >= 4 && bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) return true;
  // BMP: 42 4D ('BM')
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) return true;
  // TIFF: 49 49 2A 00 (little endian) or 4D 4D 00 2A (big endian)
  if (bytes.length >= 4 && ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) || (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a))) return true;

  // JSON or XML text
  if (bytes.length >= 1 && (bytes[0] === 0x7b || bytes[0] === 0x5b || bytes[0] === 0x3c)) return true;

  return false;
}

