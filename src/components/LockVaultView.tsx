import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Lock,
  ShieldAlert,
  KeyRound,
  RotateCcw,
  AlertTriangle,
  Fingerprint,
  CheckCircle2,
  X,
  Mail,
  Send,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Clock,
  RefreshCw,
  ChevronLeft,
  AtSign,
} from 'lucide-react';
import { deriveKeyFromPin, verifyKey, hexToBuf, verifyDuressPinHash } from '../crypto/vaultCrypto';
import {
  isBiometricsEnrolled,
  isBiometricsAutoPromptEnabled,
  hasBiometricCredentials,
  enrollBiometrics,
  authenticateWithBiometrics,
} from '../services/biometricService';
import {
  setupAutomaticEmailRecoveryEscrow,
  executePinResetAfterEmailVerified,
} from '../services/recoveryKeyService';
import {
  checkRegisteredAccountExists,
  sendEmailPin,
  verifyEmailPin,
  checkEmailConfirmationStatus,
} from '../services/emailVerificationService';
import { themeService, VaultTheme } from '../services/themeService';
import { registerBackHandler } from '../services/backButtonService';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { userProfileService, UserProfile } from '../services/userProfileService';
import { PinKeypad } from './PinKeypad';

interface LockVaultViewProps {
  onUnlock: (masterKey: CryptoKey, pin?: string) => void;
  onResetVaultRequest: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'alert' | 'error') => void;
  onGoToRegister?: () => void;
}

export const LockVaultView: React.FC<LockVaultViewProps> = ({
  onUnlock,
  onResetVaultRequest,
  showToast,
  onGoToRegister,
}) => {
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Recovery via Email Verification states (Step 1: Email -> Step 2: 6-digit code -> Step 3: New 4-digit PIN)
  const [forgotStep, setForgotStep] = useState<'email_input' | 'code_verify' | 'new_pin_input' | 'no_key'>('email_input');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotFirstName, setForgotFirstName] = useState('Usuario');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotToken, setForgotToken] = useState<string | null>(null);
  const [forgotSecondsLeft, setForgotSecondsLeft] = useState(300);
  const [forgotResendCooldown, setForgotResendCooldown] = useState(0);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');
  const [showNewPinText, setShowNewPinText] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<VaultTheme>(() => themeService.getTheme());

  useEffect(() => {
    return themeService.subscribe((t) => setCurrentTheme(t));
  }, []);

  const isLightTheme = currentTheme === 'light';
  const isForgotEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim());

  // User profile and welcome mode state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => userProfileService.getUserProfile());
  const isRegisteredUser = Boolean(userProfile && (userProfile.firstName || userProfile.email));
  const [authViewMode, setAuthViewMode] = useState<'welcome' | 'keypad'>(() => {
    return userProfileService.isUserRegistered() ? 'welcome' : 'keypad';
  });

  useEffect(() => {
    const syncProfile = () => {
      const latest = userProfileService.getUserProfile();
      setUserProfile(latest);
    };
    syncProfile();
    window.addEventListener('storage', syncProfile);
    window.addEventListener('focus', syncProfile);
    const unsub = userProfileService.subscribe((p) => {
      setUserProfile(p);
      if (!p) {
        setAuthViewMode('keypad');
      }
    });
    return () => {
      unsub();
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener('focus', syncProfile);
    };
  }, []);

  // Toma todos los nombres escritos en la caja de texto "Nombre" (ej. "José Manuel"), sin recortar el segundo nombre
  const userDisplayName =
    userProfile?.firstName?.replace(/\s+/g, ' ').trim() || 'José Manuel';

  // Saludo dinámico según la hora local del dispositivo (Buenos días, Buenas tardes, Buenas noches)
  const getTimeGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Buenos días';
    }
    if (hour >= 12 && hour < 20) {
      return 'Buenas tardes';
    }
    return 'Buenas noches';
  };

  const userInitials = userProfileService.getInitials(userProfile) || 'JM';

  // Open Forgot PIN flow
  const handleOpenForgotPin = () => {
    setForgotError(null);
    setForgotEmail('');
    setForgotCode('');
    setForgotToken(null);
    setNewPinInput('');
    setConfirmNewPinInput('');
    setIsEmailFocused(true);
    setForgotStep('email_input');
    setShowForgotModal(true);
  };

  // Intercept Android back gesture (left/right edge swipe), touch swipe, and hardware back button when Forgot PIN screen is open
  const forgotStepRef = useRef(forgotStep);
  forgotStepRef.current = forgotStep;
  const wasForgotOpenRef = useRef(false);
  const forgotTouchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleForgotBackNavigation = useCallback(() => {
    if (forgotStepRef.current !== 'email_input') {
      setForgotStep('email_input');
      setForgotError(null);
      return;
    }
    setShowForgotModal(false);
  }, []);

  useEffect(() => {
    if (showForgotModal && !wasForgotOpenRef.current) {
      wasForgotOpenRef.current = true;
      try {
        window.history.pushState({ lockOverlay: 'forgot_pin' }, '');
      } catch {}
    } else if (!showForgotModal && wasForgotOpenRef.current) {
      wasForgotOpenRef.current = false;
      try {
        if (window.history.state?.lockOverlay === 'forgot_pin') {
          (window as any).__ignoreNextPopState = true;
          window.history.back();
        }
      } catch {}
    }
  }, [showForgotModal]);

  useEffect(() => {
    if (!showForgotModal) return;

    const unregister = registerBackHandler(
      'lock-forgot-pin-view',
      () => {
        if (forgotStepRef.current !== 'email_input') {
          setForgotStep('email_input');
          setForgotError(null);
          try {
            if (window.history.state?.lockOverlay !== 'forgot_pin') {
              window.history.pushState({ lockOverlay: 'forgot_pin' }, '');
            }
          } catch {}
          return true;
        }
        wasForgotOpenRef.current = false;
        setShowForgotModal(false);
        return true;
      },
      100
    );

    return () => {
      unregister();
    };
  }, [showForgotModal]);

  // Countdown timer for 6-digit email recovery code
  useEffect(() => {
    if (!showForgotModal || forgotStep !== 'code_verify') return;
    const timer = setInterval(() => {
      setForgotSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setForgotResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showForgotModal, forgotStep]);

  // Background listener in case user clicks the confirmation link inside the email
  useEffect(() => {
    if (!showForgotModal || forgotStep !== 'code_verify' || !forgotEmail.trim() || forgotSecondsLeft <= 0) return;
    const cleanEmail = forgotEmail.trim().toLowerCase();
    const interval = setInterval(async () => {
      const status = await checkEmailConfirmationStatus(cleanEmail, forgotToken);
      if (status.confirmed) {
        clearInterval(interval);
        setForgotError(null);
        showToast('¡Correo confirmado! Ahora elige tu nuevo PIN.', 'success');
        setForgotStep('new_pin_input');
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [showForgotModal, forgotStep, forgotEmail, forgotToken, forgotSecondsLeft]);

  // Step 1: Validate that the entered email is registered in the app and send 6-digit code
  const handleSendRecoveryEmailCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setForgotError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsForgotLoading(true);
    setForgotError(null);

    try {
      const checkRes = await checkRegisteredAccountExists(cleanEmail, true);
      if (!checkRes.exists) {
        setForgotError(
          checkRes.error || 'Este correo no está registrado en la aplicación. Verifica que esté bien escrito.'
        );
        setIsForgotLoading(false);
        return;
      }

      const targetName = checkRes.firstName || 'Usuario';
      setForgotFirstName(targetName);

      const sendRes = await sendEmailPin(cleanEmail, targetName);
      if (sendRes.success) {
        setForgotToken(sendRes.token || null);
        setForgotCode('');
        setForgotSecondsLeft(300);
        setForgotResendCooldown(20);
        setForgotError(null);
        setForgotStep('code_verify');
        showToast(`Código de recuperación enviado a ${cleanEmail}`, 'success');
      } else {
        setForgotError(sendRes.error || 'No se pudo enviar el código de verificación.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Error al validar el correo.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Step 2: Verify the 6-digit code sent to the email
  const handleVerifyRecoveryEmailCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = forgotCode.replace(/\D/g, '').trim();
    if (forgotSecondsLeft <= 0) {
      setForgotError('El código ha expirado (válido por 5 minutos). Toca "Reenviar código".');
      return;
    }
    if (cleanCode.length !== 6) {
      setForgotError('Por favor ingresa los 6 dígitos del código enviado a tu correo.');
      return;
    }

    setIsForgotLoading(true);
    setForgotError(null);

    try {
      const cleanEmail = forgotEmail.trim().toLowerCase();
      const res = await verifyEmailPin(cleanEmail, cleanCode, forgotToken);
      if (res.success) {
        setForgotError(null);
        setForgotStep('new_pin_input');
      } else {
        setForgotError(res.error || 'El código de 6 dígitos es incorrecto.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Error al verificar el código.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Step 3: Change PIN and restore vault access without losing photos
  const handleResetPinWithRecovery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newPinInput.length !== 4) {
      setForgotError('El nuevo PIN debe tener exactamente 4 dígitos.');
      return;
    }
    if (newPinInput !== confirmNewPinInput) {
      setForgotError('Los nuevos PINs no coinciden.');
      return;
    }

    setIsForgotLoading(true);
    setForgotError(null);

    try {
      const result = await executePinResetAfterEmailVerified(newPinInput);
      if (result.success && result.masterKey) {
        showToast('¡PIN restablecido con éxito! Tus archivos están intactos.', 'success');
        setShowForgotModal(false);
        onUnlock(result.masterKey, newPinInput);
      } else {
        setForgotError(result.error || 'Error al restablecer el PIN.');
      }
    } catch (err: any) {
      console.error('Reset error:', err);
      setForgotError(err?.message || 'Error al restablecer el PIN.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Biometric fingerprint states
  const [isBioEnrolled, setIsBioEnrolled] = useState(() => isBiometricsAutoPromptEnabled());
  const [isBioLoading, setIsBioLoading] = useState(false);
  const [showEnrollBioModal, setShowEnrollBioModal] = useState(false);
  const [enrollPin, setEnrollPin] = useState('');
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [isEnrollingBio, setIsEnrollingBio] = useState(false);

  useEffect(() => {
    setIsBioEnrolled(isBiometricsAutoPromptEnabled());
  }, [authViewMode]);

  const expectedLength = parseInt(localStorage.getItem('vault_pin_length') || '4', 10);
  const isUnlockingRef = useRef<boolean>(false);
  const isAuthenticatingBiometricsRef = useRef<boolean>(false);
  const hasAutoTriggeredBioRef = useRef<boolean>(false);
  const attemptUnlockRef = useRef<(pin: string, method?: 'pin' | 'biometric') => Promise<void>>(async () => {});

  // Helper de tiempos de bloqueo progresivo:
  // 3er fallo consecutivo: 15 segundos
  // 4to fallo consecutivo: 20 segundos
  // 5to o más fallos: 30 segundos
  const getLockoutDurationSeconds = (streak: number): number => {
    if (streak === 3) return 15;
    if (streak === 4) return 20;
    if (streak >= 5) return 30;
    return 0;
  };

  // Formato MM:SS para cuenta regresiva
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Estado de bloqueo temporal con persistencia
  const [remainingLockout, setRemainingLockout] = useState<number>(() => {
    try {
      const until = Number(localStorage.getItem('nullvault_lockout_until') || '0');
      const diff = Math.ceil((until - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  });

  // Temporizador de cuenta regresiva en vivo y sincronización al volver de segundo plano
  useEffect(() => {
    if (remainingLockout <= 0) return;

    const syncLockoutRemaining = () => {
      const until = Number(localStorage.getItem('nullvault_lockout_until') || '0');
      const diff = Math.ceil((until - Date.now()) / 1000);
      if (diff <= 0) {
        setRemainingLockout(0);
        localStorage.removeItem('nullvault_lockout_until');
        setErrorMessage(null);
      } else {
        setRemainingLockout(diff);
      }
    };

    const timer = setInterval(syncLockoutRemaining, 1000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        syncLockoutRemaining();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', syncLockoutRemaining);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', syncLockoutRemaining);
    };
  }, [remainingLockout]);

  // Intercept back gesture / hardware back button when on keypad mode to return to welcome screen
  useEffect(() => {
    if (authViewMode === 'keypad' && isRegisteredUser && !showForgotModal && remainingLockout <= 0) {
      const unregister = registerBackHandler(
        'lock-vault-keypad-mode',
        () => {
          setAuthViewMode('welcome');
          setErrorMessage(null);
          setPin('');
          return true;
        },
        40
      );
      return () => unregister();
    }
  }, [authViewMode, isRegisteredUser, showForgotModal, remainingLockout]);

  /* ==================== BLOQUE DE HISTORIAL (REGISTRO) ==================== */
  const recordAccessLog = (
    type: 'success' | 'failed',
    method: 'pin' | 'biometric' = 'pin',
    isLockout: boolean = false,
    attemptNumber?: number,
    lockoutDuration?: number
  ) => {
    try {
      const logs = JSON.parse(localStorage.getItem('nullvault_access_logs') || '[]');
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (type === 'success') {
        const prevFailedSince = Number(localStorage.getItem('nullvault_failed_since_last_success') || '0');
        const prevStreak = Number(localStorage.getItem('nullvault_failed_streak') || '0');
        const totalFailedBefore = prevFailedSince > 0 ? prevFailedSince : prevStreak;

        // Guardar cuántos fallos ocurrieron antes de este acceso exitoso para el banner (Requisito 7)
        localStorage.setItem('nullvault_failed_before_last_success', totalFailedBefore.toString());
        // Reiniciar contadores de fallos consecutivos a 0 (Requisito 1)
        localStorage.setItem('nullvault_failed_streak', '0');
        localStorage.setItem('nullvault_failed_since_last_success', '0');
        localStorage.removeItem('nullvault_lockout_until');

        logs.unshift({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: 'success',
          method,
          isLockout: false,
          title: method === 'biometric' ? 'Acceso biométrico correcto' : 'Acceso correcto',
          time: timeStr,
          timestamp: Date.now(),
        });
        // Límite estricto de 100 registros eliminando los más antiguos
        localStorage.setItem('nullvault_access_logs', JSON.stringify(logs.slice(0, 100)));
        localStorage.setItem('nullvault_last_access', timeStr);
      } else {
        if (!isLockout) {
          const streak = Number(localStorage.getItem('nullvault_failed_streak') || '0') + 1;
          localStorage.setItem('nullvault_failed_streak', streak.toString());
          localStorage.setItem('nullvault_last_failed_time', timeStr);

          const failedSince = Number(localStorage.getItem('nullvault_failed_since_last_success') || '0') + 1;
          localStorage.setItem('nullvault_failed_since_last_success', failedSince.toString());

          logs.unshift({
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: 'failed',
            method,
            isLockout: false,
            attemptNumber: attemptNumber ?? streak,
            title: method === 'biometric' ? 'Huella no reconocida' : 'PIN incorrecto',
            time: timeStr,
            timestamp: Date.now(),
          });
        } else {
          // Registro extra de tipo "bloqueado" (Requisito 4)
          // Nota: No incrementa los contadores de intentos fallidos, ya que es el registro del estado de bloqueo
          logs.unshift({
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}_lock`,
            type: 'failed',
            method,
            isLockout: true,
            lockoutDuration: lockoutDuration ?? 30,
            title: 'Bóveda bloqueada por intentos',
            time: timeStr,
            timestamp: Date.now() + 1,
          });
        }

        // Límite estricto de 100 registros eliminando los más antiguos
        localStorage.setItem('nullvault_access_logs', JSON.stringify(logs.slice(0, 100)));
      }
    } catch (e) {
      console.error(e);
    }
  };
  /* ==================== FIN BLOQUE DE HISTORIAL (REGISTRO) ==================== */

  const attemptUnlock = useCallback(
    async (pinToVerify: string, method: 'pin' | 'biometric' = 'pin') => {
      // Bloquear si la cuenta regresiva está activa
      if (remainingLockout > 0) return;
      if (isUnlockingRef.current) return;
      isUnlockingRef.current = true;

      const saltHex = localStorage.getItem('vault_salt');
      const testIvHex = localStorage.getItem('vault_test_iv');
      const testCipherHex = localStorage.getItem('vault_test_cipher');

      if (!saltHex || !testIvHex || !testCipherHex) {
        setErrorMessage('La bóveda no está inicializada correctamente.');
        isUnlockingRef.current = false;
        return;
      }

      setIsVerifying(true);
      setErrorMessage(null);

      try {
        // Verificar si se introdujo el PIN de Coacción (mediante hash criptográfico)
        const isDuressMatch = await verifyDuressPinHash(pinToVerify);

        if (isDuressMatch) {
          // Generar clave señuelo para modo coacción
          const decoySalt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
          const decoyKey = await deriveKeyFromPin(pinToVerify, decoySalt);
          sessionStorage.setItem('vault_is_duress_mode', 'true');
          recordAccessLog('success', 'pin', false);
          localStorage.removeItem('nullvault_lockout_until');
          setRemainingLockout(0);
          onUnlock(decoyKey, pinToVerify);
          return;
        }

        const salt = hexToBuf(saltHex);
        const derivedKey = await deriveKeyFromPin(pinToVerify, salt);
        const isValid = await verifyKey(derivedKey, testIvHex, testCipherHex);

        if (isValid) {
          sessionStorage.removeItem('vault_is_duress_mode');
          recordAccessLog('success', method, false);
          localStorage.removeItem('nullvault_lockout_until');
          setRemainingLockout(0);
          setupAutomaticEmailRecoveryEscrow(derivedKey).catch(() => {});
          onUnlock(derivedKey, pinToVerify);
        } else {
          const currentStreak = Number(localStorage.getItem('nullvault_failed_streak') || '0');
          const nextStreak = currentStreak + 1;
          const lockoutDuration = getLockoutDurationSeconds(nextStreak);
          const shouldLockout = lockoutDuration > 0;

          // 1. Guardar intento fallido
          recordAccessLog('failed', method, false, nextStreak);

          if (shouldLockout) {
            // 2. Guardar hora de finalización en almacenamiento persistente
            const lockoutUntil = Date.now() + lockoutDuration * 1000;
            localStorage.setItem('nullvault_lockout_until', lockoutUntil.toString());
            setRemainingLockout(lockoutDuration);

            // 3. Registro extra de tipo "bloqueado" (Requisito 4)
            recordAccessLog('failed', method, true, undefined, lockoutDuration);
          }

          setIsShaking(true);
          setErrorMessage(
            shouldLockout
              ? `Demasiados intentos. Intenta de nuevo en ${formatCountdown(lockoutDuration)}`
              : 'PIN incorrecto. Inténtalo de nuevo.'
          );
          setPin('');
          setTimeout(() => setIsShaking(false), 500);
        }
      } catch (err) {
        console.error('Error unlocking vault:', err);
        const currentStreak = Number(localStorage.getItem('nullvault_failed_streak') || '0');
        const nextStreak = currentStreak + 1;
        const lockoutDuration = getLockoutDurationSeconds(nextStreak);
        const shouldLockout = lockoutDuration > 0;

        recordAccessLog('failed', method, false, nextStreak);

        if (shouldLockout) {
          const lockoutUntil = Date.now() + lockoutDuration * 1000;
          localStorage.setItem('nullvault_lockout_until', lockoutUntil.toString());
          setRemainingLockout(lockoutDuration);
          recordAccessLog('failed', method, true, undefined, lockoutDuration);
        }

        setIsShaking(true);
        setErrorMessage(
          shouldLockout
            ? `Demasiados intentos. Intenta de nuevo en ${formatCountdown(lockoutDuration)}`
            : 'Error al descifrar la bóveda.'
        );
        setPin('');
        setTimeout(() => setIsShaking(false), 500);
      } finally {
        setIsVerifying(false);
        setTimeout(() => {
          isUnlockingRef.current = false;
        }, 500);
      }
    },
    [onUnlock, remainingLockout]
  );

  // Keyboard listener for desktop users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showForgotModal || remainingLockout > 0) return;

      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < expectedLength) {
          const next = pin + e.key;
          setPin(next);
          if (next.length === expectedLength) {
            attemptUnlock(next);
          }
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setErrorMessage(null);
      } else if (e.key === 'Escape') {
        setPin('');
        setErrorMessage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, expectedLength, attemptUnlock, showForgotModal]);

  const handleKeypadChange = (newPin: string) => {
    if (isVerifying || isUnlockingRef.current || remainingLockout > 0) return;
    setPin(newPin);
    setErrorMessage(null);
    if (newPin.length === expectedLength) {
      attemptUnlock(newPin);
    }
  };

  attemptUnlockRef.current = attemptUnlock;

  const handleBiometricClick = useCallback(async () => {
    if (isVerifying || isBioLoading || isUnlockingRef.current || remainingLockout > 0) return;
    const enrolled = hasBiometricCredentials();
    if (enrolled) {
      isAuthenticatingBiometricsRef.current = true;
      setIsBioLoading(true);
      setErrorMessage(null);
      try {
        const decryptedPin = await authenticateWithBiometrics(true);
        await attemptUnlockRef.current(decryptedPin, 'biometric');
      } catch (err: any) {
        console.warn('Biometric unlock canceled or failed:', err);
        setIsBioEnrolled(isBiometricsAutoPromptEnabled());

        const isAbort =
          err?.name === 'AbortError' ||
          err?.name === 'NotAllowedError' ||
          (err as any)?.isUserCanceled ||
          /cancel/i.test(err?.message || '') ||
          err?.message?.includes('cancelad') ||
          err?.message?.includes('descartad') ||
          err?.message?.includes('cancelada para iniciar');

        if (!isAbort) {
          const currentStreak = Number(localStorage.getItem('nullvault_failed_streak') || '0');
          const nextStreak = currentStreak + 1;
          const lockoutDuration = getLockoutDurationSeconds(nextStreak);
          const shouldLockout = lockoutDuration > 0;

          // Registrar intento fallido con método 'biometric'
          recordAccessLog('failed', 'biometric', false, nextStreak);

          if (shouldLockout) {
            const lockoutUntil = Date.now() + lockoutDuration * 1000;
            localStorage.setItem('nullvault_lockout_until', lockoutUntil.toString());
            setRemainingLockout(lockoutDuration);
            recordAccessLog('failed', 'biometric', true, undefined, lockoutDuration);
          }

          setIsShaking(true);
          setErrorMessage(
            shouldLockout
              ? `Demasiados intentos. Intenta de nuevo en ${formatCountdown(lockoutDuration)}`
              : `Huella no reconocida. Intento ${nextStreak} de 3 antes del bloqueo.`
          );
          setTimeout(() => setIsShaking(false), 500);
        }
      } finally {
        setIsBioLoading(false);
        setTimeout(() => {
          isAuthenticatingBiometricsRef.current = false;
        }, 300);
      }
    } else {
      if (pin.length >= 4) {
        setEnrollPin(pin);
      } else {
        setEnrollPin('');
      }
      setEnrollError(null);
      setShowEnrollBioModal(true);
    }
  }, [pin, isVerifying, isBioLoading, remainingLockout]);

  // Sensor de huella automático y reconexión al volver a la app o maximizar
  useEffect(() => {
    let isMounted = true;
    let bioDebounceTimeout: any = null;
    let lastAutoTriggerTime = 0;

    const triggerAutoBiometrics = async (forceFresh = false) => {
      const lockoutUntil = Number(localStorage.getItem('nullvault_lockout_until') || '0');
      if (lockoutUntil > Date.now()) return;
      if (!isBiometricsAutoPromptEnabled()) return;
      if (document.visibilityState !== 'visible') return;
      if (isUnlockingRef.current || isAuthenticatingBiometricsRef.current) return;

      const now = Date.now();
      if (now - lastAutoTriggerTime < 800) return; // evitar llamadas duplicadas rápidas
      lastAutoTriggerTime = now;

      isAuthenticatingBiometricsRef.current = true;

      try {
        if (isMounted) setIsBioLoading(true);
        const decryptedPin = await authenticateWithBiometrics(forceFresh);
        if (isMounted && decryptedPin) {
          await attemptUnlockRef.current(decryptedPin, 'biometric');
        }
      } catch (err: any) {
        console.debug('Auto-biometric prompt dismissed/cancelled by user:', err);
        const msg = err?.message?.toLowerCase() || '';
        if (msg.includes('demasiados intentos') || msg.includes('too many') || msg.includes('bloqueado')) {
          const currentStreak = Number(localStorage.getItem('nullvault_failed_streak') || '0');
          const nextStreak = Math.max(3, currentStreak + 1);
          const lockoutDuration = getLockoutDurationSeconds(nextStreak) || 15;
          const lockoutUntil = Date.now() + lockoutDuration * 1000;
          localStorage.setItem('nullvault_lockout_until', lockoutUntil.toString());
          setRemainingLockout(lockoutDuration);
          recordAccessLog('failed', 'biometric', true, undefined, lockoutDuration);
        }
      } finally {
        if (isMounted) {
          setIsBioLoading(false);
        }
        setTimeout(() => {
          isAuthenticatingBiometricsRef.current = false;
        }, 300);
      }
    };

    // Disparar en el montaje inicial si la ventana ya está visible
    if (document.visibilityState === 'visible') {
      bioDebounceTimeout = setTimeout(() => {
        triggerAutoBiometrics(true);
      }, 300);
    }

    const handleResumeOrVisible = () => {
      if (document.visibilityState === 'visible') {
        setPin('');
        setErrorMessage(null);
        clearTimeout(bioDebounceTimeout);
        bioDebounceTimeout = setTimeout(() => {
          triggerAutoBiometrics(true);
        }, 200);
      }
    };

    const handleFocus = () => {
      handleResumeOrVisible();
    };

    // Escuchar visibilidad, foco y reactivación tras minimizar/maximizar
    document.addEventListener('visibilitychange', handleResumeOrVisible);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('vault_app_resumed', handleResumeOrVisible);

    return () => {
      isMounted = false;
      clearTimeout(bioDebounceTimeout);
      document.removeEventListener('visibilitychange', handleResumeOrVisible);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('vault_app_resumed', handleResumeOrVisible);
    };
  }, []);

  const handleEnrollBiometrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enrollPin.length < 4) {
      setEnrollError('Ingresa tu PIN de al menos 4 dígitos.');
      return;
    }

    setIsEnrollingBio(true);
    setEnrollError(null);

    try {
      const saltHex = localStorage.getItem('vault_salt');
      const testIvHex = localStorage.getItem('vault_test_iv');
      const testCipherHex = localStorage.getItem('vault_test_cipher');

      if (!saltHex || !testIvHex || !testCipherHex) {
        setEnrollError('La bóveda no está inicializada correctamente.');
        return;
      }

      const salt = hexToBuf(saltHex);
      const testKey = await deriveKeyFromPin(enrollPin, salt);
      const isValid = await verifyKey(testKey, testIvHex, testCipherHex);

      if (!isValid) {
        setEnrollError('PIN incorrecto. Ingresa el PIN maestro de tu bóveda.');
        return;
      }

      await enrollBiometrics(enrollPin);
      setIsBioEnrolled(true);
      setShowEnrollBioModal(false);
      showToast('¡Sensor de huella vinculado con éxito!', 'success');
      onUnlock(testKey);
    } catch (err: any) {
      console.error('Error enrolling biometrics:', err);
      if (err?.name === 'NotAllowedError') {
        setEnrollError('Operación cancelada en el lector de huella.');
      } else {
        setEnrollError(err?.message || 'No se pudo vincular la huella digital en este celular.');
      }
    } finally {
      setIsEnrollingBio(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 transition-colors duration-250 select-none"
      style={{
        backgroundColor: 'var(--theme-bg-main, #060b14)',
        color: 'var(--theme-text-main, #f8fafc)',
      }}
    >
      {/* Ambient background blur using theme glow or coral during lockout */}
      <div className="fixed inset-0 pointer-events-none flex justify-center items-center overflow-hidden">
        <div
          className="w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-500"
          style={{
            backgroundColor: remainingLockout > 0 ? '#F87171' : 'var(--theme-primary, #00e5ff)',
            opacity: remainingLockout > 0 ? 0.14 : 0.2,
          }}
        />
      </div>

      {remainingLockout > 0 ? (
        /* ==================== BLOQUE DE HISTORIAL: PANTALLA COMPLETA DE BLOQUEO ==================== */
        <div className="relative w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center justify-between min-h-[82vh] py-8 px-4 text-center select-none animate-in fade-in duration-300">
          {/* Espaciador superior para centrado */}
          <div className="w-full h-4" />

          {/* Bloque central de contenido */}
          <div className="flex flex-col items-center justify-center my-auto w-full">
            {/* 2. Ícono de candado en recuadro redondeado coral #F87171 con borde rgba(248,113,113,0.55) y fondo rgba(248,113,113,0.08) */}
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-rose-950/20 backdrop-blur-md transition-all"
              style={{
                backgroundColor: 'rgba(248, 113, 113, 0.08)',
                border: '1.5px solid rgba(248, 113, 113, 0.55)',
              }}
            >
              <Lock className="w-9 h-9 stroke-[2.2]" style={{ color: '#F87171' }} />
            </div>

            {/* 3. Título "Intentos fallidos" en blanco (o color principal según tema) tamaño grande */}
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2.5 text-slate-900 dark:text-white"
              style={{ color: 'var(--theme-text-main, #ffffff)' }}
            >
              Intentos fallidos
            </h2>

            {/* 4. Subtítulo en gris claro (#9AA7BD) adaptable */}
            <p
              className="text-xs sm:text-sm font-medium max-w-[280px] leading-relaxed mb-8 text-slate-600 dark:text-[#9AA7BD]"
              style={{ color: 'var(--theme-text-muted, #9AA7BD)' }}
            >
              Por seguridad, tu bóveda se bloqueó temporalmente
            </p>

            {/* 5. Texto pequeño en mayúsculas "INTENTA DE NUEVO EN" */}
            <p className="text-[11px] font-extrabold tracking-[0.22em] uppercase mb-2 text-slate-400 dark:text-slate-500">
              INTENTA DE NUEVO EN
            </p>

            {/* 5. Cuenta regresiva muy grande, fuente monoespaciada, color #F87171 */}
            <div
              className="font-mono text-6xl sm:text-7xl font-black tracking-wider drop-shadow-md py-1 select-none"
              style={{ color: '#F87171' }}
            >
              {formatCountdown(remainingLockout)}
            </div>
          </div>

          {/* 6. Al fondo, texto pequeño y apagado con ícono de escudo: "Tus archivos siguen protegidos" */}
          <div className="w-full pt-8 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 opacity-80">
            <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
            <span>Tus archivos siguen protegidos</span>
          </div>
        </div>
      ) : authViewMode === 'welcome' && isRegisteredUser ? (
        /* ==================== PANTALLA DE BIENVENIDA (ESTILO BANCOMER / BBVA) ==================== */
        <div className="relative w-full max-w-sm sm:max-w-md mx-auto flex flex-col justify-between min-h-[85vh] py-6 px-4 select-none animate-in fade-in duration-300">
          {/* 1. Header con Iniciar sesión centrado (20 px, 700 bold) */}
          <div className="w-full flex items-center justify-center relative pt-2 pb-4">
            <h1
              className="text-[20px] font-bold tracking-wide text-center"
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#0F1B3D',
              }}
            >
              Iniciar sesión
            </h1>
          </div>

          {/* 2. Zona central: Saludo a la izquierda (#1F2A44), Nombre (28 px serif bold #0F1B3D) y Avatar (76 px, iniciales 28 px) */}
          <div className="w-full my-auto py-8 px-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col text-left min-w-0">
                <span
                  className="text-[20px] font-medium tracking-normal leading-snug"
                  style={{
                    fontSize: '20px',
                    color: '#1F2A44',
                  }}
                >
                  {getTimeGreeting()}
                </span>
                <h2
                  className="text-[28px] font-serif font-bold tracking-tight leading-tight mt-0.5 break-words"
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#0F1B3D',
                  }}
                >
                  {userDisplayName}
                </h2>
              </div>

              <div
                className="w-[76px] h-[76px] rounded-full flex items-center justify-center text-white font-medium text-[28px] shadow-xl shrink-0 border border-white/20 select-none overflow-hidden"
                style={{
                  width: '76px',
                  height: '76px',
                  fontSize: '28px',
                  background: userProfile?.avatarColor || 'linear-gradient(135deg, #FF8000, #F59E0B)',
                }}
              >
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userDisplayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
            </div>

            {/* Error discreto si la huella falló o se canceló */}
            {errorMessage && (
              <div className="mt-6 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs font-semibold text-rose-300 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* 3. Zona inferior: Botón biometría (principal), Botón contraseña (secundario) y Enlaces */}
          <div className="w-full flex flex-col gap-[12px] pb-4 px-1">
            {/* Botón Principal: Entra con biometría (Relleno sólido #0F1B3D, texto BLANCO PURO #ffffff en 18px peso 600, icono Fingerprint 22px blanco, 10px sep, pill 64px, sombra 0 10px 24px rgba(15,27,61,.28)) */}
            <button
              type="button"
              onClick={handleBiometricClick}
              disabled={isBioLoading}
              className="vault-primary-bio-btn w-full h-[64px] rounded-full bg-[#0F1B3D] hover:bg-[#162550] active:scale-[0.99] transition-all flex items-center justify-center gap-[10px] cursor-pointer disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-[#0F1B3D] focus:ring-offset-2"
              style={{
                height: '64px',
                backgroundColor: '#0F1B3D',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 600,
                borderRadius: '9999px',
                boxShadow: '0 10px 24px rgba(15,27,61,0.28)',
              }}
            >
              {isBioLoading ? (
                <>
                  <Loader2 className="w-[22px] h-[22px] animate-spin text-white shrink-0" style={{ color: '#ffffff' }} />
                  <span className="text-white font-semibold" style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600 }}>Verificando huella...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-[22px] h-[22px] shrink-0 text-white" style={{ width: '22px', height: '22px', color: '#ffffff', stroke: '#ffffff' }} />
                  <span className="text-white font-semibold" style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600 }}>Entra con biometría</span>
                </>
              )}
            </button>

            {/* Botón Secundario: Entra con contraseña (Fondo transparente, borde 1.5px #0F1B3D, texto #0F1B3D 18px peso 600, pill 64px) */}
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setAuthViewMode('keypad');
              }}
              className="w-full h-[64px] rounded-full bg-transparent border-[1.5px] border-[#0F1B3D] hover:bg-[#0F1B3D]/5 active:scale-[0.99] text-[#0F1B3D] font-semibold transition-all flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F1B3D] focus:ring-offset-2"
              style={{
                height: '64px',
                backgroundColor: 'transparent',
                borderWidth: '1.5px',
                borderColor: '#0F1B3D',
                color: '#0F1B3D',
                fontSize: '18px',
                fontWeight: 600,
                borderRadius: '9999px',
              }}
            >
              <span style={{ color: '#0F1B3D', fontSize: '18px', fontWeight: 600 }}>Entra con contraseña</span>
            </button>

            {/* Enlaces nuevos debajo de los botones (8px margen sup, centrados, subrayados, color #0F1B3D, min height 44px) */}
            <div className="mt-[8px] flex flex-col items-center justify-center gap-1">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenForgotPin();
                }}
                className="inline-flex items-center justify-center min-h-[44px] px-2 text-[16px] font-semibold underline text-[#0F1B3D] hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#0F1B3D] focus:ring-offset-2 rounded-lg"
                style={{
                  color: '#0F1B3D',
                  fontSize: '16px',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  minHeight: '44px',
                }}
              >
                ¿Olvidaste tu contraseña?
              </a>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onGoToRegister) {
                    onGoToRegister();
                  } else if (onResetVaultRequest) {
                    onResetVaultRequest();
                  }
                }}
                className="inline-flex items-center justify-center min-h-[44px] px-2 text-[15px] font-normal underline text-[#0F1B3D] hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#0F1B3D] focus:ring-offset-2 rounded-lg"
                style={{
                  color: '#0F1B3D',
                  fontSize: '15px',
                  fontWeight: 400,
                  textDecoration: 'underline',
                  minHeight: '44px',
                }}
              >
                ¿No eres {userDisplayName}? Cambiar usuario
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== FIN BLOQUE DE HISTORIAL: PANTALLA COMPLETA DE BLOQUEO ==================== */
        /* ==================== PANTALLA HABITUAL DE DESBLOQUEO CON PIN (MISMOS COLORES QUE INICIAR SESIÓN) ==================== */
        <div
          className={`relative w-full max-w-sm sm:max-w-md mx-auto flex flex-col justify-between min-h-[85vh] py-6 px-4 text-center select-none transition-all animate-in fade-in duration-300 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {/* Parte superior: Botón Volver y encabezado con los mismos tonos de Iniciar sesión */}
          <div className="w-full flex flex-col items-center pt-2">
            {isRegisteredUser && (
              <div className="w-full flex items-center justify-start mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setPin('');
                    setAuthViewMode('welcome');
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer py-1.5 px-2.5 -ml-2 rounded-xl hover:bg-white/10"
                  style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>Volver</span>
                </button>
              </div>
            )}

            <h1
              className="text-2xl font-black tracking-tight mb-0.5 mt-1"
              style={{ color: 'var(--theme-text-main, #ffffff)' }}
            >
              Bóveda de <span style={{ color: 'var(--theme-primary, #00e5ff)' }}>Seguridad</span>
            </h1>
            <p
              className="text-[10px] font-semibold tracking-[0.18em] uppercase mb-1"
              style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
            >
              TUS ARCHIVOS, SIEMPRE PROTEGIDOS
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
            >
              {isBioLoading
                ? 'Esperando sensor de huella en tu celular...'
                : isBioEnrolled
                ? 'Introduce tu PIN o toca el sensor de huella para acceder'
                : 'Introduce tu PIN para acceder'}
            </p>
          </div>

          {/* Zona central: Teclado numérico sobre el mismo fondo de Iniciar sesión */}
          <div className="w-full my-auto py-2">
            <PinKeypad
              pin={pin}
              onPinChange={handleKeypadChange}
              maxDigits={expectedLength}
              disabled={isVerifying}
              onBiometricRequest={handleBiometricClick}
              isBiometricsEnrolled={isBioEnrolled}
              isBiometricsLoading={isBioLoading}
            />

            {/* Error Feedback cuando aún no hay bloqueo pero hubo un fallo */}
            {errorMessage && (
              <div className="mt-4 flex flex-col items-center justify-center gap-1.5 text-center animate-in fade-in duration-150">
                <div
                  className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-900 dark:text-white"
                  style={{ color: 'var(--theme-text-main, #ffffff)' }}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
                {errorMessage?.includes('no está inicializada') && (
                  <button
                    type="button"
                    onClick={onResetVaultRequest}
                    className="mt-1 text-[11px] font-bold text-[#00e5ff] hover:underline cursor-pointer"
                  >
                    Volver a la pantalla de inicio o registro
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Action Footer */}
          <div className="w-full pt-4 pb-2 flex items-center justify-center text-xs" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>
            <button
              type="button"
              onClick={handleOpenForgotPin}
              className="hover:text-[#00e5ff] transition-colors font-semibold cursor-pointer"
            >
              ¿Olvidaste tu PIN?
            </button>
          </div>
        </div>
      )}

      {/* Forgot PIN / Email Verification Recovery Full-Screen View */}
      {showForgotModal && (
        <div
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              forgotTouchStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                time: Date.now(),
              };
            }
          }}
          onTouchEnd={(e) => {
            if (!forgotTouchStartRef.current || e.changedTouches.length === 0) return;
            const start = forgotTouchStartRef.current;
            forgotTouchStartRef.current = null;
            const dx = e.changedTouches[0].clientX - start.x;
            const dy = e.changedTouches[0].clientY - start.y;
            const dt = Date.now() - start.time;
            const screenW = window.innerWidth || 360;
            const startedNearEdge = start.x <= 48 || start.x >= screenW - 48;
            // Detect horizontal back swipe (either from screen edges or a clear horizontal swipe across the view)
            if (
              dt < 600 &&
              Math.abs(dx) >= (startedNearEdge ? 50 : 95) &&
              Math.abs(dx) > Math.abs(dy) * 2.2
            ) {
              handleForgotBackNavigation();
            }
          }}
          className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center select-none animate-in fade-in duration-200"
          style={{
            backgroundColor: isLightTheme ? '#F3F6FB' : '#060B14',
            color: isLightTheme ? '#0F172A' : '#F8FAFC',
            fontFamily: "'Manrope', system-ui, -apple-system, sans-serif",
          }}
        >
          <div className="w-full max-w-[440px] flex flex-col px-6 pt-8 pb-8 box-border">
            {/* 1. Barra superior: botón "Volver" cuadrado (44×44) a la izquierda (sin las 3 líneas a la derecha) */}
            <div className="w-full flex items-center justify-start mb-5">
              <button
                type="button"
                onClick={handleForgotBackNavigation}
                aria-label="Volver"
                className="w-[44px] h-[44px] rounded-[14px] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
                style={{
                  backgroundColor: isLightTheme ? '#FFFFFF' : '#0A121D',
                  border: `1.5px solid ${isLightTheme ? '#D5DEEA' : '#1E293B'}`,
                  color: isLightTheme ? '#0F172A' : '#F8FAFC',
                }}
              >
                <ChevronLeft
                  className="w-5 h-5 stroke-[2]"
                  style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                />
              </button>
            </div>

            {/* STEP 1: VALIDATE REGISTERED EMAIL */}
            {forgotStep === 'email_input' && (
              <div className="flex flex-col">
                {/* 2. Icono: tile azul sólido de 64×64 con esquinas de 20 px y un icono de sobre/correo blanco */}
                <div
                  className="pin-recovery-on-primary w-[64px] h-[64px] rounded-[20px] flex items-center justify-center mb-5 shrink-0"
                  style={{ backgroundColor: '#0B6FB8' }}
                >
                  <Mail className="w-7 h-7 stroke-[2]" />
                </div>

                {/* 3. Título: "Recupera tu PIN" (30 px, peso 800, color casi negro) */}
                <h2
                  className="text-[30px] font-extrabold leading-[1.15] tracking-[-0.02em] mb-2.5 text-left"
                  style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                >
                  Recupera tu PIN
                </h2>

                {/* 4. Descripción (16 px, gris oscuro) */}
                <p
                  className="text-[16px] font-medium leading-[1.5] mb-5 text-left"
                  style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                >
                  Escribe el correo con el que registraste tu cuenta. Si está registrado, te enviaremos un código de 6 dígitos.
                </p>

                <form onSubmit={handleSendRecoveryEmailCode} className="flex flex-col">
                  {/* 5. Etiqueta: "Correo electrónico registrado" (14 px, peso 700) */}
                  <label
                    htmlFor="pin-recovery-email-input"
                    className="block text-[14px] font-bold mb-2 text-left"
                    style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                  >
                    Correo electrónico registrado
                  </label>

                  {/* 6. Campo de texto: estilizado h-[48px], esquinas suaves rounded-[14px], sin icono @ */}
                  <div
                    className="w-full h-[48px] rounded-[14px] px-3.5 flex items-center transition-all box-border shadow-sm"
                    style={{
                      backgroundColor: isLightTheme ? '#FFFFFF' : '#0A121D',
                      border: isEmailFocused
                        ? `1.5px solid ${isLightTheme ? '#0B6FB8' : '#00E5FF'}`
                        : `1.5px solid ${isLightTheme ? '#D5DEEA' : '#1E293B'}`,
                    }}
                  >
                    <input
                      id="pin-recovery-email-input"
                      type="email"
                      autoComplete="email"
                      value={forgotEmail}
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        setForgotError(null);
                      }}
                      placeholder="tucorreo@ejemplo.com"
                      required
                      autoFocus
                      disabled={isForgotLoading}
                      className="bg-transparent w-full h-full border-0 p-0 text-[15px] font-medium focus:outline-none focus:ring-0"
                      style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                    />
                  </div>

                  {/* 7. Texto de ayuda (13 px) */}
                  <p
                    className="text-[13px] font-medium leading-[1.4] mt-2 text-left"
                    style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                  >
                    Si no ves el correo, revisa tu carpeta de spam.
                  </p>

                  {forgotError && (
                    <div
                      className="mt-3.5 flex items-start gap-2.5 text-[13px] font-semibold p-3.5 rounded-[14px] border text-left"
                      style={{
                        backgroundColor: isLightTheme ? '#FFF1F2' : 'rgba(244, 63, 94, 0.12)',
                        borderColor: isLightTheme ? '#FECDD3' : 'rgba(244, 63, 94, 0.3)',
                        color: isLightTheme ? '#BE123C' : '#FDA4AF',
                      }}
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 stroke-[2]" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  {/* 8. Botón principal: ancho completo, alto 56 px, esquinas de 16 px, azul sólido, texto blanco "Enviar código de 6 dígitos" con icono de avión de papel */}
                  <button
                    type="submit"
                    disabled={isForgotLoading || !isForgotEmailValid}
                    className="pin-recovery-on-primary w-full h-[56px] rounded-[16px] mt-4 font-bold text-[16px] transition-opacity flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#0B6FB8' }}
                  >
                    {isForgotLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin stroke-[2]" />
                        <span>Validando correo...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 stroke-[2]" />
                        <span>Enviar código de 6 dígitos</span>
                      </>
                    )}
                  </button>
                </form>

                {/* 9. Tarjeta de zona de riesgo (fondo blanco, borde gris claro, esquinas de 20 px, padding 18) */}
                <div
                  className="w-full rounded-[20px] p-[18px] text-left box-border mt-5"
                  style={{
                    backgroundColor: isLightTheme ? '#FFFFFF' : '#0A121D',
                    border: `1px solid ${isLightTheme ? '#E2E8F0' : '#1E293B'}`,
                  }}
                >
                  <h3
                    className="text-[16px] font-extrabold leading-[1.3] mb-1.5"
                    style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                  >
                    ¿No tienes acceso a ese correo?
                  </h3>
                  <p
                    className="text-[13px] font-medium leading-[1.45] mb-3.5"
                    style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                  >
                    Puedes empezar con una bóveda nueva. Esta acción elimina el contenido actual y no se puede deshacer.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotError(null);
                      setForgotStep('no_key');
                    }}
                    className="w-full h-[48px] rounded-[14px] font-bold text-[15px] flex items-center justify-center transition-colors cursor-pointer active:scale-[0.99]"
                    style={{
                      backgroundColor: isLightTheme ? '#FFFFFF' : '#0F172A',
                      border: `1.5px solid ${isLightTheme ? '#B45309' : '#D97706'}`,
                      color: isLightTheme ? '#92400E' : '#FBBF24',
                    }}
                  >
                    Restablecer bóveda desde cero
                  </button>
                </div>

                {/* 10. Botón de texto "Cancelar" (alto 48 px, gris oscuro) al final */}
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full h-[48px] mt-1.5 font-bold text-[15px] flex items-center justify-center transition-colors cursor-pointer"
                  style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* STEP 2: VERIFY 6-DIGIT EMAIL CODE */}
            {forgotStep === 'code_verify' && (
              <div className="flex flex-col">
                <div
                  className="pin-recovery-on-primary w-[64px] h-[64px] rounded-[20px] flex items-center justify-center mb-5 shrink-0"
                  style={{ backgroundColor: '#0B6FB8' }}
                >
                  <KeyRound className="w-7 h-7 stroke-[2]" />
                </div>

                <h2
                  className="text-[30px] font-extrabold leading-[1.15] tracking-[-0.02em] mb-2.5 text-left"
                  style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                >
                  Verifica tu código
                </h2>

                <p
                  className="text-[16px] font-medium leading-[1.5] mb-3.5 text-left"
                  style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                >
                  Enviamos un código de 6 dígitos a{' '}
                  <strong
                    className="font-bold break-all"
                    style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                  >
                    {forgotEmail.trim()}
                  </strong>
                </p>

                <div className="flex items-center gap-2 text-[13px] font-bold mb-5">
                  <Clock
                    className="w-4 h-4 stroke-[2] shrink-0"
                    style={{
                      color:
                        forgotSecondsLeft <= 0
                          ? isLightTheme
                            ? '#BE123C'
                            : '#FDA4AF'
                          : isLightTheme
                          ? '#0B6FB8'
                          : '#00E5FF',
                    }}
                  />
                  <span
                    style={{
                      color:
                        forgotSecondsLeft <= 0
                          ? isLightTheme
                            ? '#BE123C'
                            : '#FDA4AF'
                          : isLightTheme
                          ? '#0B6FB8'
                          : '#00E5FF',
                    }}
                  >
                    {forgotSecondsLeft <= 0
                      ? 'Código caducado (5 min)'
                      : `Válido por ${formatCountdown(forgotSecondsLeft)}`}
                  </span>
                </div>

                <form onSubmit={handleVerifyRecoveryEmailCode} className="flex flex-col">
                  <label
                    htmlFor="pin-recovery-code-input"
                    className="block text-[14px] font-bold mb-2 text-left"
                    style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                  >
                    Código de verificación (6 dígitos)
                  </label>

                  <div
                    className="w-full h-[56px] rounded-[16px] px-4 flex items-center transition-colors box-border"
                    style={{
                      backgroundColor: isLightTheme ? '#FFFFFF' : '#0A121D',
                      border: `2px solid ${isLightTheme ? '#0B6FB8' : '#00E5FF'}`,
                    }}
                  >
                    <input
                      id="pin-recovery-code-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={forgotCode}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setForgotCode(clean);
                        setForgotError(null);
                      }}
                      placeholder="000000"
                      required
                      autoFocus
                      disabled={isForgotLoading || forgotSecondsLeft <= 0}
                      className="bg-transparent w-full h-full border-0 p-0 text-center text-[22px] font-mono font-bold tracking-[0.35em] focus:outline-none focus:ring-0"
                      style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                    />
                  </div>

                  {forgotError && (
                    <div
                      className="mt-3.5 flex items-start gap-2.5 text-[13px] font-semibold p-3.5 rounded-[14px] border text-left"
                      style={{
                        backgroundColor: isLightTheme ? '#FFF1F2' : 'rgba(244, 63, 94, 0.12)',
                        borderColor: isLightTheme ? '#FECDD3' : 'rgba(244, 63, 94, 0.3)',
                        color: isLightTheme ? '#BE123C' : '#FDA4AF',
                      }}
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 stroke-[2]" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isForgotLoading || forgotSecondsLeft <= 0 || forgotCode.length !== 6}
                    className="pin-recovery-on-primary w-full h-[56px] rounded-[16px] mt-4 font-bold text-[16px] transition-opacity flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#0B6FB8' }}
                  >
                    {isForgotLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin stroke-[2]" />
                        <span>Verificando código...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 stroke-[2]" />
                        <span>Verificar código</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-3 text-[14px] font-bold">
                    <button
                      type="button"
                      onClick={() => handleSendRecoveryEmailCode()}
                      disabled={isForgotLoading || forgotResendCooldown > 0}
                      className="min-h-[44px] inline-flex items-center gap-1.5 hover:underline disabled:opacity-45 cursor-pointer"
                      style={{ color: isLightTheme ? '#0B6FB8' : '#00E5FF' }}
                    >
                      <RefreshCw className="w-4 h-4 stroke-[2]" />
                      <span>
                        {forgotResendCooldown > 0
                          ? `Reenviar (${forgotResendCooldown}s)`
                          : 'Reenviar código'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('email_input');
                        setForgotError(null);
                      }}
                      className="min-h-[44px] inline-flex items-center transition-colors cursor-pointer"
                      style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                    >
                      Cambiar correo
                    </button>
                  </div>
                </form>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full h-[48px] mt-3 font-bold text-[15px] flex items-center justify-center transition-colors cursor-pointer"
                  style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* STEP 3: NEW 4-DIGIT PIN INPUT */}
            {forgotStep === 'new_pin_input' && (
              <div className="flex flex-col">
                <div
                  className="pin-recovery-on-primary w-[64px] h-[64px] rounded-[20px] flex items-center justify-center mb-5 shrink-0"
                  style={{ backgroundColor: '#0B6FB8' }}
                >
                  <KeyRound className="w-7 h-7 stroke-[2]" />
                </div>

                <h2
                  className="text-[30px] font-extrabold leading-[1.15] tracking-[-0.02em] mb-2.5 text-left"
                  style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                >
                  Crea tu nuevo PIN
                </h2>

                <p
                  className="text-[16px] font-medium leading-[1.5] mb-5 text-left"
                  style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                >
                  Identidad verificada. Define tu nuevo PIN de 4 dígitos para abrir tu bóveda conservando todos tus archivos.
                </p>

                <form onSubmit={handleResetPinWithRecovery} className="flex flex-col space-y-4">
                  <div>
                    <label
                      className="block text-[14px] font-bold mb-2 text-left"
                      style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                    >
                      Nuevo PIN (4 dígitos)
                    </label>
                    <div
                      className="w-full h-[56px] rounded-[16px] px-4 flex items-center justify-between transition-colors box-border"
                      style={{
                        backgroundColor: isLightTheme ? '#FFFFFF' : '#0A121D',
                        border: `2px solid ${isLightTheme ? '#0B6FB8' : '#00E5FF'}`,
                      }}
                    >
                      <input
                        type={showNewPinText ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={4}
                        value={newPinInput}
                        onChange={(e) => {
                          setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                          setForgotError(null);
                        }}
                        placeholder="••••"
                        required
                        autoFocus
                        className="bg-transparent w-full h-full border-0 p-0 text-[18px] font-mono font-bold tracking-[0.35em] focus:outline-none focus:ring-0"
                        style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPinText(!showNewPinText)}
                        className="w-[44px] h-[44px] flex items-center justify-center cursor-pointer shrink-0 -mr-2"
                        style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                        aria-label={showNewPinText ? 'Ocultar PIN' : 'Mostrar PIN'}
                      >
                        {showNewPinText ? (
                          <EyeOff className="w-5 h-5 stroke-[2]" />
                        ) : (
                          <Eye className="w-5 h-5 stroke-[2]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-[14px] font-bold mb-2 text-left"
                      style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                    >
                      Confirmar nuevo PIN
                    </label>
                    <div
                      className="w-full h-[56px] rounded-[16px] px-4 flex items-center transition-colors box-border"
                      style={{
                        backgroundColor: isLightTheme ? '#FFFFFF' : '#0A121D',
                        border: `1.5px solid ${isLightTheme ? '#D5DEEA' : '#1E293B'}`,
                      }}
                    >
                      <input
                        type={showNewPinText ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={4}
                        value={confirmNewPinInput}
                        onChange={(e) => {
                          setConfirmNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                          setForgotError(null);
                        }}
                        placeholder="••••"
                        required
                        className="bg-transparent w-full h-full border-0 p-0 text-[18px] font-mono font-bold tracking-[0.35em] focus:outline-none focus:ring-0"
                        style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                      />
                    </div>
                  </div>

                  {forgotError && (
                    <div
                      className="flex items-start gap-2.5 text-[13px] font-semibold p-3.5 rounded-[14px] border text-left"
                      style={{
                        backgroundColor: isLightTheme ? '#FFF1F2' : 'rgba(244, 63, 94, 0.12)',
                        borderColor: isLightTheme ? '#FECDD3' : 'rgba(244, 63, 94, 0.3)',
                        color: isLightTheme ? '#BE123C' : '#FDA4AF',
                      }}
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 stroke-[2]" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      isForgotLoading ||
                      newPinInput.length !== 4 ||
                      newPinInput !== confirmNewPinInput
                    }
                    className="pin-recovery-on-primary w-full h-[56px] rounded-[16px] mt-1 font-bold text-[16px] transition-opacity flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#0B6FB8' }}
                  >
                    {isForgotLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin stroke-[2]" />
                        <span>Restableciendo PIN...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 stroke-[2]" />
                        <span>Guardar nuevo PIN y acceder</span>
                      </>
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full h-[48px] mt-3 font-bold text-[15px] flex items-center justify-center transition-colors cursor-pointer"
                  style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* FALLBACK: FULL VAULT RESET CONFIRMATION */}
            {forgotStep === 'no_key' && (
              <div className="flex flex-col">
                <div
                  className="w-[64px] h-[64px] rounded-[20px] flex items-center justify-center mb-5 shrink-0"
                  style={{
                    backgroundColor: isLightTheme ? '#FFFBEB' : 'rgba(217, 119, 6, 0.14)',
                    border: `1.5px solid ${isLightTheme ? '#B45309' : '#D97706'}`,
                    color: isLightTheme ? '#92400E' : '#FBBF24',
                  }}
                >
                  <AlertTriangle className="w-7 h-7 stroke-[2]" />
                </div>

                <h2
                  className="text-[30px] font-extrabold leading-[1.15] tracking-[-0.02em] mb-2.5 text-left"
                  style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                >
                  Restablecer bóveda
                </h2>

                <p
                  className="text-[16px] font-medium leading-[1.5] mb-5 text-left"
                  style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                >
                  Si ya no tienes acceso a tu correo registrado, puedes configurar una bóveda nueva desde cero.
                </p>

                <div
                  className="w-full rounded-[20px] p-[18px] text-left box-border mb-5"
                  style={{
                    backgroundColor: isLightTheme ? '#FFFFFF' : '#0A121D',
                    border: `1px solid ${isLightTheme ? '#E2E8F0' : '#1E293B'}`,
                  }}
                >
                  <h3
                    className="text-[15px] font-extrabold mb-1.5"
                    style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                  >
                    Aviso importante
                  </h3>
                  <p
                    className="text-[13px] font-medium leading-[1.45]"
                    style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                  >
                    Al restablecer desde cero sin verificar tu correo, se eliminarán de forma permanente los archivos guardados actualmente en este dispositivo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    onResetVaultRequest();
                  }}
                  className="w-full h-[56px] rounded-[16px] font-bold text-[16px] flex items-center justify-center gap-2.5 transition-colors cursor-pointer active:scale-[0.99]"
                  style={{
                    backgroundColor: isLightTheme ? '#FFFFFF' : '#0F172A',
                    border: `1.5px solid ${isLightTheme ? '#B45309' : '#D97706'}`,
                    color: isLightTheme ? '#92400E' : '#FBBF24',
                  }}
                >
                  <RotateCcw className="w-5 h-5 stroke-[2]" />
                  <span>Confirmar y restablecer bóveda</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForgotStep('email_input');
                    setForgotError(null);
                  }}
                  className="w-full h-[48px] mt-3 font-bold text-[15px] flex items-center justify-center transition-colors cursor-pointer"
                  style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                >
                  Volver a recuperar con correo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enroll Biometrics Modal */}
      {showEnrollBioModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#131c2e] border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-200">
            <div className="flex justify-between items-center mb-3">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                <Fingerprint className="w-6 h-6 animate-pulse" />
              </div>
              <button
                type="button"
                onClick={() => setShowEnrollBioModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-white mb-1.5">
              Activar Sensor de Huella
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Ingresa tu PIN maestro para vincular el sensor de huella de tu celular a la bóveda. Una vez vinculado, podrás entrar con un solo toque de tu huella digital.
            </p>

            <form onSubmit={handleEnrollBiometrics} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-left">
                  PIN Maestro Actual
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={enrollPin}
                  onChange={(e) => {
                    setEnrollPin(e.target.value);
                    setEnrollError(null);
                  }}
                  placeholder="Introduce tu PIN"
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-center text-xl tracking-[0.3em] font-mono text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              {enrollError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-[11px] text-rose-300 space-y-1 text-left">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-200">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{enrollError}</span>
                  </div>
                  <div className="text-[10px] text-rose-400/90 pt-1 border-t border-rose-800/40 space-y-0.5">
                    <p><b>Para solucionar:</b></p>
                    <p>• Si tienes <b>"Modo avión"</b> activado, desactívalo un momento.</p>
                    <p>• Si usas un <b>APK de WebIntoApp</b> (WebView), abre la app en <b>Google Chrome</b> en tu celular e instálala como <b>PWA ("Añadir a pantalla")</b> para acceso 100% nativo al sensor de huella.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isEnrollingBio || enrollPin.length < 4}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>{isEnrollingBio ? 'Verificando con tu celular...' : 'Escanear Huella en el Celular'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEnrollBioModal(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
