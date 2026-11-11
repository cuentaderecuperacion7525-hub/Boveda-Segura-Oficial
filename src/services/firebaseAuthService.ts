import {
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  applyActionCode,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { userProfileService, UserProfile } from './userProfileService';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            ux_mode?: 'popup' | 'redirect';
            context?: 'signin' | 'signup' | 'use';
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number | string;
              logo_alignment?: 'left' | 'center';
            }
          ) => void;
          prompt: () => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export const GOOGLE_OAUTH_CLIENT_ID =
  firebaseConfig.oAuthClientId ||
  '608078005590-n71gktl427qb5265uej3nonvafjsavuv.apps.googleusercontent.com';

/**
 * Decodes a Google ID Token JWT payload without external libraries.
 */
export function decodeGoogleJwt(token: string): {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
  email_verified?: boolean;
} | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('Failed to parse Google JWT:', err);
    return null;
  }
}

/**
 * Signs in using a Google ID token credential obtained from Google Identity Services (GSI).
 * Never opens .firebaseapp.com/__/auth/handler, preventing "The requested action is invalid" on Android.
 */
export async function signInWithGoogleCredential(idToken: string): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    const payload = decodeGoogleJwt(idToken);
    const firstName = payload?.given_name || user.displayName?.split(' ')[0] || 'Usuario';
    const lastName = payload?.family_name || user.displayName?.split(' ').slice(1).join(' ') || '';
    const email = payload?.email || user.email || '';
    const photoURL = payload?.picture || user.photoURL || undefined;

    const profile = userProfileService.saveUserProfile({
      firstName,
      lastName,
      email,
      emailVerified: true,
      photoURL,
      authProvider: 'google.com',
    });

    await syncUserProfile(user.uid, {
      firstName,
      lastName,
      email,
      emailVerified: true,
      photoURL,
      authProvider: 'google.com',
    });

    return {
      success: true,
      profile,
    };
  } catch (err: any) {
    console.error('Google Credential Sign-In Error:', err);
    return {
      success: false,
      error: err.message || 'Error al autenticar con credencial de Google.',
    };
  }
}

/**
 * Signs in using an OAuth 2.0 access_token obtained directly from accounts.google.com (GSI Token Client).
 * Fetches real user profile from Google's userinfo endpoint and signs into Firebase via signInWithCredential.
 */
export async function signInWithGoogleAccessToken(accessToken: string): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  try {
    // 1. Authenticate with Firebase using the Google access token directly (no firebaseapp.com popup)
    const credential = GoogleAuthProvider.credential(null, accessToken);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    // 2. Fetch complete profile info from official Google userinfo API
    let googleUser: {
      given_name?: string;
      family_name?: string;
      name?: string;
      email?: string;
      picture?: string;
      email_verified?: boolean;
    } = {};

    try {
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (resp.ok) {
        googleUser = await resp.json();
      }
    } catch (fetchErr) {
      console.warn('Could not fetch extra userinfo, using Firebase user fields:', fetchErr);
    }

    const fullName = googleUser.name || user.displayName || 'Usuario';
    const nameParts = fullName.trim().split(' ');
    const firstName = googleUser.given_name || nameParts[0] || 'Usuario';
    const lastName = googleUser.family_name || nameParts.slice(1).join(' ') || '';
    const email = googleUser.email || user.email || '';
    const photoURL = googleUser.picture || user.photoURL || undefined;

    if (!email) {
      return {
        success: false,
        error: 'No se pudo obtener el correo electrónico de la cuenta de Google.',
      };
    }

    const profile = userProfileService.saveUserProfile({
      firstName,
      lastName,
      email,
      emailVerified: true,
      photoURL,
      authProvider: 'google.com',
    });

    await syncUserProfile(user.uid, {
      firstName,
      lastName,
      email,
      emailVerified: true,
      photoURL,
      authProvider: 'google.com',
    });

    return {
      success: true,
      profile,
    };
  } catch (err: any) {
    console.error('Google AccessToken Sign-In Error:', err);
    return {
      success: false,
      error: err.message || 'Error al verificar la cuenta con Google.',
    };
  }
}

/**
 * Opens the official Google Account Chooser & Consent flow directly via accounts.google.com
 * (Google Identity Services OAuth2 Token Client), avoiding the .firebaseapp.com/__/auth/handler
 * "The requested action is invalid" error on Android Chrome / WebAPK.
 */
export async function signInWithGoogle(): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  return new Promise((resolve) => {
    const oauth2 = window.google?.accounts?.oauth2;

    if (!oauth2) {
      resolve({
        success: false,
        error: 'El servicio de cuentas de Google aún está cargando. Intenta de nuevo en un segundo.',
      });
      return;
    }

    try {
      const tokenClient = oauth2.initTokenClient({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        scope: 'openid email profile',
        prompt: 'select_account consent',
        callback: async (tokenResponse) => {
          if (tokenResponse.error || !tokenResponse.access_token) {
            if (tokenResponse.error === 'access_denied') {
              resolve({
                success: false,
                error: 'Acceso rechazado. Debes permitir el acceso para continuar.',
              });
            } else {
              resolve({
                success: false,
                error: tokenResponse.error_description || 'Inicio de sesión cancelado.',
              });
            }
            return;
          }

          const result = await signInWithGoogleAccessToken(tokenResponse.access_token);
          resolve(result);
        },
        error_callback: (err) => {
          if (err?.type === 'popup_closed') {
            resolve({
              success: false,
              error: 'Ventana cerrada antes de completar la selección de cuenta.',
            });
          } else if (err?.type === 'popup_failed_to_open') {
            resolve({
              success: false,
              error: 'El navegador bloqueó la ventana emergente de Google. Permite las ventanas emergentes.',
            });
          } else {
            resolve({
              success: false,
              error: 'Operación cancelada.',
            });
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account consent' });
    } catch (err: any) {
      console.error('Error launching Google OAuth2 TokenClient:', err);
      resolve({
        success: false,
        error: 'No se pudo abrir el selector oficial de cuentas de Google.',
      });
    }
  });
}

/**
 * Sign out from Firebase Auth
 */
export async function signOutFromFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.error('Error signing out:', err);
  }
}

/**
 * Generates a stable deterministic authentication token for local fallback.
 */
function getDeterministicVaultKey(email: string): string {
  const clean = email.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return `Boveda_#${Math.abs(hash)}_SecKey!2026`;
}

export interface FirebaseRegisterResult {
  success: boolean;
  emailSent?: boolean;
  isAlreadyVerified?: boolean;
  message?: string;
  error?: string;
}

/**
 * Fallback: Registers the user with Email and sends a verification link via Firebase Auth.
 */
export async function sendFirebaseVerification(
  email: string,
  firstName: string,
  lastName?: string,
  birthDate?: string,
  age?: number
): Promise<FirebaseRegisterResult> {
  const cleanEmail = email.trim().toLowerCase();
  const password = getDeterministicVaultKey(cleanEmail);

  try {
    let userCredential;

    try {
      userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    } catch (createErr: any) {
      if (createErr.code === 'auth/email-already-in-use') {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      } else {
        throw createErr;
      }
    }

    const user = userCredential.user;
    await user.reload();

    if (user.emailVerified) {
      await syncUserProfile(user.uid, {
        firstName,
        lastName,
        birthDate,
        age,
        email: cleanEmail,
        emailVerified: true,
        authProvider: 'password',
      });

      return {
        success: true,
        emailSent: false,
        isAlreadyVerified: true,
        message: 'Tu correo ya está verificado oficialmente.',
      };
    }

    await sendEmailVerification(user, {
      url: window.location.origin,
      handleCodeInApp: false,
    });

    return {
      success: true,
      emailSent: true,
      message: `Correo oficial de verificación enviado a ${cleanEmail}`,
    };
  } catch (err: any) {
    console.error('Firebase Auth Verification error:', err);
    let errorMsg = 'Error al enviar el correo de verificación con Firebase.';
    if (err.code === 'auth/invalid-email') {
      errorMsg = 'El formato del correo electrónico no es válido.';
    } else if (err.code === 'auth/too-many-requests') {
      errorMsg = 'Demasiados intentos. Espera unos momentos antes de solicitar otro correo.';
    } else if (err.code === 'auth/operation-not-allowed') {
      errorMsg = 'El registro manual por correo está deshabilitado. Usa el botón "Continuar con Gmail".';
    } else if (err.code === 'auth/network-request-failed') {
      errorMsg = 'Error de conexión. Verifica tu conexión a internet.';
    } else if (err.message) {
      errorMsg = err.message;
    }

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Re-sends the verification email to the current authenticated Firebase user.
 */
export async function resendFirebaseVerificationEmail(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No hay sesión de usuario activa para reenviar.' };
    }

    await sendEmailVerification(user, {
      url: window.location.origin,
      handleCodeInApp: false,
    });

    return { success: true };
  } catch (err: any) {
    console.error('Resend verification error:', err);
    return {
      success: false,
      error: err.code === 'auth/too-many-requests'
        ? 'Espera unos minutos antes de solicitar otro correo.'
        : 'No se pudo reenviar el correo.',
    };
  }
}

/**
 * Checks whether the user has verified the link in their real email.
 */
export async function checkFirebaseEmailVerification(
  profileData: {
    firstName: string;
    lastName?: string;
    birthDate?: string;
    age?: number;
    email: string;
  }
): Promise<{ verified: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      const cleanEmail = profileData.email.trim().toLowerCase();
      const password = getDeterministicVaultKey(cleanEmail);
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      await cred.user.reload();
      if (cred.user.emailVerified) {
        await syncUserProfile(cred.user.uid, {
          ...profileData,
          emailVerified: true,
          authProvider: 'password',
        });
        return { verified: true };
      }
      return { verified: false };
    }

    await user.reload();

    if (user.emailVerified) {
      await syncUserProfile(user.uid, {
        ...profileData,
        emailVerified: true,
        authProvider: 'password',
      });
      return { verified: true };
    }

    return { verified: false };
  } catch (err: any) {
    console.error('Check email verification error:', err);
    return { verified: false, error: err.message };
  }
}

/**
 * If the user pastes an action code or link directly from their email.
 */
export async function verifyWithActionCode(
  actionCode: string,
  profileData: {
    firstName: string;
    lastName?: string;
    birthDate?: string;
    age?: number;
    email: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await applyActionCode(auth, actionCode);
    const user = auth.currentUser;
    if (user) {
      await user.reload();
      await syncUserProfile(user.uid, {
        ...profileData,
        emailVerified: true,
        authProvider: 'password',
      });
    }
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: 'El código de acción no es válido o ha expirado.',
    };
  }
}

/**
 * Saves profile data to local storage and Firestore.
 */
export async function syncUserProfile(
  uid: string,
  profile: {
    firstName: string;
    lastName?: string;
    birthDate?: string;
    age?: number;
    email: string;
    emailVerified: boolean;
    photoURL?: string;
    authProvider?: string;
  }
) {
  userProfileService.saveUserProfile({
    firstName: profile.firstName,
    lastName: profile.lastName,
    birthDate: profile.birthDate,
    age: profile.age,
    email: profile.email,
    emailVerified: profile.emailVerified,
    photoURL: profile.photoURL,
    authProvider: profile.authProvider,
  });

  try {
    const userRef = doc(db, 'users', uid);
    const now = new Date().toISOString();
    const docData: Record<string, any> = {
      id: uid,
      firstName: profile.firstName.trim(),
      email: profile.email.trim().toLowerCase(),
      emailVerified: profile.emailVerified,
      createdAt: now,
      updatedAt: now,
    };

    if (profile.lastName?.trim()) {
      docData.lastName = profile.lastName.trim();
    }
    if (profile.birthDate?.trim()) {
      docData.birthDate = profile.birthDate.trim();
    }
    if (profile.age !== undefined && profile.age >= 0) {
      docData.age = profile.age;
    }
    if (profile.photoURL) {
      docData.photoURL = profile.photoURL;
    }
    if (profile.authProvider) {
      docData.authProvider = profile.authProvider;
    }

    await setDoc(userRef, docData, { merge: true });
  } catch (err) {
    console.warn('Firestore user profile sync warning (offline or permissions):', err);
  }
}
