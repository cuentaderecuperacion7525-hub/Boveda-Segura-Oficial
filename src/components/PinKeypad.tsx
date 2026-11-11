import React from 'react';
import { Delete, Fingerprint } from 'lucide-react';

interface PinKeypadProps {
  pin: string;
  onPinChange: (newPin: string) => void;
  onSubmit?: () => void;
  maxDigits?: number;
  disabled?: boolean;
  onBiometricRequest?: () => void;
  isBiometricsEnrolled?: boolean;
  isBiometricsLoading?: boolean;
}

interface KeyConfig {
  type: 'digit' | 'biometric' | 'backspace';
  digit?: string;
  letters?: string;
  ariaLabel?: string;
}

const KEYPAD_LAYOUT: KeyConfig[][] = [
  [
    { type: 'digit', digit: '1', letters: ' ' },
    { type: 'digit', digit: '2', letters: 'ABC' },
    { type: 'digit', digit: '3', letters: 'DEF' },
  ],
  [
    { type: 'digit', digit: '4', letters: 'GHI' },
    { type: 'digit', digit: '5', letters: 'JKL' },
    { type: 'digit', digit: '6', letters: 'MNO' },
  ],
  [
    { type: 'digit', digit: '7', letters: 'PQRS' },
    { type: 'digit', digit: '8', letters: 'TUV' },
    { type: 'digit', digit: '9', letters: 'WXYZ' },
  ],
  [
    { type: 'biometric', ariaLabel: 'Sensor de huella digital' },
    { type: 'digit', digit: '0', letters: '+' },
    { type: 'backspace', ariaLabel: 'Borrar dígito' },
  ],
];

export const PinKeypad: React.FC<PinKeypadProps> = ({
  pin,
  onPinChange,
  onSubmit,
  maxDigits = 6,
  disabled = false,
  onBiometricRequest,
  isBiometricsEnrolled = false,
  isBiometricsLoading = false,
}) => {
  const handleDigit = (digit: string) => {
    if (disabled) return;
    if (pin.length < maxDigits) {
      const nextPin = pin + digit;
      onPinChange(nextPin);
      if (nextPin.length === maxDigits && onSubmit) {
        setTimeout(() => onSubmit(), 60);
      }
    }
  };

  const handleDelete = () => {
    if (disabled) return;
    if (pin.length > 0) {
      onPinChange(pin.slice(0, -1));
    }
  };

  return (
    <div className="w-full max-w-[300px] mx-auto select-none">
      {/* PIN Dots Indicator with subtle neon glow */}
      <div className="flex justify-center items-center gap-3.5 mb-7 h-9">
        {Array.from({ length: maxDigits }).map((_, index) => {
          const filled = index < pin.length;
          return (
            <div
              key={index}
              style={
                filled
                  ? {
                      backgroundColor: 'var(--theme-primary, #00e5ff)',
                      boxShadow: '0 0 12px var(--theme-glow)',
                    }
                  : undefined
              }
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 transform ${
                filled
                  ? 'scale-125'
                  : 'bg-slate-800/90 border border-slate-700/70 shadow-inner'
              }`}
            />
          );
        })}
      </div>

      {/* Modern Numeric Keypad Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-3.5">
        {KEYPAD_LAYOUT.flat().map((keyItem, index) => {
          if (keyItem.type === 'backspace') {
            return (
              <button
                key="key-backspace"
                type="button"
                onClick={handleDelete}
                disabled={disabled || pin.length === 0}
                aria-label={keyItem.ariaLabel}
                className="keypad-btn-backspace group h-15 sm:h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-800/85 active:scale-95 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col items-center justify-center shadow-sm cursor-pointer disabled:cursor-not-allowed text-slate-300 hover:text-white"
                style={{
                  color: 'var(--theme-text-main, #ffffff)',
                }}
              >
                <Delete
                  className="w-5.5 h-5.5 stroke-[2] transition-transform group-hover:scale-110 keypad-backspace-icon"
                  style={{
                    color: pin.length > 0 ? 'var(--theme-text-main, #ffffff)' : 'var(--theme-text-muted, #94a3b8)',
                    stroke: 'currentColor',
                  }}
                />
              </button>
            );
          }

          if (keyItem.type === 'biometric') {
            if (!isBiometricsEnrolled) {
              return <div key="key-biometric-placeholder" className="h-15 sm:h-16" aria-hidden="true" />;
            }
            return (
              <button
                key="key-biometric"
                type="button"
                onClick={onBiometricRequest}
                disabled={disabled || isBiometricsLoading}
                aria-label={keyItem.ariaLabel}
                title="Toca para escanear huella digital"
                className="group h-15 sm:h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-800/85 active:scale-95 active:bg-[#00e5ff]/20 active:border-[#00e5ff]/50 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col items-center justify-center shadow-sm cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isBiometricsLoading ? (
                  <div className="relative flex items-center justify-center">
                    <span
                      className="absolute w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-[#00e5ff]"
                    />
                    <Fingerprint className="w-6 h-6 animate-pulse text-[#00e5ff]" />
                  </div>
                ) : (
                  <Fingerprint
                    className={`w-6.5 h-6.5 transition-transform group-hover:scale-110 ${
                      isBiometricsEnrolled ? 'text-[#00e5ff]' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                )}
              </button>
            );
          }

          const digit = keyItem.digit || '0';
          const letters = keyItem.letters || ' ';

          return (
            <button
              key={`key-${digit}-${index}`}
              type="button"
              onClick={() => handleDigit(digit)}
              disabled={disabled}
              className="group h-15 sm:h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-800/85 active:scale-95 active:bg-[#00e5ff]/20 active:border-[#00e5ff]/50 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col items-center justify-center shadow-sm cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              <span className="text-2xl font-bold tracking-tight text-white leading-none group-hover:text-[#00e5ff] transition-colors">
                {digit}
              </span>
              <span className="text-[9px] font-semibold tracking-[0.16em] uppercase text-slate-400/90 group-hover:text-slate-300 mt-1 leading-none h-2.5">
                {letters}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
