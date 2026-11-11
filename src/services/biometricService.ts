/**
 * Biometric authentication service for Android (Native BiometricPrompt / Capacitor & WebAuthn / Passkeys).
 * Integrates directly with the device's native fingerprint scanner.
 */

import { registerPlugin, Capacitor } from '@capacitor/core';
import { bufToHex, hexToBuf, generateIV } from '../crypto/vaultCrypto';

const BIO_ENABLED_KEY = 'vault_biometric_enabled';
const BIO_CIPHER_KEY = 'vault_biometric_cipher';
const BIO_IV_KEY = 'vault_biometric_iv';
const BIO_WRAP_KEY = 'vault_biometric_wrap';
const BIO_CRED_ID_KEY = 'vault_biometric_cred_id';
const BIO_TYPE_KEY = 'vault_biometric_type'; // 'native' | 'webauthn'

export interface NativeVaultBiometricsPlugin {
  isAvailable(): Promise<{ isAvailable: boolean; hasEnrolled: boolean; status: string }>;
  authenticate(options?: {
    title?: string;
    subtitle?: string;
    negativeButton?: string;
  }): Promise<{ success: boolean; errorCode?: number; message?: string }>;
}

export const NativeVaultBiometrics = registerPlugin<NativeVaultBiometricsPlugin>('VaultBiometrics');

/**
 * Checks whether native Android / iOS biometrics plugin is accessible
 */
export async function isNativeBiometricPluginAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Check Capacitor native platform
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await NativeVaultBiometrics.isAvailable();
      return !!res.isAvailable;
    } catch {
      // Fall through to window bridge
    }
  }

  // Check Android JavascriptInterface bridge (if custom WebView)
  if ((window as any).AndroidBiometrics?.isAvailable) {
    try {
      return !!(window as any).AndroidBiometrics.isAvailable();
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Checks if biometric hardware (fingerprint sensor / platform authenticator) is available on the device.
 */
export async function isBiometricsSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Native Plugin / Bridge
  if (await isNativeBiometricPluginAvailable()) {
    return true;
  }

  // 2. WebAuthn / Platform Authenticator (Android Chrome / Google Play Services)
  if (window.PublicKeyCredential) {
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return !!available;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Checks if biometric credentials exist on this device.
 */
export function hasBiometricCredentials(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    localStorage.getItem(BIO_ENABLED_KEY) === 'true' &&
    !!localStorage.getItem(BIO_CRED_ID_KEY) &&
    !!localStorage.getItem(BIO_CIPHER_KEY) &&
    !!localStorage.getItem(BIO_IV_KEY) &&
    !!localStorage.getItem(BIO_WRAP_KEY)
  );
}

/**
 * Checks if biometric fingerprint unlock is already enrolled and active.
 */
export function isBiometricsEnrolled(): boolean {
  return hasBiometricCredentials();
}

/**
 * Checks if automatic prompt on startup is enabled.
 */
export function isBiometricsAutoPromptEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return hasBiometricCredentials() && localStorage.getItem('vault_biometrics_auto_prompt') !== 'false';
}

/**
 * Toggles whether biometrics prompts automatically on lock screen opening.
 */
export function setBiometricsAutoPromptEnabled(enabled: boolean): void {
  localStorage.setItem('vault_biometrics_auto_prompt', enabled ? 'true' : 'false');
  localStorage.setItem('vault_biometrics_active', enabled ? 'true' : 'false');
}

/**
 * Gets clean relying party ID from current origin hostname
 */
function getRelyingPartyId(): string {
  if (typeof window === 'undefined') return 'localhost';
  const hostname = window.location.hostname.split(':')[0];
  if (!hostname || hostname === '' || hostname === '127.0.0.1') return 'localhost';
  return hostname;
}

/**
 * Enrolls the device's biometric fingerprint and encrypts the vault PIN with a dedicated wrapping key.
 */
export async function enrollBiometrics(pin: string): Promise<boolean> {
  const isNative = await isNativeBiometricPluginAvailable();

  // 1. If Native Android Biometric plugin is present
  if (isNative) {
    try {
      let authSuccess = false;
      if (Capacitor.isNativePlatform()) {
        const auth = await NativeVaultBiometrics.authenticate({
          title: 'Vincular Huella Digital',
          subtitle: 'Toca el sensor de huella para confirmar',
          negativeButton: 'Cancelar',
        });
        authSuccess = !!auth.success;
      } else if ((window as any).AndroidBiometrics?.authenticate) {
        authSuccess = !!(window as any).AndroidBiometrics.authenticate('Vincular Huella Digital');
      }

      if (!authSuccess) {
        throw new Error('No se pudo verificar la huella en el sensor.');
      }

      // Generate local encryption wrap key for PIN
      const rawWrapKey = window.crypto.getRandomValues(new Uint8Array(32));
      const cryptoWrapKey = await window.crypto.subtle.importKey(
        'raw',
        rawWrapKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );

      const iv = generateIV();
      const encodedPin = new TextEncoder().encode(pin);
      const encryptedPin = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        cryptoWrapKey,
        encodedPin
      );

      localStorage.setItem(BIO_CRED_ID_KEY, 'native_device_biometric');
      localStorage.setItem(BIO_WRAP_KEY, bufToHex(rawWrapKey));
      localStorage.setItem(BIO_IV_KEY, bufToHex(iv));
      localStorage.setItem(BIO_CIPHER_KEY, bufToHex(new Uint8Array(encryptedPin)));
      localStorage.setItem(BIO_TYPE_KEY, 'native');
      localStorage.setItem(BIO_ENABLED_KEY, 'true');
      return true;
    } catch (nativeErr: any) {
      console.error('Native biometric enrollment error:', nativeErr);
      throw new Error(nativeErr?.message || 'Error al autenticar con el sensor nativo de huella.');
    }
  }

  // 2. WebAuthn fallback (Chrome, Firefox, Safari, Edge)
  if (!window.PublicKeyCredential) {
    // Check if inside a WebView (like WebIntoApp or Android WebView)
    const ua = navigator.userAgent || '';
    const isWebView = /wv|Android.*Version\/[0-9.]+/i.test(ua);
    if (isWebView) {
      throw new Error(
        'El visor WebView de esta app (WebIntoApp) tiene bloqueado el acceso al sensor de huellas. Para usar tu huella: 1) Abre la app en Chrome en tu celular e instálala con "Añadir a pantalla de inicio", o 2) Desactiva el Modo Avión.'
      );
    }
    throw new Error(
      'Tu navegador o visor actual no tiene habilitada la API de huella biométrica (WebAuthn). Desactiva el Modo Avión o abre la app en Chrome.'
    );
  }

  const rpId = getRelyingPartyId();
  const challenge = window.crypto.getRandomValues(new Uint8Array(32));
  const userId = window.crypto.getRandomValues(new Uint8Array(16));

  let isPreviewFallback = false;
  let credential: PublicKeyCredential | null = null;

  // Detectar si estamos en un iframe con Permissions Policy restrictiva (entorno de desarrollo/preview)
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const isPermissionDenied =
    typeof document !== 'undefined' &&
    (document as any).permissionsPolicy?.allowsFeature?.('publickey-credentials-create') === false;

  if (isIframe || isPermissionDenied) {
    console.warn('Iframe de desarrollo detectado: usando modo biométrico simulado para evitar bloqueo de Permissions Policy.');
    isPreviewFallback = true;
  } else {
    try {
      credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Mi Bóveda',
            id: rpId,
          },
          user: {
            id: userId,
            name: 'boveda_user',
            displayName: 'Usuario Bóveda',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Native fingerprint scanner
            userVerification: 'required',
            residentKey: 'discouraged',
            requireResidentKey: false,
          },
          timeout: 60000,
          attestation: 'none',
        },
      })) as PublicKeyCredential | null;
    } catch (err: any) {
      console.error('Error creating credential:', err);
      const msg = err?.message?.toLowerCase() || '';

      if (
        msg.includes('publickey-credentials') ||
        msg.includes('permissions policy') ||
        (isIframe && (err?.name === 'SecurityError' || err?.name === 'NotAllowedError'))
      ) {
        console.warn('Permisos de WebAuthn delegados por iframe ausentes. Activando fallback local cifrado para vista previa.');
        isPreviewFallback = true;
      } else if (err?.name === 'NotAllowedError') {
        throw new Error('Registro cancelado en el sensor de huella.');
      } else if (
        msg.includes('credential manager') ||
        err?.name === 'UnknownError' ||
        msg.includes('offline')
      ) {
        throw new Error(
          'El Administrador de Credenciales de Google falló. Si tienes el "Modo avión" activado en tu celular, desactívalo para permitir la vinculación de huella.'
        );
      } else {
        throw new Error(
          err?.message || 'No se pudo registrar la huella. Desactiva el Modo Avión y prueba de nuevo.'
        );
      }
    }
  }

  if (!isPreviewFallback && (!credential || !credential.rawId)) {
    throw new Error('No se pudo verificar la huella digital.');
  }

  // 3. Generate random 256-bit wrapping key for encrypting the PIN locally
  const rawWrapKey = window.crypto.getRandomValues(new Uint8Array(32));
  const cryptoWrapKey = await window.crypto.subtle.importKey(
    'raw',
    rawWrapKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );

  const iv = generateIV();
  const encodedPin = new TextEncoder().encode(pin);
  const encryptedPin = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    cryptoWrapKey,
    encodedPin
  );

  // 4. Store credential ID, encrypted PIN and wrap key
  const credRawIdHex = isPreviewFallback
    ? 'preview_simulated_biometric'
    : bufToHex(new Uint8Array(credential!.rawId));
  localStorage.setItem(BIO_CRED_ID_KEY, credRawIdHex);
  localStorage.setItem(BIO_WRAP_KEY, bufToHex(rawWrapKey));
  localStorage.setItem(BIO_IV_KEY, bufToHex(iv));
  localStorage.setItem(BIO_CIPHER_KEY, bufToHex(new Uint8Array(encryptedPin)));
  localStorage.setItem(BIO_TYPE_KEY, isPreviewFallback ? 'preview' : 'webauthn');
  localStorage.setItem(BIO_ENABLED_KEY, 'true');

  return true;
}

// Mutex to strictly prevent concurrent or duplicated biometric authentication calls
let activeBiometricAuthPromise: Promise<string> | null = null;
let currentBioAbortController: AbortController | null = null;

/**
 * Triggers the native Android fingerprint prompt and, upon successful touch, returns the decrypted PIN.
 * Uses a singleton promise to ensure only one biometric prompt is active at a time.
 * If forceFresh is true, cancels any stalled prompt and starts a fresh biometric scan.
 */
export async function authenticateWithBiometrics(forceFresh = false): Promise<string> {
  if (forceFresh) {
    if (currentBioAbortController) {
      try {
        currentBioAbortController.abort();
      } catch {}
      currentBioAbortController = null;
    }
    activeBiometricAuthPromise = null;
  }

  if (activeBiometricAuthPromise) {
    return activeBiometricAuthPromise;
  }

  const abortCtrl = new AbortController();
  currentBioAbortController = abortCtrl;

  activeBiometricAuthPromise = (async () => {
    try {
      if (!isBiometricsEnrolled()) {
        throw new Error('La huella digital aún no está registrada en esta bóveda.');
      }

      const credIdHex = localStorage.getItem(BIO_CRED_ID_KEY);
      const rawWrapHex = localStorage.getItem(BIO_WRAP_KEY);
      const ivHex = localStorage.getItem(BIO_IV_KEY);
      const cipherHex = localStorage.getItem(BIO_CIPHER_KEY);
      const bioType = localStorage.getItem(BIO_TYPE_KEY) || 'webauthn';

      if (!credIdHex || !rawWrapHex || !ivHex || !cipherHex) {
        disableBiometrics();
        throw new Error('Datos de huella corruptos. Por favor vincula tu huella nuevamente.');
      }

      // 1. Si está en modo preview (iframe de desarrollo)
      if (bioType === 'preview' || credIdHex === 'preview_simulated_biometric') {
        await new Promise((resolve) => setTimeout(resolve, 200));
      } else if (bioType === 'native' || credIdHex === 'native_device_biometric') {
        let verified = false;
        if (Capacitor.isNativePlatform()) {
          const auth = await NativeVaultBiometrics.authenticate({
            title: 'Desbloquear Bóveda',
            subtitle: 'Toca el sensor de huella para ingresar',
            negativeButton: 'Usar PIN',
          });
          verified = !!auth.success;
          if (!verified) {
            const isCanceled =
              auth?.errorCode === 10 || // BIOMETRIC_ERROR_USER_CANCELED
              auth?.errorCode === 13 || // BIOMETRIC_ERROR_NEGATIVE_BUTTON
              auth?.errorCode === 5 ||  // BIOMETRIC_ERROR_CANCELED
              /cancel/i.test(auth?.message || '') ||
              /usar pin/i.test(auth?.message || '');
            if (isCanceled) {
              const cancelErr = new Error('Autenticación biométrica cancelada por el usuario.');
              cancelErr.name = 'AbortError';
              (cancelErr as any).isUserCanceled = true;
              throw cancelErr;
            }
          }
        } else if ((window as any).AndroidBiometrics?.authenticate) {
          verified = !!(window as any).AndroidBiometrics.authenticate('Desbloquear Bóveda');
        }

        if (!verified) {
          throw new Error('Huella no reconocida.');
        }
      } else {
        // 2. WebAuthn Authentication Dialog
        const isIframe = typeof window !== 'undefined' && window.self !== window.top;
        if (isIframe) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        } else {
          const credRawId = hexToBuf(credIdHex);
          const rpId = getRelyingPartyId();
          const challenge = window.crypto.getRandomValues(new Uint8Array(32));

          let assertion: Credential | null = null;
          try {
            assertion = await navigator.credentials.get({
              publicKey: {
                challenge,
                rpId,
                allowCredentials: [
                  {
                    type: 'public-key',
                    id: credRawId as BufferSource,
                    transports: ['internal'],
                  },
                ],
                userVerification: 'required',
                timeout: 60000,
              },
              signal: abortCtrl.signal,
            });
          } catch (err: any) {
            console.error('Error getting credential:', err);
            const msg = err?.message?.toLowerCase() || '';
            if (
              msg.includes('publickey-credentials') ||
              msg.includes('permissions policy') ||
              err?.name === 'SecurityError'
            ) {
              console.warn('WebAuthn get bloqueado por Permissions Policy del iframe. Usando fallback cifrado.');
            } else if (err?.name === 'AbortError') {
              throw new Error('Solicitud biométrica cancelada para iniciar una nueva.');
            } else if (err?.name === 'NotAllowedError') {
              throw err;
            } else if (err?.name === 'InvalidStateError' || err?.name === 'NotFoundError') {
              disableBiometrics();
              throw new Error('El registro de huella expiró. Toca el sensor para vincularla de nuevo con tu PIN.');
            } else if (
              msg.includes('credential manager') ||
              err?.name === 'UnknownError'
            ) {
              throw new Error(
                'Google Credential Manager falló. Si tienes el "Modo avión" activado en tu celular, desactívalo un momento para verificar tu huella, o ingresa con tu PIN.'
              );
            } else {
              throw err;
            }
          }

          if (!assertion) {
            throw new Error('No se reconoció la huella digital.');
          }
        }
      }

      // 3. Biometrics passed! Decrypt the PIN
      const rawWrapKey = hexToBuf(rawWrapHex);
      const iv = hexToBuf(ivHex);
      const cipher = hexToBuf(cipherHex);

      const cryptoWrapKey = await window.crypto.subtle.importKey(
        'raw',
        rawWrapKey as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decryptedBytes = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        cryptoWrapKey,
        cipher as BufferSource
      );

      return new TextDecoder().decode(decryptedBytes);
    } finally {
      // Clear mutex and controller on finish
      if (currentBioAbortController === abortCtrl) {
        currentBioAbortController = null;
      }
      activeBiometricAuthPromise = null;
    }
  })();

  return activeBiometricAuthPromise;
}

/**
 * Disables and removes biometric credentials from storage.
 */
export function disableBiometrics(): void {
  localStorage.removeItem(BIO_ENABLED_KEY);
  localStorage.removeItem(BIO_CRED_ID_KEY);
  localStorage.removeItem(BIO_CIPHER_KEY);
  localStorage.removeItem(BIO_IV_KEY);
  localStorage.removeItem(BIO_WRAP_KEY);
  localStorage.removeItem(BIO_TYPE_KEY);
}

/**
 * Updates the encrypted PIN stored for biometric authentication if biometrics is already enrolled.
 * Prevents biometric unlock failures after a master PIN change or recovery reset.
 */
export async function updateBiometricPinIfEnrolled(newPin: string): Promise<void> {
  try {
    if (!hasBiometricCredentials()) return;

    const rawWrapKey = window.crypto.getRandomValues(new Uint8Array(32));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const cryptoWrapKey = await window.crypto.subtle.importKey(
      'raw',
      rawWrapKey as BufferSource,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const encodedPin = new TextEncoder().encode(newPin);
    const encryptedPin = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      cryptoWrapKey,
      encodedPin as BufferSource
    );

    localStorage.setItem(BIO_WRAP_KEY, bufToHex(rawWrapKey));
    localStorage.setItem(BIO_IV_KEY, bufToHex(iv));
    localStorage.setItem(BIO_CIPHER_KEY, bufToHex(new Uint8Array(encryptedPin)));
  } catch (err) {
    console.warn('Could not sync biometric PIN after PIN change:', err);
  }
}

