/**
 * Flip to Lock / Face-Down Security Service for Bóveda Segura.
 * Detects when the mobile device is flipped face-down on a surface or in hand,
 * and immediately triggers vault locking for instant panic protection.
 */

const STORAGE_KEY = 'vault_flip_to_lock_enabled';

class FlipToLockService {
  private enabled: boolean = true;
  private isFaceDown: boolean = false;
  private faceDownTimer: number | null = null;
  private lockCallback: (() => void) | null = null;
  private listenersAttached: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        this.enabled = saved === 'true';
      } else {
        // Default enabled for maximum protection
        this.enabled = true;
      }
    } catch {
      this.enabled = true;
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      localStorage.setItem(STORAGE_KEY, val ? 'true' : 'false');
    } catch {}
    window.dispatchEvent(new CustomEvent('vault_flip_to_lock_changed', { detail: { enabled: val } }));
  }

  public register(callback: () => void): () => void {
    this.lockCallback = callback;
    this.attachSensors();

    return () => {
      this.lockCallback = null;
      this.detachSensors();
    };
  }

  private handleOrientation = (e: DeviceOrientationEvent) => {
    if (!this.enabled || !this.lockCallback) return;

    // Beta: [-180, 180] degrees. Around 180 or -180 means facing down.
    const beta = e.beta;
    if (beta === null || beta === undefined) return;

    const isFlippedBeta = Math.abs(beta) > 155;
    this.processSensorState(isFlippedBeta);
  };

  private handleMotion = (e: DeviceMotionEvent) => {
    if (!this.enabled || !this.lockCallback) return;

    const z = e.accelerationIncludingGravity?.z;
    if (z === null || z === undefined) return;

    // Normal flat face-up gravity is ~ +9.8 m/s². Flat face-down gravity is ~ -9.8 m/s².
    const isFlippedZ = z < -6.5;
    this.processSensorState(isFlippedZ);
  };

  private processSensorState(isFlipped: boolean) {
    if (isFlipped) {
      if (!this.isFaceDown) {
        this.isFaceDown = true;
        // Require 350ms sustained face-down orientation to prevent accidental triggers during casual movement
        if (this.faceDownTimer) window.clearTimeout(this.faceDownTimer);
        this.faceDownTimer = window.setTimeout(() => {
          this.triggerLock('sensor');
        }, 350);
      }
    } else {
      if (this.isFaceDown) {
        this.isFaceDown = false;
        if (this.faceDownTimer) {
          window.clearTimeout(this.faceDownTimer);
          this.faceDownTimer = null;
        }
      }
    }
  }

  private triggerLock(source: 'sensor' | 'simulation') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 50, 40]);
      } catch {}
    }

    window.dispatchEvent(
      new CustomEvent('vault_flip_to_lock_triggered', {
        detail: { source, timestamp: Date.now() },
      })
    );

    if (this.lockCallback) {
      this.lockCallback();
    }
  }

  public simulateFlipLock() {
    this.triggerLock('simulation');
  }

  private attachSensors() {
    if (this.listenersAttached || typeof window === 'undefined') return;

    window.addEventListener('deviceorientation', this.handleOrientation, { passive: true });
    window.addEventListener('devicemotion', this.handleMotion, { passive: true });
    this.listenersAttached = true;
  }

  private detachSensors() {
    if (!this.listenersAttached || typeof window === 'undefined') return;

    window.removeEventListener('deviceorientation', this.handleOrientation);
    window.removeEventListener('devicemotion', this.handleMotion);
    if (this.faceDownTimer) {
      window.clearTimeout(this.faceDownTimer);
      this.faceDownTimer = null;
    }
    this.isFaceDown = false;
    this.listenersAttached = false;
  }
}

export const flipToLockService = new FlipToLockService();
