/**
 * Servicio independiente para la "Carpeta con PIN" (PIN extra de 4 dígitos)
 * Presente en todas las categorías: Fotos, Videos, Audios, Aplicaciones y Documentos.
 * No modifica ningún archivo protegido (vaultCrypto.ts ni vaultDb.ts).
 */

export const EXTRA_PIN_FOLDER_NAME = 'Carpeta con PIN';
const EXTRA_PIN_SALT_KEY = 'vault_extra_pin_salt_v1';
const EXTRA_PIN_HASH_KEY = 'vault_extra_pin_hash_v1';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function computePinHash(pin: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const payload = encoder.encode(`boveda_extra_pin_v1:${saltHex}:${pin.trim()}`);
  const digest = await crypto.subtle.digest('SHA-256', payload);
  return bytesToHex(new Uint8Array(digest));
}

export function isExtraPinAlbum(album?: string | null): boolean {
  if (!album) return false;
  return album === EXTRA_PIN_FOLDER_NAME || album === '__VAULT_EXTRA_PIN__';
}

export function isExtraPinConfigured(): boolean {
  try {
    const salt = localStorage.getItem(EXTRA_PIN_SALT_KEY);
    const hash = localStorage.getItem(EXTRA_PIN_HASH_KEY);
    return Boolean(salt && hash);
  } catch {
    return false;
  }
}

export async function setupExtraPin(pin: string): Promise<void> {
  const cleanPin = pin.trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    throw new Error('El PIN extra debe ser de 4 dígitos numéricos.');
  }
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const saltHex = bytesToHex(randomBytes);
  const hashHex = await computePinHash(cleanPin, saltHex);

  localStorage.setItem(EXTRA_PIN_SALT_KEY, saltHex);
  localStorage.setItem(EXTRA_PIN_HASH_KEY, hashHex);
  window.dispatchEvent(new CustomEvent('vault_extra_pin_updated'));
}

export async function verifyExtraPin(pin: string): Promise<boolean> {
  try {
    const saltHex = localStorage.getItem(EXTRA_PIN_SALT_KEY);
    const storedHash = localStorage.getItem(EXTRA_PIN_HASH_KEY);
    if (!saltHex || !storedHash) return false;
    const candidateHash = await computePinHash(pin.trim(), saltHex);
    return candidateHash === storedHash;
  } catch {
    return false;
  }
}

export function exportExtraPinConfig(): { salt: string; hash: string } | null {
  try {
    const salt = localStorage.getItem(EXTRA_PIN_SALT_KEY);
    const hash = localStorage.getItem(EXTRA_PIN_HASH_KEY);
    if (salt && hash) {
      return { salt, hash };
    }
  } catch {}
  return null;
}

export function importExtraPinConfig(config: { salt?: string; hash?: string } | null | undefined): void {
  if (!config || !config.salt || !config.hash) return;
  try {
    localStorage.setItem(EXTRA_PIN_SALT_KEY, config.salt);
    localStorage.setItem(EXTRA_PIN_HASH_KEY, config.hash);
    window.dispatchEvent(new CustomEvent('vault_extra_pin_updated'));
  } catch {}
}
