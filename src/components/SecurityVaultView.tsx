import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Shield,
  Camera,
  Fingerprint,
  ChevronRight,
  CheckCircle2,
  XCircle,
  X,
  Clock,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  ShieldAlert,
  ShieldCheck,
  Filter,
  Calendar,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { setScreenshotBlockEnabled } from '../services/screenshotBlockService';
import {
  deriveKeyFromPin,
  verifyKey,
  hexToBuf,
  bufToHex,
  generateSalt,
  createVerificationPayload,
  decryptBuffer,
  encryptBuffer,
  checkIsUnencryptedMedia,
  saveDuressPinHash,
  clearDuressPinHash,
  verifyDuressPinHash,
} from '../crypto/vaultCrypto';
import {
  enrollBiometrics,
  disableBiometrics,
  isBiometricsEnrolled,
  hasBiometricCredentials,
  isBiometricsAutoPromptEnabled,
  setBiometricsAutoPromptEnabled,
  authenticateWithBiometrics,
  updateBiometricPinIfEnrolled,
} from '../services/biometricService';
import { rebindRecoveryKeyToNewMasterKey } from '../services/recoveryKeyService';
import { flipToLockService } from '../services/flipToLockService';
import { registerBackHandler } from '../services/backButtonService';
import { themeService, VaultTheme } from '../services/themeService';
import { PinKeypad } from './PinKeypad';
import { NeonSwitch } from './NeonSwitch';
import { getAllEncryptedItems, saveEncryptedItems, EncryptedVaultItem } from '../db/vaultDb';
import { isExtraPinConfigured } from '../services/extraPinFolderService';
import { ExtraPinModal } from './ExtraPinModal';

interface SecurityVaultViewProps {
  onOpenSettings: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'alert' | 'error') => void;
  sessionPin?: string | null;
  onLock?: () => void;
  masterKey?: CryptoKey | null;
  onMasterKeyUpdated?: (newKey: CryptoKey, newPin?: string) => void;
  autoLockMinutes?: number;
  onAutoLockChange?: (mins: number) => void;
  lockOnTabSwitch?: boolean;
  onLockOnTabSwitchChange?: (enabled: boolean) => void;
}

/* ==================== BLOQUE DE HISTORIAL (TIPOS Y UTILIDADES) ==================== */
interface AccessLogItem {
  id: string;
  type: 'success' | 'failed';
  method?: 'pin' | 'biometric';
  isLockout?: boolean;
  attemptNumber?: number;
  lockoutDuration?: number;
  title: string;
  time: string;
  timestamp: number;
}

// Formato de grupo por día ("Hoy", "Ayer", "24 oct")
function getDayGroupLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffDays = Math.round((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  
  const day = date.getDate();
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const monthName = months[date.getMonth()];
  
  if (date.getFullYear() === now.getFullYear()) {
    return `${day} ${monthName}`;
  }
  return `${day} ${monthName} ${date.getFullYear()}`;
}

// Formato de fecha largo en español (ej. "Lunes 26 de octubre de 2026")
function formatDetailDateLong(timestamp: number): string {
  const date = new Date(timestamp);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

// Formato de hora con segundos (ej. "12:26:41 p.m.")
function formatDetailTimeWithSeconds(timestamp: number): string {
  const d = new Date(timestamp);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
}
/* ==================== FIN BLOQUE DE HISTORIAL (TIPOS Y UTILIDADES) ==================== */

export const SecurityVaultView: React.FC<SecurityVaultViewProps> = ({
  showToast,
  sessionPin,
  onLock,
  masterKey,
  onMasterKeyUpdated,
  autoLockMinutes = 5,
  onAutoLockChange,
  lockOnTabSwitch = true,
  onLockOnTabSwitchChange,
}) => {
  // Protection toggles
  const [duressPinActive, setDuressPinActive] = useState<boolean>(() => {
    return localStorage.getItem('vault_duress_pin_active') === 'true' && Boolean(localStorage.getItem('vault_duress_pin'));
  });
  const [screenshotBlockActive, setScreenshotBlockActive] = useState<boolean>(() => {
    return localStorage.getItem('vault_screenshot_block_active') !== 'false';
  });
  const [biometricsActive, setBiometricsActive] = useState<boolean>(() => {
    return isBiometricsAutoPromptEnabled();
  });
  const [isBioPairConfigured, setIsBioPairConfigured] = useState<boolean>(() => {
    return hasBiometricCredentials();
  });

  // Flip to lock state
  const [flipToLockEnabled, setFlipToLockEnabled] = useState<boolean>(() => flipToLockService.isEnabled());

  const handleToggleFlipToLock = (enabled: boolean) => {
    setFlipToLockEnabled(enabled);
    flipToLockService.setEnabled(enabled);
    showToast(
      enabled
        ? 'Bloqueo al voltear boca abajo activado'
        : 'Bloqueo al voltear desactivado',
      'info'
    );
  };

  // Theme state for dedicated screens
  const [currentTheme, setCurrentTheme] = useState<VaultTheme>(() => themeService.getTheme());
  useEffect(() => {
    return themeService.subscribe((t) => setCurrentTheme(t));
  }, []);
  const isLightTheme = currentTheme === 'light';

  // Change PIN states
  const [showChangePinScreen, setShowChangePinScreen] = useState(false);
  const [showExtraPinChangeModal, setShowExtraPinChangeModal] = useState(false);
  const [extraPinConfigured, setExtraPinConfigured] = useState<boolean>(() => isExtraPinConfigured());
  const [focusedPinField, setFocusedPinField] = useState<'current' | 'new' | 'confirm' | null>('new');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmNewPin, setShowConfirmNewPin] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  const wasChangePinOpenRef = useRef(false);
  const changePinTouchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleCloseChangePinScreen = useCallback(() => {
    setShowChangePinScreen(false);
    setPinChangeError(null);
    setPinChangeSuccess(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
    setShowCurrentPin(false);
    setShowNewPin(false);
    setShowConfirmNewPin(false);
  }, []);

  const handleToggleChangePinScreen = (enabled: boolean) => {
    if (enabled) {
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      setShowCurrentPin(false);
      setShowNewPin(false);
      setShowConfirmNewPin(false);
      setPinChangeError(null);
      setPinChangeSuccess(false);
      setFocusedPinField('new');
      setShowChangePinScreen(true);
    } else {
      handleCloseChangePinScreen();
    }
  };

  useEffect(() => {
    if (showChangePinScreen && !wasChangePinOpenRef.current) {
      wasChangePinOpenRef.current = true;
      try {
        window.history.pushState({ secModal: 'change_pin' }, '');
      } catch {}
    } else if (!showChangePinScreen && wasChangePinOpenRef.current) {
      wasChangePinOpenRef.current = false;
      try {
        if (window.history.state?.secModal === 'change_pin') {
          (window as any).__ignoreNextPopState = true;
          window.history.back();
        }
      } catch {}
    }
  }, [showChangePinScreen]);

  useEffect(() => {
    if (!showChangePinScreen) return;
    return registerBackHandler(
      'sec_change_pin_screen',
      () => {
        wasChangePinOpenRef.current = false;
        handleCloseChangePinScreen();
        return true;
      },
      92
    );
  }, [showChangePinScreen, handleCloseChangePinScreen]);

  // Live requirement checks for Cambiar PIN maestro card
  const reqMinDigits = newPin.length === 4;
  const reqPinsMatch = newPin.length === 4 && newPin === confirmNewPin;
  const reqIsDifferent =
    newPin.length === 4 &&
    (currentPin.length > 0
      ? newPin !== currentPin
      : sessionPin
      ? newPin !== sessionPin
      : true);

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError(null);
    setPinChangeSuccess(false);

    if (newPin.length !== 4) {
      setPinChangeError('El nuevo PIN debe tener exactamente 4 dígitos');
      return;
    }

    if (newPin !== confirmNewPin) {
      setPinChangeError('Los dos PIN nuevos no coinciden');
      return;
    }

    if (newPin === currentPin) {
      setPinChangeError('El nuevo PIN debe ser distinto al PIN actual');
      return;
    }

    setIsChangingPin(true);

    try {
      const saltHex = localStorage.getItem('vault_salt');
      const testIvHex = localStorage.getItem('vault_test_iv');
      const testCipherHex = localStorage.getItem('vault_test_cipher');

      if (!saltHex || !testIvHex || !testCipherHex) {
        throw new Error('Datos de verificación de bóveda no encontrados');
      }

      const salt = hexToBuf(saltHex);
      const testKey = await deriveKeyFromPin(currentPin, salt);
      const isValid = await verifyKey(testKey, testIvHex, testCipherHex);

      if (!isValid) {
        setPinChangeError('El PIN actual es incorrecto');
        setIsChangingPin(false);
        return;
      }

      const isSameAsDuress = await verifyDuressPinHash(newPin);
      if (isSameAsDuress) {
        setPinChangeError('El nuevo PIN maestro no puede ser igual a tu PIN de coacción.');
        setIsChangingPin(false);
        return;
      }

      const newSalt = generateSalt();
      const newDerivedKey = await deriveKeyFromPin(newPin, newSalt);
      const newVerification = await createVerificationPayload(newDerivedKey);

      // Re-encrypt all items in IndexedDB (including Recycle Bin) from testKey to newDerivedKey
      try {
        const allItems = await getAllEncryptedItems(true);
        const updatedItems: EncryptedVaultItem[] = [];
        for (const item of allItems) {
          try {
            const isUnencrypted = !item.iv || item.iv.length === 0 || checkIsUnencryptedMedia(item.data);
            const decrypted = isUnencrypted ? item.data : await decryptBuffer(item.data, item.iv, testKey);
            const reEncrypted = await encryptBuffer(decrypted, newDerivedKey);
            updatedItems.push({
              ...item,
              iv: reEncrypted.iv,
              data: reEncrypted.data,
            });
          } catch (itemErr) {
            console.warn(`Could not re-encrypt item ${item.id} during PIN change:`, itemErr);
            updatedItems.push(item);
          }
        }
        if (updatedItems.length > 0) {
          await saveEncryptedItems(updatedItems);
        }
      } catch (reErr) {
        console.warn('Error during batch item re-encryption on PIN change:', reErr);
      }

      localStorage.setItem('vault_salt', bufToHex(newSalt));
      localStorage.setItem('vault_test_iv', newVerification.ivHex);
      localStorage.setItem('vault_test_cipher', newVerification.cipherHex);
      localStorage.setItem('vault_pin_length', newPin.length.toString());

      try {
        sessionStorage.setItem('vault_session_pin', newPin);
      } catch {}

      // Sync Biometric PIN & Recovery Key Escrow with the new master PIN/key
      await updateBiometricPinIfEnrolled(newPin);
      await rebindRecoveryKeyToNewMasterKey(testKey, newDerivedKey);

      if (onMasterKeyUpdated) {
        onMasterKeyUpdated(newDerivedKey, newPin);
      }

      setPinChangeSuccess(true);
      showToast('PIN maestro actualizado con éxito', 'success');
      handleCloseChangePinScreen();
    } catch (err: any) {
      console.error('Error changing PIN:', err);
      setPinChangeError(err?.message || 'Error al cambiar PIN');
    } finally {
      setIsChangingPin(false);
    }
  };

  // Modal de confirmación con PIN para desactivar bloqueo de capturas
  const [showDisableScreenshotModal, setShowDisableScreenshotModal] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [confirmPinError, setConfirmPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Duress PIN setup states
  const [showDuressModal, setShowDuressModal] = useState(false);
  const [duressStep, setDuressStep] = useState<'create' | 'confirm'>('create');
  const [duressPinInput, setDuressPinInput] = useState('');
  const [duressPinConfirmInput, setDuressPinConfirmInput] = useState('');
  const [duressPinError, setDuressPinError] = useState<string | null>(null);

  // Biometric activation direct sensor states
  const [isEnrollingBio, setIsEnrollingBio] = useState(false);
  const [showBioPinModal, setShowBioPinModal] = useState(false);
  const [bioPinInput, setBioPinInput] = useState('');
  const [bioPinError, setBioPinError] = useState<string | null>(null);

  const [showAllLogsModal, setShowAllLogsModal] = useState<boolean>(false);

  // Back button registrations for modals in Security Tab
  useEffect(() => {
    if (showDisableScreenshotModal) {
      try { window.history.pushState({ secModal: 'ss' }, ''); } catch {}
      return registerBackHandler('sec_disable_ss_modal', () => {
        setShowDisableScreenshotModal(false);
        setConfirmPin('');
        setConfirmPinError(null);
        return true;
      }, 85);
    }
  }, [showDisableScreenshotModal]);

  useEffect(() => {
    if (showDuressModal) {
      try { window.history.pushState({ secModal: 'duress' }, ''); } catch {}
      return registerBackHandler('sec_duress_modal', () => {
        setShowDuressModal(false);
        setDuressPinInput('');
        setDuressPinConfirmInput('');
        setDuressPinError(null);
        return true;
      }, 85);
    }
  }, [showDuressModal]);

  useEffect(() => {
    if (showBioPinModal) {
      try { window.history.pushState({ secModal: 'bio' }, ''); } catch {}
      return registerBackHandler('sec_bio_pin_modal', () => {
        setShowBioPinModal(false);
        setBioPinInput('');
        setBioPinError(null);
        return true;
      }, 85);
    }
  }, [showBioPinModal]);

  useEffect(() => {
    if (showAllLogsModal) {
      try { window.history.pushState({ secModal: 'logs' }, ''); } catch {}

      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevOverscroll = document.body.style.overscrollBehavior;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';

      const unregisterBack = registerBackHandler('sec_all_logs_modal', () => {
        setShowAllLogsModal(false);
        return true;
      }, 85);

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overscrollBehavior = prevOverscroll;
        unregisterBack();
      };
    }
  }, [showAllLogsModal]);

  /* ==================== BLOQUE DE HISTORIAL (ESTADOS Y MEMOS) ==================== */
  // Modal de detalle de un registro específico (Bottom Sheet)
  const [selectedLogDetail, setSelectedLogDetail] = useState<AccessLogItem | null>(null);
  const [sheetDragDelta, setSheetDragDelta] = useState<number>(0);
  const sheetTouchStartY = React.useRef<number | null>(null);
  // Modal de confirmación con PIN para vaciar historial
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [clearPinInput, setClearPinInput] = useState<string>('');
  const [clearPinError, setClearPinError] = useState<string | null>(null);
  const [isVerifyingClearPin, setIsVerifyingClearPin] = useState<boolean>(false);

  // Filtros: 'all' | 'success' | 'failed'
  const [logsFilter, setLogsFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    if (selectedLogDetail) {
      try { window.history.pushState({ secModal: 'log_detail' }, ''); } catch {}

      // Bloqueo total de desplazamiento para Android nativo (Capacitor / WebAPK)
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevOverscroll = document.body.style.overscrollBehavior;
      const prevTouchAction = document.body.style.touchAction;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
      document.body.style.touchAction = 'none';

      const unregisterBack = registerBackHandler('sec_log_detail_modal', () => {
        setSelectedLogDetail(null);
        return true;
      }, 90);

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overscrollBehavior = prevOverscroll;
        document.body.style.touchAction = prevTouchAction;
        unregisterBack();
      };
    }
  }, [selectedLogDetail]);

  useEffect(() => {
    if (showClearConfirmModal) {
      try { window.history.pushState({ secModal: 'clear_confirm' }, ''); } catch {}
      return registerBackHandler('sec_clear_logs_modal', () => {
        setShowClearConfirmModal(false);
        setClearPinInput('');
        setClearPinError(null);
        return true;
      }, 95);
    }
  }, [showClearConfirmModal]);

  // Cargar registros de acceso reales (limitado estrictamente a 100)
  const [logs, setLogs] = useState<AccessLogItem[]>(() => {
    try {
      const stored = localStorage.getItem('nullvault_access_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.slice(0, 100);
      }
    } catch (e) {
      console.error(e);
    }
    const lastAcc = localStorage.getItem('nullvault_last_access');
    if (lastAcc) {
      return [
        {
          id: `log_init_${Date.now()}`,
          type: 'success',
          method: 'pin',
          isLockout: false,
          title: 'Acceso correcto',
          time: lastAcc,
          timestamp: Date.now(),
        },
      ];
    }
    return [];
  });

  // Intentos fallidos desde el último acceso exitoso (Requisito 6)
  const failedSinceLastAccess = useMemo(() => {
    // 1. Verificamos primero la variable exacta guardada al momento del desbloqueo exitoso
    const storedBefore = localStorage.getItem('nullvault_failed_before_last_success');
    if (storedBefore !== null && storedBefore !== '') {
      const num = Number(storedBefore);
      if (!isNaN(num)) return num;
    }

    if (!logs || logs.length === 0) return 0;

    // 2. Si no existe la variable, calculamos examinando los registros entre el éxito actual y el previo
    let firstSuccessIdx = -1;
    for (let i = 0; i < logs.length; i++) {
      if (logs[i].type === 'success') {
        firstSuccessIdx = i;
        break;
      }
    }

    // Si no hay ningún acceso exitoso en la lista, contamos los fallos reales (!isLockout)
    if (firstSuccessIdx === -1) {
      return logs.filter((l) => l.type === 'failed' && !l.isLockout).length;
    }

    // Si el primer registro es el éxito actual (índice 0):
    // Contamos únicamente los intentos fallidos de PIN/huella (!isLockout) que ocurrieron antes de este acceso
    let count = 0;
    const startIndex = firstSuccessIdx === 0 ? 1 : 0;
    for (let i = startIndex; i < logs.length; i++) {
      if (logs[i].type === 'success') {
        // Encontramos el éxito anterior, terminamos el conteo
        break;
      }
      if (logs[i].type === 'failed' && !logs[i].isLockout) {
        count++;
      }
    }

    return count;
  }, [logs]);

  // Conteos para chips de filtro
  const countSuccess = useMemo(() => logs.filter((l) => l.type === 'success').length, [logs]);
  const countFailed = useMemo(() => logs.filter((l) => l.type === 'failed').length, [logs]);

  // Registros según filtro seleccionado
  const filteredLogs = useMemo(() => {
    if (logsFilter === 'success') return logs.filter((l) => l.type === 'success');
    if (logsFilter === 'failed') return logs.filter((l) => l.type === 'failed');
    return logs;
  }, [logs, logsFilter]);

  // Agrupación de registros por día: "Hoy", "Ayer", "24 oct" (Requisito 2)
  const groupedLogs = useMemo(() => {
    const groups: { label: string; items: AccessLogItem[] }[] = [];
    const map = new Map<string, AccessLogItem[]>();
    for (const log of filteredLogs) {
      const label = getDayGroupLabel(log.timestamp);
      if (!map.has(label)) {
        map.set(label, []);
        groups.push({ label, items: map.get(label)! });
      }
      map.get(label)!.push(log);
    }
    return groups;
  }, [filteredLogs]);
  /* ==================== FIN BLOQUE DE HISTORIAL (ESTADOS Y MEMOS) ==================== */

  // Handlers for protection switches
  const handleToggleDuress = () => {
    if (duressPinActive) {
      setDuressPinActive(false);
      clearDuressPinHash();
      showToast('PIN de coacción desactivado', 'info');
    } else {
      setDuressStep('create');
      setDuressPinInput('');
      setDuressPinConfirmInput('');
      setDuressPinError(null);
      setShowDuressModal(true);
    }
  };

  const triggerBiometricForScreenshot = async () => {
    if (!hasBiometricCredentials()) return;
    setIsVerifyingPin(true);
    setConfirmPinError(null);
    try {
      const decryptedPin = await authenticateWithBiometrics(true);
      if (decryptedPin) {
        await handleVerifyDisableScreenshotPin(decryptedPin);
      }
    } catch (err: any) {
      console.debug('Sensor de huella cancelado o fallido:', err);
      if (err?.name !== 'NotAllowedError' && !err?.message?.includes('cancelada')) {
        setConfirmPinError(err?.message || 'Sensor de huella no reconocido. Usa tu PIN.');
      }
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleToggleScreenshot = () => {
    if (screenshotBlockActive) {
      setConfirmPin('');
      setConfirmPinError(null);
      setShowDisableScreenshotModal(true);
      if (hasBiometricCredentials()) {
        setTimeout(() => {
          triggerBiometricForScreenshot();
        }, 150);
      }
    } else {
      setScreenshotBlockActive(true);
      localStorage.setItem('vault_screenshot_block_active', 'true');
      setScreenshotBlockEnabled(true);
      window.dispatchEvent(new Event('vault_security_settings_changed'));
      showToast('Bloqueo de capturas activado', 'info');
    }
  };

  const triggerBiometricEnrollment = async (pinToUse: string) => {
    setIsEnrollingBio(true);
    setBioPinError(null);
    try {
      const success = await enrollBiometrics(pinToUse);
      if (success) {
        setBiometricsAutoPromptEnabled(true);
        setBiometricsActive(true);
        setIsBioPairConfigured(true);
        setShowBioPinModal(false);
        setBioPinInput('');
        showToast('Huella digital vinculada y activada', 'success');
      } else {
        setBiometricsAutoPromptEnabled(false);
        setBiometricsActive(false);
        showToast('No se pudo verificar el sensor de huella', 'alert');
      }
    } catch (err: any) {
      setBiometricsAutoPromptEnabled(false);
      setBiometricsActive(false);
      const msg = err?.message || 'Sensor de huella cancelado o no reconocido';
      setBioPinError(msg);
      showToast(msg, 'alert');
    } finally {
      setIsEnrollingBio(false);
    }
  };

  const handleToggleBiometrics = async () => {
    if (biometricsActive) {
      disableBiometrics();
      setBiometricsAutoPromptEnabled(false);
      setBiometricsActive(false);
      setIsBioPairConfigured(false);
      showToast('Huella desvinculada', 'info');
    } else {
      const activePin = sessionPin || sessionStorage.getItem('vault_session_pin');
      if (activePin) {
        showToast('Toca el sensor de huella de tu celular...', 'info');
        await triggerBiometricEnrollment(activePin);
      } else {
        setBioPinInput('');
        setBioPinError(null);
        setShowBioPinModal(true);
      }
    }
  };

  const handleUnlinkBiometrics = () => {
    disableBiometrics();
    setBiometricsAutoPromptEnabled(false);
    setBiometricsActive(false);
    setIsBioPairConfigured(false);
    showToast('Huella desvinculada de este celular', 'info');
  };

  // PIN Verification handlers
  const handleVerifyDisableScreenshotPin = async (enteredPin: string) => {
    setIsVerifyingPin(true);
    setConfirmPinError(null);
    try {
      const saltHex = localStorage.getItem('vault_salt');
      const testIvHex = localStorage.getItem('vault_test_iv');
      const testCipherHex = localStorage.getItem('vault_test_cipher');
      const sessionPinVal = sessionPin || sessionStorage.getItem('vault_session_pin');

      let isValid = false;
      if (sessionPinVal && enteredPin === sessionPinVal) {
        isValid = true;
      } else if (saltHex && testIvHex && testCipherHex) {
        const salt = hexToBuf(saltHex);
        const derivedKey = await deriveKeyFromPin(enteredPin, salt);
        isValid = await verifyKey(derivedKey, testIvHex, testCipherHex);
      }

      if (isValid) {
        setScreenshotBlockActive(false);
        localStorage.setItem('vault_screenshot_block_active', 'false');
        setScreenshotBlockEnabled(false);
        window.dispatchEvent(new Event('vault_security_settings_changed'));
        setShowDisableScreenshotModal(false);
        setConfirmPin('');
        showToast('Bloqueo de capturas desactivado', 'info');
      } else {
        setConfirmPinError('PIN incorrecto. Inténtalo de nuevo.');
      }
    } catch (e) {
      console.error(e);
      setConfirmPinError('Error al verificar PIN');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleConfirmDuressPin = async (pin: string) => {
    const sessionPinVal = sessionPin || sessionStorage.getItem('vault_session_pin');
    if (sessionPinVal && pin === sessionPinVal) {
      setDuressPinError('El PIN de coacción no puede ser igual a tu PIN maestro.');
      return;
    }

    const saltHex = localStorage.getItem('vault_salt');
    const testIvHex = localStorage.getItem('vault_test_iv');
    const testCipherHex = localStorage.getItem('vault_test_cipher');
    if (saltHex && testIvHex && testCipherHex) {
      try {
        const salt = hexToBuf(saltHex);
        const testMaster = await deriveKeyFromPin(pin, salt);
        const matchesMaster = await verifyKey(testMaster, testIvHex, testCipherHex);
        if (matchesMaster) {
          setDuressPinError('El PIN de coacción no puede ser igual a tu PIN maestro.');
          return;
        }
      } catch {}
    }

    if (duressStep === 'create') {
      setDuressPinInput(pin);
      setDuressStep('confirm');
      setDuressPinError(null);
    } else {
      if (pin === duressPinInput) {
        await saveDuressPinHash(pin);
        setDuressPinActive(true);
        setShowDuressModal(false);
        setDuressPinInput('');
        setDuressPinConfirmInput('');
        showToast('PIN de coacción activado correctamente', 'success');
      } else {
        setDuressPinError('Los PINs no coinciden. Inténtalo de nuevo.');
        setDuressStep('create');
        setDuressPinInput('');
      }
    }
  };

  /* ==================== BLOQUE DE HISTORIAL (VACIAR HISTORIAL CON PIN) ==================== */
  const handleRequestClearLogs = () => {
    setClearPinInput('');
    setClearPinError(null);
    setShowClearConfirmModal(true);
  };

  const handleConfirmClearLogsWithPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clearPinInput) {
      setClearPinError('Ingresa tu PIN maestro para confirmar.');
      return;
    }

    setIsVerifyingClearPin(true);
    setClearPinError(null);

    try {
      const saltHex = localStorage.getItem('vault_salt');
      const testIvHex = localStorage.getItem('vault_test_iv');
      const testCipherHex = localStorage.getItem('vault_test_cipher');

      if (!saltHex || !testIvHex || !testCipherHex) {
        setClearPinError('Error de configuración de la bóveda.');
        return;
      }

      const salt = hexToBuf(saltHex);
      const derivedKey = await deriveKeyFromPin(clearPinInput, salt);
      const isValid = await verifyKey(derivedKey, testIvHex, testCipherHex);

      if (isValid) {
        localStorage.removeItem('nullvault_access_logs');
        localStorage.setItem('nullvault_failed_since_last_success', '0');
        localStorage.setItem('nullvault_failed_streak', '0');
        localStorage.setItem('nullvault_failed_before_last_success', '0');
        setLogs([]);
        setShowClearConfirmModal(false);
        setClearPinInput('');
        showToast('Historial de accesos vaciado con éxito', 'info');
      } else {
        setClearPinError('PIN maestro incorrecto. No se autorizó el borrado.');
      }
    } catch (err: any) {
      setClearPinError(err?.message || 'Error al validar el PIN.');
    } finally {
      setIsVerifyingClearPin(false);
    }
  };
  /* ==================== FIN BLOQUE DE HISTORIAL (VACIAR HISTORIAL CON PIN) ==================== */

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-[max(calc(env(safe-area-inset-bottom,0px)+4.75rem),5rem)] animate-in fade-in duration-200 select-none box-border">
      {/* Fixed Pinned Header */}
      <header
        className="fixed top-0 left-0 right-0 z-30 [backdrop-filter:blur(24px)] backdrop-blur-xl border-b safe-top-sticky pb-3 px-4 shadow-md transition-all"
        style={{
          backgroundColor: 'var(--theme-bg-header, rgba(6, 11, 20, 0.94))',
          borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.8))',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="max-w-md mx-auto w-full flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-0.5" style={{ color: 'var(--theme-text-main, #ffffff)' }}>
              Seguri<span style={{ color: 'var(--theme-primary, #00e5ff)' }}>dad</span>
            </h1>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>
              PROTECCIÓN ACTIVA Y CONTROL DE ACCESO
            </p>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="safe-top-header-spacer shrink-0 w-full mb-3" />

      {/* Card 1: PROTECCIONES ACTIVAS */}
      <div className="bg-[#0a121d] border border-slate-800/90 rounded-3xl p-5 mb-4 shadow-xl">
        <h3 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-4">
          PROTECCIONES ACTIVAS
        </h3>

        <div className="space-y-4">
          {/* 1. PIN de coacción */}
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3.5 flex-1 cursor-pointer group"
              onClick={handleToggleDuress}
            >
              <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-[#00e5ff] transition-colors">
                  PIN de coacción
                </h4>
                <p className="text-xs text-slate-400">
                  {duressPinActive ? 'Activo · Toca para desactivar o cambiar' : 'Inactivo'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleDuress}
              aria-label="Toggle PIN de coacción"
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                duressPinActive ? 'bg-[#00e5ff]' : 'bg-slate-800 border border-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform transform absolute top-0.5 ${
                  duressPinActive ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* 2. Bloqueo de capturas */}
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3.5 flex-1 cursor-pointer group"
              onClick={handleToggleScreenshot}
            >
              <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-[#00e5ff] transition-colors">
                  Bloqueo de capturas
                </h4>
                <p className="text-xs text-slate-400">
                  {screenshotBlockActive ? 'Activo' : 'Inactivo'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleScreenshot}
              aria-label="Toggle Bloqueo de capturas"
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                screenshotBlockActive ? 'bg-[#00e5ff]' : 'bg-slate-800 border border-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform transform absolute top-0.5 ${
                  screenshotBlockActive ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* 3. Biometría */}
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3.5 flex-1 cursor-pointer group"
              onClick={handleToggleBiometrics}
            >
              <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-[#00e5ff] transition-colors">
                  Acceso biométrico
                </h4>
                <p className="text-xs text-slate-400">
                  {biometricsActive ? 'Activo' : 'Sin configurar'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleBiometrics}
              aria-label="Toggle Biometría"
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                biometricsActive ? 'bg-[#00e5ff]' : 'bg-slate-800 border border-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform transform absolute top-0.5 ${
                  biometricsActive ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: PIN Y BLOQUEO */}
      <div className="bg-[#0a121d] border border-slate-800/90 rounded-3xl p-5 mb-4 shadow-xl">
        <h3 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-4">
          PIN Y BLOQUEO
        </h3>

        {/* Políticas de Bloqueo y Cambio de PIN */}
        <div className="space-y-4">
          {/* Timeout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white">Auto-bloqueo por inactividad</h4>
                <p className="text-xs text-slate-400">Bloquea la bóveda si no hay interacción</p>
              </div>
            </div>
            <select
              value={autoLockMinutes}
              onChange={(e) => onAutoLockChange && onAutoLockChange(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#00e5ff] cursor-pointer shrink-0"
            >
              <option value={0.5}>30 seg</option>
              <option value={1}>1 min</option>
              <option value={2}>2 min</option>
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={0}>Desactivado</option>
            </select>
          </div>

          {/* Bloquear al salir de la app */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] shrink-0">
                <EyeOff className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white">Bloquear al salir de la app</h4>
                <p className="text-xs text-slate-400">Protege tu pantalla si sales o minimizas</p>
              </div>
            </div>
            <NeonSwitch
              checked={lockOnTabSwitch}
              onChange={(enabled) => onLockOnTabSwitchChange && onLockOnTabSwitchChange(enabled)}
              ariaLabel="Bloquear al salir de la app"
            />
          </div>

          {/* Bloqueo al Voltear Boca Abajo (Flip to Lock) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white">Bloqueo al voltear boca abajo</h4>
                <p className="text-xs text-slate-400">Bloquea al colocar el móvil sobre la mesa</p>
              </div>
            </div>
            <NeonSwitch
              checked={flipToLockEnabled}
              onChange={handleToggleFlipToLock}
              ariaLabel="Bloqueo al voltear boca abajo"
            />
          </div>

          {/* Cambiar PIN maestro (Fila interactiva con flecha > que abre la pantalla de la tarjeta dedicada) */}
          <button
            type="button"
            onClick={() => handleToggleChangePinScreen(true)}
            aria-label="Cambiar PIN maestro"
            className="w-full flex items-center justify-between pt-3 border-t border-slate-800/80 text-left cursor-pointer group active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2 flex-1">
              <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white group-hover:text-[#00e5ff] transition-colors">
                  Cambiar PIN maestro
                </h4>
                <p className="text-xs text-slate-400">
                  Actualiza el código con el que desbloqueas tu bóveda
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-center text-slate-400 group-hover:text-[#00e5ff] group-hover:border-[#00e5ff]/40 transition-all shrink-0">
              <ChevronRight className="w-4 h-4 stroke-[2.2] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Configurar / Cambiar PIN de Carpeta con PIN (4 dígitos) */}
          <button
            type="button"
            onClick={() => setShowExtraPinChangeModal(true)}
            aria-label="PIN de Carpeta con PIN"
            className="w-full flex items-center justify-between pt-3 border-t border-slate-800/80 text-left cursor-pointer group active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2 flex-1">
              <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white group-hover:text-[#00e5ff] transition-colors">
                  PIN de Carpeta con PIN
                </h4>
                <p className="text-xs text-slate-400">
                  {extraPinConfigured
                    ? 'PIN extra de 4 dígitos activo en tus carpetas · Toca para cambiarlo'
                    : 'Configura un PIN extra de 4 dígitos para tus carpetas más delicadas'}
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-center text-slate-400 group-hover:text-[#00e5ff] group-hover:border-[#00e5ff]/40 transition-all shrink-0">
              <ChevronRight className="w-4 h-4 stroke-[2.2] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* ==================== BLOQUE DE HISTORIAL (VISTA Y MODALES) ==================== */}
      {/* Card 3: REGISTRO DE ACCESOS */}
      <div className="flex items-center justify-between px-1 mb-2.5">
        <h3 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
          REGISTRO DE ACCESOS
        </h3>
        <button
          type="button"
          onClick={() => setShowAllLogsModal(true)}
          className="text-xs font-bold text-[#00e5ff] hover:underline cursor-pointer"
        >
          VER TODO
        </button>
      </div>

      {/* Resumen superior rápido en la tarjeta de accesos (Requisito 6) */}
      <div
        className={`mb-3 p-3 rounded-2xl border flex items-center gap-3 transition-colors ${
          failedSinceLastAccess > 0
            ? 'bg-rose-500/10 border-rose-500/30'
            : 'border-slate-200 dark:border-slate-800/80'
        }`}
        style={{
          backgroundColor: failedSinceLastAccess > 0 ? undefined : 'var(--theme-bg-secondary, rgba(15, 23, 42, 0.4))',
          borderColor: failedSinceLastAccess > 0 ? undefined : 'var(--theme-border, rgba(51, 65, 85, 0.8))',
        }}
      >
        {failedSinceLastAccess > 0 ? (
          <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
        ) : (
          <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-primary, #00e5ff)' }} />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-semibold truncate ${
              failedSinceLastAccess > 0 ? 'text-rose-700 dark:text-rose-300 font-bold' : ''
            }`}
            style={{ color: failedSinceLastAccess > 0 ? undefined : 'var(--theme-text-main, #e2e8f0)' }}
          >
            {failedSinceLastAccess > 0
              ? `${failedSinceLastAccess} ${failedSinceLastAccess === 1 ? 'intento fallido' : 'intentos fallidos'} desde tu último acceso`
              : 'Sin intentos fallidos recientes'}
          </p>
        </div>
      </div>

      <div
        className="rounded-3xl divide-y divide-slate-200 dark:divide-slate-800/70 overflow-hidden shadow-xl mb-4 border transition-colors"
        style={{
          backgroundColor: 'var(--theme-bg-card, #0a121d)',
          borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.8))',
        }}
      >
        {logs.slice(0, 4).map((log) => {
          const isSuccess = log.type === 'success';

          return (
            <div
              key={log.id}
              onClick={() => setSelectedLogDetail(log)}
              className={`flex items-center justify-between p-4 transition-colors cursor-pointer group ${
                isSuccess
                  ? 'hover:bg-slate-500/5'
                  : 'bg-rose-500/[0.05] hover:bg-rose-500/[0.09]'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--theme-primary, #00e5ff)' }} />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4
                      className="text-sm font-semibold truncate transition-colors"
                      style={{ color: 'var(--theme-text-main, #ffffff)' }}
                    >
                      {log.title}
                    </h4>
                    {log.method === 'biometric' && (
                      <span title="Acceso biométrico">
                        <Fingerprint className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--theme-text-muted, #94a3b8)' }} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>
                    {log.time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                    isSuccess
                      ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/25'
                      : log.isLockout
                      ? 'bg-rose-500/25 text-rose-800 dark:text-rose-300 border border-rose-500/50'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isSuccess ? 'Válido' : log.isLockout ? 'Bloqueado' : 'Fallido'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <Clock className="w-8 h-8" style={{ color: 'var(--theme-text-muted, #64748b)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>
              Aún no hay accesos registrados
            </p>
          </div>
        )}
      </div>

      {/* Modal Todos los Registros de Acceso (HISTORIAL DE ACCESOS) */}
      {showAllLogsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-md border rounded-3xl p-5 shadow-2xl relative max-h-[88vh] flex flex-col transition-colors"
            style={{
              backgroundColor: 'var(--theme-bg-card, #0a121d)',
              borderColor: 'var(--theme-border, #1e293b)',
              color: 'var(--theme-text-main, #ffffff)',
            }}
          >
            {/* Cabecera del modal */}
            <div
              className="flex items-center justify-between pb-3 border-b mb-3"
              style={{ borderColor: 'var(--theme-border, #1e293b)' }}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-primary, #00e5ff)' }} />
                <h3
                  className="font-bold text-sm uppercase tracking-wider"
                  style={{ color: 'var(--theme-text-main, #ffffff)' }}
                >
                  Historial de Accesos
                </h3>
              </div>
              <button
                onClick={() => setShowAllLogsModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-500/10 text-slate-400 hover:text-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Resumen superior (Requisito 6) */}
            <div
              className={`p-3 rounded-2xl border flex items-center gap-3 mb-3.5 transition-colors ${
                failedSinceLastAccess > 0
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
              style={{
                backgroundColor: failedSinceLastAccess > 0 ? undefined : 'var(--theme-bg-secondary, rgba(15, 23, 42, 0.4))',
                borderColor: failedSinceLastAccess > 0 ? undefined : 'var(--theme-border, #1e293b)',
              }}
            >
              {failedSinceLastAccess > 0 ? (
                <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-primary, #00e5ff)' }} />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-semibold ${
                    failedSinceLastAccess > 0 ? 'text-rose-700 dark:text-rose-300 font-bold' : ''
                  }`}
                  style={{ color: failedSinceLastAccess > 0 ? undefined : 'var(--theme-text-main, #e2e8f0)' }}
                >
                  {failedSinceLastAccess > 0
                    ? `${failedSinceLastAccess} ${failedSinceLastAccess === 1 ? 'intento fallido' : 'intentos fallidos'} desde tu último acceso`
                    : 'Sin intentos fallidos recientes'}
                </p>
              </div>
            </div>

            {/* Chips de filtro: Todos, Exitosos, Fallidos (Requisito 5) */}
            <div className="flex items-center gap-2 mb-3 px-0.5">
              <button
                type="button"
                onClick={() => setLogsFilter('all')}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border"
                style={{
                  backgroundColor: logsFilter === 'all' ? 'var(--theme-glow, rgba(0, 229, 255, 0.15))' : 'var(--theme-bg-secondary, rgba(15, 23, 42, 0.4))',
                  borderColor: logsFilter === 'all' ? 'var(--theme-primary, #00e5ff)' : 'var(--theme-border, #334155)',
                  color: logsFilter === 'all' ? 'var(--theme-primary, #00e5ff)' : 'var(--theme-text-muted, #94a3b8)',
                }}
              >
                Todos ({logs.length})
              </button>
              <button
                type="button"
                onClick={() => setLogsFilter('success')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                  logsFilter === 'success'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
                style={{
                  backgroundColor: logsFilter === 'success' ? undefined : 'var(--theme-bg-secondary, rgba(15, 23, 42, 0.4))',
                  borderColor: logsFilter === 'success' ? undefined : 'var(--theme-border, #334155)',
                  color: logsFilter === 'success' ? undefined : 'var(--theme-text-muted, #94a3b8)',
                }}
              >
                Exitosos ({countSuccess})
              </button>
              <button
                type="button"
                onClick={() => setLogsFilter('failed')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                  logsFilter === 'failed'
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
                style={{
                  backgroundColor: logsFilter === 'failed' ? undefined : 'var(--theme-bg-secondary, rgba(15, 23, 42, 0.4))',
                  borderColor: logsFilter === 'failed' ? undefined : 'var(--theme-border, #334155)',
                  color: logsFilter === 'failed' ? undefined : 'var(--theme-text-muted, #94a3b8)',
                }}
              >
                Fallidos ({countFailed})
              </button>
            </div>

            {/* Lista agrupada por día con encabezados a la DERECHA: "Hoy", "Ayer", "24 oct" (Requisito 2) */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {groupedLogs.map((group) => (
                <div key={group.label} className="space-y-2">
                  {/* Encabezado cronológico alineado hacia el lado DERECHO */}
                  <div className="flex items-center justify-end gap-1.5 px-2 pt-1.5 pb-0.5 text-right">
                    <span
                      className="text-xs font-bold tracking-wide uppercase font-mono"
                      style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                    >
                      {group.label}
                    </span>
                    <Calendar
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: 'var(--theme-primary, #00e5ff)' }}
                    />
                  </div>

                  <div className="space-y-2">
                    {group.items.map((log) => {
                      const isSuccess = log.type === 'success';

                      return (
                        <div
                          key={log.id}
                          onClick={() => setSelectedLogDetail(log)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer border ${
                            isSuccess
                              ? 'hover:brightness-105'
                              : 'bg-rose-500/[0.06] border-rose-500/30 hover:bg-rose-500/[0.1]'
                          }`}
                          style={{
                            backgroundColor: isSuccess ? 'var(--theme-bg-secondary, rgba(15, 23, 42, 0.5))' : undefined,
                            borderColor: isSuccess ? 'var(--theme-border, rgba(51, 65, 85, 0.7))' : undefined,
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {isSuccess ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-primary, #00e5ff)' }} />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p
                                  className="text-xs font-semibold truncate"
                                  style={{ color: 'var(--theme-text-main, #ffffff)' }}
                                >
                                  {log.title}
                                </p>
                                {log.method === 'biometric' && (
                                  <span title="Acceso biométrico">
                                    <Fingerprint className="w-3 h-3 shrink-0" style={{ color: 'var(--theme-text-muted, #94a3b8)' }} />
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-mono" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>
                                {log.time}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                                isSuccess
                                  ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/25'
                                  : log.isLockout
                                  ? 'bg-rose-500/25 text-rose-800 dark:text-rose-300 border border-rose-500/50'
                                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {isSuccess ? 'Válido' : log.isLockout ? 'Bloqueado' : 'Fallido'}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Estado vacío (Requisito 10) */}
              {groupedLogs.length === 0 && (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2.5">
                  <div
                    className="w-12 h-12 rounded-2xl border flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--theme-bg-secondary, rgba(15, 23, 42, 0.5))',
                      borderColor: 'var(--theme-border, #1e293b)',
                      color: 'var(--theme-text-muted, #94a3b8)',
                    }}
                  >
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>
                    Aún no hay accesos registrados
                  </p>
                </div>
              )}
            </div>

            {/* Pie del modal con botón de vaciar historial y cerrar */}
            <div
              className="pt-3.5 border-t mt-3 flex items-center justify-between"
              style={{ borderColor: 'var(--theme-border, #1e293b)' }}
            >
              <button
                type="button"
                onClick={handleRequestClearLogs}
                disabled={logs.length === 0}
                className="text-xs text-rose-500 hover:text-rose-400 flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-opacity font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar historial</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAllLogsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'var(--theme-bg-secondary, #1e293b)',
                  color: 'var(--theme-text-main, #ffffff)',
                  border: '1px solid var(--theme-border, #334155)',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hoja Inferior (Bottom Sheet) - Detalle de Acceso */}
      {selectedLogDetail && (
        <div
          className="fixed inset-0 z-[55] flex items-end justify-center animate-in fade-in duration-200 transition-opacity overscroll-none touch-none select-none"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', touchAction: 'none' }}
          onClick={() => setSelectedLogDetail(null)}
          onTouchMove={(e) => {
            // Evitar que el gesto táctil en la capa oscura se propague a la vista nativa de fondo
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              sheetTouchStartY.current = e.touches[0].clientY;
            }}
            onTouchMove={(e) => {
              if (sheetTouchStartY.current !== null) {
                const delta = e.touches[0].clientY - sheetTouchStartY.current;
                // Desplazamiento exclusivo hacia abajo para cerrar la hoja
                if (delta > 0) {
                  e.preventDefault();
                  e.stopPropagation();
                  setSheetDragDelta(delta);
                } else {
                  // Prevenir que el arrastre hacia arriba intente desplazar el fondo nativo
                  e.preventDefault();
                  e.stopPropagation();
                }
              }
            }}
            onTouchEnd={() => {
              if (sheetDragDelta > 70) {
                setSelectedLogDetail(null);
              }
              sheetTouchStartY.current = null;
              setSheetDragDelta(0);
            }}
            style={{
              transform: `translateY(${Math.max(0, sheetDragDelta)}px)`,
              transition: sheetDragDelta > 0 ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              backgroundColor: 'var(--theme-bg-card, #0a121d)',
              borderColor: 'var(--theme-border, #1e293b)',
              color: 'var(--theme-text-main, #ffffff)',
              touchAction: 'none',
              overscrollBehavior: 'contain',
            }}
            className="w-full max-w-lg border-t border-x rounded-t-3xl px-6 pt-3 pb-8 shadow-2xl relative flex flex-col animate-in slide-in-from-bottom duration-200 select-none"
          >
            {/* Manija táctil superior (indicador de deslizamiento) */}
            <div className="w-12 h-1.5 rounded-full mx-auto mb-4 bg-slate-400/40 dark:bg-slate-600/50" />

            {/* Ícono circular grande arriba */}
            <div className="text-center mb-1">
              {selectedLogDetail.type === 'success' ? (
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center bg-cyan-500/10 border-2 border-cyan-500/30"
                  style={{ color: 'var(--theme-primary, #00e5ff)' }}
                >
                  <Check className="w-8 h-8 stroke-[2.8]" />
                </div>
              ) : selectedLogDetail.isLockout ? (
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center bg-rose-500/15 border-2 border-rose-500/40 text-rose-500 dark:text-rose-400">
                  <Lock className="w-8 h-8 stroke-[2.4]" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center bg-rose-500/10 border-2 border-rose-500/30 text-rose-500 dark:text-rose-400">
                  <X className="w-8 h-8 stroke-[2.8]" />
                </div>
              )}

              {/* Título según el tipo */}
              <h3
                className="text-center font-bold text-lg mb-5"
                style={{ color: 'var(--theme-text-main, #ffffff)' }}
              >
                {selectedLogDetail.type === 'success'
                  ? 'Acceso correcto'
                  : selectedLogDetail.isLockout
                  ? 'Bloqueo activado'
                  : 'PIN incorrecto'}
              </h3>
            </div>

            {/* Filas con etiqueta gris pequeña y valor debajo */}
            <div
              className="border rounded-2xl p-4 space-y-3.5 mb-5 text-left"
              style={{
                backgroundColor: 'var(--theme-bg-secondary, rgba(15, 23, 42, 0.5))',
                borderColor: 'var(--theme-border, #1e293b)',
              }}
            >
              {/* Fecha: formato largo en español */}
              <div>
                <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Fecha
                </span>
                <span
                  className="block text-sm font-semibold mt-0.5"
                  style={{ color: 'var(--theme-text-main, #ffffff)' }}
                >
                  {formatDetailDateLong(selectedLogDetail.timestamp)}
                </span>
              </div>

              {/* Hora: con segundos */}
              <div>
                <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Hora
                </span>
                <span
                  className="block text-sm font-semibold font-mono mt-0.5"
                  style={{ color: 'var(--theme-text-main, #ffffff)' }}
                >
                  {formatDetailTimeWithSeconds(selectedLogDetail.timestamp)}
                </span>
              </div>

              {/* Método */}
              <div>
                <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Método
                </span>
                <span
                  className="block text-sm font-semibold mt-0.5"
                  style={{ color: 'var(--theme-text-main, #ffffff)' }}
                >
                  {selectedLogDetail.method === 'biometric' ? 'Biométrico' : 'PIN'}
                </span>
              </div>

              {/* Resultado */}
              <div>
                <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Resultado
                </span>
                <div className="mt-0.5">
                  <span
                    className={`inline-block font-bold px-2.5 py-0.5 rounded-full text-xs ${
                      selectedLogDetail.type === 'success'
                        ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30'
                        : selectedLogDetail.isLockout
                        ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/50'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {selectedLogDetail.type === 'success'
                      ? 'Válido'
                      : selectedLogDetail.isLockout
                      ? 'Bloqueado'
                      : 'Fallido'}
                  </span>
                </div>
              </div>

              {/* Solo si es fallido (no bloqueo) */}
              {selectedLogDetail.type === 'failed' && !selectedLogDetail.isLockout && (
                <div>
                  <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Intentos antes del bloqueo
                  </span>
                  <span className="block text-sm font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                    {`Intento ${selectedLogDetail.attemptNumber || 1} de 3 antes del bloqueo`}
                  </span>
                </div>
              )}

              {/* Solo si es bloqueado */}
              {selectedLogDetail.isLockout && (
                <div>
                  <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Duración del bloqueo
                  </span>
                  <span className="block text-sm font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                    {`Duración del bloqueo: ${selectedLogDetail.lockoutDuration || 30} segundos`}
                  </span>
                </div>
              )}
            </div>

            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={() => setSelectedLogDetail(null)}
              className="w-full py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-[0.99]"
              style={{
                backgroundColor: 'var(--theme-bg-secondary, #1e293b)',
                color: 'var(--theme-text-main, #ffffff)',
                border: '1px solid var(--theme-border, #334155)',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal Confirmar PIN antes de Vaciar Historial (Requisito 8) */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm border rounded-3xl p-6 shadow-2xl relative transition-colors"
            style={{
              backgroundColor: 'var(--theme-bg-card, #0a121d)',
              borderColor: 'var(--theme-border, #1e293b)',
              color: 'var(--theme-text-main, #ffffff)',
            }}
          >
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base" style={{ color: 'var(--theme-text-main, #ffffff)' }}>
                ¿Vaciar Historial de Accesos?
              </h3>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>
                Esta acción borrará de forma irreversible todos los registros de intentos de acceso. Introduce tu PIN maestro para confirmar.
              </p>
            </div>

            <form onSubmit={handleConfirmClearLogsWithPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  value={clearPinInput}
                  onChange={(e) => {
                    setClearPinInput(e.target.value);
                    setClearPinError(null);
                  }}
                  placeholder="Introduce tu PIN maestro"
                  autoFocus
                  required
                  className="w-full rounded-xl px-4 py-2.5 text-center text-sm focus:outline-none focus:border-rose-500 font-mono tracking-widest border transition-colors"
                  style={{
                    backgroundColor: 'var(--theme-bg-input, #0f172a)',
                    borderColor: 'var(--theme-border, #334155)',
                    color: 'var(--theme-text-main, #ffffff)',
                  }}
                />
              </div>

              {clearPinError && (
                <div className="text-rose-700 dark:text-rose-400 text-xs bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30 text-center font-semibold">
                  {clearPinError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowClearConfirmModal(false);
                    setClearPinInput('');
                    setClearPinError(null);
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary, #1e293b)',
                    color: 'var(--theme-text-main, #cbd5e1)',
                    border: '1px solid var(--theme-border, #334155)',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingClearPin || !clearPinInput}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/20 cursor-pointer disabled:opacity-40 transition-colors"
                >
                  {isVerifyingClearPin ? 'Verificando...' : 'Vaciar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ==================== FIN BLOQUE DE HISTORIAL (VISTA Y MODALES) ==================== */}

      {/* Modal Confirmar PIN para Desactivar Bloqueo de Capturas */}
      {showDisableScreenshotModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0a121d] border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                Desactivar Bloqueo de Capturas
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {hasBiometricCredentials()
                  ? 'Toca el sensor de huella o ingresa tu PIN Maestro para autorizar la desactivación.'
                  : 'Ingresa tu PIN Maestro para autorizar la desactivación del bloqueo de capturas de pantalla.'}
              </p>
            </div>

            {hasBiometricCredentials() && (
              <button
                type="button"
                onClick={triggerBiometricForScreenshot}
                disabled={isVerifyingPin}
                className="w-full mb-3.5 py-2.5 px-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 active:scale-95 border border-cyan-500/30 text-[#00e5ff] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Fingerprint className="w-4 h-4 text-[#00e5ff]" />
                <span>{isVerifyingPin ? 'Verificando huella...' : 'Usar sensor de huella'}</span>
              </button>
            )}

            {confirmPinError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-medium">
                {confirmPinError}
              </div>
            )}

            <PinKeypad
              pin={confirmPin}
              maxDigits={4}
              onPinChange={(newPin) => {
                setConfirmPin(newPin);
                setConfirmPinError(null);
                if (newPin.length === 4) {
                  handleVerifyDisableScreenshotPin(newPin);
                }
              }}
              disabled={isVerifyingPin}
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDisableScreenshotModal(false);
                  setConfirmPin('');
                  setConfirmPinError(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear PIN de Coacción */}
      {showDuressModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0a121d] border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                {duressStep === 'create' ? 'Crear PIN de Coacción' : 'Confirmar PIN de Coacción'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {duressStep === 'create'
                  ? 'Elige un PIN alternativo de 4 dígitos. Si entras con este PIN, la app simulará estar vacía.'
                  : 'Vuelve a escribir el PIN de coacción de 4 dígitos para confirmarlo.'}
              </p>
            </div>

            {duressPinError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-medium">
                {duressPinError}
              </div>
            )}

            <PinKeypad
              pin={duressStep === 'create' ? duressPinInput : duressPinConfirmInput}
              maxDigits={4}
              onPinChange={(newPin) => {
                setDuressPinError(null);
                if (duressStep === 'create') {
                  setDuressPinInput(newPin);
                  if (newPin.length === 4) {
                    handleConfirmDuressPin(newPin);
                  }
                } else {
                  setDuressPinConfirmInput(newPin);
                  if (newPin.length === 4) {
                    handleConfirmDuressPin(newPin);
                  }
                }
              }}
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDuressModal(false);
                  setDuressPinInput('');
                  setDuressPinConfirmInput('');
                  setDuressPinError(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Activar Biometría con PIN */}
      {showBioPinModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0a121d] border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] flex items-center justify-center mx-auto mb-3">
                <Fingerprint className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">
                Vincular Huella Digital
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ingresa tu PIN Maestro de 4 dígitos para autorizar el uso de tu sensor de huella.
              </p>
            </div>

            {bioPinError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-medium">
                {bioPinError}
              </div>
            )}

            <PinKeypad
              pin={bioPinInput}
              maxDigits={4}
              onPinChange={(newPin) => {
                setBioPinInput(newPin);
                setBioPinError(null);
                if (newPin.length === 4) {
                  const saltHex = localStorage.getItem('vault_salt');
                  const testIvHex = localStorage.getItem('vault_test_iv');
                  const testCipherHex = localStorage.getItem('vault_test_cipher');
                  const sessionPinVal = sessionPin || sessionStorage.getItem('vault_session_pin');

                  let isValid = false;
                  if (sessionPinVal && newPin === sessionPinVal) {
                    isValid = true;
                  } else if (saltHex && testIvHex && testCipherHex) {
                    const salt = hexToBuf(saltHex);
                    deriveKeyFromPin(newPin, salt).then((derivedKey) => {
                      verifyKey(derivedKey, testIvHex, testCipherHex).then((valid) => {
                        if (valid) {
                          triggerBiometricEnrollment(newPin);
                        } else {
                          setBioPinError('PIN Maestro incorrecto.');
                        }
                      });
                    });
                    return;
                  }

                  if (isValid) {
                    triggerBiometricEnrollment(newPin);
                  } else {
                    setBioPinError('PIN Maestro incorrecto.');
                  }
                }
              }}
              disabled={isEnrollingBio}
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowBioPinModal(false);
                  setBioPinInput('');
                  setBioPinError(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pantalla dedicada: Cambiar PIN maestro (solo tarjeta) */}
      {showChangePinScreen && (
        <div
          onClick={handleCloseChangePinScreen}
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              changePinTouchStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                time: Date.now(),
              };
            }
          }}
          onTouchEnd={(e) => {
            if (!changePinTouchStartRef.current || e.changedTouches.length === 0) return;
            const start = changePinTouchStartRef.current;
            changePinTouchStartRef.current = null;
            const dx = e.changedTouches[0].clientX - start.x;
            const dy = e.changedTouches[0].clientY - start.y;
            const dt = Date.now() - start.time;
            const screenW = window.innerWidth || 360;
            const startedNearEdge = start.x <= 48 || start.x >= screenW - 48;
            if (
              dt < 600 &&
              Math.abs(dx) >= (startedNearEdge ? 50 : 95) &&
              Math.abs(dx) > Math.abs(dy) * 2.2
            ) {
              handleCloseChangePinScreen();
            }
          }}
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center px-5 py-6 select-none animate-in fade-in duration-200"
          style={{
            backgroundColor: isLightTheme ? '#EEF3F9' : '#060B14',
            color: isLightTheme ? '#0F172A' : '#F8FAFC',
            fontFamily: "'Manrope', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[390px] my-auto rounded-[26px] p-5 box-border transition-all"
            style={{
              backgroundColor: isLightTheme ? '#FFFFFF' : '#0A121D',
              border: `1px solid ${isLightTheme ? '#E2E8F0' : '#1E293B'}`,
              boxShadow: isLightTheme
                ? '0 20px 50px -12px rgba(15, 23, 42, 0.08), 0 4px 16px -4px rgba(15, 23, 42, 0.04)'
                : '0 24px 60px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Cabecera de la tarjeta */}
            <div className="flex items-start gap-3.5 text-left">
              <div
                className="pin-recovery-on-primary w-[48px] h-[48px] rounded-[14px] flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #1E64B7 0%, #3E66E2 100%)',
                }}
              >
                <KeyRound className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0 pt-0.5">
                <h2
                  className="text-[20px] font-extrabold leading-[1.2] tracking-[-0.02em]"
                  style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                >
                  Cambiar PIN maestro
                </h2>
                <p
                  className="text-[13px] font-medium leading-[1.35] mt-1"
                  style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                >
                  Es el código con el que desbloqueas tu bóveda.
                </p>
              </div>
            </div>

            {/* Línea divisoria */}
            <div
              className="w-full h-[1px] my-3.5"
              style={{ backgroundColor: isLightTheme ? '#E2E8F0' : '#1E293B' }}
            />

            {/* Formulario de cambio de PIN */}
            <form onSubmit={handleChangePin} className="text-left">
              <div className="space-y-3">
                {/* 1. PIN actual */}
                <div>
                  <label
                    htmlFor="change-pin-current"
                    className="block text-[13px] font-bold mb-1.5"
                    style={{ color: isLightTheme ? '#1E293B' : '#E2E8F0' }}
                  >
                    PIN actual
                  </label>
                  <div
                    className="w-full h-[46px] rounded-[14px] px-3.5 flex items-center gap-3 transition-all box-border"
                    style={{
                      backgroundColor: isLightTheme ? '#FFFFFF' : '#0F172A',
                      border:
                        focusedPinField === 'current'
                          ? `2px solid ${isLightTheme ? '#0B6FB8' : '#00E5FF'}`
                          : `1.5px solid ${isLightTheme ? '#CBD5E1' : '#1E293B'}`,
                    }}
                  >
                    <Lock
                      className="w-4 h-4 stroke-[1.9] shrink-0"
                      style={{ color: isLightTheme ? '#64748B' : '#94A3B8' }}
                    />
                    <input
                      id="change-pin-current"
                      type={showCurrentPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={4}
                      value={currentPin}
                      onFocus={() => setFocusedPinField('current')}
                      onBlur={() => setFocusedPinField((prev) => (prev === 'current' ? null : prev))}
                      onChange={(e) => {
                        setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                        setPinChangeError(null);
                      }}
                      placeholder="• • • •"
                      required
                      className="bg-transparent w-full h-full border-0 p-0 text-[15px] font-bold tracking-[0.25em] focus:outline-none focus:ring-0"
                      style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPin(!showCurrentPin)}
                      className="p-1 -mr-1 rounded-lg transition-colors cursor-pointer shrink-0"
                      style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                      aria-label={showCurrentPin ? 'Ocultar PIN actual' : 'Ver PIN actual'}
                    >
                      {showCurrentPin ? (
                        <EyeOff className="w-4 h-4 stroke-[1.9]" />
                      ) : (
                        <Eye className="w-4 h-4 stroke-[1.9]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Nuevo PIN */}
                <div>
                  <label
                    htmlFor="change-pin-new"
                    className="block text-[13px] font-bold mb-1.5"
                    style={{ color: isLightTheme ? '#1E293B' : '#E2E8F0' }}
                  >
                    Nuevo PIN
                  </label>
                  <div
                    className="w-full h-[46px] rounded-[14px] px-3.5 flex items-center gap-3 transition-all box-border"
                    style={{
                      backgroundColor: isLightTheme ? '#FFFFFF' : '#0F172A',
                      border:
                        focusedPinField === 'new'
                          ? `2px solid ${isLightTheme ? '#0B6FB8' : '#00E5FF'}`
                          : `1.5px solid ${isLightTheme ? '#CBD5E1' : '#1E293B'}`,
                    }}
                  >
                    <Lock
                      className="w-4 h-4 stroke-[1.9] shrink-0"
                      style={{ color: isLightTheme ? '#64748B' : '#94A3B8' }}
                    />
                    <input
                      id="change-pin-new"
                      type={showNewPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={4}
                      value={newPin}
                      onFocus={() => setFocusedPinField('new')}
                      onBlur={() => setFocusedPinField((prev) => (prev === 'new' ? null : prev))}
                      onChange={(e) => {
                        setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                        setPinChangeError(null);
                      }}
                      placeholder="• • • •"
                      required
                      className="bg-transparent w-full h-full border-0 p-0 text-[15px] font-bold tracking-[0.25em] focus:outline-none focus:ring-0"
                      style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="p-1 -mr-1 rounded-lg transition-colors cursor-pointer shrink-0"
                      style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                      aria-label={showNewPin ? 'Ocultar nuevo PIN' : 'Ver nuevo PIN'}
                    >
                      {showNewPin ? (
                        <EyeOff className="w-4 h-4 stroke-[1.9]" />
                      ) : (
                        <Eye className="w-4 h-4 stroke-[1.9]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. Confirmar nuevo PIN */}
                <div>
                  <label
                    htmlFor="change-pin-confirm"
                    className="block text-[13px] font-bold mb-1.5"
                    style={{ color: isLightTheme ? '#1E293B' : '#E2E8F0' }}
                  >
                    Confirmar nuevo PIN
                  </label>
                  <div
                    className="w-full h-[46px] rounded-[14px] px-3.5 flex items-center gap-3 transition-all box-border"
                    style={{
                      backgroundColor: isLightTheme ? '#FFFFFF' : '#0F172A',
                      border:
                        focusedPinField === 'confirm'
                          ? `2px solid ${isLightTheme ? '#0B6FB8' : '#00E5FF'}`
                          : `1.5px solid ${isLightTheme ? '#CBD5E1' : '#1E293B'}`,
                    }}
                  >
                    <Lock
                      className="w-4 h-4 stroke-[1.9] shrink-0"
                      style={{ color: isLightTheme ? '#64748B' : '#94A3B8' }}
                    />
                    <input
                      id="change-pin-confirm"
                      type={showConfirmNewPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={4}
                      value={confirmNewPin}
                      onFocus={() => setFocusedPinField('confirm')}
                      onBlur={() => setFocusedPinField((prev) => (prev === 'confirm' ? null : prev))}
                      onChange={(e) => {
                        setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                        setPinChangeError(null);
                      }}
                      placeholder="• • • •"
                      required
                      className="bg-transparent w-full h-full border-0 p-0 text-[15px] font-bold tracking-[0.25em] focus:outline-none focus:ring-0"
                      style={{ color: isLightTheme ? '#0F172A' : '#F8FAFC' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPin(!showConfirmNewPin)}
                      className="p-1 -mr-1 rounded-lg transition-colors cursor-pointer shrink-0"
                      style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                      aria-label={showConfirmNewPin ? 'Ocultar confirmación de PIN' : 'Ver confirmación de PIN'}
                    >
                      {showConfirmNewPin ? (
                        <EyeOff className="w-4 h-4 stroke-[1.9]" />
                      ) : (
                        <Eye className="w-4 h-4 stroke-[1.9]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Recuadro de REQUISITOS */}
              <div
                className="w-full rounded-[16px] p-3.5 mt-3.5 box-border"
                style={{
                  backgroundColor: isLightTheme ? '#EEF2F8' : 'rgba(15, 23, 42, 0.75)',
                }}
              >
                <p
                  className="text-[11px] font-extrabold tracking-[0.12em] uppercase mb-2"
                  style={{ color: isLightTheme ? '#475569' : '#94A3B8' }}
                >
                  REQUISITOS
                </p>

                <div className="space-y-1.5">
                  {/* Requisito 1 */}
                  <div className="flex items-center gap-2.5">
                    {reqMinDigits ? (
                      <div
                        className="pin-recovery-on-primary w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 transition-colors"
                        style={{ backgroundColor: '#0D9488' }}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div
                        className="w-4.5 h-4.5 rounded-full shrink-0 transition-colors"
                        style={{
                          border: `1.5px solid ${isLightTheme ? '#94A3B8' : '#475569'}`,
                        }}
                      />
                    )}
                    <span
                      className="text-[13px] font-medium transition-colors"
                      style={{
                        color: reqMinDigits
                          ? isLightTheme
                            ? '#1E293B'
                            : '#F8FAFC'
                          : isLightTheme
                          ? '#64748B'
                          : '#64748B',
                      }}
                    >
                      Exactamente 4 dígitos
                    </span>
                  </div>

                  {/* Requisito 2 */}
                  <div className="flex items-center gap-2.5">
                    {reqPinsMatch ? (
                      <div
                        className="pin-recovery-on-primary w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 transition-colors"
                        style={{ backgroundColor: '#0D9488' }}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div
                        className="w-4.5 h-4.5 rounded-full shrink-0 transition-colors"
                        style={{
                          border: `1.5px solid ${isLightTheme ? '#94A3B8' : '#475569'}`,
                        }}
                      />
                    )}
                    <span
                      className="text-[13px] font-medium transition-colors"
                      style={{
                        color: reqPinsMatch
                          ? isLightTheme
                            ? '#1E293B'
                            : '#F8FAFC'
                          : isLightTheme
                          ? '#64748B'
                          : '#64748B',
                      }}
                    >
                      Los dos PIN nuevos coinciden
                    </span>
                  </div>

                  {/* Requisito 3 */}
                  <div className="flex items-center gap-2.5">
                    {reqIsDifferent ? (
                      <div
                        className="pin-recovery-on-primary w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 transition-colors"
                        style={{ backgroundColor: '#0D9488' }}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div
                        className="w-4.5 h-4.5 rounded-full shrink-0 transition-colors"
                        style={{
                          border: `1.5px solid ${isLightTheme ? '#94A3B8' : '#475569'}`,
                        }}
                      />
                    )}
                    <span
                      className="text-[13px] font-medium transition-colors"
                      style={{
                        color: reqIsDifferent
                          ? isLightTheme
                            ? '#1E293B'
                            : '#F8FAFC'
                          : isLightTheme
                          ? '#64748B'
                          : '#64748B',
                      }}
                    >
                      Es distinto al PIN actual
                    </span>
                  </div>
                </div>
              </div>

              {pinChangeError && (
                <div
                  className="mt-3 flex items-start gap-2 text-[12px] font-semibold p-3 rounded-[12px] border text-left"
                  style={{
                    backgroundColor: isLightTheme ? '#FFF1F2' : 'rgba(244, 63, 94, 0.12)',
                    borderColor: isLightTheme ? '#FECDD3' : 'rgba(244, 63, 94, 0.3)',
                    color: isLightTheme ? '#BE123C' : '#FDA4AF',
                  }}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 stroke-[2]" />
                  <span>{pinChangeError}</span>
                </div>
              )}

              {/* Botón principal Actualizar PIN */}
              <button
                type="submit"
                disabled={
                  isChangingPin ||
                  !currentPin ||
                  !reqMinDigits ||
                  !reqPinsMatch ||
                  !reqIsDifferent
                }
                className="pin-recovery-on-primary w-full h-[48px] rounded-[14px] mt-4 font-bold text-[15px] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(90deg, #1B65B4 0%, #3E6AE1 100%)',
                  boxShadow: isLightTheme
                    ? '0 10px 24px -6px rgba(27, 101, 180, 0.45)'
                    : '0 10px 24px -6px rgba(30, 100, 183, 0.45)',
                }}
              >
                <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                <span>{isChangingPin ? 'Actualizando PIN...' : 'Actualizar PIN'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal para configurar o cambiar el PIN de 4 dígitos de Carpeta con PIN */}
      <ExtraPinModal
        isOpen={showExtraPinChangeModal}
        mode="change"
        categoryLabel="Seguridad"
        mainVaultPin={sessionPin}
        onClose={() => setShowExtraPinChangeModal(false)}
        onSuccess={() => {
          setExtraPinConfigured(true);
          setShowExtraPinChangeModal(false);
          showToast('PIN de Carpeta con PIN guardado correctamente', 'success');
        }}
      />
    </div>
  );
};

