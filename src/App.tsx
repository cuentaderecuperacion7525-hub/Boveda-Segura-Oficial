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
  checkRedirectAuthResult,
  signOutFromFirebase,
} from './services/firebaseAuthService';

export default function App() {
  const [vaultStatus, setVaultStatus] = useState<'checking' | 'register' | 'setup' | 'locked' | 'unlocked'>('checking');
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [sessionPin, setSessionPin] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrivacyBlurActive, setIsPrivacyBlurActive] = useState(false);

  // Settings
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('vault_autolock_mins');
    const val = Number(saved);
    return saved !== null && !isNaN(val) ? val : 5;
  });

  const [lockOnTabSwitch, setLockOnTabSwitch] = useState<boolean>(() => {
    const saved = localStorage.getItem('vault_lock_on_tab_switch');
    return saved !== null ? saved === 'true' : true;
  });

  const vaultStatusRef = useRef(vaultStatus);
  useEffect(() => {
    vaultStatusRef.current = vaultStatus;
  }, [vaultStatus]);

  const lockOnTabSwitchRef = useRef(lockOnTabSwitch);
  useEffect(() => {
    lockOnTabSwitchRef.current = lockOnTabSwitch;
  }, [lockOnTabSwitch]);

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
  const lockVault = useCallback(() => {
    if (
      (window as any).__isPickingFile ||
      (window as any).__isProcessingBackup ||
      (window as any).__isAuthenticatingGoogle
    ) {
      return;
    }
    if (vaultStatusRef.current !== 'unlocked') {
      return;
    }
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
        const redirectRes = await checkRedirectAuthResult();
        if (redirectRes && redirectRes.success && redirectRes.profile) {
          showToast(`Acceso autorizado para ${redirectRes.profile.email}`, 'success');
        }

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
      lockVault();
    });

    return () => {
      unregister();
    };
  }, [vaultStatus, lockVault, showToast]);

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
    try {
      localStorage.setItem('vault_autolock_mins', String(mins));
    } catch {}
  };

  const handleLockOnTabSwitchChange = (enabled: boolean) => {
    setLockOnTabSwitch(enabled);
    try {
      localStorage.setItem('vault_lock_on_tab_switch', String(enabled));
    } catch {}
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
          showToast={showToast}
        />
      ) : (
        <>
          <MainVaultView
            masterKey={masterKey!}
            sessionPin={sessionPin}
            refreshTrigger={vaultRefreshTrigger}
            showToast={showToast}
            onLock={lockVault}
            onOpenSettings={() => setIsSettingsOpen(true)}
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
