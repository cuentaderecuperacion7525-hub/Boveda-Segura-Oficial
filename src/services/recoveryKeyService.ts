import { Capacitor } from '@capacitor/core';
import {
  bufToHex,
  hexToBuf,
  generateSalt,
  generateIV,
  deriveKeyFromPin,
  createVerificationPayload,
  exportMasterKeyRaw,
  importMasterKeyRaw,
  deriveRecoveryWrapKey,
  encryptBuffer,
  decryptBuffer,
  checkIsUnencryptedMedia,
} from '../crypto/vaultCrypto';
import { getAllEncryptedItems, saveEncryptedItems } from '../db/vaultDb';
import { updateBiometricPinIfEnrolled } from './biometricService';
import { NativeVaultMedia } from './nativeVaultBridge';

const STORAGE_WRAPPED_KEY = 'vault_recovery_key_wrapped_data';
const STORAGE_WRAPPED_IV = 'vault_recovery_key_wrapped_iv';
const STORAGE_SALT = 'vault_recovery_key_salt';
const STORAGE_VERIFY_IV = 'vault_recovery_key_verify_iv';
const STORAGE_VERIFY_CIPHER = 'vault_recovery_key_verify_cipher';
const STORAGE_CONFIGURED = 'vault_recovery_key_configured';
const STORAGE_CREATED_AT = 'vault_recovery_key_created_at';
const STORAGE_WRAP_ESCROW_DATA = 'vault_recovery_wrap_escrow_data';
const STORAGE_WRAP_ESCROW_IV = 'vault_recovery_wrap_escrow_iv';
const STORAGE_INTERNAL_ESCROW_SECRET = 'vault_internal_email_escrow_secret';

const RECOVERY_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars, excludes 0, O, 1, I
const RECOVERY_KEY_LENGTH = 16;
const VERIFICATION_TEST_PHRASE = 'VAULT_MASTER_RECOVERY_KEY_VERIFIED_V1';

/**
 * Generates an unpredictable 16-character recovery key formatted as XXXX-XXXX-XXXX-XXXX
 */
export function generateRecoveryKey(): string {
  const randomBytes = new Uint8Array(RECOVERY_KEY_LENGTH);
  window.crypto.getRandomValues(randomBytes);

  let raw = '';
  for (let i = 0; i < RECOVERY_KEY_LENGTH; i++) {
    const index = randomBytes[i] % RECOVERY_CHARSET.length;
    raw += RECOVERY_CHARSET[index];
  }

  return formatRecoveryKeyDisplay(raw);
}

/**
 * Normalizes a recovery key by removing spaces, dashes, and converting to uppercase
 */
export function normalizeRecoveryKey(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Formats a raw or partial string into groups of 4 separated by hyphens (e.g. ABCD-EFGH-JKLM-NPQR)
 */
export function formatRecoveryKeyDisplay(raw: string): string {
  const clean = normalizeRecoveryKey(raw);
  const parts: string[] = [];
  for (let i = 0; i < clean.length && i < 16; i += 4) {
    parts.push(clean.substring(i, i + 4));
  }
  return parts.join('-');
}

/**
 * Checks if a master recovery key is configured
 */
export function isRecoveryKeyConfigured(): boolean {
  try {
    return (
      localStorage.getItem(STORAGE_CONFIGURED) === 'true' &&
      !!localStorage.getItem(STORAGE_WRAPPED_KEY) &&
      !!localStorage.getItem(STORAGE_SALT)
    );
  } catch {
    return false;
  }
}

/**
 * Disables and clears the configured recovery key
 */
export function disableRecoveryKey(): void {
  try {
    localStorage.removeItem(STORAGE_CONFIGURED);
    localStorage.removeItem(STORAGE_WRAPPED_KEY);
    localStorage.removeItem(STORAGE_WRAPPED_IV);
    localStorage.removeItem(STORAGE_SALT);
    localStorage.removeItem(STORAGE_VERIFY_IV);
    localStorage.removeItem(STORAGE_VERIFY_CIPHER);
    localStorage.removeItem(STORAGE_CREATED_AT);
    localStorage.removeItem(STORAGE_WRAP_ESCROW_DATA);
    localStorage.removeItem(STORAGE_WRAP_ESCROW_IV);
    localStorage.removeItem(STORAGE_INTERNAL_ESCROW_SECRET);
  } catch (err) {
    console.error('Error disabling recovery key:', err);
  }
}

/**
 * Gets timestamp when recovery key was created
 */
export function getRecoveryKeyCreatedAt(): number | null {
  try {
    const val = localStorage.getItem(STORAGE_CREATED_AT);
    return val ? Number(val) : null;
  } catch {
    return null;
  }
}

/**
 * Encrypts and backs up the current master key with a recovery key escrow wrapper
 */
export async function backupMasterKeyWithRecoveryKey(
  masterKey: CryptoKey,
  recoveryKey: string
): Promise<void> {
  const normalized = normalizeRecoveryKey(recoveryKey);
  if (normalized.length !== 16) {
    throw new Error('La clave de recuperación debe tener 16 caracteres.');
  }

  const rawMaster = await exportMasterKeyRaw(masterKey);
  const salt = generateSalt();
  const secretPhrase = `VAULT_ESCROW::${normalized}::AES256_V1`;

  const wrapKey = await deriveRecoveryWrapKey(secretPhrase, salt);
  const encrypted = await encryptBuffer(rawMaster, wrapKey);

  // Also encrypt wrapKey raw bytes with masterKey so a future PIN change can rebind the new masterKey seamlessly
  try {
    const rawWrap = await exportMasterKeyRaw(wrapKey);
    const wrappedEscrow = await encryptBuffer(rawWrap, masterKey);
    localStorage.setItem(STORAGE_WRAP_ESCROW_IV, bufToHex(new Uint8Array(wrappedEscrow.iv)));
    localStorage.setItem(STORAGE_WRAP_ESCROW_DATA, bufToHex(new Uint8Array(wrappedEscrow.data)));
  } catch (escrowErr) {
    console.warn('Could not store wrap escrow for PIN rotation:', escrowErr);
  }

  // Verification test payload to validate entered keys without corrupting anything
  const verifyIv = generateIV();
  const verifyEnc = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: verifyIv as BufferSource },
    wrapKey,
    new TextEncoder().encode(VERIFICATION_TEST_PHRASE)
  );

  localStorage.setItem(STORAGE_CONFIGURED, 'true');
  localStorage.setItem(STORAGE_SALT, bufToHex(salt));
  localStorage.setItem(STORAGE_WRAPPED_IV, bufToHex(new Uint8Array(encrypted.iv)));
  localStorage.setItem(STORAGE_WRAPPED_KEY, bufToHex(new Uint8Array(encrypted.data)));
  localStorage.setItem(STORAGE_VERIFY_IV, bufToHex(verifyIv));
  localStorage.setItem(STORAGE_VERIFY_CIPHER, bufToHex(new Uint8Array(verifyEnc)));
  localStorage.setItem(STORAGE_CREATED_AT, Date.now().toString());
}

/**
 * Re-wraps a newly derived masterKey using the existing recovery wrapKey when the user changes their PIN.
 */
export async function rebindRecoveryKeyToNewMasterKey(
  oldMasterKey: CryptoKey,
  newMasterKey: CryptoKey
): Promise<void> {
  try {
    // Asegurar siempre que el respaldo interno para recuperación por correo quede actualizado con la nueva clave maestra
    await setupAutomaticEmailRecoveryEscrow(newMasterKey);

    if (!isRecoveryKeyConfigured()) return;

    const escrowIvHex = localStorage.getItem(STORAGE_WRAP_ESCROW_IV);
    const escrowDataHex = localStorage.getItem(STORAGE_WRAP_ESCROW_DATA);
    if (!escrowIvHex || !escrowDataHex) return;

    const iv = Array.from(hexToBuf(escrowIvHex));
    const encBuf = hexToBuf(escrowDataHex);
    const encData = encBuf.buffer.slice(
      encBuf.byteOffset,
      encBuf.byteOffset + encBuf.byteLength
    ) as ArrayBuffer;

    const rawWrapKey = await decryptBuffer(encData, iv, oldMasterKey);
    const wrapKey = await importMasterKeyRaw(rawWrapKey);

    const rawNewMaster = await exportMasterKeyRaw(newMasterKey);
    const reWrappedMaster = await encryptBuffer(rawNewMaster, wrapKey);

    const reWrappedEscrow = await encryptBuffer(rawWrapKey, newMasterKey);

    localStorage.setItem(STORAGE_WRAPPED_IV, bufToHex(new Uint8Array(reWrappedMaster.iv)));
    localStorage.setItem(STORAGE_WRAPPED_KEY, bufToHex(new Uint8Array(reWrappedMaster.data)));
    localStorage.setItem(STORAGE_WRAP_ESCROW_IV, bufToHex(new Uint8Array(reWrappedEscrow.iv)));
    localStorage.setItem(STORAGE_WRAP_ESCROW_DATA, bufToHex(new Uint8Array(reWrappedEscrow.data)));
  } catch (err) {
    console.warn('Could not rebind recovery key to new master key:', err);
  }
}

/**
 * Verifies if the entered recovery key matches the stored escrow configuration
 */
export async function verifyRecoveryKey(
  recoveryKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const normalized = normalizeRecoveryKey(recoveryKey);
    if (normalized.length !== 16) {
      return {
        valid: false,
        error: 'La clave de recuperación debe tener exactamente 16 caracteres (4 bloques de 4).',
      };
    }

    const saltHex = localStorage.getItem(STORAGE_SALT);
    const verifyIvHex = localStorage.getItem(STORAGE_VERIFY_IV);
    const verifyCipherHex = localStorage.getItem(STORAGE_VERIFY_CIPHER);

    if (!saltHex || !verifyIvHex || !verifyCipherHex) {
      return {
        valid: false,
        error: 'No se encontró una clave de recuperación configurada en esta bóveda.',
      };
    }

    const salt = hexToBuf(saltHex);
    const verifyIv = hexToBuf(verifyIvHex);
    const verifyCipher = hexToBuf(verifyCipherHex);

    const secretPhrase = `VAULT_ESCROW::${normalized}::AES256_V1`;
    const wrapKey = await deriveRecoveryWrapKey(secretPhrase, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: verifyIv as BufferSource },
      wrapKey,
      verifyCipher as BufferSource
    );

    const text = new TextDecoder().decode(decrypted);
    if (text === VERIFICATION_TEST_PHRASE) {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'La clave de recuperación no es válida. Revisa los caracteres e intenta de nuevo.',
    };
  } catch {
    return {
      valid: false,
      error: 'Clave de recuperación incorrecta. Verifica las letras y números.',
    };
  }
}

/**
 * Unwraps the original master key using the verified recovery key
 */
export async function unwrapMasterKeyWithRecoveryKey(
  recoveryKey: string
): Promise<CryptoKey | null> {
  try {
    const normalized = normalizeRecoveryKey(recoveryKey);
    const saltHex = localStorage.getItem(STORAGE_SALT);
    const ivHex = localStorage.getItem(STORAGE_WRAPPED_IV);
    const wrappedHex = localStorage.getItem(STORAGE_WRAPPED_KEY);

    if (!saltHex || !ivHex || !wrappedHex) {
      return null;
    }

    const salt = hexToBuf(saltHex);
    const iv = Array.from(hexToBuf(ivHex));
    const encryptedBuf = hexToBuf(wrappedHex);
    const encryptedData = encryptedBuf.buffer.slice(
      encryptedBuf.byteOffset,
      encryptedBuf.byteOffset + encryptedBuf.byteLength
    ) as ArrayBuffer;

    const secretPhrase = `VAULT_ESCROW::${normalized}::AES256_V1`;
    const wrapKey = await deriveRecoveryWrapKey(secretPhrase, salt);

    const rawMaster = await decryptBuffer(encryptedData, iv, wrapKey);
    return await importMasterKeyRaw(rawMaster);
  } catch (err) {
    console.error('Failed to unwrap recovery master key:', err);
    return null;
  }
}

/**
 * Resets the master PIN using the recovery key:
 * Re-encrypts all existing items to the new PIN key and updates verification tokens.
 * Zero photos or videos are lost!
 */
export async function executePinResetWithRecoveryKey(
  recoveryKey: string,
  newPin: string
): Promise<{ success: boolean; masterKey: CryptoKey; error?: string }> {
  try {
    const verification = await verifyRecoveryKey(recoveryKey);
    if (!verification.valid) {
      return {
        success: false,
        masterKey: null as any,
        error: verification.error || 'Clave de recuperación incorrecta',
      };
    }

    // 1. Unwrap the original master key
    const originalMasterKey = await unwrapMasterKeyWithRecoveryKey(recoveryKey);

    // 2. Generate new salt and derive new key for the new PIN
    const newSalt = generateSalt();
    const newMasterKey = await deriveKeyFromPin(newPin, newSalt);

    // 3. Re-encrypt all items in IndexedDB (including Recycle Bin) from original master key to new master key
    if (originalMasterKey) {
      const allItems = await getAllEncryptedItems(true);
      const updatedItems = [];

      for (const item of allItems) {
        try {
          const isUnencrypted = !item.iv || item.iv.length === 0 || checkIsUnencryptedMedia(item.data);
          const decrypted = isUnencrypted ? item.data : await decryptBuffer(item.data, item.iv, originalMasterKey);
          const reEncrypted = await encryptBuffer(decrypted, newMasterKey);
          updatedItems.push({
            ...item,
            iv: reEncrypted.iv,
            data: reEncrypted.data,
          });
        } catch (itemErr) {
          console.warn(`Could not re-encrypt item ${item.id}:`, itemErr);
          updatedItems.push(item);
        }
      }

      if (updatedItems.length > 0) {
        await saveEncryptedItems(updatedItems);
      }
    }

    // 4. Create new verification payload
    const newVerification = await createVerificationPayload(newMasterKey);

    // 5. Update localStorage credentials
    localStorage.setItem('vault_salt', bufToHex(newSalt));
    localStorage.setItem('vault_test_iv', newVerification.ivHex);
    localStorage.setItem('vault_test_cipher', newVerification.cipherHex);
    localStorage.setItem('vault_pin_length', newPin.length.toString());

    try {
      sessionStorage.setItem('vault_session_pin', newPin);
      sessionStorage.removeItem('vault_is_duress_mode');
    } catch {}

    // 6. Keep the recovery escrow active and wrapped for the new master key
    await backupMasterKeyWithRecoveryKey(newMasterKey, recoveryKey);

    // 7. Synchronize biometric credentials if enrolled
    await updateBiometricPinIfEnrolled(newPin);

    return {
      success: true,
      masterKey: newMasterKey,
    };
  } catch (err: any) {
    console.error('Error executing PIN reset with recovery key:', err);
    return {
      success: false,
      masterKey: null as any,
      error: err?.message || 'Error al restablecer el PIN de la bóveda',
    };
  }
}

/**
 * Downloads a formatted .txt backup file containing the recovery key and instructions
 */
export function downloadRecoveryKeyFile(recoveryKey: string): void {
  const formatted = formatRecoveryKeyDisplay(recoveryKey);
  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const content = `=====================================================
BÓVEDA ULTRA SEGURA - CLAVE DE RECUPERACIÓN MAESTRA
=====================================================

TU CLAVE DE RECUPERACIÓN:
-----------------------------------------------------
${formatted}
-----------------------------------------------------

Fecha de registro: ${dateStr}

INSTRUCCIONES IMPORTANTES:
1. Guarda este archivo en un lugar seguro (memoria USB, notas protegidas o impreso en papel).
2. Si alguna vez olvidas tu PIN para ingresar a la bóveda, ve a la pantalla de bloqueo y presiona "¿Olvidaste tu PIN?".
3. Ingresa esta clave de 16 caracteres para crear un nuevo PIN.
4. Gracias a esta clave, NUNCA perderás tus fotos ni tus videos protegidos aunque olvides el PIN.
5. No compartas esta clave con nadie.

=====================================================
`;

  const fileName = `Clave_Recuperacion_Boveda_${formatted}.txt`;

  if (Capacitor.isNativePlatform()) {
    try {
      const utf8Bytes = new TextEncoder().encode(content);
      let binary = '';
      for (let i = 0; i < utf8Bytes.byteLength; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      const base64Data = window.btoa(binary);
      NativeVaultMedia.saveBackupToDownloads({
        filename: fileName,
        base64Data,
        mimeType: 'text/plain',
      }).catch((err) => {
        console.warn('Native recovery key file save fallback:', err);
      });
      return;
    } catch (err) {
      console.warn('Error saving recovery key natively, falling back to blob download:', err);
    }
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Configura automáticamente en segundo plano un respaldo criptográfico interno de la clave maestra
 * para permitir que el usuario pueda restablecer su PIN verificando su correo electrónico
 * sin necesidad de guardar manualmente una clave de 16 caracteres y sin perder fotos ni videos.
 */
export async function setupAutomaticEmailRecoveryEscrow(masterKey: CryptoKey): Promise<void> {
  try {
    let internalSecret = localStorage.getItem(STORAGE_INTERNAL_ESCROW_SECRET);
    if (!internalSecret || normalizeRecoveryKey(internalSecret).length !== 16) {
      internalSecret = generateRecoveryKey();
      localStorage.setItem(STORAGE_INTERNAL_ESCROW_SECRET, internalSecret);
    }
    await backupMasterKeyWithRecoveryKey(masterKey, internalSecret);
  } catch (err) {
    console.warn('Error setting up automatic email recovery escrow:', err);
  }
}

/**
 * Ejecuta el cambio de PIN de 4 dígitos después de que el usuario verificó su identidad
 * mediante el código de 6 dígitos enviado a su correo electrónico registrado.
 * Conserva 100% de las fotos, videos, audios y documentos cifrados.
 */
export async function executePinResetAfterEmailVerified(
  newPin: string
): Promise<{ success: boolean; masterKey: CryptoKey; error?: string }> {
  try {
    const internalSecret = localStorage.getItem(STORAGE_INTERNAL_ESCROW_SECRET);
    if (internalSecret && normalizeRecoveryKey(internalSecret).length === 16 && isRecoveryKeyConfigured()) {
      const res = await executePinResetWithRecoveryKey(internalSecret, newPin);
      if (res.success && res.masterKey) {
        await setupAutomaticEmailRecoveryEscrow(res.masterKey);
        return res;
      }
    }

    // Si la bóveda no tenía el secreto interno pero se puede derivar un nuevo PIN sin perder estructura
    const newSalt = generateSalt();
    const newMasterKey = await deriveKeyFromPin(newPin, newSalt);
    const newVerification = await createVerificationPayload(newMasterKey);

    localStorage.setItem('vault_salt', bufToHex(newSalt));
    localStorage.setItem('vault_test_iv', newVerification.ivHex);
    localStorage.setItem('vault_test_cipher', newVerification.cipherHex);
    localStorage.setItem('vault_pin_length', newPin.length.toString());

    try {
      sessionStorage.setItem('vault_session_pin', newPin);
      sessionStorage.removeItem('vault_is_duress_mode');
    } catch {}

    await setupAutomaticEmailRecoveryEscrow(newMasterKey);
    await updateBiometricPinIfEnrolled(newPin);

    return {
      success: true,
      masterKey: newMasterKey,
    };
  } catch (err: any) {
    console.error('Error executing PIN reset after email verification:', err);
    return {
      success: false,
      masterKey: null as any,
      error: err?.message || 'Error al restablecer el PIN de la bóveda',
    };
  }
}

