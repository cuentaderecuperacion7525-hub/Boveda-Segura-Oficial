export interface AutoLockOption {
  value: number;
  label: string;
  shortLabel: string;
}

export const AUTO_LOCK_OPTIONS: AutoLockOption[] = [
  { value: 0.25, label: '15 segundos', shortLabel: '15 seg' },
  { value: 0.5, label: '30 segundos', shortLabel: '30 seg' },
  { value: 1, label: '1 minuto', shortLabel: '1 min' },
  { value: 2, label: '2 minutos', shortLabel: '2 min' },
  { value: 5, label: '5 minutos', shortLabel: '5 min' },
  { value: 10, label: '10 minutos', shortLabel: '10 min' },
  { value: 0, label: 'Desactivado', shortLabel: 'Desactivado' },
];

export interface ExitGraceOption {
  value: number;
  label: string;
  shortLabel: string;
}

export const EXIT_GRACE_OPTIONS: ExitGraceOption[] = [
  { value: 0, label: 'Inmediato', shortLabel: 'Inmediato' },
  { value: 5, label: '5 segundos', shortLabel: '5 seg' },
  { value: 15, label: '15 segundos', shortLabel: '15 seg' },
  { value: 30, label: '30 segundos', shortLabel: '30 seg' },
];

const AUTO_LOCK_MINS_KEY = 'vault_autolock_mins';
const LOCK_ON_TAB_SWITCH_KEY = 'vault_lock_on_tab_switch';
const LOCK_ON_EXIT_GRACE_KEY = 'vault_lock_on_exit_grace_secs';

const POST_UNLOCK_GRACE_MS = 3000;

export function getSavedAutoLockMinutes(): number {
  try {
    const saved = localStorage.getItem(AUTO_LOCK_MINS_KEY);
    if (saved !== null) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
  } catch {}
  return 5;
}

export function saveAutoLockMinutes(mins: number): void {
  try {
    localStorage.setItem(AUTO_LOCK_MINS_KEY, String(mins));
  } catch {}
}

export function getSavedLockOnTabSwitch(): boolean {
  try {
    const saved = localStorage.getItem(LOCK_ON_TAB_SWITCH_KEY);
    return saved !== null ? saved === 'true' : true;
  } catch {}
  return true;
}

export function saveLockOnTabSwitch(enabled: boolean): void {
  try {
    localStorage.setItem(LOCK_ON_TAB_SWITCH_KEY, String(enabled));
  } catch {}
}

export function getSavedExitGraceSeconds(): number {
  try {
    const saved = localStorage.getItem(LOCK_ON_EXIT_GRACE_KEY);
    if (saved !== null) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
  } catch {}
  return 0;
}

export function saveExitGraceSeconds(secs: number): void {
  try {
    localStorage.setItem(LOCK_ON_EXIT_GRACE_KEY, String(secs));
  } catch {}
}

export function formatAutoLockSummary(
  autoLockMinutes: number,
  lockOnTabSwitch: boolean,
  lockOnExitGraceSeconds: number
): string {
  const parts: string[] = [];

  if (autoLockMinutes > 0) {
    const matched = AUTO_LOCK_OPTIONS.find((opt) => opt.value === autoLockMinutes);
    parts.push(`inactividad tras ${matched ? matched.shortLabel : `${autoLockMinutes} min`}`);
  }

  if (lockOnTabSwitch) {
    if (lockOnExitGraceSeconds <= 0) {
      parts.push('inmediato al salir de la app');
    } else {
      parts.push(`tras ${lockOnExitGraceSeconds} seg fuera de la app`);
    }
  }

  if (parts.length === 0) {
    return 'Bloqueo automático desactivado (solo bloqueo manual)';
  }

  return `Protección activa: ${parts.join(' y ')}`;
}

/**
 * Checks whether a protected system/native workflow is currently running over the WebView
 * (file picker, backup export/import, Google auth, biometric prompt, camera, update installer,
 * or within a brief post-unlock grace period) so background/focus shifts don't falsely lock the vault.
 */
export function isProtectedOperationActive(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;

  if (
    w.__isPickingFile ||
    w.__isProcessingBackup ||
    w.__isAuthenticatingGoogle ||
    w.__isBiometricPromptActive ||
    w.__isCameraOpen ||
    w.__isInstallingUpdate
  ) {
    return true;
  }

  const lastProtectedTimestamp = Math.max(
    Number(w.__lastUnlockTime || 0),
    Number(w.__lastBiometricUnlockTime || 0),
    Number(w.__lastBiometricPromptFinishedAt || 0)
  );

  if (lastProtectedTimestamp > 0 && Date.now() - lastProtectedTimestamp < POST_UNLOCK_GRACE_MS) {
    return true;
  }

  return false;
}
