import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Smartphone,
  QrCode,
  ArrowRight,
  ChevronLeft,
  Download,
  Share2,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Camera,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  KeyRound,
  FolderCheck,
} from 'lucide-react';
import { generateQrMatrix } from '../utils/qrCodeGenerator';
import {
  exportEncryptedBackupBlob,
  importEncryptedBackupBlobStream,
  readBackupHeaderFromBlob,
  BackupHeaderInfo,
} from '../db/vaultDb';
import {
  deriveKeyFromPin,
  verifyKey,
  hexToBuf,
} from '../crypto/vaultCrypto';
import {
  saveInternalBackup,
  downloadBackupToDevice,
  shareBackupFile,
} from '../services/backupStorageService';
import {
  exportExtraPinConfig,
  importExtraPinConfig,
} from '../services/extraPinFolderService';
import { registerBackHandler } from '../services/backButtonService';
import { updateBiometricPinIfEnrolled } from '../services/biometricService';
import { rebindRecoveryKeyToNewMasterKey } from '../services/recoveryKeyService';

interface DeviceMigrationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterKey: CryptoKey | null;
  sessionPin?: string | null;
  onMasterKeyUpdated: (newKey: CryptoKey, newPin?: string) => void;
  onPhotosUpdated: (overrideKey?: CryptoKey) => void | Promise<void>;
  showToast: (msg: string, type?: 'info' | 'success' | 'alert' | 'error') => void;
}

interface MigrationQrPayload {
  v: 1;
  code: string;
  salt: string;
  epSalt?: string;
  epHash?: string;
  folders?: Record<string, string[]>;
  ts: number;
}

export const DeviceMigrationWizardModal: React.FC<DeviceMigrationWizardModalProps> = ({
  isOpen,
  onClose,
  masterKey,
  sessionPin,
  onMasterKeyUpdated,
  onPhotosUpdated,
  showToast,
}) => {
  const [role, setRole] = useState<'select' | 'sender' | 'receiver'>('select');
  const [senderStep, setSenderStep] = useState<1 | 2 | 3>(1);
  const [receiverStep, setReceiverStep] = useState<1 | 2>(1);

  // Sender state
  const [isGeneratingPackage, setIsGeneratingPackage] = useState(false);
  const [packageProgress, setPackageProgress] = useState(0);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Receiver state
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [scannedPayload, setScannedPayload] = useState<MigrationQrPayload | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedHeader, setSelectedHeader] = useState<BackupHeaderInfo | null>(null);
  const [restorePinInput, setRestorePinInput] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restoreCompleteCount, setRestoreCompleteCount] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate a 6-character alphanumeric pairing code for this session
  useEffect(() => {
    if (!isOpen) return;
    setRole('select');
    setSenderStep(1);
    setReceiverStep(1);
    setGeneratedBlob(null);
    setPackageProgress(0);
    setScannedPayload(null);
    setSelectedFile(null);
    setSelectedHeader(null);
    setRestorePinInput('');
    setRestoreError(null);
    setIsRestoring(false);
    setRestoreProgress(0);
    setRestoreCompleteCount(null);
    setManualCodeInput('');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setPairingCode(code);
  }, [isOpen]);

  // Stop camera stream on unmount or step change
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (!isOpen || role !== 'receiver' || receiverStep !== 1 || scanMode !== 'camera') {
      stopCamera();
      return;
    }

    let active = true;
    let scanTimer: any = null;

    const startScanner = async () => {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        const BarcodeDetectorApi = (window as any).BarcodeDetector;
        if (BarcodeDetectorApi) {
          const detector = new BarcodeDetectorApi({ formats: ['qr_code'] });
          const scanLoop = async () => {
            if (!active || !videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes && codes.length > 0 && codes[0].rawValue) {
                handleQrStringDetected(codes[0].rawValue);
                return;
              }
            } catch {}
            scanTimer = setTimeout(scanLoop, 300);
          };
          scanTimer = setTimeout(scanLoop, 400);
        } else {
          setCameraError(
            'Tu cámara está activa. Si tu sistema no detecta el QR automáticamente, escribe la clave de 6 dígitos que aparece debajo del QR.'
          );
        }
      } catch {
        setCameraError('No se pudo acceder a la cámara. Usa la clave de vinculación de 6 dígitos.');
        setScanMode('manual');
      }
    };

    startScanner();

    return () => {
      active = false;
      if (scanTimer) clearTimeout(scanTimer);
      stopCamera();
    };
  }, [isOpen, role, receiverStep, scanMode]);

  useEffect(() => {
    if (!isOpen) return;
    return registerBackHandler(
      'device_migration_wizard',
      () => {
        if (role === 'sender') {
          if (senderStep > 1) {
            setSenderStep((prev) => (prev - 1) as 1 | 2 | 3);
            return true;
          }
          setRole('select');
          return true;
        }
        if (role === 'receiver') {
          if (receiverStep > 1) {
            setReceiverStep(1);
            return true;
          }
          setRole('select');
          return true;
        }
        onClose();
        return true;
      },
      93
    );
  }, [isOpen, role, senderStep, receiverStep, onClose]);

  const qrPayloadString = useMemo(() => {
    const salt = localStorage.getItem('vault_salt') || '';
    const extraPinCfg = exportExtraPinConfig();
    const payload: MigrationQrPayload = {
      v: 1,
      code: pairingCode,
      salt: salt.slice(0, 32),
      epSalt: extraPinCfg?.salt,
      epHash: extraPinCfg?.hash,
      ts: Math.floor(Date.now() / 1000),
    };
    return JSON.stringify(payload);
  }, [pairingCode]);

  const qrMatrix = useMemo(() => {
    try {
      return generateQrMatrix(qrPayloadString);
    } catch {
      return [];
    }
  }, [qrPayloadString]);

  if (!isOpen) return null;

  const handleQrStringDetected = (raw: string) => {
    try {
      const parsed = JSON.parse(raw) as MigrationQrPayload;
      if (parsed && parsed.v === 1 && parsed.code) {
        if (parsed.epSalt && parsed.epHash) {
          importExtraPinConfig({ salt: parsed.epSalt, hash: parsed.epHash });
        }
        setScannedPayload(parsed);
        setManualCodeInput(parsed.code);
        stopCamera();
        setReceiverStep(2);
      }
    } catch {
      // Si es un texto corto de 6 caracteres
      if (raw.trim().length === 6) {
        setManualCodeInput(raw.trim().toUpperCase());
        stopCamera();
        setReceiverStep(2);
      }
    }
  };

  const handlePrepareMigrationPackage = async () => {
    setIsGeneratingPackage(true);
    setPackageProgress(10);
    try {
      let exportedCount = 0;
      const blob = await exportEncryptedBackupBlob((curr, tot) => {
        exportedCount = tot;
        const pct = tot > 0 ? Math.min(95, Math.round((curr / tot) * 85) + 10) : 50;
        setPackageProgress(pct);
      });
      const dateStr = new Date().toISOString().split('T')[0];
      const fname = `migracion_boveda_${pairingCode}_${dateStr}.boveda`;
      await saveInternalBackup(blob, fname, exportedCount);
      setGeneratedBlob(blob);
      setGeneratedFilename(fname);
      setPackageProgress(100);
      setTimeout(() => {
        setIsGeneratingPackage(false);
        setSenderStep(2);
      }, 300);
    } catch (err: any) {
      setIsGeneratingPackage(false);
      showToast(err?.message || 'Error al preparar el paquete de migración', 'error');
    }
  };

  const handleShareGeneratedFile = async () => {
    if (!generatedBlob) return;
    try {
      const res = await shareBackupFile(generatedBlob, generatedFilename);
      if (res.success) {
        setSenderStep(3);
      }
    } catch {
      showToast('Error al compartir el archivo de migración', 'error');
    }
  };

  const handleDownloadGeneratedFile = async () => {
    if (!generatedBlob) return;
    try {
      await downloadBackupToDevice(generatedBlob, generatedFilename);
      setSenderStep(3);
    } catch {
      showToast('Error al guardar el archivo de migración', 'error');
    }
  };

  const handleSelectBackupFileOnReceiver = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setRestoreError(null);
    setSelectedFile(file);
    try {
      const header = await readBackupHeaderFromBlob(file);
      setSelectedHeader(header);
    } catch {
      setSelectedHeader(null);
    }
  };

  const handleExecuteReceiverRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setRestoreError('Selecciona primero el archivo .boveda recibido.');
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreProgress(8);

    try {
      const header = selectedHeader || (await readBackupHeaderFromBlob(selectedFile));
      let verifiedKey: CryptoKey | null = null;
      const pinToTest = restorePinInput.trim() || sessionPin || sessionStorage.getItem('vault_session_pin') || '';

      if (header?.saltHex && header?.testIvHex && header?.testCipherHex) {
        if (pinToTest.length < 4) {
          setIsRestoring(false);
          setRestoreError('Ingresa el PIN de 4 dígitos de tu bóveda anterior para descifrar el respaldo.');
          return;
        }
        const salt = hexToBuf(header.saltHex);
        const candidateKey = await deriveKeyFromPin(pinToTest, salt);
        const valid = await verifyKey(candidateKey, header.testIvHex, header.testCipherHex);
        if (!valid) {
          setIsRestoring(false);
          setRestoreError('El PIN ingresado no coincide con el respaldo del celular anterior.');
          return;
        }
        verifiedKey = candidateKey;
      }

      const oldMasterKey = masterKey;
      const result = await importEncryptedBackupBlobStream(
        selectedFile,
        (curr, tot) => {
          const pct = tot > 0 ? Math.min(99, Math.round((curr / tot) * 88) + 10) : 60;
          setRestoreProgress(pct);
        },
        true
      );

      if (verifiedKey && pinToTest) {
        try {
          sessionStorage.setItem('vault_session_pin', pinToTest);
          localStorage.setItem('vault_pin_length', pinToTest.length.toString());
          await updateBiometricPinIfEnrolled(pinToTest);
          if (oldMasterKey) {
            await rebindRecoveryKeyToNewMasterKey(oldMasterKey, verifiedKey);
          }
        } catch {}
        onMasterKeyUpdated(verifiedKey, pinToTest);
        await onPhotosUpdated(verifiedKey);
      } else {
        await onPhotosUpdated();
      }

      setRestoreProgress(100);
      setRestoreCompleteCount(result.importedCount);
    } catch (err: any) {
      setRestoreError(err?.message || 'Error al restaurar el respaldo en este celular.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center p-4 select-none animate-in fade-in duration-200"
      style={{
        backgroundColor: 'var(--theme-bg-main, #060b14)',
        color: 'var(--theme-text-main, #f8fafc)',
      }}
    >
      {/* Brillo ambiental */}
      <div className="fixed inset-0 pointer-events-none flex justify-center items-center overflow-hidden">
        <div
          className="w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{
            backgroundColor: 'var(--theme-primary, #00e5ff)',
            opacity: 0.18,
          }}
        />
      </div>

      <div className="relative w-full max-w-md mx-auto flex flex-col py-4 px-1 z-10">
        {/* Barra superior con botón Volver */}
        <div className="w-full flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              if (role === 'sender' && senderStep > 1) {
                setSenderStep((prev) => (prev - 1) as 1 | 2 | 3);
              } else if (role === 'receiver' && receiverStep > 1) {
                setReceiverStep(1);
              } else if (role !== 'select') {
                setRole('select');
              } else {
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl border transition-all cursor-pointer active:scale-95"
            style={{
              backgroundColor: 'var(--theme-bg-card, #0a121d)',
              borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
              color: 'var(--theme-text-main, #ffffff)',
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <span
            className="text-[11px] font-bold tracking-wider uppercase"
            style={{ color: 'var(--theme-primary, #00e5ff)' }}
          >
            Asistente de Migración
          </span>
        </div>

        {/* PANTALLA INICIAL: ELEGIR CELULAR ACTUAL O CELULAR NUEVO */}
        {role === 'select' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div
              className="border rounded-3xl p-5 text-center shadow-xl"
              style={{
                backgroundColor: 'var(--theme-bg-card, #0a121d)',
                borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 30%, transparent)',
                  color: 'var(--theme-primary, #00e5ff)',
                }}
              >
                <QrCode className="w-7 h-7" />
              </div>
              <h2
                className="text-xl font-extrabold tracking-tight mb-1.5"
                style={{ color: 'var(--theme-text-main, #ffffff)' }}
              >
                Migrar a otro celular
              </h2>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
              >
                Pasa todas tus fotos, videos, audios, documentos, carpetas y tu Carpeta con PIN extra hacia tu teléfono nuevo con cifrado AES-256 y verificación por código QR.
              </p>
            </div>

            {/* Opción 1: Este es mi celular actual */}
            <button
              type="button"
              onClick={() => {
                setRole('sender');
                setSenderStep(1);
              }}
              className="w-full border rounded-3xl p-4 text-left flex items-center justify-between gap-3.5 transition-all active:scale-[0.99] cursor-pointer shadow-lg group"
              style={{
                backgroundColor: 'var(--theme-bg-card, #0a121d)',
                borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
              }}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                  <Share2 className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-sm font-bold truncate"
                    style={{ color: 'var(--theme-text-main, #ffffff)' }}
                  >
                    1. Enviar desde este celular
                  </h3>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  >
                    Genera el paquete cifrado y muestra el código QR para tu celular nuevo.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 shrink-0 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Opción 2: Este es mi celular nuevo */}
            <button
              type="button"
              onClick={() => {
                setRole('receiver');
                setReceiverStep(1);
              }}
              className="w-full border rounded-3xl p-4 text-left flex items-center justify-between gap-3.5 transition-all active:scale-[0.99] cursor-pointer shadow-lg group"
              style={{
                backgroundColor: 'var(--theme-bg-card, #0a121d)',
                borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
              }}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 30%, transparent)',
                    color: 'var(--theme-primary, #00e5ff)',
                  }}
                >
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-sm font-bold truncate"
                    style={{ color: 'var(--theme-text-main, #ffffff)' }}
                  >
                    2. Recibir en este celular nuevo
                  </h3>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  >
                    Escanea el código QR del celular anterior y restaura tu bóveda completa.
                  </p>
                </div>
              </div>
              <ArrowRight
                className="w-5 h-5 shrink-0 group-hover:translate-x-0.5 transition-transform"
                style={{ color: 'var(--theme-primary, #00e5ff)' }}
              />
            </button>
          </div>
        )}

        {/* FLUJO EMISOR (CELULAR ACTUAL) */}
        {role === 'sender' && (
          <div
            className="border rounded-3xl p-5 space-y-5 shadow-xl animate-in fade-in duration-200"
            style={{
              backgroundColor: 'var(--theme-bg-card, #0a121d)',
              borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
            }}
          >
            {/* Indicador de 3 pasos */}
            <div className="flex items-center justify-between text-xs font-bold px-1">
              <span style={{ color: senderStep >= 1 ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}>
                Paso 1: Empaquetar
              </span>
              <span style={{ color: 'var(--theme-text-muted)' }}>→</span>
              <span style={{ color: senderStep >= 2 ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}>
                Paso 2: Enviar
              </span>
              <span style={{ color: 'var(--theme-text-muted)' }}>→</span>
              <span style={{ color: senderStep >= 3 ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}>
                Paso 3: Código QR
              </span>
            </div>

            {senderStep === 1 && (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto">
                  <FolderCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3
                    className="text-lg font-bold mb-1"
                    style={{ color: 'var(--theme-text-main, #ffffff)' }}
                  >
                    Paso 1: Preparar paquete cifrado
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  >
                    Empaquetaremos todos tus archivos, carpetas personalizadas y tu Carpeta con PIN extra en un único archivo blindado con AES-256.
                  </p>
                </div>

                {isGeneratingPackage && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span style={{ color: 'var(--theme-text-muted)' }}>Cifrando paquete...</span>
                      <span className="font-bold text-emerald-400">{packageProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-200 rounded-full"
                        style={{ width: `${packageProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePrepareMigrationPackage}
                  disabled={isGeneratingPackage}
                  className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isGeneratingPackage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Preparando respaldo ({packageProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4.5 h-4.5" />
                      <span>Generar paquete de migración</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {senderStep === 2 && (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto">
                  <Share2 className="w-7 h-7" />
                </div>
                <div>
                  <h3
                    className="text-lg font-bold mb-1"
                    style={{ color: 'var(--theme-text-main, #ffffff)' }}
                  >
                    Paso 2: Envía el archivo al celular nuevo
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  >
                    Envía el archivo <b>{generatedFilename}</b> a tu teléfono nuevo por Quick Share, Bluetooth, WhatsApp o Google Drive.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleShareGeneratedFile}
                    className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-4.5 h-4.5" />
                    <span>Compartir a mi celular nuevo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadGeneratedFile}
                    className="w-full py-3 px-5 rounded-2xl border font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--theme-bg-secondary, #0f172a)',
                      borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                      color: 'var(--theme-text-main, #ffffff)',
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Guardar en Descargas y ver Código QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSenderStep(3)}
                    className="w-full py-2 text-xs font-bold underline cursor-pointer"
                    style={{ color: 'var(--theme-primary, #00e5ff)' }}
                  >
                    Ya envié el archivo, mostrar Código QR →
                  </button>
                </div>
              </div>
            )}

            {senderStep === 3 && (
              <div className="space-y-4 text-center py-1">
                <div>
                  <h3
                    className="text-lg font-bold mb-1"
                    style={{ color: 'var(--theme-text-main, #ffffff)' }}
                  >
                    Paso 3: Escanea este QR en tu celular nuevo
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  >
                    En tu celular nuevo abre <b>Migrar a otro celular → Recibir</b> y escanea este Código QR para vincular tu Carpeta con PIN y restaurar.
                  </p>
                </div>

                {/* Código QR SVG de alto contraste */}
                <div className="bg-white p-4 rounded-3xl inline-flex items-center justify-center mx-auto shadow-xl border-4 border-white">
                  {qrMatrix.length > 0 ? (
                    <svg
                      viewBox={`0 0 ${qrMatrix.length + 4} ${qrMatrix.length + 4}`}
                      className="w-48 h-48 sm:w-52 sm:h-52"
                      shapeRendering="crispEdges"
                    >
                      <rect width="100%" height="100%" fill="#ffffff" />
                      {qrMatrix.map((row, rIdx) =>
                        row.map((cell, cIdx) =>
                          cell ? (
                            <rect
                              key={`${rIdx}-${cIdx}`}
                              x={cIdx + 2}
                              y={rIdx + 2}
                              width={1}
                              height={1}
                              fill="#060b14"
                            />
                          ) : null
                        )
                      )}
                    </svg>
                  ) : null}
                </div>

                {/* Clave de vinculación manual de 6 caracteres */}
                <div
                  className="p-3 rounded-2xl border flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary, #0f172a)',
                    borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                  }}
                >
                  <div className="text-left">
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                    >
                      CLAVE DE VINCULACIÓN
                    </p>
                    <p
                      className="text-lg font-mono font-extrabold tracking-widest"
                      style={{ color: 'var(--theme-primary, #00e5ff)' }}
                    >
                      {pairingCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(qrPayloadString);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--theme-bg-card, #0a121d)',
                      borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                      color: 'var(--theme-text-main, #ffffff)',
                    }}
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copiado' : 'Copiar token'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FLUJO RECEPTOR (CELULAR NUEVO) */}
        {role === 'receiver' && (
          <div
            className="border rounded-3xl p-5 space-y-5 shadow-xl animate-in fade-in duration-200"
            style={{
              backgroundColor: 'var(--theme-bg-card, #0a121d)',
              borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
            }}
          >
            <div className="flex items-center justify-between text-xs font-bold px-1">
              <span style={{ color: receiverStep >= 1 ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}>
                Paso 1: Vincular QR / Clave
              </span>
              <span style={{ color: 'var(--theme-text-muted)' }}>→</span>
              <span style={{ color: receiverStep >= 2 ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}>
                Paso 2: Restaurar Bóveda
              </span>
            </div>

            {receiverStep === 1 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3
                    className="text-lg font-bold mb-1"
                    style={{ color: 'var(--theme-text-main, #ffffff)' }}
                  >
                    Paso 1: Vincula con tu celular anterior
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  >
                    Escanea el Código QR que aparece en tu celular anterior o introduce la clave de vinculación de 6 caracteres.
                  </p>
                </div>

                {/* Selector Cámara / Clave manual */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScanMode('camera')}
                    className="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    style={{
                      backgroundColor:
                        scanMode === 'camera'
                          ? 'color-mix(in srgb, var(--theme-primary, #00e5ff) 15%, transparent)'
                          : 'var(--theme-bg-secondary, #0f172a)',
                      borderColor:
                        scanMode === 'camera'
                          ? 'var(--theme-primary, #00e5ff)'
                          : 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                      color:
                        scanMode === 'camera'
                          ? 'var(--theme-primary, #00e5ff)'
                          : 'var(--theme-text-muted, #94a3b8)',
                    }}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Escanear QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScanMode('manual')}
                    className="py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    style={{
                      backgroundColor:
                        scanMode === 'manual'
                          ? 'color-mix(in srgb, var(--theme-primary, #00e5ff) 15%, transparent)'
                          : 'var(--theme-bg-secondary, #0f172a)',
                      borderColor:
                        scanMode === 'manual'
                          ? 'var(--theme-primary, #00e5ff)'
                          : 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                      color:
                        scanMode === 'manual'
                          ? 'var(--theme-primary, #00e5ff)'
                          : 'var(--theme-text-muted, #94a3b8)',
                    }}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Usar clave / token</span>
                  </button>
                </div>

                {scanMode === 'camera' ? (
                  <div className="space-y-3">
                    <div className="relative w-full aspect-square max-w-[240px] mx-auto rounded-2xl overflow-hidden bg-black border-2 border-[#00e5ff]/60 flex items-center justify-center">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-6 border-2 border-dashed border-white/60 rounded-xl pointer-events-none" />
                    </div>
                    {cameraError && (
                      <p className="text-xs text-amber-400 text-center px-2">{cameraError}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={manualCodeInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setManualCodeInput(val);
                        if (val.trim().startsWith('{')) {
                          handleQrStringDetected(val.trim());
                        }
                      }}
                      placeholder="Ingresa la clave de 6 dígitos o pega el token QR"
                      className="w-full rounded-2xl px-4 py-3 text-sm font-mono text-center uppercase border focus:outline-none"
                      style={{
                        backgroundColor: 'var(--theme-bg-secondary, #0f172a)',
                        borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                        color: 'var(--theme-text-main, #ffffff)',
                      }}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setReceiverStep(2)}
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continuar al Paso 2 (Seleccionar archivo)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {receiverStep === 2 && (
              <form onSubmit={handleExecuteReceiverRestore} className="space-y-4">
                <div className="text-center">
                  <h3
                    className="text-lg font-bold mb-1"
                    style={{ color: 'var(--theme-text-main, #ffffff)' }}
                  >
                    Paso 2: Selecciona el archivo recibido
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  >
                    Elige el archivo <b>.boveda</b> que enviaste desde tu celular anterior e introduce su PIN para restaurar todo.
                  </p>
                </div>

                {scannedPayload && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Código QR verificado ({scannedPayload.code}) · Ajustes sincronizados</span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".boveda,.json,application/json,application/octet-stream"
                  onChange={handleSelectBackupFileOnReceiver}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => {
                    (window as any).__isPickingFile = true;
                    (window as any).__filePickingStartTime = Date.now();
                    fileInputRef.current?.click();
                  }}
                  className="w-full p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary, #0f172a)',
                    borderColor: selectedFile
                      ? '#10b981'
                      : 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                  }}
                >
                  <Upload className="w-6 h-6" style={{ color: 'var(--theme-primary, #00e5ff)' }} />
                  <span
                    className="text-xs font-bold truncate max-w-[260px]"
                    style={{ color: 'var(--theme-text-main, #ffffff)' }}
                  >
                    {selectedFile ? selectedFile.name : 'Toca aquí para elegir el archivo .boveda'}
                  </span>
                  {selectedHeader?.hasItems && (
                    <span className="text-[11px] text-emerald-400 font-mono">
                      Paquete cifrado verificado y listo para restaurar
                    </span>
                  )}
                </button>

                <div>
                  <label
                    className="block text-xs font-bold mb-1.5"
                    style={{ color: 'var(--theme-text-main, #ffffff)' }}
                  >
                    PIN de 4 dígitos de tu bóveda anterior
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={restorePinInput}
                    onChange={(e) => {
                      setRestorePinInput(e.target.value.replace(/\D/g, ''));
                      setRestoreError(null);
                    }}
                    placeholder="••••"
                    className="w-full rounded-2xl px-4 py-3 text-center text-lg font-mono tracking-widest border focus:outline-none"
                    style={{
                      backgroundColor: 'var(--theme-bg-secondary, #0f172a)',
                      borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                      color: 'var(--theme-text-main, #ffffff)',
                    }}
                  />
                </div>

                {isRestoring && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span style={{ color: 'var(--theme-text-muted)' }}>Restaurando archivos...</span>
                      <span className="font-bold text-emerald-400">{restoreProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-200 rounded-full"
                        style={{ width: `${restoreProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {restoreError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{restoreError}</span>
                  </div>
                )}

                {restoreCompleteCount !== null ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-bold text-emerald-400">
                      ¡Migración completada! ({restoreCompleteCount} archivos restaurados)
                    </p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                    >
                      Ir a Mi Bóveda
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={!selectedFile || isRestoring}
                    className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Restaurando ({restoreProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4.5 h-4.5" />
                        <span>Restaurar Bóveda en este celular</span>
                      </>
                    )}
                  </button>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
