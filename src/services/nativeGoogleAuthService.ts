/**
 * =========================================================================
 * CÓDIGO CRÍTICO PROTEGIDO - NO MODIFICAR NI ALTERAR
 * Este servicio comunica con el selector nativo oficial de Google Accounts.
 * No modificar sin autorización explícita previa del usuario.
 * =========================================================================
 */
import { registerPlugin, Capacitor } from '@capacitor/core';
import { userProfileService, UserProfile } from './userProfileService';
import { syncUserProfile } from './firebaseAuthService';

export interface NativeGoogleAuthResponse {
  success: boolean;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  provider?: string;
  cancelled?: boolean;
  error?: string;
}

export interface VaultGoogleAuthPluginInterface {
  chooseGoogleAccount(): Promise<NativeGoogleAuthResponse>;
}

export const NativeGoogleAuth = registerPlugin<VaultGoogleAuthPluginInterface>('VaultGoogleAuth');

export interface NativeGoogleAuthResult {
  success: boolean;
  profile?: UserProfile;
  error?: string;
  cancelled?: boolean;
}

const FIRESTORE_PROJECT_ID = 'studio-7313343442-ab21c';
const FIRESTORE_DB_ID = 'ai-studio-remixbvedasegura-97d4266f-3ed5-45b1-9490-cec56ba0c191';
const FIRESTORE_BASE_DOCS_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents`;

function emailToAccountDocId(email: string): string {
  const clean = email.trim().toLowerCase();
  let hex = '';
  for (let i = 0; i < clean.length; i++) {
    hex += clean.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return `cuenta_${hex.slice(0, 120)}`;
}

async function fetchStoredNameForEmail(cleanEmail: string): Promise<{ firstName?: string; lastName?: string; photoURL?: string }> {
  try {
    // 1. Buscar en registro de cuentas (email_verifications/cuenta_<hex>)
    const accountDocId = emailToAccountDocId(cleanEmail);
    const resp1 = await fetch(`${FIRESTORE_BASE_DOCS_URL}/email_verifications/${accountDocId}`);
    if (resp1.ok) {
      const data1 = await resp1.json();
      const f1 = data1?.fields?.firstName?.stringValue?.trim();
      const l1 = data1?.fields?.lastName?.stringValue?.trim();
      if (f1) {
        return { firstName: f1, lastName: l1 || '' };
      }
    }

    // 2. Buscar en colección users/google_<base64>
    const uid = `google_${btoa(cleanEmail).replace(/=/g, '')}`;
    const resp2 = await fetch(`${FIRESTORE_BASE_DOCS_URL}/users/${uid}`);
    if (resp2.ok) {
      const data2 = await resp2.json();
      const f2 = data2?.fields?.firstName?.stringValue?.trim();
      const l2 = data2?.fields?.lastName?.stringValue?.trim();
      const p2 = data2?.fields?.photoURL?.stringValue?.trim();
      if (f2) {
        return { firstName: f2, lastName: l2 || '', photoURL: p2 || '' };
      }
    }
  } catch {
    // Ignorar errores de red
  }
  return {};
}

/**
 * Invoca directamente el selector nativo oficial de Google Play Services / Android en el teléfono.
 *
 * En Android:
 * - Desliza la tarjeta oficial de Google desde la parte inferior de la pantalla.
 * - Muestra las cuentas reales de Gmail guardadas en el dispositivo (la tuya, la de un familiar o la opción de añadir otra).
 * - Al pulsar la cuenta, entrega su nombre y correo real verificado.
 * - Sin redirecciones web, sin abrir Chrome y sin errores de origin_mismatch.
 */
export async function signInWithNativeGoogle(): Promise<NativeGoogleAuthResult> {
  try {
    // Si estamos en un dispositivo nativo Android
    if (Capacitor.isNativePlatform()) {
      (window as any).__isAuthenticatingGoogle = true;
      (window as any).__googleAuthStartTime = Date.now();

      let res: NativeGoogleAuthResponse;
      try {
        res = await NativeGoogleAuth.chooseGoogleAccount();
      } finally {
        setTimeout(() => {
          (window as any).__isAuthenticatingGoogle = false;
          (window as any).__googleAuthStartTime = 0;
        }, 3000);
      }

      if (res.cancelled) {
        return {
          success: false,
          cancelled: true,
        };
      }

      if (res.success && res.email) {
        const cleanEmail = res.email.trim().toLowerCase();
        const emailHandle = cleanEmail.split('@')[0] || 'Usuario';
        const defaultHandleName = emailHandle.charAt(0).toUpperCase() + emailHandle.slice(1);

        let resolvedFirst = (res.firstName || res.displayName || '').trim();
        let resolvedLast = (res.lastName || '').trim();
        let resolvedPhoto = (res.photoURL || '').trim();

        // Si el plugin nativo devolvió únicamente el prefijo del correo (ej. Jmmrtinez5121),
        // verificamos si este correo ya tiene un nombre guardado en Firestore
        if (!resolvedFirst || resolvedFirst.toLowerCase() === emailHandle.toLowerCase()) {
          const stored = await fetchStoredNameForEmail(cleanEmail);
          if (stored.firstName && stored.firstName.toLowerCase() !== emailHandle.toLowerCase()) {
            resolvedFirst = stored.firstName;
            if (!resolvedLast && stored.lastName) {
              resolvedLast = stored.lastName;
            }
          }
          if (!resolvedPhoto && stored.photoURL) {
            resolvedPhoto = stored.photoURL;
          }
        }

        if (!resolvedFirst) {
          resolvedFirst = defaultHandleName;
        }

        const existing = userProfileService.getUserProfile();
        const isSameEmail = existing?.email?.trim().toLowerCase() === cleanEmail;

        // Guardar el perfil verificado
        const profile = userProfileService.saveUserProfile({
          firstName: resolvedFirst,
          lastName: resolvedLast || (isSameEmail ? existing?.lastName || '' : ''),
          birthDate: isSameEmail ? existing?.birthDate : undefined,
          age: isSameEmail ? existing?.age : undefined,
          email: cleanEmail,
          emailVerified: true,
          photoURL: resolvedPhoto || (isSameEmail ? existing?.photoURL || '' : ''),
          authProvider: 'google.com',
        });

        // Sincronización en segundo plano sin bloquear la interfaz
        try {
          const uid = `google_${btoa(cleanEmail).replace(/=/g, '')}`;
          syncUserProfile(uid, {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            emailVerified: true,
            photoURL: profile.photoURL,
            authProvider: 'google.com',
          }).catch((syncErr) => {
            console.warn('Sync profile warning (offline):', syncErr);
          });
        } catch {
          // Continúa sin bloquear
        }

        return {
          success: true,
          profile,
        };
      }

      return {
        success: false,
        error: res.error || 'No se pudo obtener la cuenta seleccionada',
      };
    }

    // Entorno Web (Previsualizador de AI Studio / Navegador de escritorio)
    return {
      success: false,
      error: 'web_environment',
    };
  } catch (err: any) {
    console.error('Error en selector nativo de Google:', err);
    return {
      success: false,
      error: err?.message || 'Error al conectar con Google Play Services',
    };
  }
}
