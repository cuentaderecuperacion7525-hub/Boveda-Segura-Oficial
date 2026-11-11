import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

type BackHandler = () => boolean | void;

interface HandlerEntry {
  id: string;
  priority: number; // Higher number gets called first
  handler: BackHandler;
}

const handlers: HandlerEntry[] = [];
let isListenerAttached = false;
let lastBackPressTime = 0;

/**
 * Registers a back button action handler.
 * Handlers are executed in order of highest priority first.
 * If a handler returns true or undefined (non-false), back button propagation is stopped.
 * Returns an unregister cleanup function.
 */
export function registerBackHandler(id: string, handler: BackHandler, priority: number = 10): () => void {
  // Remove any existing handler with the same ID
  const index = handlers.findIndex((h) => h.id === id);
  if (index !== -1) {
    handlers.splice(index, 1);
  }

  handlers.push({ id, priority, handler });
  handlers.sort((a, b) => b.priority - a.priority);

  initBackButtonListener();

  return () => {
    const idx = handlers.findIndex((h) => h.id === id);
    if (idx !== -1) {
      handlers.splice(idx, 1);
    }
  };
}

/**
 * Initializes the back button event listeners for Android Capacitor and browser history
 */
export function initBackButtonListener() {
  if (isListenerAttached || typeof window === 'undefined') return;
  isListenerAttached = true;

  // Ensure a base history entry exists so Android edge-swipe back triggers popstate instead of closing the app immediately
  try {
    if (!window.history.state) {
      window.history.pushState({ vaultRoot: true }, '');
    }
  } catch {}

  if (Capacitor.isNativePlatform()) {
    CapacitorApp.addListener('backButton', async () => {
      // Execute highest priority handler first
      for (const entry of [...handlers]) {
        try {
          const result = entry.handler();
          if (result !== false) {
            // Back action handled by component/modal/navigation level
            return;
          }
        } catch (e) {
          console.error('Error in back handler:', entry.id, e);
        }
      }

      // If at root of the app and no handler consumed the back press:
      const now = Date.now();
      if (now - lastBackPressTime < 2200) {
        // Double press back within 2.2s -> minimize or exit app
        try {
          await CapacitorApp.minimizeApp();
        } catch {
          await CapacitorApp.exitApp();
        }
      } else {
        lastBackPressTime = now;
        window.dispatchEvent(new CustomEvent('vault_root_back_press', { detail: { time: now } }));
      }
    });
  }

  // Also handle popstate for web / PWA / Android WebView gesture navigation
  window.addEventListener('popstate', () => {
    if ((window as any).__ignoreNextPopState) {
      (window as any).__ignoreNextPopState = false;
      return;
    }

    for (const entry of [...handlers]) {
      try {
        const result = entry.handler();
        if (result !== false) {
          try {
            if (!window.history.state) {
              window.history.pushState({ vaultRoot: true }, '');
            }
          } catch {}
          return;
        }
      } catch (e) {
        console.error('Error in popstate handler:', entry.id, e);
      }
    }

    // If at root of the app and no handler consumed the back press:
    const now = Date.now();
    if (now - lastBackPressTime < 2200) {
      window.dispatchEvent(new CustomEvent('vault_root_exit_allowed', { detail: { time: now } }));
    } else {
      lastBackPressTime = now;
      try {
        window.history.pushState({ vaultRoot: true }, '');
      } catch {}
      window.dispatchEvent(new CustomEvent('vault_root_back_press', { detail: { time: now } }));
    }
  });
}

/**
 * Triggers the back action programmatically (for screen swipe gestures, on-screen back buttons, etc.)
 * Executes the highest priority registered handler. Returns true if handled, false if at root.
 */
export function triggerBackAction(): boolean {
  for (const entry of [...handlers]) {
    try {
      const result = entry.handler();
      if (result !== false) {
        return true;
      }
    } catch (e) {
      console.error('Error in triggerBackAction handler:', entry.id, e);
    }
  }

  // If at root of the app and no handler consumed the back press:
  const now = Date.now();
  if (now - lastBackPressTime < 2200) {
    window.dispatchEvent(new CustomEvent('vault_root_exit_allowed', { detail: { time: now } }));
  } else {
    lastBackPressTime = now;
    window.dispatchEvent(new CustomEvent('vault_root_back_press', { detail: { time: now } }));
  }
  return false;
}

