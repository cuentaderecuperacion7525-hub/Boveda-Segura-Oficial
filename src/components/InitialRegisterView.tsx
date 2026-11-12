import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Mail,
  User,
  IdCard,
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  X,
} from 'lucide-react';
import { userProfileService } from '../services/userProfileService';
import { syncUserProfile, signInWithGoogle, signOutFromFirebase } from '../services/firebaseAuthService';
import { signInWithNativeGoogle, getNativeGoogleAccounts } from '../services/nativeGoogleAuthService';
import {
  sendEmailPin,
  verifyEmailPin,
  checkEmailConfirmationStatus,
  saveRegisteredAccountToCloud,
  loginRegisteredAccount,
  checkRegisteredAccountExists,
  updateRegisteredAccountPassword,
} from '../services/emailVerificationService';

interface InitialRegisterViewProps {
  onComplete: () => void;
  showToast: (message: string, type?: 'info' | 'success' | 'alert' | 'error') => void;
}

/**
 * Filtra en tiempo real números y símbolos para que solo se puedan escribir letras y espacios,
 * aplicando mayúscula inicial a cada palabra (ej. "josé manuel" -> "José Manuel").
 */
export function sanitizePersonNameInput(raw: string): string {
  const lettersAndSpaces = raw
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s+/, '');

  return lettersAndSpaces
    .split(' ')
    .map((word) => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Grupos de 2 consonantes válidos al inicio de un nombre o apellido real.
 */
const VALID_INITIAL_CLUSTERS = new Set([
  'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr',
  'ch', 'll', 'qu', 'sh', 'st', 'sp', 'sc', 'sm', 'sn', 'kh', 'ph', 'th', 'vl', 'tz', 'tl',
  'by', 'cy', 'dy', 'fy', 'gy', 'hy', 'ky', 'ly', 'my', 'ny', 'py', 'ry', 'sy', 'ty', 'vy', 'zy',
  'yb', 'yc', 'yd', 'yg', 'yl', 'ym', 'yn', 'yp', 'yr', 'ys', 'yt', 'yv', 'yz',
]);

/**
 * Grupos de 2 consonantes válidos en el interior de un nombre o apellido real en español.
 */
const VALID_INTERNAL_PAIRS = new Set([
  // Licuantes + líquidas y dígrafos
  'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr',
  'ch', 'll', 'rr', 'qu', 'sh', 'ph', 'th', 'kh', 'tz', 'tl',
  // N + consonante válida
  'nb', 'nc', 'nd', 'nf', 'ng', 'nh', 'nj', 'nk', 'nl', 'nm', 'nn', 'np', 'nq', 'nr', 'ns', 'nt', 'nv', 'nx', 'nz', 'ny',
  // M + consonante válida
  'mb', 'mp', 'mn', 'mm', 'my',
  // L + consonante válida
  'lb', 'lc', 'ld', 'lf', 'lg', 'lj', 'lk', 'lm', 'ln', 'lp', 'lq', 'lr', 'ls', 'lt', 'lv', 'lz', 'ly',
  // R + consonante válida
  'rb', 'rc', 'rd', 'rf', 'rg', 'rj', 'rk', 'rl', 'rm', 'rn', 'rp', 'rq', 'rs', 'rt', 'rv', 'rz', 'ry',
  // S + consonante válida
  'sb', 'sc', 'sd', 'sf', 'sg', 'sk', 'sl', 'sm', 'sn', 'sp', 'sq', 'sr', 'st', 'sv', 'sz', 'sy',
  // Z / D / B / C / G / P / T / X combinaciones reales (ej. Vázquez, Guzmán, Víctor, Héctor, Magdalena, Abraham)
  'zc', 'zg', 'zk', 'zl', 'zm', 'zn', 'zq', 'zr', 'zt', 'zv', 'zy',
  'dm', 'dq', 'dv', 'dz', 'dy',
  'bd', 'bj', 'bn', 'bs', 'bt', 'bv', 'by',
  'cc', 'ck', 'ct', 'cy',
  'gd', 'gm', 'gn', 'gy',
  'pt', 'ps', 'py',
  'ts', 'tt', 'ty',
  'xc', 'xp', 'xt',
  // Combinaciones con Y (ej. Leyva, Reyna, Taylor, Evelyn, Wendy, Katya, Bryan, Dylan)
  'yb', 'yc', 'yd', 'yf', 'yg', 'yh', 'yk', 'yl', 'ym', 'yn', 'yp', 'yr', 'ys', 'yt', 'yv', 'yz',
  'fy', 'hy', 'ky', 'vy',
]);

/**
 * Grupos de 3 consonantes válidos en español (ej. Contreras, Estrada, Castro, Sánchez, Alejandro, Constanza, Bryan, Cynthia).
 */
const VALID_THREE_CONSONANTS = new Set([
  'ntr', 'ndr', 'npl', 'npr', 'nbl', 'nbr', 'ncl', 'ncr', 'ngl', 'ngr', 'nfl', 'nfr',
  'mbr', 'mbl', 'mpr', 'mpl',
  'str', 'spl', 'spr', 'scl', 'scr',
  'rtr', 'rpl', 'rpr', 'rbl', 'rbr', 'rcl', 'rcr', 'rgl', 'rgr', 'rfl', 'rfr',
  'ltr', 'lpl', 'lpr', 'lbl', 'lbr', 'lcl', 'lcr', 'lgl', 'lgr',
  'nst', 'nsp', 'nsc', 'rst', 'rsp', 'rsc', 'lst', 'lsp',
  'nch', 'rch', 'lch', 'sch', 'chr',
  'nll', 'rll', 'nrr',
  'bry', 'cry', 'dry', 'fry', 'gry', 'pry', 'try', 'ply', 'cyn', 'lyn', 'ryn', 'nth', 'lvr',
]);

const VALID_CONNECTOR_WORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'san', 'santa', 'da', 'do', 'dos', 'das', 'van', 'von', 'y', 'mc', 'mac',
]);

/**
 * Detector fonético estricto de nombres y apellidos reales:
 * Acepta nombres y apellidos reales en español (como Ayala, Reyes, Yáñez, Ochoa, Carlos, Cruz, Hernández)
 * y bloquea combinaciones de letras tecleadas al azar (como "jdjsjwiw", "idnwiwqv", "xxx", "asdf").
 */
export function validateRealPersonName(value: string, fieldLabel: string): { valid: boolean; error?: string } {
  const clean = value.trim();
  if (!clean) {
    return { valid: false, error: `Por favor ingresa tu ${fieldLabel.toLowerCase()}.` };
  }

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { valid: false, error: `Por favor ingresa un ${fieldLabel.toLowerCase()} válido.` };
  }

  const keyboardTrashPattern =
    /(asdf|fdsa|qwer|rewq|zxcv|vcxz|hjkl|lkjh|yuio|oiuy|bnm|poiuy|mnbv|abcd|bcde|xyz|wxyz|qaz|wsx|edc|rfv|tgb|yhn|ujm)/i;

  for (let idx = 0; idx < words.length; idx++) {
    const rawWord = words[idx];

    // Normalizar acentos a vocales simples para el análisis fonético
    const w = rawWord
      .toLowerCase()
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú|ü/g, 'u');

    // Permitir conectores de apellidos compuestos (ej. "De la Cruz", "Del Río")
    if (words.length > 1 && VALID_CONNECTOR_WORDS.has(w)) {
      continue;
    }

    if (w.length < 2) {
      return {
        valid: false,
        error: `Cada ${fieldLabel.toLowerCase()} debe tener al menos 2 letras.`,
      };
    }
    if (w.length > 22) {
      return {
        valid: false,
        error: `El ${fieldLabel.toLowerCase()} ingresado es demasiado largo.`,
      };
    }

    // 1. Bloquear secuencias de teclado o 3 letras iguales seguidas ("xxx", "aaa")
    if (keyboardTrashPattern.test(w) || /(.)\1\1/.test(w)) {
      return {
        valid: false,
        error: `"${rawWord}" no es un ${fieldLabel.toLowerCase()} real válido.`,
      };
    }

    // 2. Regla de la Q: en nombres reales siempre va seguida de 'u' + vocal (que, qui, qua)
    if (/q(?!u[aeiou])/.test(w)) {
      return {
        valid: false,
        error: `"${rawWord}" no es un ${fieldLabel.toLowerCase()} real válido.`,
      };
    }

    // 3. Letras finales inválidas en nombres/apellidos reales (ninguno termina en w, q, v, j)
    if (/[wqvj]$/.test(w)) {
      return {
        valid: false,
        error: `"${rawWord}" no es un ${fieldLabel.toLowerCase()} real válido.`,
      };
    }

    // 4. Exceso de letras poco frecuentes (w, x, k, q, j) en una misma palabra (ej. "jdjsjwiw")
    const rareCount = (w.match(/[wxkq]/g) || []).length;
    const jwCount = (w.match(/[jw]/g) || []).length;
    if (rareCount >= 2 || jwCount >= 3 || (w.match(/w/g) || []).length >= 2) {
      return {
        valid: false,
        error: `"${rawWord}" no parece un ${fieldLabel.toLowerCase()} real.`,
      };
    }

    // 5. Proporción de vocales [aeiou] vs consonantes (tratando 'y' como consonante cuando hay vocales, como en Ayala, Reyes, Yáñez)
    const pureVowels = (w.match(/[aeiou]/g) || []).length;
    const yCount = (w.match(/y/g) || []).length;
    const vowels = pureVowels > 0 ? pureVowels : yCount;
    const consonants = w.length - vowels;
    const vowelRatio = vowels / w.length;

    // Permitir inicios de 2 vocales (ej. "Au" de Aurora, "Eu" de Eugenio) mientras escribe las primeras 2 letras
    const isTwoLetterDiphthongStart = w.length === 2 && /^(au|eu|ai|ei|oi|ou|ia|ie|io|ua|ue|uo)$/.test(w);

    if (!isTwoLetterDiphthongStart && (vowels === 0 || consonants === 0 || vowelRatio < 0.24 || vowelRatio > 0.80)) {
      return {
        valid: false,
        error: `"${rawWord}" no parece un ${fieldLabel.toLowerCase()} real.`,
      };
    }

    // 6. No más de 3 vocales seguidas ni 4 consonantes seguidas
    if (/[aeiou]{4,}/.test(w) || /[bcdfghjklmnñpqrstvwxzy]{4,}/.test(w)) {
      return {
        valid: false,
        error: `"${rawWord}" no es un ${fieldLabel.toLowerCase()} real válido.`,
      };
    }

    // 7. Validar grupos de 2 consonantes al inicio de la palabra (ej. bloquea "jd...", "nw...", "wq...")
    const initialClusterMatch = w.match(/^([bcdfghjklmnñpqrstvwxzy]{2})/);
    if (initialClusterMatch) {
      const cluster = initialClusterMatch[1];
      if (!VALID_INITIAL_CLUSTERS.has(cluster)) {
        return {
          valid: false,
          error: `"${rawWord}" contiene combinaciones de letras que no corresponden a un ${fieldLabel.toLowerCase()} real.`,
        };
      }
    }

    // 8. Validar grupos de 3 consonantes seguidas (ej. bloquea "jdj", "sjw", "dnw", "wqv")
    const threeConsonantMatches = w.match(/[bcdfghjklmnñpqrstvwxzy]{3}/g) || [];
    for (const c3 of threeConsonantMatches) {
      if (!VALID_THREE_CONSONANTS.has(c3)) {
        return {
          valid: false,
          error: `"${rawWord}" no es un ${fieldLabel.toLowerCase()} real válido.`,
        };
      }
    }

    // 9. Validar todos los pares de consonantes internas (ej. bloquea "jd", "js", "jw", "dn", "nw", "wq", "qv")
    const twoConsonantMatches = w.match(/[bcdfghjklmnñpqrstvwxzy]{2}/g) || [];
    for (const c2 of twoConsonantMatches) {
      if (!VALID_INTERNAL_PAIRS.has(c2)) {
        return {
          valid: false,
          error: `"${rawWord}" no es un ${fieldLabel.toLowerCase()} real válido.`,
        };
      }
    }
  }

  return { valid: true };
}

export const InitialRegisterView: React.FC<InitialRegisterViewProps> = ({
  onComplete,
  showToast,
}) => {
  // Control de vista: 'register', 'login', 'verify', 'forgot_email', 'forgot_verify', 'forgot_new_password'
  const [step, setStep] = useState<
    'register' | 'login' | 'verify' | 'forgot_email' | 'forgot_verify' | 'forgot_new_password'
  >('register');

  // Campos de formulario
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Estados de la Pantalla 2 (6 dígitos, contador de 5 minutos, token activo)
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState<number>(300); // 5 minutos = 300 segundos
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  // Estados de carga y error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isLoadingNative, setIsLoadingNative] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados para el selector y confirmación de cuenta de Google
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);
  const [detectedGoogleAccounts, setDetectedGoogleAccounts] = useState<{ email: string; name: string }[]>([]);
  const [authorizedGoogleProfile, setAuthorizedGoogleProfile] = useState<any | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const completedRef = useRef(false);

  // Evaluación en tiempo real de los requisitos de la contraseña (máximo 12 caracteres)
  const passHasValidLength = passwordInput.length >= 6 && passwordInput.length <= 12;
  const passHasUppercase = /[A-ZÁÉÍÓÚÑ]/.test(passwordInput);
  const passHasNumber = /\d/.test(passwordInput);
  const isPasswordAllValid = passHasValidLength && passHasUppercase && passHasNumber;

  // El desplegable dinámico se abre al instante cuando el campo Contraseña recibe foco o el usuario comienza a escribir
  const showPasswordDropdown =
    (step === 'register' || step === 'forgot_new_password') &&
    (isPasswordFocused || passwordInput.length > 0);

  // Evaluación en tiempo real de Nombre y Apellidos reales
  const firstNameValidation = validateRealPersonName(firstName, 'Nombre');
  const lastNameValidation = validateRealPersonName(lastName, 'Apellidos');
  const isFirstNameReal = firstName.trim().length >= 2 && firstNameValidation.valid;
  const isLastNameReal = lastName.trim().length >= 2 && lastNameValidation.valid;
  const isFirstNameInvalid = firstName.trim().length >= 2 && !firstNameValidation.valid;
  const isLastNameInvalid = lastName.trim().length >= 2 && !lastNameValidation.valid;

  // Finalizar registro o login y pasar a la bóveda
  const completeRegistration = async (email: string, fName: string, lName?: string, saveCloudAccount = true) => {
    if (completedRef.current) return;
    completedRef.current = true;

    const cleanEmail = email.trim().toLowerCase();
    const cleanFirst = fName.trim() || firstName.trim() || 'Usuario';
    const cleanLast = (lName !== undefined ? lName : lastName).trim();

    if (saveCloudAccount && passwordInput) {
      await saveRegisteredAccountToCloud({
        firstName: cleanFirst,
        lastName: cleanLast,
        email: cleanEmail,
        password: passwordInput,
      });
    }

    const profile = userProfileService.saveUserProfile({
      firstName: cleanFirst,
      lastName: cleanLast,
      email: cleanEmail,
      emailVerified: true,
      authProvider: 'password',
    });

    try {
      const deterministicUid = `vault_${btoa(cleanEmail).replace(/=/g, '')}`;
      syncUserProfile(deterministicUid, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        emailVerified: true,
        authProvider: 'password',
      }).catch(() => {});
    } catch {}

    showToast('¡Acceso confirmado con éxito!', 'success');
    onComplete();
  };

  // Reloj regresivo de 5 minutos (300s) y enfriamiento del botón Reenviar
  useEffect(() => {
    if (step !== 'verify' && step !== 'forgot_verify') return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // Escucha automática en segundo plano (cada 2 segundos) en la Pantalla 2
  // por si el usuario toca el enlace chiquito dentro de su correo
  useEffect(() => {
    if ((step !== 'verify' && step !== 'forgot_verify') || !emailInput.trim() || secondsLeft <= 0) return;

    const cleanEmail = emailInput.trim().toLowerCase();
    const interval = setInterval(async () => {
      const status = await checkEmailConfirmationStatus(cleanEmail, pendingToken);
      if (status.confirmed) {
        clearInterval(interval);
        if (step === 'forgot_verify') {
          setPasswordInput('');
          setConfirmPasswordInput('');
          setErrorMsg(null);
          showToast('¡Correo verificado! Ahora crea tu nueva contraseña.', 'success');
          setStep('forgot_new_password');
        } else {
          completeRegistration(status.email || cleanEmail, firstName || status.firstName || 'Usuario', lastName, true);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, emailInput, firstName, lastName, pendingToken, secondsLeft]);

  /* ==================== ACCESO GOOGLE CON CONTROL DE CONSENTIMIENTO ==================== */
  const handleContinueWithGoogle = async () => {
    if (isLoadingNative) return;
    setErrorMsg(null);
    setIsLoadingNative(true);

    try {
      // 1. Limpiar sesión previa para exigir siempre la selección de cuenta
      try {
        await signOutFromFirebase();
        if (window.google?.accounts?.id) {
          (window.google.accounts.id as any)?.disableAutoSelect?.();
        }
      } catch {}

      // 2. Si estamos en Android nativo, obtener las cuentas registradas en el dispositivo
      const accounts = await getNativeGoogleAccounts();
      if (accounts && accounts.length > 0) {
        setDetectedGoogleAccounts(accounts);
        setAuthorizedGoogleProfile(null);
        setIsGoogleChooserOpen(true);
        setIsLoadingNative(false);
        return;
      }

      // Si no hay cuentas devueltas directamente o en Web, abrir selector nativo
      await executeGoogleAuth();
    } catch (err: any) {
      console.warn('Error al preparar selector de Google:', err);
      await executeGoogleAuth();
    } finally {
      setIsLoadingNative(false);
    }
  };

  const executeGoogleAuth = async (targetEmail?: string) => {
    setIsLoadingNative(true);
    setErrorMsg(null);

    try {
      // 1. En Android (APK nativa), usar el selector nativo oficial de Google Accounts
      const nativeRes = await signInWithNativeGoogle(targetEmail);
      if (nativeRes.success && nativeRes.profile) {
        showToast(`Acceso autorizado para ${nativeRes.profile.email}`, 'success');
        setAuthorizedGoogleProfile(nativeRes.profile);
        setIsGoogleChooserOpen(true);
        return;
      } else if (nativeRes.cancelled) {
        showToast('Acceso cancelado', 'info');
        return;
      } else if (nativeRes.error && nativeRes.error !== 'web_environment') {
        showToast(nativeRes.error, 'error');
        setErrorMsg(nativeRes.error);
        return;
      }

      // 2. En entorno Web / AI Studio, usar el selector oficial de Google (GSI / accounts.google.com)
      const webRes = await signInWithGoogle();
      if (webRes.success && webRes.profile) {
        showToast(`Acceso autorizado para ${webRes.profile.email}`, 'success');
        setAuthorizedGoogleProfile(webRes.profile);
        setIsGoogleChooserOpen(true);
        return;
      } else if (webRes.cancelled) {
        showToast('Acceso cancelado', 'info');
        return;
      } else if (webRes.error) {
        showToast(webRes.error, 'error');
        setErrorMsg(webRes.error);
        return;
      }

      showToast('No se pudo iniciar sesión con Google', 'error');
    } catch (err: any) {
      const msg = err?.message || 'Acceso cancelado';
      showToast(msg, 'error');
      setErrorMsg(msg);
    } finally {
      setIsLoadingNative(false);
    }
  };

  const handleConfirmGoogleAndProceedToPin = () => {
    if (authorizedGoogleProfile) {
      showToast(`¡Acceso verificado para ${authorizedGoogleProfile.email}!`, 'success');
      setIsGoogleChooserOpen(false);
      onComplete();
    }
  };
  /* ==================== FIN BLOQUE PROTEGIDO ==================== */

  // Enviar código de 6 dígitos + enlace al correo al pulsar "Crear cuenta"
  const handleRegisterSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const nameCheck = validateRealPersonName(firstName, 'Nombre');
    if (!nameCheck.valid) {
      setErrorMsg(nameCheck.error || 'Por favor ingresa un nombre real válido.');
      return;
    }

    const lastNameCheck = validateRealPersonName(lastName, 'Apellidos');
    if (!lastNameCheck.valid) {
      setErrorMsg(lastNameCheck.error || 'Por favor ingresa apellidos reales válidos.');
      return;
    }

    const cleanEmail = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Por favor ingresa un correo electrónico válido (ej. correo@ejemplo.com).');
      return;
    }

    if (!isPasswordAllValid) {
      setIsPasswordFocused(true);
      setErrorMsg('La contraseña debe tener entre 6 y 12 caracteres, al menos una mayúscula y un número.');
      return;
    }

    const fullDisplayName = `${firstName.trim()} ${lastName.trim()}`.trim();

    setIsSubmitting(true);
    try {
      const res = await sendEmailPin(cleanEmail, fullDisplayName);
      if (res.success) {
        if (res.token) {
          setPendingToken(res.token);
        }
        setPinDigits(['', '', '', '', '', '']);
        setSecondsLeft(300); // 5 minutos exactos
        setResendCooldown(20);
        setStep('verify');
        showToast(`Código enviado a ${cleanEmail}`, 'success');
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 120);
      } else {
        setErrorMsg(res.error || 'No se pudo enviar el correo de verificación.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al enviar el correo de verificación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Iniciar sesión para usuarios que ya tienen cuenta creada
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!passwordInput) {
      setErrorMsg('Por favor ingresa tu contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginRegisteredAccount(cleanEmail, passwordInput);
      if (res.success) {
        await completeRegistration(
          res.email || cleanEmail,
          res.firstName || 'Usuario',
          res.lastName || '',
          false
        );
      } else {
        setErrorMsg(res.error || 'Correo o contraseña incorrectos.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paso 1 de "¿Olvidaste tu contraseña?": Validar correo registrado y enviar PIN de 6 dígitos
  const handleForgotEmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const checkRes = await checkRegisteredAccountExists(cleanEmail, false);
      if (!checkRes.exists) {
        setErrorMsg(
          'Este correo no está registrado en la aplicación. Verifica que esté bien escrito o crea una cuenta.'
        );
        setIsSubmitting(false);
        return;
      }

      if (checkRes.firstName) setFirstName(checkRes.firstName);
      if (checkRes.lastName !== undefined) setLastName(checkRes.lastName);

      const res = await sendEmailPin(cleanEmail, checkRes.firstName || 'Usuario');
      if (res.success) {
        if (res.token) {
          setPendingToken(res.token);
        }
        setPinDigits(['', '', '', '', '', '']);
        setSecondsLeft(300);
        setResendCooldown(20);
        setStep('forgot_verify');
        showToast(`Código de recuperación enviado a ${cleanEmail}`, 'success');
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 120);
      } else {
        setErrorMsg(res.error || 'No se pudo enviar el correo de recuperación.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al validar el correo electrónico.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paso 3 de "¿Olvidaste tu contraseña?": Guardar nueva contraseña y entrar
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isPasswordAllValid) {
      setIsPasswordFocused(true);
      setErrorMsg('La nueva contraseña debe tener entre 6 y 12 caracteres, al menos una mayúscula y un número.');
      return;
    }

    if (passwordInput !== confirmPasswordInput) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanEmail = emailInput.trim().toLowerCase();
      const updRes = await updateRegisteredAccountPassword(cleanEmail, passwordInput);
      if (updRes.success) {
        showToast('¡Contraseña actualizada con éxito!', 'success');
        await completeRegistration(
          updRes.email || cleanEmail,
          updRes.firstName || firstName || 'Usuario',
          updRes.lastName !== undefined ? updRes.lastName : lastName,
          false
        );
      } else {
        setErrorMsg(updRes.error || 'No se pudo actualizar la contraseña.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al actualizar la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verificar los 6 dígitos ingresados en las cajitas
  const verifySixDigits = async (codeToVerify: string) => {
    if (isVerifyingPin) return;
    setErrorMsg(null);

    if (secondsLeft <= 0) {
      setErrorMsg('El código ha caducado (válido solo por 5 minutos). Toca "Reenviar código".');
      return;
    }

    if (codeToVerify.length !== 6) {
      setErrorMsg('Por favor ingresa los 6 dígitos del código que enviamos a tu correo.');
      return;
    }

    setIsVerifyingPin(true);
    try {
      const cleanEmail = emailInput.trim().toLowerCase();
      const res = await verifyEmailPin(cleanEmail, codeToVerify, pendingToken);
      if (res.success) {
        if (step === 'forgot_verify') {
          setPasswordInput('');
          setConfirmPasswordInput('');
          setErrorMsg(null);
          showToast('¡Código verificado! Crea tu nueva contraseña.', 'success');
          setStep('forgot_new_password');
        } else {
          await completeRegistration(cleanEmail, firstName.trim() || res.firstName || 'Usuario', lastName.trim(), true);
        }
      } else {
        setErrorMsg(res.error || 'El código ingresado es incorrecto.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al verificar el código.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Manejo de escritura en cada una de las 6 cajitas
  const handleDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');
    if (errorMsg) setErrorMsg(null);

    if (cleanVal.length > 1) {
      const chars = cleanVal.slice(0, 6).split('');
      const nextDigits = [...pinDigits];
      for (let i = 0; i < 6; i++) {
        nextDigits[i] = chars[i] || '';
      }
      setPinDigits(nextDigits);
      const focusIdx = Math.min(chars.length, 5);
      inputRefs.current[focusIdx]?.focus();
      if (chars.length === 6) {
        verifySixDigits(chars.join(''));
      }
      return;
    }

    const digit = cleanVal.slice(-1);
    const nextDigits = [...pinDigits];
    nextDigits[index] = digit;
    setPinDigits(nextDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const joined = nextDigits.join('');
    if (digit && index === 5 && joined.length === 6) {
      verifySixDigits(joined);
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ==================== PANTALLA 2: VERIFICAR CÓDIGO DE 6 DÍGITOS (REGISTRO O RECUPERACIÓN DE CONTRASEÑA) ====================
  if (step === 'verify' || step === 'forgot_verify') {
    const isExpired = secondsLeft <= 0;
    const currentCode = pinDigits.join('');
    const isForgotFlow = step === 'forgot_verify';

    return (
      <div
        className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 relative select-none font-sans"
        style={{
          backgroundColor: 'var(--theme-bg-main, #060b14)',
          color: 'var(--theme-text-main, #f8fafc)',
        }}
      >
        {/* Resplandor ambiental cian */}
        <div className="fixed inset-0 pointer-events-none flex justify-center items-center overflow-hidden">
          <div className="w-[500px] h-[500px] bg-[#00e5ff]/14 rounded-full blur-[140px]" />
        </div>

        <div
          className="w-full max-w-[360px] rounded-3xl border px-6 py-8 shadow-2xl backdrop-blur-xl flex flex-col items-center animate-in fade-in duration-200 relative z-10"
          style={{
            backgroundColor: 'var(--theme-bg-card, #0a121d)',
            borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] mb-3 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
            <Mail className="w-7 h-7 stroke-[1.8]" />
          </div>

          <h1 className="text-[23px] font-bold tracking-tight text-center text-white">
            {isForgotFlow ? 'Código de recuperación' : 'Verifica tu correo'}
          </h1>
          <p className="text-[13.5px] text-slate-400 text-center mt-1.5 mb-4 leading-relaxed">
            Enviamos un código de 6 dígitos a{' '}
            <span className="font-semibold text-slate-200 break-all">
              {emailInput.trim()}
            </span>
          </p>

          {/* Contador de vigencia de 5 minutos */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-5 border ${
              isExpired
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : secondsLeft <= 60
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isExpired
                ? 'Código caducado (límite de 5 min)'
                : `Válido por ${formatCountdown(secondsLeft)}`}
            </span>
          </div>

          {/* Las 6 cajitas para el código */}
          <div className="w-full flex items-center justify-between gap-2 mb-4">
            {pinDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                disabled={isExpired || isVerifyingPin}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                className="w-11 h-13 rounded-xl border border-slate-700 bg-slate-900/80 focus:border-[#00e5ff] focus:ring-2 focus:ring-[#00e5ff]/20 text-center text-[20px] font-bold text-white outline-none transition-all disabled:opacity-40"
              />
            ))}
          </div>

          {errorMsg && (
            <div className="w-full p-3 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 text-rose-400 text-xs text-left animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => verifySixDigits(currentCode)}
            disabled={isVerifyingPin || isExpired || currentCode.length !== 6}
            className="vault-auth-submit-btn w-full h-[50px] rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 font-bold text-[15px] shadow-lg shadow-black/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isVerifyingPin ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <span>Verificar código</span>
            )}
          </button>

          {!isExpired && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-3">
              <Loader2 className="w-3 h-3 animate-spin text-[#00e5ff]" />
              <span>También puedes tocar el enlace dentro del correo</span>
            </div>
          )}

          <div className="w-full flex items-center justify-between mt-6 pt-4 border-t border-slate-800 text-[13px]">
            <button
              type="button"
              onClick={() => (isForgotFlow ? handleForgotEmailSubmit() : handleRegisterSubmit())}
              disabled={isSubmitting || resendCooldown > 0}
              className="inline-flex items-center gap-1.5 text-[#00e5ff] hover:underline font-semibold cursor-pointer disabled:opacity-45 disabled:no-underline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>
                {isSubmitting
                  ? 'Enviando...'
                  : resendCooldown > 0
                  ? `Reenviar (${resendCooldown}s)`
                  : 'Reenviar código'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(isForgotFlow ? 'forgot_email' : 'register');
                setErrorMsg(null);
              }}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cambiar correo</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== PANTALLA: OLVIDASTE TU CONTRASEÑA (PASO 1: INGRESAR CORREO) ====================
  if (step === 'forgot_email') {
    return (
      <div
        className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 relative select-none font-sans"
        style={{
          backgroundColor: 'var(--theme-bg-main, #060b14)',
          color: 'var(--theme-text-main, #f8fafc)',
        }}
      >
        {/* Resplandor ambiental cian */}
        <div className="fixed inset-0 pointer-events-none flex justify-center items-center overflow-hidden">
          <div className="w-[500px] h-[500px] bg-[#00e5ff]/14 rounded-full blur-[140px]" />
        </div>

        <div
          className="w-full max-w-[360px] rounded-3xl border px-6 py-8 shadow-2xl backdrop-blur-xl flex flex-col items-center animate-in fade-in duration-200 relative z-10"
          style={{
            backgroundColor: 'var(--theme-bg-card, #0a121d)',
            borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
          }}
        >
          <div className="w-13 h-13 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] mb-3 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
            <Mail className="w-6 h-6 stroke-[1.75]" />
          </div>

          <h1 className="text-[22px] font-bold tracking-tight text-center text-white">
            Recuperar contraseña
          </h1>
          <p className="text-[13.5px] text-slate-400 text-center mt-1.5 mb-6 leading-relaxed">
            Ingresa el correo electrónico con el que registraste tu cuenta. Validaremos que exista y te enviaremos un código de 6 dígitos.
          </p>

          <form onSubmit={handleForgotEmailSubmit} className="w-full space-y-5">
            <div className="w-full">
              <div className="flex items-center border-b border-slate-700 focus-within:border-[#00e5ff] pb-2.5 transition-colors">
                <Mail className="w-[19px] h-[19px] text-slate-400 stroke-[1.7] shrink-0" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Tu correo registrado"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  required
                  autoFocus
                  className="w-full pl-3 pr-2 bg-transparent text-[15px] font-normal placeholder-slate-500 text-white outline-none"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 text-rose-400 text-xs text-left animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !emailInput.trim()}
              className="vault-auth-submit-btn w-full h-[50px] rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 font-bold text-[15px] shadow-lg shadow-black/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Validando correo...</span>
                </>
              ) : (
                <span>Enviar código de verificación</span>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setStep('login');
              setErrorMsg(null);
            }}
            className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] text-slate-400 hover:text-[#00e5ff] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio de sesión</span>
          </button>
        </div>
      </div>
    );
  }

  // ==================== PANTALLA: OLVIDASTE TU CONTRASEÑA (PASO 3: CREAR NUEVA CONTRASEÑA) ====================
  if (step === 'forgot_new_password') {
    return (
      <div
        className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 relative select-none font-sans"
        style={{
          backgroundColor: 'var(--theme-bg-main, #060b14)',
          color: 'var(--theme-text-main, #f8fafc)',
        }}
      >
        {/* Resplandor ambiental cian */}
        <div className="fixed inset-0 pointer-events-none flex justify-center items-center overflow-hidden">
          <div className="w-[500px] h-[500px] bg-[#00e5ff]/14 rounded-full blur-[140px]" />
        </div>

        <div
          className="w-full max-w-[360px] rounded-3xl border px-6 py-8 shadow-2xl backdrop-blur-xl flex flex-col items-center animate-in fade-in duration-200 relative z-10"
          style={{
            backgroundColor: 'var(--theme-bg-card, #0a121d)',
            borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
          }}
        >
          <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <Lock className="w-6 h-6 stroke-[1.75]" />
          </div>

          <h1 className="text-[22px] font-bold tracking-tight text-center text-white">
            Nueva contraseña
          </h1>
          <p className="text-[13.5px] text-slate-400 text-center mt-1.5 mb-6 leading-relaxed">
            Crea una nueva contraseña segura para{' '}
            <span className="font-semibold text-slate-200 break-all">
              {emailInput.trim()}
            </span>
          </p>

          <form onSubmit={handleSaveNewPassword} className="w-full space-y-5">
            <div className="w-full">
              <div className="flex items-center border-b border-slate-700 focus-within:border-[#00e5ff] pb-2.5 transition-colors">
                <Lock className="w-[19px] h-[19px] text-slate-400 stroke-[1.7] shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Nueva contraseña"
                  maxLength={12}
                  value={passwordInput}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  onChange={(e) => {
                    setPasswordInput(e.target.value.slice(0, 12));
                    if (errorMsg) setErrorMsg(null);
                  }}
                  required
                  autoFocus
                  className="w-full pl-3 pr-2 bg-transparent text-[15px] font-normal placeholder-slate-500 text-white outline-none"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5 shrink-0"
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px] stroke-[1.7]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px] stroke-[1.7]" />
                  )}
                </button>
              </div>

              <div
                className={`overflow-hidden transition-all duration-200 ease-out ${
                  showPasswordDropdown
                    ? 'max-h-36 opacity-100 mt-2.5'
                    : 'max-h-0 opacity-0 mt-0 pointer-events-none'
                }`}
              >
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2.5 space-y-1.5">
                  <div
                    className={`flex items-center gap-2 text-[11.5px] transition-colors ${
                      passHasValidLength
                        ? 'text-emerald-400 font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 transition-all ${
                        passHasValidLength
                          ? 'opacity-100 stroke-[2.6] text-emerald-400'
                          : 'opacity-30 stroke-[1.7]'
                      }`}
                    />
                    <span>Entre 6 y 12 caracteres ({passwordInput.length}/12)</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-[11.5px] transition-colors ${
                      passHasUppercase
                        ? 'text-emerald-400 font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 transition-all ${
                        passHasUppercase
                          ? 'opacity-100 stroke-[2.6] text-emerald-400'
                          : 'opacity-30 stroke-[1.7]'
                      }`}
                    />
                    <span>Al menos una letra mayúscula (A-Z)</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-[11.5px] transition-colors ${
                      passHasNumber
                        ? 'text-emerald-400 font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 transition-all ${
                        passHasNumber
                          ? 'opacity-100 stroke-[2.6] text-emerald-400'
                          : 'opacity-30 stroke-[1.7]'
                      }`}
                    />
                    <span>Al menos un número (0-9)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="flex items-center border-b border-slate-700 focus-within:border-[#00e5ff] pb-2.5 transition-colors">
                <Lock className="w-[19px] h-[19px] text-slate-400 stroke-[1.7] shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirmar nueva contraseña"
                  maxLength={12}
                  value={confirmPasswordInput}
                  onChange={(e) => {
                    setConfirmPasswordInput(e.target.value.slice(0, 12));
                    if (errorMsg) setErrorMsg(null);
                  }}
                  required
                  className="w-full pl-3 pr-2 bg-transparent text-[15px] font-normal placeholder-slate-500 text-white outline-none"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 text-rose-400 text-xs text-left animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="vault-auth-submit-btn w-full h-[50px] rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 font-bold text-[15px] shadow-lg shadow-black/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Guardando contraseña...</span>
                </>
              ) : (
                <span>Guardar y entrar</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isLoginMode = step === 'login';

  // ==================== PANTALLA 1: CREAR CUENTA / INICIAR SESIÓN (DISEÑO MINIMALISTA DE LÍNEA FINA) ====================
  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 relative select-none font-sans"
      style={{
        backgroundColor: 'var(--theme-bg-main, #060b14)',
        color: 'var(--theme-text-main, #f8fafc)',
      }}
    >
      {/* Resplandor ambiental cian */}
      <div className="fixed inset-0 pointer-events-none flex justify-center items-center overflow-hidden">
        <div className="w-[500px] h-[500px] bg-[#00e5ff]/14 rounded-full blur-[140px]" />
      </div>

      <div
        className="w-full max-w-[360px] rounded-3xl border px-6 py-8 shadow-2xl backdrop-blur-xl flex flex-col items-center animate-in fade-in duration-200 relative z-10"
        style={{
          backgroundColor: 'var(--theme-bg-card, #0a121d)',
          borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
        }}
      >
        {/* Ícono superior */}
        <div className="w-13 h-13 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] mb-3 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
          <Lock className="w-6 h-6 stroke-[1.75]" />
        </div>

        {/* Título y subtítulo */}
        <h1 className="text-[24px] font-bold tracking-tight text-center text-white">
          Mi bóveda
        </h1>
        <p className="text-[14px] text-slate-400 text-center mt-1 mb-7 max-w-[260px] leading-snug font-normal">
          {isLoginMode
            ? 'Inicia sesión con tu cuenta registrada'
            : 'Crea tu cuenta para guardar tus archivos'}
        </p>

        {/* Formulario con campos de línea inferior fina e iconos lineales */}
        <form
          onSubmit={isLoginMode ? handleLoginSubmit : handleRegisterSubmit}
          className="w-full space-y-5"
        >
          {!isLoginMode && (
            <>
              {/* 1. Campo "Nombre" con icono lineal de usuario */}
              <div className="w-full">
                <div
                  className={`flex items-center border-b pb-2.5 transition-colors ${
                    isFirstNameInvalid
                      ? 'border-rose-500'
                      : 'border-slate-700 focus-within:border-[#00e5ff]'
                  }`}
                >
                  <User className="w-[19px] h-[19px] text-slate-400 stroke-[1.7] shrink-0" />
                  <input
                    type="text"
                    autoComplete="given-name"
                    placeholder="Nombre"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(sanitizePersonNameInput(e.target.value));
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full pl-3 pr-2 bg-transparent text-[15px] font-normal placeholder-slate-500 text-white outline-none"
                  />
                  {isFirstNameReal && (
                    <Check className="w-4 h-4 text-emerald-400 stroke-[2.2] shrink-0" />
                  )}
                </div>
                {isFirstNameInvalid && (
                  <p className="mt-1 pl-1 text-[11px] text-rose-400 animate-in fade-in duration-150">
                    {firstNameValidation.error || 'Ingresa un nombre real válido.'}
                  </p>
                )}
              </div>

              {/* 2. Campo "Apellidos" con icono lineal de tarjeta de identidad */}
              <div className="w-full">
                <div
                  className={`flex items-center border-b pb-2.5 transition-colors ${
                    isLastNameInvalid
                      ? 'border-rose-500'
                      : 'border-slate-700 focus-within:border-[#00e5ff]'
                  }`}
                >
                  <IdCard className="w-[19px] h-[19px] text-slate-400 stroke-[1.7] shrink-0" />
                  <input
                    type="text"
                    autoComplete="family-name"
                    placeholder="Apellidos"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(sanitizePersonNameInput(e.target.value));
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full pl-3 pr-2 bg-transparent text-[15px] font-normal placeholder-slate-500 text-white outline-none"
                  />
                  {isLastNameReal && (
                    <Check className="w-4 h-4 text-emerald-400 stroke-[2.2] shrink-0" />
                  )}
                </div>
                {isLastNameInvalid && (
                  <p className="mt-1 pl-1 text-[11px] text-rose-400 animate-in fade-in duration-150">
                    {lastNameValidation.error || 'Ingresa apellidos reales válidos.'}
                  </p>
                )}
              </div>
            </>
          )}

          {/* 3. Campo "Correo electrónico" con icono lineal de sobre */}
          <div className="w-full">
            <div className="flex items-center border-b border-slate-700 focus-within:border-[#00e5ff] pb-2.5 transition-colors">
              <Mail className="w-[19px] h-[19px] text-slate-400 stroke-[1.7] shrink-0" />
              <input
                type="email"
                autoComplete="email"
                placeholder="Correo electrónico"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full pl-3 pr-2 bg-transparent text-[15px] font-normal placeholder-slate-500 text-white outline-none"
              />
            </div>
          </div>

          {/* 4. Campo "Contraseña" con candado a la izquierda, ojo a la derecha y desplegable dinámico */}
          <div className="w-full">
            <div className="flex items-center border-b border-slate-700 focus-within:border-[#00e5ff] pb-2.5 transition-colors">
              <Lock className="w-[19px] h-[19px] text-slate-400 stroke-[1.7] shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                placeholder="Contraseña"
                maxLength={12}
                value={passwordInput}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                onChange={(e) => {
                  setPasswordInput(e.target.value.slice(0, 12));
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full pl-3 pr-2 bg-transparent text-[15px] font-normal placeholder-slate-500 text-white outline-none"
              />
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5 shrink-0"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <EyeOff className="w-[18px] h-[18px] stroke-[1.7]" />
                ) : (
                  <Eye className="w-[18px] h-[18px] stroke-[1.7]" />
                )}
              </button>
            </div>

            {/* Enlace "¿Olvidaste tu contraseña?" en modo inicio de sesión */}
            {isLoginMode && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setStep('forgot_email');
                  }}
                  className="text-[12.5px] text-[#00e5ff] hover:underline font-semibold cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {/* Desplegable dinámico que aparece instantáneamente cuando el campo recibe foco */}
            {!isLoginMode && (
              <div
                className={`overflow-hidden transition-all duration-200 ease-out ${
                  showPasswordDropdown
                    ? 'max-h-36 opacity-100 mt-2.5'
                    : 'max-h-0 opacity-0 mt-0 pointer-events-none'
                }`}
              >
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2.5 space-y-1.5">
                  <div
                    className={`flex items-center gap-2 text-[11.5px] transition-colors ${
                      passHasValidLength
                        ? 'text-emerald-400 font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 transition-all ${
                        passHasValidLength
                          ? 'opacity-100 stroke-[2.6] text-emerald-400'
                          : 'opacity-30 stroke-[1.7]'
                      }`}
                    />
                    <span>Entre 6 y 12 caracteres ({passwordInput.length}/12)</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 text-[11.5px] transition-colors ${
                      passHasUppercase
                        ? 'text-emerald-400 font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 transition-all ${
                        passHasUppercase
                          ? 'opacity-100 stroke-[2.6] text-emerald-400'
                          : 'opacity-30 stroke-[1.7]'
                      }`}
                    />
                    <span>Al menos una letra mayúscula (A-Z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 text-[11.5px] transition-colors ${
                      passHasNumber
                        ? 'text-emerald-400 font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 transition-all ${
                        passHasNumber
                          ? 'opacity-100 stroke-[2.6] text-emerald-400'
                          : 'opacity-30 stroke-[1.7]'
                      }`}
                    />
                    <span>Al menos un número (0-9)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mensaje de error */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 text-rose-400 text-xs text-left animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botón de acción principal de ancho completo */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="vault-auth-submit-btn w-full h-[50px] rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 font-bold text-[15px] shadow-lg shadow-black/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isLoginMode ? 'Iniciando sesión...' : 'Enviando código...'}</span>
              </>
            ) : (
              <span>{isLoginMode ? 'Iniciar sesión' : 'Crear cuenta'}</span>
            )}
          </button>
        </form>

        {/* Enlace de navegación secundaria centrado */}
        <div className="mt-4 text-center text-[13.5px] text-slate-400">
          {isLoginMode ? (
            <>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setStep('register');
                  setErrorMsg(null);
                }}
                className="text-[#00e5ff] font-semibold hover:underline cursor-pointer"
              >
                Crear cuenta
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setErrorMsg(null);
                }}
                className="text-[#00e5ff] font-semibold hover:underline cursor-pointer"
              >
                Inicia sesión
              </button>
            </>
          )}
        </div>

        {/* Separador "o continúa con" */}
        <div className="relative my-5 w-full flex items-center justify-center">
          <div className="w-full border-t border-slate-800" />
          <span
            className="absolute bg-[#0a121d] px-3 text-[12px] text-slate-400 font-normal"
            style={{ backgroundColor: 'var(--theme-bg-card, #0a121d)' }}
          >
            o continúa con
          </span>
        </div>

        {/* Botón secundario de ancho completo para Google (conectado al bloque protegido intacto) */}
        <button
          type="button"
          onClick={handleContinueWithGoogle}
          disabled={isLoadingNative}
          className="vault-google-auth-btn w-full h-[50px] rounded-2xl bg-[#080e19]/80 hover:bg-[#121c2e] border border-slate-700/80 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-65 text-slate-100 font-medium"
        >
          {isLoadingNative ? (
            <div className="flex items-center gap-2 text-[14.5px] font-medium text-white">
              <Loader2 className="w-5 h-5 animate-spin text-[#00e5ff]" />
              <span>Abriendo Google...</span>
            </div>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="font-semibold text-[14.5px] text-white">
                Continuar con Google
              </span>
            </>
          )}
        </button>
      </div>

      {/* ==================== MODAL SELECTOR Y AUTORIZACIÓN DE GOOGLE ==================== */}
      {isGoogleChooserOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-[390px] rounded-3xl border p-6 shadow-2xl relative flex flex-col items-center select-none"
            style={{
              backgroundColor: 'var(--theme-bg-card, #0a121d)',
              borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
              color: 'var(--theme-text-main, #f8fafc)',
            }}
          >
            {/* Botón cerrar */}
            <button
              type="button"
              onClick={() => {
                setIsGoogleChooserOpen(false);
                setAuthorizedGoogleProfile(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo de Google */}
            <div className="w-14 h-14 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(0,229,255,0.2)]">
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>

            {authorizedGoogleProfile ? (
              /* Caso 1: Cuenta autorizada y lista para confirmar */
              <div className="w-full flex flex-col items-center text-center">
                <h3 className="text-xl font-bold text-white tracking-tight mb-1">
                  Acceso Autorizado
                </h3>
                <p className="text-xs text-slate-400 mb-5">
                  Confirmaste tu identidad con Google para ingresar a Mi Bóveda
                </p>

                {/* Tarjeta de cuenta elegida */}
                <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 flex items-center gap-3.5 mb-5 shadow-lg">
                  {authorizedGoogleProfile.photoURL ? (
                    <img
                      src={authorizedGoogleProfile.photoURL}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full border border-[#00e5ff]/50 object-cover shrink-0 shadow-[0_0_12px_rgba(0,229,255,0.3)]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#00e5ff]/15 border border-[#00e5ff]/40 text-[#00e5ff] font-bold text-lg flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,229,255,0.2)]">
                      {(authorizedGoogleProfile.firstName || 'G').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex flex-col text-left overflow-hidden min-w-0">
                    <span className="text-[14.5px] font-bold text-white truncate">
                      {authorizedGoogleProfile.firstName} {authorizedGoogleProfile.lastName || ''}
                    </span>
                    <span className="text-[12.5px] text-[#00e5ff] font-medium truncate">
                      {authorizedGoogleProfile.email}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-semibold">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Verificado por Google</span>
                    </div>
                  </div>
                </div>

                {/* Botón principal: Avanzar al PIN de 4 dígitos */}
                <button
                  type="button"
                  onClick={handleConfirmGoogleAndProceedToPin}
                  className="w-full h-[50px] rounded-2xl bg-gradient-to-r from-[#00b4d8] to-[#0077b6] hover:brightness-110 active:scale-[0.98] text-white font-bold text-[14.5px] flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,180,216,0.35)] transition-all cursor-pointer mb-3"
                >
                  <span>Continuar a Crear PIN (4 dígitos)</span>
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>

                {/* Botón secundario: Elegir otra cuenta */}
                <button
                  type="button"
                  onClick={() => {
                    setAuthorizedGoogleProfile(null);
                    executeGoogleAuth();
                  }}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium cursor-pointer"
                >
                  ¿Deseas usar otra cuenta de Google?
                </button>
              </div>
            ) : (
              /* Caso 2: Selector de cuentas detectadas */
              <div className="w-full flex flex-col items-center">
                <h3 className="text-xl font-bold text-white tracking-tight mb-1">
                  Elige una cuenta
                </h3>
                <p className="text-xs text-slate-400 mb-4 text-center">
                  Selecciona la cuenta de Google con la que deseas proteger tus archivos
                </p>

                {/* Lista de cuentas disponibles */}
                <div className="w-full flex flex-col gap-2.5 max-h-[220px] overflow-y-auto mb-4">
                  {detectedGoogleAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => executeGoogleAuth(acc.email)}
                      className="w-full p-3 rounded-2xl bg-slate-900/80 hover:bg-[#121c2e] border border-slate-700/80 hover:border-[#00e5ff]/50 transition-all flex items-center gap-3 text-left cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] font-bold text-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {acc.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0 overflow-hidden">
                        <span className="text-[13.5px] font-semibold text-white truncate group-hover:text-[#00e5ff] transition-colors">
                          {acc.name || acc.email.split('@')[0]}
                        </span>
                        <span className="text-[12px] text-slate-400 truncate">
                          {acc.email}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Opción para usar otra cuenta */}
                <button
                  type="button"
                  onClick={() => executeGoogleAuth()}
                  className="w-full h-[46px] rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer mb-2"
                >
                  <span>+ Usar otra cuenta de Google</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
