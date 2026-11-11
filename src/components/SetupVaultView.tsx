import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  deriveKeyFromPin,
  generateSalt,
  createVerificationPayload,
  bufToHex,
} from '../crypto/vaultCrypto';
import { setupAutomaticEmailRecoveryEscrow } from '../services/recoveryKeyService';
import { PinKeypad } from './PinKeypad';

interface SetupVaultViewProps {
  onSetupComplete: (masterKey: CryptoKey, pin?: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'alert' | 'error') => void;
}

export const SetupVaultView: React.FC<SetupVaultViewProps> = ({
  onSetupComplete,
  showToast,
}) => {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBackToCreate = () => {
    setStep('create');
    setConfirmPin('');
    setErrorMessage(null);
  };

  // Finalizes vault cryptographic storage and unlocks immediately after confirming the 4-digit PIN
  const finalizeSetup = async (confirmedPinValue: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      // 1. Generate cryptographic salt and derive AES-GCM 256 master key
      const salt = generateSalt();
      const saltHex = bufToHex(salt);
      const masterKey = await deriveKeyFromPin(confirmedPinValue, salt);

      // 2. Create test verification token
      const verification = await createVerificationPayload(masterKey);

      // 3. Store vault state in localStorage
      localStorage.setItem('vault_salt', saltHex);
      localStorage.setItem('vault_test_iv', verification.ivHex);
      localStorage.setItem('vault_test_cipher', verification.cipherHex);
      localStorage.setItem('vault_initialized', 'true');
      localStorage.setItem('vault_pin_length', confirmedPinValue.length.toString());

      try {
        sessionStorage.setItem('vault_session_pin', confirmedPinValue);
      } catch {}

      // 4. Configure automatic internal recovery escrow for email-verified PIN recovery
      await setupAutomaticEmailRecoveryEscrow(masterKey);

      showToast('¡Bóveda configurada y protegida con éxito!', 'success');
      onSetupComplete(masterKey, confirmedPinValue);
    } catch (err) {
      console.error('Error creating vault:', err);
      setErrorMessage('Error al inicializar la bóveda criptográfica');
      setIsProcessing(false);
    }
  };

  // Called when PIN is confirmed
  const handlePinConfirmed = (confirmedValue: string) => {
    if (confirmedValue !== pin) {
      setErrorMessage('Los PINs no coinciden. Inténtalo de nuevo.');
      setConfirmPin('');
      return;
    }
    setErrorMessage(null);
    finalizeSetup(confirmedValue);
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 transition-colors duration-250 select-none relative"
      style={{
        backgroundColor: 'var(--theme-bg-main, #060b14)',
        color: 'var(--theme-text-main, #f8fafc)',
      }}
    >
      {/* Background ambient glow matching Iniciar sesión */}
      <div className="fixed inset-0 pointer-events-none flex justify-center items-center overflow-hidden">
        <div
          className="w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-500"
          style={{
            backgroundColor: 'var(--theme-primary, #00e5ff)',
            opacity: 0.2,
          }}
        />
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md mx-auto flex flex-col justify-between min-h-[85vh] py-6 px-4 text-center select-none animate-in fade-in duration-300">
        <div className="w-full flex flex-col items-center pt-2">
          {/* Header Icon */}
          <div className="w-16 h-16 bg-[#00e5ff]/10 border border-[#00e5ff]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#00e5ff] shadow-inner shadow-[#00e5ff]/20">
            {step === 'create' ? (
              <KeyRound className="w-8 h-8" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            )}
          </div>

          {/* Titles and Descriptions according to step */}
          {step === 'create' && (
            <>
              <h1
                className="text-2xl font-bold tracking-tight mb-2"
                style={{ color: 'var(--theme-text-main, #ffffff)' }}
              >
                Configura tu Bóveda
              </h1>
              <p
                className="text-sm mb-5 leading-relaxed"
                style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
              >
                Crea un PIN numérico de 4 dígitos. Tus fotos, videos y documentos se cifrarán localmente mediante AES-GCM de 256 bits.
              </p>
            </>
          )}

          {step === 'confirm' && (
            <>
              <h1
                className="text-2xl font-bold tracking-tight mb-2"
                style={{ color: 'var(--theme-text-main, #ffffff)' }}
              >
                Confirma tu PIN
              </h1>
              <p
                className="text-sm mb-5 leading-relaxed"
                style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
              >
                Ingresa de nuevo el mismo PIN maestro para confirmar la clave de cifrado.
              </p>
            </>
          )}

          {/* Step indicator (2 steps) */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 'create' ? 'w-8' : 'w-2'
              }`}
              style={{
                backgroundColor: step === 'create' ? 'var(--theme-primary)' : 'var(--theme-border)',
              }}
            />
            <span
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 'confirm' ? 'w-8' : 'w-2'
              }`}
              style={{
                backgroundColor: step === 'confirm' ? 'var(--theme-primary)' : 'var(--theme-border)',
              }}
            />
          </div>
        </div>

        {/* STEP 1: CREATE PIN */}
        {step === 'create' && (
          <div className="w-full my-auto py-2">
            <PinKeypad
              pin={pin}
              onPinChange={(val) => {
                setPin(val);
                setErrorMessage(null);
                if (val.length === 4) {
                  setTimeout(() => {
                    setStep('confirm');
                  }, 120);
                }
              }}
              maxDigits={4}
              disabled={isProcessing}
            />

            {errorMessage && (
              <div className="mt-4 flex items-center justify-center gap-1.5 text-rose-400 text-xs bg-rose-500/10 py-2 px-3 rounded-xl border border-rose-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CONFIRM PIN */}
        {step === 'confirm' && (
          <div className="w-full my-auto py-2">
            <PinKeypad
              pin={confirmPin}
              onPinChange={(val) => {
                setConfirmPin(val);
                setErrorMessage(null);
                if (val.length === 4) {
                  handlePinConfirmed(val);
                }
              }}
              maxDigits={4}
              disabled={isProcessing}
            />

            {isProcessing && (
              <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Inicializando bóveda segura...</span>
              </div>
            )}

            {errorMessage && (
              <div className="mt-4 flex items-center justify-center gap-1.5 text-rose-400 text-xs bg-rose-500/10 py-2 px-3 rounded-xl border border-rose-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={handleBackToCreate}
                disabled={isProcessing}
                className="py-2.5 px-6 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700/80 transition-colors cursor-pointer"
              >
                Volver a cambiar PIN
              </button>
            </div>
          </div>
        )}

        {/* Security Info Footnote */}
        <div
          className="mt-6 pt-4 border-t text-left flex items-start gap-2.5 text-xs"
          style={{
            borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
            color: 'var(--theme-text-muted, #94a3b8)',
          }}
        >
          <Sparkles className="w-4 h-4 text-[#00e5ff] shrink-0 mt-0.5" />
          <p>
            Cifrado de conocimiento cero: tu PIN nunca sale de este dispositivo. Si alguna vez lo olvidas, podrás recuperarlo verificando tu correo registrado sin perder tus archivos.
          </p>
        </div>
      </div>
    </div>
  );
};
