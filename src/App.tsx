/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { SetupVaultView } from './components/SetupVaultView';
import { LockVaultView } from './components/LockVaultView';
import { MainVaultView } from './components/MainVaultView';
import { InitialRegisterView } from './components/InitialRegisterView';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer, ToastData } from './components/Toast';
import { openVaultDatabase, clearVaultDatabase, autoPurgeTrash } from './db/vaultDb';
import { initScreenshotBlocker, setScreenshotBlockToastCallback } from './services/screenshotBlockService';
import { initBackButtonListener } from './services/backButtonService';
import { updateService, UpdateCheckResult } from './services/updateService';
import { flipToLockService } from './services/flipToLockService';
import { themeService } from './services/themeService';
import { userProfileService } from './services/userProfileService';
import { testFirestoreConnection } from './services/firebase';
import { UpdateNotificationModal } from './components/UpdateNotificationModal';
import { CURRENT_APP_VERSION } from './version';
import { disableBiometrics } from './services/biometricService';
import { disableRecoveryKey } from './services/recoveryKeyService';
import { clearDuressPinHash } from './crypto/vaultCrypto';
import { clearAllStoredLocalBackups } from './services/backupStorageService';
import {
  configureAuthPersistence,
  signOutFromFirebase,
} from './services/firebaseAuthService';
import {
  getSavedAutoLockMinutes,
  saveAutoLockMinutes,
  getSavedLockOnTabSwitch,
  saveLockOnTabSwitch,
  getSavedExitGraceSeconds,
  saveExitGraceSeconds,
  isProtectedOperationActive,
} from './services/autoLockService';

export default function App() {
  const [vaultStatus, setVaultStatus] = useState<'checking' | 'register' | 'setup' | 'locked' | 'unlocked'>('checking');
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [sessionPin, setSessionPin] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrivacyBlurActive, setIsPrivacyBlurActive] = useState(false);

  // Settings
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(() => getSavedAutoLockMinutes());
  const [lockOnTabSwitch, setLockOnTabSwitch] = useState<boolean>(() => getSavedLockOnTabSwitch());
  const [lockOnExitGraceSeconds, setLockOnExitGraceSeconds] = useState<number>(() => getSavedExitGraceSeconds());

  const vaultStatusRef = useRef(vaultStatus);
  useEffect(() => {
    vaultStatusRef.current = vaultStatus;
  }, [vaultStatus]);

  const autoLockMinutesRef = useRef(autoLockMinutes);
  useEffect(() => {
    autoLockMinutesRef.current = autoLockMinutes;
  }, [autoLockMinutes]);

  const lockOnTabSwitchRef = useRef(lockOnTabSwitch);
  useEffect(() => {
    lockOnTabSwitchRef.current = lockOnTabSwitch;
  }, [lockOnTabSwitch]);

  const lockOnExitGraceSecondsRef = useRef(lockOnExitGraceSeconds);
  useEffect(() => {
    lockOnExitGraceSecondsRef.current = lockOnExitGraceSeconds;
  }, [lockOnExitGraceSeconds]);

  const [vaultRefreshTrigger, setVaultRefreshTrigger] = useState<number>(0);

  // Sistema de Actualizaciones
  const [pendingUpdateInfo, setPendingUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [isViewingUpdates, setIsViewingUpdates] = useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('vault_updates_menu_active') === 'true';
  });
  const isViewingUpdatesRef = useRef<boolean>(isViewingUpdates);

  useEffect(() => {
    isViewingUpdatesRef.current = isViewingUpdates;
  }, [isViewingUpdates]);

  useEffect(() => {
    const handleUpdateViewState = (e: any) => {
      const isOpen = !!e.detail?.isOpen;
      setIsViewingUpdates(isOpen);
      if (isOpen) {
        setShowUpdateBanner(false);
      }
    };

    window.addEventListener('vault_updates_view_state', handleUpdateViewState);
    return () => window.removeEventListener('vault_updates_view_state', handleUpdateViewState);
  }, []);

  const inactivityTimerRef = useRef<number | null>(null);
  const inactivityWatchdogRef = useRef<number | null>(null);
  const exitGraceTimerRef = useRef<number | null>(null);
  const lastActivityTimestampRef = useRef<number>(Date.now());
  const leftAppAtRef = useRef<number | null>(null);

  // Toast Helper (mostrar únicamente errores importantes)
  const showToast = useCallback((message: string, type: 'info' | 'success' | 'alert' | 'error' = 'info') => {
    if (type !== 'error') return;
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Lock Vault Action
  const lockVault = useCallback((force = false) => {
    if (!force && isProtectedOperationActive()) {
      return;
    }
    if (vaultStatusRef.current !== 'unlocked') {
      return;
    }
    if (inactivityTimerRef.current !== null) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (inactivityWatchdogRef.current !== null) {
      window.clearInterval(inactivityWatchdogRef.current);
      inactivityWatchdogRef.current = null;
    }
    if (exitGraceTimerRef.current !== null) {
      window.clearTimeout(exitGraceTimerRef.current);
      exitGraceTimerRef.current = null;
    }
    leftAppAtRef.current = null;
    setIsPrivacyBlurActive(false);

    try {
      sessionStorage.removeItem('vault_session_pin');
      sessionStorage.removeItem('vault_is_duress_mode');
    } catch {}
    signOutFromFirebase().catch(() => {});
    setMasterKey(null);
    setSessionPin(null);
    setVaultStatus('locked');
    setIsSettingsOpen(false);
  }, []);

  // Unlock handler
  const handleUnlock = useCallback((key: CryptoKey, pin?: string) => {
    const now = Date.now();
    (window as any).__lastUnlockTime = now;
    (window as any).__lastBiometricUnlockTime = now;
    lastActivityTimestampRef.current = now;
    leftAppAtRef.current = null;
    setIsPrivacyBlurActive(false);
    setMasterKey(key);
    if (pin) {
      setSessionPin(pin);
      try {
        sessionStorage.setItem('vault_session_pin', pin);
      } catch {}
    }
    setVaultStatus('unlocked');
  }, []);

  // Android Back navigation for settings
  const isSettingsOpenRef = useRef(isSettingsOpen);
  isSettingsOpenRef.current = isSettingsOpen;
  const wasSettingsOpenRef = useRef(false);

  useEffect(() => {
    if (isSettingsOpen && !wasSettingsOpenRef.current) {
      window.history.pushState({ appOverlay: 'settings' }, '');
      wasSettingsOpenRef.current = true;
    } else if (!isSettingsOpen && wasSettingsOpenRef.current) {
      wasSettingsOpenRef.current = false;
      if (window.history.state?.appOverlay === 'settings') {
        window.history.back();
      }
    }
  }, [isSettingsOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (isSettingsOpenRef.current) {
        wasSettingsOpenRef.current = false;
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check initial vault existence on mount
  useEffect(() => {
    const init = async () => {
      try {
        await configureAuthPersistence();

        await openVaultDatabase();
        const isInit = localStorage.getItem('vault_initialized');
        const saltHex = localStorage.getItem('vault_salt');
        const testIvHex = localStorage.getItem('vault_test_iv');
        const testCipherHex = localStorage.getItem('vault_test_cipher');
        const isRegistered = userProfileService.isUserRegistered();

        const urlParams = new URLSearchParams(window.location.search);
        const forceRegister =
          urlParams.get('view') === 'register' ||
          window.location.hash === '#register';

        if (forceRegister) {
          setVaultStatus('register');
        } else if (isInit === 'true' && saltHex && testIvHex && testCipherHex) {
          setVaultStatus('locked');
        } else if (!isRegistered) {
          setVaultStatus('register');
        } else {
          setVaultStatus('setup');
        }
        autoPurgeTrash(30).catch(() => {});
        testFirestoreConnection().catch(() => {});
      } catch (err) {
        console.error('Initialization error:', err);
        setVaultStatus('setup');
      }
    };

    init();
    initScreenshotBlocker();
    setScreenshotBlockToastCallback(showToast);
    initBackButtonListener();
  }, [showToast]);

  // Flip to Lock / Face-Down
  useEffect(() => {
    if (vaultStatus !== 'unlocked') return;

    const unregister = flipToLockService.register(() => {
      showToast('Bóveda bloqueada al voltear el teléfono', 'alert');
      lockVault(true);
    });

    return () => {
      unregister();
    };
  }, [vaultStatus, lockVault, showToast]);

  // Ensure privacy blur never lingers outside unlocked state
  useEffect(() => {
    if (vaultStatus !== 'unlocked') {
      setIsPrivacyBlurActive(false);
      leftAppAtRef.current = null;
    }
  }, [vaultStatus]);

  // Motor de Auto-bloqueo por Inactividad (tolerante a suspensión de temporizadores en Android)
  useEffect(() => {
    if (inactivityTimerRef.current !== null) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (inactivityWatchdogRef.current !== null) {
      window.clearInterval(inactivityWatchdogRef.current);
      inactivityWatchdogRef.current = null;
    }

    if (vaultStatus !== 'unlocked' || autoLockMinutes <= 0) {
      return;
    }

    const timeoutMs = Math.max(autoLockMinutes * 60_000, 5000);
    lastActivityTimestampRef.current = Date.now();
    let lastScheduleStamp = Date.now();

    const scheduleTimer = (delayMs: number) => {
      if (inactivityTimerRef.current !== null) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = window.setTimeout(() => {
        if (vaultStatusRef.current !== 'unlocked') return;

        // If a native picker/camera/biometric dialog is active, keep session alive
        if (isProtectedOperationActive()) {
          lastActivityTimestampRef.current = Date.now();
          scheduleTimer(timeoutMs);
          return;
        }

        const elapsed = Date.now() - lastActivityTimestampRef.current;
        if (elapsed >= timeoutMs - 250) {
          lockVault(false);
        } else {
          scheduleTimer(Math.max(timeoutMs - elapsed, 500));
        }
      }, delayMs);
    };

    const handleUserActivity = () => {
      if (vaultStatusRef.current !== 'unlocked') return;
      const now = Date.now();
      lastActivityTimestampRef.current = now;
      if (now - lastScheduleStamp >= 400) {
        lastScheduleStamp = now;
        scheduleTimer(timeoutMs);
      }
    };

    scheduleTimer(timeoutMs);

    // Watchdog periódico para capturar retrasos o suspensión parcial del WebView
    const watchdogIntervalMs = Math.min(Math.max(Math.floor(timeoutMs / 4), 1000), 5000);
    inactivityWatchdogRef.current = window.setInterval(() => {
      if (vaultStatusRef.current !== 'unlocked') return;
      if (isProtectedOperationActive()) {
        lastActivityTimestampRef.current = Date.now();
        return;
      }
      const elapsed = Date.now() - lastActivityTimestampRef.current;
      if (elapsed >= timeoutMs) {
        lockVault(false);
      }
    }, watchdogIntervalMs);

    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'touchstart',
      'keydown',
      'wheel',
      'scroll',
    ];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true, capture: true });
    });

    return () => {
      if (inactivityTimerRef.current !== null) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (inactivityWatchdogRef.current !== null) {
        window.clearInterval(inactivityWatchdogRef.current);
        inactivityWatchdogRef.current = null;
      }
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity, { capture: true } as any);
      });
    };
  }, [vaultStatus, autoLockMinutes, lockVault]);

  // Motor de Protección al Salir o Minimizar la App (Capacitor Android + Web)
  useEffect(() => {
    if (vaultStatus !== 'unlocked') return;

    let cancelled = false;
    let appStateHandle: { remove: () => Promise<void> } | null = null;

    const handleAppBackground = () => {
      if (vaultStatusRef.current !== 'unlocked') return;
      if (isProtectedOperationActive()) return;

      setIsPrivacyBlurActive(true);

      if (leftAppAtRef.current === null) {
        leftAppAtRef.current = Date.now();
      }

      if (lockOnTabSwitchRef.current) {
        const graceMs = Math.max(0, lockOnExitGraceSecondsRef.current) * 1000;
        if (graceMs === 0) {
          lockVault(false);
        } else if (exitGraceTimerRef.current === null) {
          exitGraceTimerRef.current = window.setTimeout(() => {
            exitGraceTimerRef.current = null;
            if (
              vaultStatusRef.current === 'unlocked' &&
              leftAppAtRef.current !== null &&
              !isProtectedOperationActive()
            ) {
              lockVault(false);
            }
          }, graceMs);
        }
      }
    };

    const handleAppForeground = () => {
      if (exitGraceTimerRef.current !== null) {
        window.clearTimeout(exitGraceTimerRef.current);
        exitGraceTimerRef.current = null;
      }

      if (vaultStatusRef.current !== 'unlocked') {
        leftAppAtRef.current = null;
        setIsPrivacyBlurActive(false);
        return;
      }

      const now = Date.now();
      const leftAt = leftAppAtRef.current;
      leftAppAtRef.current = null;

      // 1. Verificar si superó el tiempo de gracia al salir mientras estuvo en segundo plano
      if (lockOnTabSwitchRef.current && leftAt !== null && !isProtectedOperationActive()) {
        const graceMs = Math.max(0, lockOnExitGraceSecondsRef.current) * 1000;
        if (now - leftAt >= graceMs) {
          lockVault(false);
          return;
        }
      }

      // 2. Verificar si superó el tiempo de inactividad total mientras Android pausó los timers
      const mins = autoLockMinutesRef.current;
      if (mins > 0 && !isProtectedOperationActive()) {
        if (now - lastActivityTimestampRef.current >= mins * 60_000) {
          lockVault(false);
          return;
        }
      }

      // Usuario regresó dentro de ventana permitida: actualizar actividad y retirar escudo
      lastActivityTimestampRef.current = now;
      setIsPrivacyBlurActive(false);
    };

    const onVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        handleAppBackground();
      } else {
        handleAppForeground();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', handleAppBackground);
    window.addEventListener('focus', handleAppForeground);

    try {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          handleAppForeground();
        } else {
          handleAppBackground();
        }
      })
        .then((handle) => {
          if (cancelled) {
            handle.remove().catch(() => {});
          } else {
            appStateHandle = handle;
          }
        })
        .catch(() => {});
    } catch {}

    return () => {
      cancelled = true;
      if (exitGraceTimerRef.current !== null) {
        window.clearTimeout(exitGraceTimerRef.current);
        exitGraceTimerRef.current = null;
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', handleAppBackground);
      window.removeEventListener('focus', handleAppForeground);
      if (appStateHandle) {
        appStateHandle.remove().catch(() => {});
      }
    };
  }, [vaultStatus, lockVault]);

  // Root back button press notice
  useEffect(() => {
    const handleRootBack = () => {
      showToast('Presiona o desliza atrás de nuevo para salir', 'info');
    };
    const handleRootExit = () => {
      showToast('Saliendo de la bóveda...', 'info');
    };
    window.addEventListener('vault_root_back_press', handleRootBack);
    window.addEventListener('vault_root_exit_allowed', handleRootExit);
    return () => {
      window.removeEventListener('vault_root_back_press', handleRootBack);
      window.removeEventListener('vault_root_exit_allowed', handleRootExit);
    };
  }, [showToast]);

  // Detección de actualizaciones
  useEffect(() => {
    if (sessionStorage.getItem('vault_just_updated') === 'true') {
      sessionStorage.removeItem('vault_just_updated');
      setTimeout(() => {
        showToast(`¡Bóveda actualizada con éxito a la versión v${CURRENT_APP_VERSION}!`, 'success');
      }, 700);
    }

    const checkUpdates = async () => {
      try {
        const res = await updateService.checkForUpdates();
        if (res.hasUpdate) {
          setPendingUpdateInfo(res);

          const lastNotified = localStorage.getItem('vault_last_update_notified_version');
          if (lastNotified !== res.latestVersion) {
            setShowUpdateBanner(true);
            localStorage.setItem('vault_last_update_notified_version', res.latestVersion || '');
          }
        }
      } catch {}
    };
    checkUpdates();
  }, [showToast]);

  const handleResetVault = async () => {
    try {
      await signOutFromFirebase();
      await clearVaultDatabase();
      await disableBiometrics();
      await disableRecoveryKey();
      await clearDuressPinHash();
      await clearAllStoredLocalBackups();
      localStorage.removeItem('vault_initialized');
      localStorage.removeItem('vault_salt');
      localStorage.removeItem('vault_test_iv');
      localStorage.removeItem('vault_test_cipher');
      userProfileService.clearProfile();
    } catch {}
    setMasterKey(null);
    setSessionPin(null);
    setIsSettingsOpen(false);
    setVaultStatus('register');
    showToast('La bóveda ha sido formateada por completo.', 'info');
  };

  const handleAutoLockChange = (mins: number) => {
    setAutoLockMinutes(mins);
    saveAutoLockMinutes(mins);
  };

  const handleLockOnTabSwitchChange = (enabled: boolean) => {
    setLockOnTabSwitch(enabled);
    saveLockOnTabSwitch(enabled);
  };

  const handleLockOnExitGraceChange = (secs: number) => {
    setLockOnExitGraceSeconds(secs);
    saveExitGraceSeconds(secs);
  };

  return (
    <div
      className="relative min-h-screen w-full select-none overflow-hidden transition-colors"
      style={{
        backgroundColor: 'var(--theme-bg-main, #060b14)',
        color: 'var(--theme-text-main, #ffffff)',
      }}
    >
      <ToastContainer toasts={toasts} />

      {vaultStatus === 'checking' ? (
        <div className="flex h-screen w-full items-center justify-center bg-[#060b14] text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] shadow-[0_0_30px_rgba(0,229,255,0.2)] animate-pulse">
              <Shield className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Verificando estado de seguridad...</span>
          </div>
        </div>
      ) : vaultStatus === 'register' ? (
        <InitialRegisterView
          onComplete={() => {
            setVaultStatus('setup');
          }}
          showToast={showToast}
        />
      ) : vaultStatus === 'setup' ? (
        <SetupVaultView
          onSetupComplete={(key, pin) => {
            handleUnlock(key, pin);
          }}
          showToast={showToast}
        />
      ) : vaultStatus === 'locked' ? (
        <LockVaultView
          onUnlock={handleUnlock}
          onResetVaultRequest={() => {
            setVaultStatus('setup');
          }}
          onGoToRegister={() => {
            setVaultStatus('register');
          }}
          showToast={showToast}
        />
      ) : (
        <>
          <MainVaultView
            masterKey={masterKey!}
            sessionPin={sessionPin}
            refreshTrigger={vaultRefreshTrigger}
            showToast={showToast}
            onLock={() => lockVault(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            autoLockMinutes={autoLockMinutes}
            onAutoLockChange={handleAutoLockChange}
            lockOnTabSwitch={lockOnTabSwitch}
            onLockOnTabSwitchChange={handleLockOnTabSwitchChange}
            lockOnExitGraceSeconds={lockOnExitGraceSeconds}
            onLockOnExitGraceChange={handleLockOnExitGraceChange}
            onMasterKeyUpdated={(newKey, newPin) => {
              setMasterKey(newKey);
              if (newPin) {
                setSessionPin(newPin);
                try {
                  sessionStorage.setItem('vault_session_pin', newPin);
                } catch {}
              }
              setVaultRefreshTrigger((prev) => prev + 1);
            }}
            onResetVault={handleResetVault}
            hasUpdatePending={!!pendingUpdateInfo?.hasUpdate}
          />

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            masterKey={masterKey}
            sessionPin={sessionPin}
            onMasterKeyUpdated={(newKey, newPin) => {
              setMasterKey(newKey);
              if (newPin) {
                setSessionPin(newPin);
                try {
                  sessionStorage.setItem('vault_session_pin', newPin);
                } catch {}
              }
              setVaultRefreshTrigger((prev) => prev + 1);
            }}
            autoLockMinutes={autoLockMinutes}
            onAutoLockChange={handleAutoLockChange}
            lockOnTabSwitch={lockOnTabSwitch}
            onLockOnTabSwitchChange={handleLockOnTabSwitchChange}
            lockOnExitGraceSeconds={lockOnExitGraceSeconds}
            onLockOnExitGraceChange={handleLockOnExitGraceChange}
            onPhotosUpdated={() => {
              setVaultRefreshTrigger((prev) => prev + 1);
            }}
            onResetVault={handleResetVault}
            showToast={showToast}
          />
        </>
      )}

      {/* Modal interactivo con Novedades de la Versión */}
      <UpdateNotificationModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        updateInfo={pendingUpdateInfo}
        viewNotesOnly={false}
      />

      {/* Privacy Blur Shield when minimizing app or switching tasks */}
      {isPrivacyBlurActive && (
        <div className="fixed inset-0 z-[99999] backdrop-blur-3xl bg-[#060b14]/90 flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-100 pointer-events-none">
          <div className="w-20 h-20 rounded-3xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] mb-4 shadow-[0_0_50px_rgba(0,229,255,0.25)] animate-pulse">
            <Shield className="w-10 h-10 stroke-[2]" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight mb-1">
            Mi Bóveda Protegida
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Contenido privado oculto por seguridad
          </p>
        </div>
      )}
    </div>
  );
}
