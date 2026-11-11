import React, { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import { PinKeypad } from './PinKeypad';
import {
  isExtraPinConfigured,
  setupExtraPin,
  verifyExtraPin,
} from '../services/extraPinFolderService';
import { registerBackHandler } from '../services/backButtonService';

interface ExtraPinModalProps {
  isOpen: boolean;
  mode: 'unlock' | 'setup' | 'change';
  categoryLabel?: string;
  mainVaultPin?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExtraPinModal: React.FC<ExtraPinModalProps> = ({
  isOpen,
  mode,
  categoryLabel = 'Bóveda',
  mainVaultPin,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'verify_current' | 'create' | 'confirm' | 'unlock'>('unlock');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPin('');
    setFirstPin('');
    setErrorMessage(null);
    setIsShaking(false);
    setIsProcessing(false);

    if (mode === 'change') {
      setStep(isExtraPinConfigured() ? 'verify_current' : 'create');
    } else if (mode === 'setup' || !isExtraPinConfigured()) {
      setStep('create');
    } else {
      setStep('unlock');
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;
    return registerBackHandler(
      'extra_pin_modal',
      () => {
        if (step === 'confirm') {
          setStep('create');
          setPin('');
          setErrorMessage(null);
          return true;
        }
        onClose();
        return true;
      },
      92
    );
  }, [isOpen, step, onClose]);

  if (!isOpen) return null;

  const triggerShake = (msg: string) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  const handlePinChange = async (nextPin: string) => {
    setPin(nextPin);
    if (errorMessage) setErrorMessage(null);

    if (nextPin.length !== 4 || isProcessing) return;

    if (step === 'unlock') {
      setIsProcessing(true);
      const valid = await verifyExtraPin(nextPin);
      setIsProcessing(false);
      if (valid) {
        onSuccess();
      } else {
        setPin('');
        triggerShake('PIN de carpeta incorrecto. Inténtalo de nuevo.');
      }
      return;
    }

    if (step === 'verify_current') {
      setIsProcessing(true);
      const valid = await verifyExtraPin(nextPin);
      setIsProcessing(false);
      if (valid) {
        setPin('');
        setStep('create');
      } else {
        setPin('');
        triggerShake('El PIN actual no coincide.');
      }
      return;
    }

    if (step === 'create') {
      const activeMainPin =
        mainVaultPin || sessionStorage.getItem('vault_session_pin') || '';
      if (activeMainPin && nextPin === activeMainPin.trim()) {
        setPin('');
        triggerShake('Por seguridad, usa un PIN de 4 dígitos distinto al PIN principal.');
        return;
      }
      setFirstPin(nextPin);
      setTimeout(() => {
        setPin('');
        setStep('confirm');
      }, 120);
      return;
    }

    if (step === 'confirm') {
      if (nextPin !== firstPin) {
        setPin('');
        triggerShake('Los PINs no coinciden. Inténtalo de nuevo.');
        return;
      }
      try {
        setIsProcessing(true);
        await setupExtraPin(nextPin);
        setIsProcessing(false);
        onSuccess();
      } catch (err: any) {
        setIsProcessing(false);
        setPin('');
        triggerShake(err?.message || 'No se pudo guardar el PIN extra.');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-center items-center p-4 select-none animate-in fade-in duration-200"
      style={{
        backgroundColor: 'var(--theme-bg-main, #060b14)',
        color: 'var(--theme-text-main, #f8fafc)',
      }}
    >
      {/* Brillo ambiental idéntico a Iniciar sesión y Pantalla de PIN */}
      <div className="fixed inset-0 pointer-events-none flex justify-center items-center overflow-hidden">
        <div
          className="w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-500"
          style={{
            backgroundColor: 'var(--theme-primary, #00e5ff)',
            opacity: 0.2,
          }}
        />
      </div>

      <div
        className={`relative w-full max-w-sm sm:max-w-md mx-auto flex flex-col justify-between min-h-[85vh] py-6 px-4 text-center select-none transition-all ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Barra superior con botón Volver */}
        <div className="w-full flex flex-col items-center pt-2">
          <div className="w-full flex items-center justify-start mb-2">
            <button
              type="button"
              onClick={() => {
                if (step === 'confirm') {
                  setStep('create');
                  setPin('');
                  setErrorMessage(null);
                } else {
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer py-1.5 px-2.5 -ml-2 rounded-xl hover:bg-white/10"
              style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Volver</span>
            </button>
          </div>

          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 border shadow-inner"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
              borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 32%, transparent)',
              color: 'var(--theme-primary, #00e5ff)',
            }}
          >
            {step === 'unlock' || step === 'verify_current' ? (
              <Lock className="w-7 h-7" />
            ) : step === 'create' ? (
              <KeyRound className="w-7 h-7" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            )}
          </div>

          <h1
            className="text-2xl font-black tracking-tight mb-1"
            style={{ color: 'var(--theme-text-main, #ffffff)' }}
          >
            {step === 'unlock' ? (
              <>
                Carpeta con <span style={{ color: 'var(--theme-primary, #00e5ff)' }}>PIN</span>
              </>
            ) : step === 'verify_current' ? (
              <>
                PIN Extra <span style={{ color: 'var(--theme-primary, #00e5ff)' }}>Actual</span>
              </>
            ) : step === 'create' ? (
              <>
                Crea tu <span style={{ color: 'var(--theme-primary, #00e5ff)' }}>PIN Extra</span>
              </>
            ) : (
              <>
                Confirma tu <span style={{ color: 'var(--theme-primary, #00e5ff)' }}>PIN Extra</span>
              </>
            )}
          </h1>

          <p
            className="text-[10px] font-semibold tracking-[0.18em] uppercase mb-1.5"
            style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
          >
            {categoryLabel} · PROTECCIÓN DOBLE DE 4 DÍGITOS
          </p>

          <p
            className="text-xs max-w-[290px] leading-relaxed mb-3"
            style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
          >
            {step === 'unlock'
              ? 'Ingresa el PIN de 4 dígitos de tu Carpeta con PIN para ver tus archivos delicados.'
              : step === 'verify_current'
              ? 'Ingresa tu PIN extra actual de 4 dígitos para poder cambiarlo.'
              : step === 'create'
              ? 'Elige un PIN de 4 dígitos independiente al PIN principal para tus carpetas más delicadas.'
              : 'Vuelve a ingresar los 4 dígitos para confirmar tu PIN extra.'}
          </p>

          {(step === 'create' || step === 'confirm') && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <span
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === 'create' ? 'w-8' : 'w-2'
                }`}
                style={{
                  backgroundColor:
                    step === 'create' ? 'var(--theme-primary)' : 'var(--theme-border)',
                }}
              />
              <span
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === 'confirm' ? 'w-8' : 'w-2'
                }`}
                style={{
                  backgroundColor:
                    step === 'confirm' ? 'var(--theme-primary)' : 'var(--theme-border)',
                }}
              />
            </div>
          )}
        </div>

        {/* Teclado numérico central */}
        <div className="w-full my-auto py-2">
          <PinKeypad
            pin={pin}
            onPinChange={handlePinChange}
            maxDigits={4}
            disabled={isProcessing}
            isBiometricsEnrolled={false}
          />

          {errorMessage && (
            <div className="mt-4 flex items-center justify-center gap-1.5 text-rose-400 text-xs bg-rose-500/10 py-2 px-3 rounded-xl border border-rose-500/20 max-w-xs mx-auto animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Pie informativo */}
        <div
          className="w-full pt-3 pb-1 text-center text-[11px]"
          style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
        >
          <span>Se bloquea automáticamente al salir de la carpeta</span>
        </div>
      </div>
    </div>
  );
};
