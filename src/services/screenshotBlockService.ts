import { registerPlugin } from '@capacitor/core';
import { isNativeApp } from './nativeVaultBridge';

interface VaultSecurityPluginInterface {
  enableScreenshotBlock(): Promise<{ success: boolean }>;
  disableScreenshotBlock(): Promise<{ success: boolean }>;
  setSystemBarsTheme(options: { isDark: boolean }): Promise<{ success: boolean }>;
}

const NativeVaultSecurity = registerPlugin<VaultSecurityPluginInterface>('VaultSecurity');

export const syncNativeSystemBarsTheme = (isDark: boolean) => {
  try {
    if (isNativeApp()) {
      NativeVaultSecurity.setSystemBarsTheme({ isDark }).catch(() => {});
    }
  } catch {}
};

/**
 * Servicio de Bloqueo de Capturas y Protección de Pantalla de NullVault
 * - Bloquea atajos de teclado de captura (PrintScreen, Win+Shift+S, Cmd+Shift+3/4/5, Ctrl+P)
 * - Muestra la leyenda de seguridad requerida: "Captura no permitida. Para desactivar, ve a Seguridad e introduce tu PIN"
 * - Vacía el portapapeles ante cualquier intento de snapshot
 * - Desactiva menú contextual, descarga directa y arrastre de medios
 * - Oculta todo el contenido en impresión (@media print)
 */

let isBlockerActive = false;
let toastCallback: ((msg: string, type?: 'info' | 'success' | 'alert' | 'error') => void) | null = null;
let lastAlertTime = 0;

export const setScreenshotBlockToastCallback = (
  cb: (msg: string, type?: 'info' | 'success' | 'alert' | 'error') => void
) => {
  toastCallback = cb;
};

export const triggerScreenshotBlockedAlert = () => {
  const now = Date.now();
  if (now - lastAlertTime < 1500) return; // Debounce alerts
  lastAlertTime = now;

  // Clear clipboard immediately to prevent saving any screen snip
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText('');
    }
  } catch {}

  // Show detailed security notice
  if (toastCallback) {
    toastCallback(
      'Captura de pantalla no permitida por seguridad de la Bóveda. Si deseas desactivar el bloqueo, ve a la pestaña Seguridad e introduce tu PIN.',
      'alert'
    );
  }

  // Dispatch custom event for any listeners
  window.dispatchEvent(new CustomEvent('nullvault_screenshot_attempt_blocked'));
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!isBlockerActive) return;

  const key = e.key || '';
  const code = e.code || '';

  // 1. PrintScreen (Key code 44 / PrintScreen)
  if (key === 'PrintScreen' || code === 'PrintScreen' || e.keyCode === 44) {
    e.preventDefault();
    e.stopPropagation();
    triggerScreenshotBlockedAlert();
    return;
  }

  // 2. Ctrl+P / Cmd+P (Print to PDF / save page)
  if ((e.ctrlKey || e.metaKey) && (key === 'p' || key === 'P')) {
    e.preventDefault();
    e.stopPropagation();
    triggerScreenshotBlockedAlert();
    return;
  }

  // 3. Windows Snipping Tool (Win+Shift+S), Mac Screenshot (Cmd+Shift+3/4/5), Chrome Screenshot (Ctrl+Shift+S)
  if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
    if (['3', '4', '5', 's', 'S', 'c', 'C', 'i', 'I', 'j', 'J'].includes(key)) {
      e.preventDefault();
      e.stopPropagation();
      triggerScreenshotBlockedAlert();
      return;
    }
  }

  // 4. Alt + PrintScreen
  if (e.altKey && (key === 'PrintScreen' || code === 'PrintScreen' || e.keyCode === 44)) {
    e.preventDefault();
    e.stopPropagation();
    triggerScreenshotBlockedAlert();
    return;
  }
};

const handleKeyUp = (e: KeyboardEvent) => {
  if (!isBlockerActive) return;
  const key = e.key || '';
  const code = e.code || '';

  if (key === 'PrintScreen' || code === 'PrintScreen' || e.keyCode === 44) {
    e.preventDefault();
    triggerScreenshotBlockedAlert();
  }
};

const handleContextMenu = (e: MouseEvent) => {
  if (!isBlockerActive) return;
  // Bloquea el menú contextual nativo (evita "Guardar imagen como...", etc.)
  // Sin disparar falsa alerta de captura, ya que en Android la pulsación larga
  // para seleccionar elementos emite automáticamente el evento 'contextmenu'.
  e.preventDefault();
};

const handleDragStart = (e: DragEvent) => {
  if (!isBlockerActive) return;
  e.preventDefault();
};

const handleSelectStart = (e: Event) => {
  if (!isBlockerActive) return;
  // Permitir selección solo dentro de inputs o textareas
  const target = e.target as HTMLElement;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
    return;
  }
  e.preventDefault();
};

export const initScreenshotBlocker = () => {
  const isEnabled = localStorage.getItem('vault_screenshot_block_active') !== 'false';
  setScreenshotBlockEnabled(isEnabled);

  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('keyup', handleKeyUp, true);
  window.addEventListener('contextmenu', handleContextMenu, true);
  window.addEventListener('dragstart', handleDragStart, true);
  window.addEventListener('selectstart', handleSelectStart, true);

  // Escuchar cambios de configuración desde la pestaña de seguridad
  window.addEventListener('vault_security_settings_changed', () => {
    const updated = localStorage.getItem('vault_screenshot_block_active') !== 'false';
    setScreenshotBlockEnabled(updated);
  });
};

export const setScreenshotBlockEnabled = (enabled: boolean) => {
  isBlockerActive = enabled;

  // Inyectar o remover estilos de protección anti-captura
  let styleEl = document.getElementById('nullvault-screenshot-protection-style');
  if (enabled) {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'nullvault-screenshot-protection-style';
      styleEl.innerHTML = `
        @media print {
          html, body, #root, * {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
        }
        .nullvault-protected-screen {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        .nullvault-protected-screen img,
        .nullvault-protected-screen video,
        .nullvault-protected-screen canvas {
          -webkit-user-drag: none !important;
          -webkit-touch-callout: none !important;
          user-select: none !important;
          pointer-events: auto;
        }
      `;
      document.head.appendChild(styleEl);
    }
    document.body.classList.add('nullvault-protected-screen');

    // Activar protección nativa si es Android APK (FLAG_SECURE a nivel de sistema)
    try {
      if (isNativeApp()) {
        NativeVaultSecurity.enableScreenshotBlock().catch(() => {});
      }
    } catch {}
  } else {
    if (styleEl) {
      styleEl.remove();
    }
    document.body.classList.remove('nullvault-protected-screen');

    try {
      if (isNativeApp()) {
        NativeVaultSecurity.disableScreenshotBlock().catch(() => {});
      }
    } catch {}
  }
};
