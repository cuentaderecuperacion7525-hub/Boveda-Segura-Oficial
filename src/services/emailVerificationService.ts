/**
 * Email Verification Service.
 * Supports 6-digit PIN verification + background confirmation link detection via Firestore,
 * with strict 5-minute expiration, single-use lock, and automatic cancellation of previous codes.
 */

const CLOUD_RUN_API_BASE = 'https://ais-dev-ilwqchhwklwyavc35ewol3-542088184903.us-west2.run.app';
const FIRESTORE_PROJECT_ID = 'studio-7313343442-ab21c';
const FIRESTORE_DB_ID = 'ai-studio-remixbvedasegura-97d4266f-3ed5-45b1-9490-cec56ba0c191';
const FIRESTORE_COLLECTION_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents/email_verifications`;

export const EMAIL_CODE_VALIDITY_MS = 5 * 60 * 1000; // 5 minutos exactos

function isNativeOrRemoteClient(): boolean {
  if (typeof window !== 'undefined') {
    if (
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:' ||
      (window.location.hostname === 'localhost' && !window.location.port)
    ) {
      return true;
    }
  }
  return false;
}

function getApiEndpoint(path: string): string {
  if (isNativeOrRemoteClient()) {
    return `${CLOUD_RUN_API_BASE}${path}`;
  }
  return path;
}

function getLocalSessionKey(email: string): string {
  return `vault_email_session_${email.trim().toLowerCase()}`;
}

interface LocalVerificationSession {
  token: string;
  pin: string;
  email: string;
  firstName: string;
  createdAt: string;
  expiresAtMs: number;
  used?: boolean;
}

function getLocalSession(email: string): LocalVerificationSession | null {
  try {
    const raw = localStorage.getItem(getLocalSessionKey(email));
    if (!raw) return null;
    return JSON.parse(raw) as LocalVerificationSession;
  } catch {
    return null;
  }
}

function saveLocalSession(session: LocalVerificationSession) {
  try {
    localStorage.setItem(getLocalSessionKey(session.email), JSON.stringify(session));
  } catch {}
}

function generateRandomHexToken(bytes = 16): string {
  try {
    const arr = new Uint8Array(bytes);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return (
      Math.random().toString(16).substring(2) +
      Math.random().toString(16).substring(2) +
      Date.now().toString(16)
    ).replace(/[^a-zA-Z0-9]/g, '');
  }
}

function generateSixDigitPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface SendPinResult {
  success: boolean;
  delivered?: boolean;
  sandboxRestricted?: boolean;
  needsApiKey?: boolean;
  targetEmail?: string;
  message?: string;
  testPin?: string;
  token?: string;
  magicLink?: string;
  expiresInSeconds?: number;
  error?: string;
}

export interface VerifyPinResult {
  success: boolean;
  email?: string;
  firstName?: string;
  message?: string;
  expired?: boolean;
  error?: string;
}

async function updateFirestoreDocStatus(params: {
  token: string;
  email: string;
  firstName: string;
  pin?: string;
  status: string;
  confirmed: boolean;
  createdAt: string;
}) {
  try {
    const fields: Record<string, any> = {
      token: { stringValue: params.token },
      email: { stringValue: params.email },
      firstName: { stringValue: params.firstName },
      status: { stringValue: params.status },
      confirmed: { booleanValue: params.confirmed },
      createdAt: { stringValue: params.createdAt },
    };
    if (params.pin) {
      fields.pin = { stringValue: params.pin };
    }
    await fetch(`${FIRESTORE_COLLECTION_URL}/${encodeURIComponent(params.token)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
  } catch {}
}

export async function checkEmailConfirmationStatus(
  email: string,
  explicitToken?: string | null
): Promise<{
  confirmed: boolean;
  expired?: boolean;
  superseded?: boolean;
  email?: string;
  firstName?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { confirmed: false };

  const localSession = getLocalSession(cleanEmail);
  const token = (explicitToken || localSession?.token || '').trim();

  if (!token) return { confirmed: false };

  // 1. Consultar estado directamente en Firestore (tiempo real para APK Android y Web)
  try {
    const fsRes = await fetch(`${FIRESTORE_COLLECTION_URL}/${encodeURIComponent(token)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (fsRes.ok) {
      const doc = await fsRes.json();
      const f = doc?.fields;
      if (f) {
        const confirmed = Boolean(f.confirmed?.booleanValue);
        const status = f.status?.stringValue || '';
        const createdAt = f.createdAt?.stringValue || '';
        const docEmail = f.email?.stringValue || cleanEmail;
        const docName = f.firstName?.stringValue || localSession?.firstName || 'Usuario';
        const docPin = f.pin?.stringValue || localSession?.pin;

        if (status === 'superseded') {
          return { confirmed: false, superseded: true };
        }

        const createdMs = Date.parse(createdAt);
        if (status === 'expired' || (createdMs && Date.now() - createdMs > EMAIL_CODE_VALIDITY_MS)) {
          return { confirmed: false, expired: true };
        }

        if (confirmed || status === 'confirmed') {
          // Marcar inmediatamente como 'used' (un solo uso)
          if (status !== 'used') {
            await updateFirestoreDocStatus({
              token,
              email: docEmail,
              firstName: docName,
              pin: docPin,
              status: 'used',
              confirmed: true,
              createdAt: createdAt || new Date().toISOString(),
            });
          }
          if (localSession) {
            saveLocalSession({ ...localSession, used: true });
          }
          return {
            confirmed: true,
            email: docEmail,
            firstName: docName,
          };
        }
      }
    }
  } catch {}

  // 2. Consultar en el endpoint del servidor si estamos en el mismo origen web
  if (!isNativeOrRemoteClient()) {
    try {
      const endpoint = getApiEndpoint(
        `/api/estado-confirmacion?correo=${encodeURIComponent(cleanEmail)}&token=${encodeURIComponent(token)}`
      );
      const res = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data?.confirmado) {
          return {
            confirmed: true,
            email: data.correo || cleanEmail,
            firstName: data.nombre,
          };
        }
      }
    } catch {}
  }

  return { confirmed: false };
}

export async function sendEmailPin(email: string, firstName?: string): Promise<SendPinResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (firstName || 'Usuario').trim() || 'Usuario';

  // Si existía una sesión anterior para este correo, cancelarla de inmediato ('superseded')
  const prevSession = getLocalSession(cleanEmail);
  if (prevSession && prevSession.token && !prevSession.used) {
    updateFirestoreDocStatus({
      token: prevSession.token,
      email: prevSession.email,
      firstName: prevSession.firstName,
      pin: prevSession.pin,
      status: 'superseded',
      confirmed: false,
      createdAt: prevSession.createdAt,
    }).catch(() => {});
  }

  const token = generateRandomHexToken(16);
  const pin = generateSixDigitPin();
  const createdAt = new Date().toISOString();
  const expiresAtMs = Date.now() + EMAIL_CODE_VALIDITY_MS;

  saveLocalSession({
    token,
    pin,
    email: cleanEmail,
    firstName: cleanName,
    createdAt,
    expiresAtMs,
    used: false,
  });

  let firestoreSaved = false;

  // 1. Guardar solicitud 'pending' con el PIN de 6 dígitos en Firestore
  try {
    const fsRes = await fetch(`${FIRESTORE_COLLECTION_URL}/${encodeURIComponent(token)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          token: { stringValue: token },
          email: { stringValue: cleanEmail },
          firstName: { stringValue: cleanName },
          pin: { stringValue: pin },
          status: { stringValue: 'pending' },
          confirmed: { booleanValue: false },
          createdAt: { stringValue: createdAt },
        },
      }),
    });
    if (fsRes.ok) {
      firestoreSaved = true;
    }
  } catch (err: any) {
    console.warn('Aviso al registrar solicitud en Firestore:', err?.message);
  }

  // 2. Si estamos en navegador web (mismo origen), llamar también a /api/send-email-pin con el mismo token y pin
  if (!isNativeOrRemoteClient()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('/api/send-email-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: cleanEmail, firstName: cleanName, token, pin }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        return {
          success: true,
          delivered: true,
          targetEmail: cleanEmail,
          token,
          testPin: pin,
          magicLink: data.magicLink,
          expiresInSeconds: 300,
          message: data.message || `Código de 6 dígitos enviado a ${cleanEmail}`,
        };
      }
    } catch {}
  }

  if (firestoreSaved) {
    return {
      success: true,
      delivered: true,
      targetEmail: cleanEmail,
      token,
      testPin: pin,
      expiresInSeconds: 300,
      message: `Código de 6 dígitos enviado a ${cleanEmail}`,
    };
  }

  return {
    success: false,
    delivered: false,
    targetEmail: cleanEmail,
    error: 'No se pudo conectar con el servidor de correo. Verifica tu conexión a internet.',
  };
}

export async function verifyEmailPin(
  email: string,
  pin: string,
  explicitToken?: string | null
): Promise<VerifyPinResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPin = pin.toString().trim();

  if (cleanPin.length !== 6) {
    return {
      success: false,
      error: 'Por favor ingresa los 6 dígitos del código.',
    };
  }

  const localSession = getLocalSession(cleanEmail);
  const token = (explicitToken || localSession?.token || '').trim();

  // 1. Verificar contra el documento en Firestore (valida 5 minutos, un solo uso y que no esté cancelado)
  if (token) {
    try {
      const fsRes = await fetch(`${FIRESTORE_COLLECTION_URL}/${encodeURIComponent(token)}`, {
        method: 'GET',
        cache: 'no-store',
      });
      if (fsRes.ok) {
        const doc = await fsRes.json();
        const f = doc?.fields;
        if (f) {
          const docPin = (f.pin?.stringValue || localSession?.pin || '').trim();
          const status = f.status?.stringValue || '';
          const createdAt = f.createdAt?.stringValue || localSession?.createdAt || '';
          const docEmail = f.email?.stringValue || cleanEmail;
          const docName = f.firstName?.stringValue || localSession?.firstName || 'Usuario';

          if (status === 'superseded') {
            return {
              success: false,
              error: 'Este código fue cancelado porque solicitaste uno más reciente.',
            };
          }

          if (status === 'used') {
            return {
              success: false,
              error: 'Este código es de un solo uso y ya fue utilizado.',
            };
          }

          const createdMs = Date.parse(createdAt);
          if (status === 'expired' || (createdMs && Date.now() - createdMs > EMAIL_CODE_VALIDITY_MS)) {
            await updateFirestoreDocStatus({
              token,
              email: docEmail,
              firstName: docName,
              pin: docPin,
              status: 'expired',
              confirmed: false,
              createdAt: createdAt || new Date().toISOString(),
            });
            return {
              success: false,
              expired: true,
              error: 'El código ha expirado (válido solo por 5 minutos). Toca "Reenviar código".',
            };
          }

          if (docPin && docPin === cleanPin) {
            await updateFirestoreDocStatus({
              token,
              email: docEmail,
              firstName: docName,
              pin: docPin,
              status: 'used',
              confirmed: true,
              createdAt: createdAt || new Date().toISOString(),
            });
            if (localSession) {
              saveLocalSession({ ...localSession, used: true });
            }
            return {
              success: true,
              email: docEmail,
              firstName: docName,
              message: '¡Código verificado con éxito!',
            };
          } else if (docPin) {
            return {
              success: false,
              error: 'El código de 6 dígitos es incorrecto. Verifica el correo más reciente.',
            };
          }
        }
      }
    } catch {}
  }

  // 2. Respaldo contra sesión local (siempre respetando el límite de 5 minutos y un solo uso)
  if (localSession) {
    if (localSession.used) {
      return {
        success: false,
        error: 'Este código ya fue utilizado.',
      };
    }
    if (Date.now() > localSession.expiresAtMs) {
      return {
        success: false,
        expired: true,
        error: 'El código ha expirado (válido solo por 5 minutos). Toca "Reenviar código".',
      };
    }
    if (localSession.pin === cleanPin) {
      saveLocalSession({ ...localSession, used: true });
      return {
        success: true,
        email: localSession.email,
        firstName: localSession.firstName,
        message: '¡Código verificado con éxito!',
      };
    }
  }

  return {
    success: false,
    error: 'El código de 6 dígitos es incorrecto o ha expirado.',
  };
}

function getAccountDocKey(email: string): string {
  const clean = email.trim().toLowerCase();
  let hex = '';
  for (let i = 0; i < clean.length; i++) {
    hex += clean.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return `cuenta_${hex.slice(0, 96)}`;
}

async function hashUserPassword(email: string, password: string): Promise<string> {
  const input = `boveda_v1::${email.trim().toLowerCase()}::${password}`;
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const encoded = new TextEncoder().encode(input);
      const buf = await window.crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {}
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  return `fb_${(h1 >>> 0).toString(16)}_${(h2 >>> 0).toString(16)}`;
}

export async function saveRegisteredAccountToCloud(params: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<void> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanFirst = params.firstName.trim();
  const cleanLast = params.lastName.trim();
  const docKey = getAccountDocKey(cleanEmail);
  const passwordHash = await hashUserPassword(cleanEmail, params.password);
  const createdAt = new Date().toISOString();

  try {
    localStorage.setItem(
      `vault_registered_acct_${cleanEmail}`,
      JSON.stringify({
        firstName: cleanFirst,
        lastName: cleanLast,
        email: cleanEmail,
        passwordHash,
        createdAt,
      })
    );
  } catch {}

  try {
    await fetch(`${FIRESTORE_COLLECTION_URL}/${encodeURIComponent(docKey)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          token: { stringValue: docKey },
          email: { stringValue: cleanEmail },
          firstName: { stringValue: cleanFirst },
          lastName: { stringValue: cleanLast },
          passwordHash: { stringValue: passwordHash },
          status: { stringValue: 'registered_account' },
          confirmed: { booleanValue: true },
          createdAt: { stringValue: createdAt },
        },
      }),
    });
  } catch {}
}

export async function loginRegisteredAccount(
  email: string,
  password: string
): Promise<{
  success: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  error?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const docKey = getAccountDocKey(cleanEmail);
  const enteredHash = await hashUserPassword(cleanEmail, password);

  // 1. Buscar en Firestore
  try {
    const res = await fetch(`${FIRESTORE_COLLECTION_URL}/${encodeURIComponent(docKey)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (res.ok) {
      const doc = await res.json();
      const f = doc?.fields;
      if (f && f.passwordHash?.stringValue) {
        if (f.passwordHash.stringValue === enteredHash) {
          return {
            success: true,
            firstName: f.firstName?.stringValue || 'Usuario',
            lastName: f.lastName?.stringValue || '',
            email: f.email?.stringValue || cleanEmail,
          };
        } else {
          return {
            success: false,
            error: 'La contraseña ingresada es incorrecta.',
          };
        }
      }
    } else if (res.status === 404) {
      // Revisar respaldo local antes de declarar no encontrado
      try {
        const raw = localStorage.getItem(`vault_registered_acct_${cleanEmail}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.passwordHash === enteredHash) {
            return {
              success: true,
              firstName: parsed.firstName || 'Usuario',
              lastName: parsed.lastName || '',
              email: cleanEmail,
            };
          }
          return {
            success: false,
            error: 'La contraseña ingresada es incorrecta.',
          };
        }
      } catch {}

      return {
        success: false,
        error: 'No existe una cuenta registrada con este correo. Por favor crea una cuenta primero.',
      };
    }
  } catch {}

  // 2. Respaldo en localStorage si no hay red
  try {
    const raw = localStorage.getItem(`vault_registered_acct_${cleanEmail}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.passwordHash === enteredHash) {
        return {
          success: true,
          firstName: parsed.firstName || 'Usuario',
          lastName: parsed.lastName || '',
          email: cleanEmail,
        };
      }
      return {
        success: false,
        error: 'La contraseña ingresada es incorrecta.',
      };
    }
  } catch {}

  return {
    success: false,
    error: 'No encontramos una cuenta con ese correo o hubo un problema de conexión.',
  };
}

/**
 * Verifica si un correo electrónico está registrado en la aplicación (en Firestore o localmente).
 * Si checkLocalProfile es true (para recuperación de PIN de la bóveda en el dispositivo),
 * también valida contra el perfil activo vinculado en el teléfono.
 */
export async function checkRegisteredAccountExists(
  email: string,
  checkLocalProfile = false
): Promise<{
  exists: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  error?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return {
      exists: false,
      error: 'Por favor ingresa un correo electrónico con formato válido.',
    };
  }

  const docKey = getAccountDocKey(cleanEmail);

  // 1. Consultar en Firestore si existe el documento cuenta_<hex>
  try {
    const res = await fetch(`${FIRESTORE_COLLECTION_URL}/${encodeURIComponent(docKey)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (res.ok) {
      const doc = await res.json();
      const f = doc?.fields;
      if (f && (f.status?.stringValue === 'registered_account' || f.email?.stringValue)) {
        // Si estamos validando para recuperar el PIN del dispositivo y hay un perfil local activo con otro correo distinto,
        // asegurarnos de que coincida con el propietario de esta bóveda
        if (checkLocalProfile) {
          try {
            const rawProf = localStorage.getItem('vault_user_profile') || localStorage.getItem('vault_user_profile_v1');
            if (rawProf) {
              const prof = JSON.parse(rawProf);
              const profEmail = (prof?.email || '').trim().toLowerCase();
              if (profEmail && profEmail !== cleanEmail) {
                return {
                  exists: false,
                  error: 'Este correo no coincide con la cuenta vinculada a esta bóveda.',
                };
              }
            }
          } catch {}
        }
        return {
          exists: true,
          firstName: f.firstName?.stringValue || 'Usuario',
          lastName: f.lastName?.stringValue || '',
          email: f.email?.stringValue || cleanEmail,
        };
      }
    }
  } catch {}

  // 2. Consultar perfil activo en este dispositivo ('vault_user_profile')
  try {
    const rawProfile = localStorage.getItem('vault_user_profile') || localStorage.getItem('vault_user_profile_v1');
    if (rawProfile) {
      const parsedProfile = JSON.parse(rawProfile);
      const profileEmail = (parsedProfile?.email || '').trim().toLowerCase();
      if (profileEmail && profileEmail === cleanEmail) {
        return {
          exists: true,
          firstName: parsedProfile.firstName || 'Usuario',
          lastName: parsedProfile.lastName || '',
          email: cleanEmail,
        };
      }
    }
  } catch {}

  // 3. Consultar respaldo local de cuentas registradas en localStorage
  try {
    const raw = localStorage.getItem(`vault_registered_acct_${cleanEmail}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        exists: true,
        firstName: parsed.firstName || 'Usuario',
        lastName: parsed.lastName || '',
        email: cleanEmail,
      };
    }
  } catch {}

  return {
    exists: false,
    error: 'Este correo no está registrado en la aplicación. Verifica que esté bien escrito.',
  };
}

/**
 * Actualiza la contraseña de una cuenta registrada tras verificar el código de 6 dígitos enviado al correo.
 */
export async function updateRegisteredAccountPassword(
  email: string,
  newPassword: string
): Promise<{
  success: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  error?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const docKey = getAccountDocKey(cleanEmail);
  const newPasswordHash = await hashUserPassword(cleanEmail, newPassword);

  let firstName = 'Usuario';
  let lastName = '';
  let createdAt = new Date().toISOString();

  // Obtener datos existentes para conservar nombre, apellidos y fecha de creación
  try {
    const res = await fetch(`${FIRESTORE_COLLECTION_URL}/${encodeURIComponent(docKey)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (res.ok) {
      const doc = await res.json();
      const f = doc?.fields;
      if (f) {
        firstName = f.firstName?.stringValue || firstName;
        lastName = f.lastName?.stringValue || lastName;
        createdAt = f.createdAt?.stringValue || createdAt;
      }
    }
  } catch {}

  try {
    const rawLocal = localStorage.getItem(`vault_registered_acct_${cleanEmail}`);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (parsed.firstName && firstName === 'Usuario') firstName = parsed.firstName;
      if (parsed.lastName && !lastName) lastName = parsed.lastName;
      if (parsed.createdAt) createdAt = parsed.createdAt;
    }
  } catch {}

  // Actualizar en localStorage
  try {
    localStorage.setItem(
      `vault_registered_acct_${cleanEmail}`,
      JSON.stringify({
        firstName,
        lastName,
        email: cleanEmail,
        passwordHash: newPasswordHash,
        createdAt,
      })
    );
  } catch {}

  // Actualizar en Firestore
  try {
    const patchRes = await fetch(`${FIRESTORE_COLLECTION_URL}/${encodeURIComponent(docKey)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          token: { stringValue: docKey },
          email: { stringValue: cleanEmail },
          firstName: { stringValue: firstName },
          lastName: { stringValue: lastName },
          passwordHash: { stringValue: newPasswordHash },
          status: { stringValue: 'registered_account' },
          confirmed: { booleanValue: true },
          createdAt: { stringValue: createdAt },
        },
      }),
    });
    if (!patchRes.ok) {
      return {
        success: false,
        error: 'No se pudo actualizar la contraseña en el servidor. Revisa tu conexión.',
      };
    }
  } catch {
    return {
      success: false,
      error: 'Error de red al guardar la nueva contraseña.',
    };
  }

  return {
    success: true,
    firstName,
    lastName,
    email: cleanEmail,
  };
}


