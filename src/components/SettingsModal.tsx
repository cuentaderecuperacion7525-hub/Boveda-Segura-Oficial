import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Download,
  Upload,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  FileCheck,
  Check,
  AlertTriangle,
  HardDrive,
  Fingerprint,
  FileText,
  CheckCircle2,
  Loader2,
  Smartphone,
  ExternalLink,
  Copy,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { registerBackHandler } from '../services/backButtonService';
import { updateService, UpdateCheckResult } from '../services/updateService';
import { CURRENT_APP_VERSION, CURRENT_RELEASE_DATE } from '../version';
import { UpdateNotificationModal } from './UpdateNotificationModal';

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 0.01) return '< 0.01 MB';
  if (mb < 1) return `${mb.toFixed(2)} MB`;
  return `${mb.toFixed(1)} MB`;
};
import {
  exportEncryptedBackup,
  exportEncryptedBackupBlob,
  importEncryptedBackup,
  clearVaultDatabase,
  getVaultStats,
  getAllEncryptedPhotos,
  saveEncryptedPhoto,
  parseWithAutoRepair,
  readBackupHeaderFromBlob,
  importEncryptedBackupBlobStream,
  BackupHeaderInfo,
} from '../db/vaultDb';
import {
  saveInternalBackup,
  downloadBackupToDevice,
  createBackupDownloadUrl,
} from '../services/backupStorageService';
import {
  deriveKeyFromPin,
  verifyKey,
  createVerificationPayload,
  generateSalt,
  bufToHex,
  hexToBuf,
  decryptBuffer,
  encryptBuffer,
  verifyDuressPinHash,
  checkIsUnencryptedMedia,
} from '../crypto/vaultCrypto';
import { updateBiometricPinIfEnrolled } from '../services/biometricService';
import { rebindRecoveryKeyToNewMasterKey } from '../services/recoveryKeyService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterKey: CryptoKey | null;
  sessionPin?: string | null;
  onMasterKeyUpdated: (newKey: CryptoKey, newPin?: string) => void;
  autoLockMinutes: number;
  onAutoLockChange: (mins: number) => void;
  lockOnTabSwitch: boolean;
  onLockOnTabSwitchChange: (enabled: boolean) => void;
  onPhotosUpdated: () => void;
  onResetVault: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'alert' | 'error') => void;
  inline?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  masterKey,
  sessionPin,
  onMasterKeyUpdated,
  autoLockMinutes,
  onAutoLockChange,
  lockOnTabSwitch,
  onLockOnTabSwitchChange,
  onPhotosUpdated,
  onResetVault,
  showToast,
  inline = false,
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'backup' | 'install' | 'danger'>('security');
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const appShareUrl = window.location.href.split('#')[0];

  // Change PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmNewPin, setShowConfirmNewPin] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  // Backup / restore state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedBackupInfo, setSelectedBackupInfo] = useState<{
    name: string;
    size: number;
    status: 'reading' | 'analyzing' | 'restoring' | 'success' | 'error';
    statusText: string;
    percent: number;
  } | null>(null);
  const [pendingBackupBlob, setPendingBackupBlob] = useState<Blob | null>(null);
  const [pendingBackupHeader, setPendingBackupHeader] = useState<BackupHeaderInfo | null>(null);
  const [showBackupPinPrompt, setShowBackupPinPrompt] = useState(false);
  const [backupPinInput, setBackupPinInput] = useState('');
  const [backupPinError, setBackupPinError] = useState<string | null>(null);
  const [isVerifyingBackupPin, setIsVerifyingBackupPin] = useState(false);
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [pastedBackupText, setPastedBackupText] = useState('');
  const [generatedBackup, setGeneratedBackup] = useState<{
    blobUrl: string;
    fileName: string;
    sizeBytes: number;
    itemCount: number;
  } | null>(null);

  // Reset confirmation
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Updates state
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateCheckResult, setUpdateCheckResult] = useState<UpdateCheckResult | null>(() => updateService.getLastCheckResult());
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [autoCheckUpdates, setAutoCheckUpdates] = useState<boolean>(() => updateService.isAutoCheckEnabled());

  useEffect(() => {
    return updateService.subscribe((result) => {
      setUpdateCheckResult(result);
    });
  }, []);

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const res = await updateService.checkForUpdates(true);
      setUpdateCheckResult(res);
      if (res.hasUpdate) {
        showToast('¡Nueva actualización disponible!', 'info');
      } else {
        showToast('Tu aplicación ya está actualizada a la última versión.', 'success');
      }
    } catch {
      showToast('No se pudo verificar la actualización.', 'alert');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleToggleAutoCheck = (enabled: boolean) => {
    setAutoCheckUpdates(enabled);
    updateService.setAutoCheckEnabled(enabled);
    showToast(enabled ? 'Avisos automáticos de actualización activados' : 'Avisos automáticos desactivados', 'info');
  };

  // Back button handler for Settings Modal (only when modal)
  useEffect(() => {
    if (isOpen && !inline) {
      return registerBackHandler('settings_modal', () => {
        onClose();
        return true;
      }, 100);
    }
  }, [isOpen, inline, onClose]);

  if (!isOpen) return null;

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError(null);
    setPinChangeSuccess(false);

    if (newPin.length < 4) {
      setPinChangeError('El nuevo PIN debe tener al menos 4 dígitos');
      return;
    }

    if (newPin !== confirmNewPin) {
      setPinChangeError('Los nuevos PINs no coinciden');
      return;
    }

    const saltHex = localStorage.getItem('vault_salt');
    const testIvHex = localStorage.getItem('vault_test_iv');
    const testCipherHex = localStorage.getItem('vault_test_cipher');

    if (!saltHex || !testIvHex || !testCipherHex || !masterKey) {
      setPinChangeError('Error de estado de bóveda');
      return;
    }

    setIsChangingPin(true);

    try {
      // 1. Verify current PIN
      const salt = hexToBuf(saltHex);
      const testCurrentKey = await deriveKeyFromPin(currentPin, salt);
      const isCurrentValid = await verifyKey(testCurrentKey, testIvHex, testCipherHex);

      if (!isCurrentValid) {
        setPinChangeError('El PIN actual no es correcto');
        setIsChangingPin(false);
        return;
      }

      const isSameAsDuress = await verifyDuressPinHash(newPin);
      if (isSameAsDuress) {
        setPinChangeError('El nuevo PIN maestro no puede ser igual a tu PIN de coacción.');
        setIsChangingPin(false);
        return;
      }

      // 2. Generate new salt and derive new key
      const newSalt = generateSalt();
      const newSaltHex = bufToHex(newSalt);
      const newKey = await deriveKeyFromPin(newPin, newSalt);

      // 3. Re-encrypt all photos in the vault (including Recycle Bin) from old key to new key
      const allPhotos = await getAllEncryptedPhotos(true);
      for (const photo of allPhotos) {
        try {
          const isUnencrypted = !photo.iv || photo.iv.length === 0 || checkIsUnencryptedMedia(photo.data);
          const decrypted = isUnencrypted ? photo.data : await decryptBuffer(photo.data, photo.iv, testCurrentKey);
          const reEncrypted = await encryptBuffer(decrypted, newKey);
          await saveEncryptedPhoto({
            ...photo,
            iv: reEncrypted.iv,
            data: reEncrypted.data,
          });
        } catch (err) {
          console.error('Error re-encrypting photo:', err);
        }
      }

      // 4. Create new verification payload
      const newVerification = await createVerificationPayload(newKey);

      // 5. Update local storage
      localStorage.setItem('vault_salt', newSaltHex);
      localStorage.setItem('vault_test_iv', newVerification.ivHex);
      localStorage.setItem('vault_test_cipher', newVerification.cipherHex);
      localStorage.setItem('vault_pin_length', newPin.length.toString());

      try {
        sessionStorage.setItem('vault_session_pin', newPin);
      } catch {}

      // 6. Sync Biometric PIN & Recovery Key Escrow with the new master PIN/key
      await updateBiometricPinIfEnrolled(newPin);
      await rebindRecoveryKeyToNewMasterKey(testCurrentKey, newKey);

      onMasterKeyUpdated(newKey);
      setPinChangeSuccess(true);
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      showToast('PIN actualizado y fotos re-cifradas con éxito', 'success');
      onPhotosUpdated();
    } catch (err) {
      console.error('Error during PIN change:', err);
      setPinChangeError('Error al procesar el cambio de PIN');
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    setExportProgress({ current: 0, total: 100 });
    (window as any).__isPickingFile = true;
    (window as any).__isProcessingBackup = true;
    try {
      let finalCount = 0;
      const blob = await exportEncryptedBackupBlob((current, total) => {
        finalCount = total;
        setExportProgress({ current, total });
      });

      const filename = `boveda_segura_backup_${new Date().toISOString().slice(0, 10)}.json`;

      // 1. Guardar copia interna en IndexedDB de inmediato
      await saveInternalBackup(blob, filename, finalCount);

      // 2. Preparar URL descargable directa
      const blobUrl = createBackupDownloadUrl(blob);
      setGeneratedBackup({
        blobUrl,
        fileName: filename,
        sizeBytes: blob.size,
        itemCount: finalCount,
      });

      // 3. Descargar al dispositivo
      const dlRes = await downloadBackupToDevice(blob, filename);
      if (dlRes.success && dlRes.method !== 'cancelled') {
        showToast('Copia de seguridad guardada y descargada con éxito', 'success');
      } else {
        showToast('Copia lista. Pulsa el botón para guardarla en tu celular', 'info');
      }
    } catch (err: any) {
      console.error('Error exporting backup:', err);
      showToast(`Error al exportar copia de seguridad: ${err?.message || 'Error desconocido'}`, 'error');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
      setTimeout(() => {
        (window as any).__isPickingFile = false;
        (window as any).__isProcessingBackup = false;
      }, 3000);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setTimeout(() => {
        (window as any).__isPickingFile = false;
        (window as any).__isProcessingBackup = false;
      }, 2000);
      return;
    }

    // Keep flags active during entire restoration
    (window as any).__isPickingFile = true;
    (window as any).__isProcessingBackup = true;
    setIsImporting(true);
    setImportProgress(null);

    // Initial visual field state
    setSelectedBackupInfo({
      name: file.name || 'copia_seguridad.json',
      size: file.size || 0,
      status: 'reading',
      statusText: 'Iniciando lectura del archivo...',
      percent: 1,
    });

    try {
      // 1. Inspect header rapidly using memory-efficient blob slice
      const header = await readBackupHeaderFromBlob(file);

      // Check if file is completely empty (0 bytes)
      if (file.size === 0 && !header.hasItems && !header.saltHex) {
        setSelectedBackupInfo({
          name: file.name || 'copia_seguridad.json',
          size: 0,
          status: 'error',
          statusText: 'El archivo está vacío (0 bytes).',
          percent: 0,
        });
        showToast('El archivo está vacío (0 bytes).', 'error');
        setIsImporting(false);
        e.target.value = '';
        return;
      }

      // Check if backup has cryptographic tokens
      if (header.saltHex && header.testIvHex && header.testCipherHex) {
        let isCurrentKeyMatching = false;
        let matchedKey: CryptoKey | null = null;
        const activePin = sessionPin || sessionStorage.getItem('vault_session_pin') || '';
        try {
          if (masterKey && (await verifyKey(masterKey, header.testIvHex, header.testCipherHex))) {
            isCurrentKeyMatching = true;
            matchedKey = masterKey;
          } else if (activePin.length >= 4) {
            const salt = hexToBuf(header.saltHex);
            const testKey = await deriveKeyFromPin(activePin, salt);
            if (await verifyKey(testKey, header.testIvHex, header.testCipherHex)) {
              isCurrentKeyMatching = true;
              matchedKey = testKey;
            }
          }
        } catch {
          isCurrentKeyMatching = false;
        }

        if (isCurrentKeyMatching && matchedKey) {
          // Key matches current session: stream restore immediately!
          setSelectedBackupInfo({
            name: file.name || 'copia_seguridad.json',
            size: file.size || 0,
            status: 'restoring',
            statusText: `Cargando datos: 0 B de ${formatFileSize(file.size)}...`,
            percent: 1,
          });

          const oldMasterKey = masterKey;
          const result = await importEncryptedBackupBlobStream(
            file,
            (loaded, total, count) => {
              const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 100;
              setSelectedBackupInfo({
                name: file.name || 'copia_seguridad.json',
                size: file.size || 0,
                status: 'restoring',
                statusText: `Cargando datos: ${formatFileSize(loaded)} de ${formatFileSize(total)}... (${count} elementos)`,
                percent: Math.max(1, pct),
              });
            },
            true
          );

          try {
            if (activePin) {
              sessionStorage.setItem('vault_session_pin', activePin);
              localStorage.setItem('vault_pin_length', activePin.length.toString());
              await updateBiometricPinIfEnrolled(activePin);
            }
            if (oldMasterKey) {
              await rebindRecoveryKeyToNewMasterKey(oldMasterKey, matchedKey);
            }
          } catch {}

          onMasterKeyUpdated(matchedKey, activePin || undefined);

          if (result.importedCount === 0) {
            setSelectedBackupInfo({
              name: file.name || 'copia_seguridad.json',
              size: file.size || 0,
              status: 'success',
              statusText: 'Copia sin elementos (0 elementos para restaurar).',
              percent: 100,
            });
            showToast('Esta copia de seguridad no contiene elementos para restaurar (0 elementos).', 'info');
          } else {
            setSelectedBackupInfo({
              name: file.name || 'copia_seguridad.json',
              size: file.size || 0,
              status: 'success',
              statusText: `¡Restauración exitosa! Se guardaron ${result.importedCount} elementos.`,
              percent: 100,
            });
            showToast(`Se restauraron ${result.importedCount} elementos a la bóveda con éxito.`, 'success');
          }

          await onPhotosUpdated();
          setIsImporting(false);
          setImportProgress(null);
          setTimeout(() => {
            (window as any).__isPickingFile = false;
            (window as any).__isProcessingBackup = false;
          }, 3000);
          return;
        }

        // Current session PIN does not match the backup's PIN -> prompt for backup's original PIN
        setSelectedBackupInfo({
          name: file.name || 'copia_seguridad.json',
          size: file.size || 0,
          status: 'analyzing',
          statusText: 'Requiere ingresar el PIN original de la copia',
          percent: 5,
        });
        setPendingBackupBlob(file);
        setPendingBackupHeader(header);
        setShowBackupPinPrompt(true);
        setBackupPinInput('');
        setBackupPinError(null);
        setIsImporting(false);
        return;
      }

      // Legacy backup (no saltHex header)
      setSelectedBackupInfo({
        name: file.name || 'copia_seguridad.json',
        size: file.size || 0,
        status: 'restoring',
        statusText: `Cargando datos: 0 B de ${formatFileSize(file.size)}...`,
        percent: 1,
      });

      const result = await importEncryptedBackupBlobStream(
        file,
        (loaded, total, count) => {
          const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 100;
          setSelectedBackupInfo({
            name: file.name || 'copia_seguridad.json',
            size: file.size || 0,
            status: 'restoring',
            statusText: `Cargando datos: ${formatFileSize(loaded)} de ${formatFileSize(total)}... (${count} elementos)`,
            percent: Math.max(1, pct),
          });
        }
      );

      if (result.importedCount === 0) {
        setSelectedBackupInfo({
          name: file.name || 'copia_seguridad.json',
          size: file.size || 0,
          status: 'success',
          statusText: 'Copia sin elementos (0 elementos)',
          percent: 100,
        });
        showToast('Esta copia de seguridad no contiene elementos para restaurar (0 elementos).', 'info');
      } else {
        setSelectedBackupInfo({
          name: file.name || 'copia_seguridad.json',
          size: file.size || 0,
          status: 'success',
          statusText: `¡Restauración exitosa! Se guardaron ${result.importedCount} elementos.`,
          percent: 100,
        });
        showToast(`Se restauraron ${result.importedCount} elementos a la bóveda con éxito.`, 'success');
      }

      await onPhotosUpdated();
      setIsImporting(false);
      setImportProgress(null);
      setTimeout(() => {
        (window as any).__isPickingFile = false;
        (window as any).__isProcessingBackup = false;
      }, 3000);
    } catch (err: any) {
      console.error('Error reading/checking backup:', err);
      setSelectedBackupInfo({
        name: file.name || 'copia_seguridad.json',
        size: file.size || 0,
        status: 'error',
        statusText: `Error: ${err?.message || 'Archivo dañado'}`,
        percent: 0,
      });
      showToast(`Error al leer archivo de copia: ${err?.message || 'Archivo dañado o inválido.'}`, 'error');
      setIsImporting(false);
    } finally {
      e.target.value = '';
    }
  };

  const handleConfirmBackupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingBackupBlob || !pendingBackupHeader) return;
    if (backupPinInput.length < 4) {
      setBackupPinError('Ingresa un PIN de al menos 4 dígitos');
      return;
    }

    setIsVerifyingBackupPin(true);
    setBackupPinError(null);

    try {
      if (!pendingBackupHeader.saltHex || !pendingBackupHeader.testIvHex || !pendingBackupHeader.testCipherHex) {
        setBackupPinError('Encabezado de cifrado inválido en la copia');
        setIsVerifyingBackupPin(false);
        return;
      }

      // Derive key from entered PIN + backup's salt
      const backupSalt = hexToBuf(pendingBackupHeader.saltHex);
      const derivedKey = await deriveKeyFromPin(backupPinInput, backupSalt);

      // Verify if this key decrypts the backup's verification tokens
      const isValid = await verifyKey(derivedKey, pendingBackupHeader.testIvHex, pendingBackupHeader.testCipherHex);

      if (!isValid) {
        setBackupPinError('El PIN ingresado es incorrecto para esta copia de seguridad. Asegúrate de que coincida con el PIN con el que se creó.');
        setIsVerifyingBackupPin(false);
        return;
      }

      // PIN is correct! Close verification prompt and run stream restore
      setShowBackupPinPrompt(false);
      setIsImporting(true);
      (window as any).__isPickingFile = true;
      (window as any).__isProcessingBackup = true;

      setSelectedBackupInfo({
        name: (pendingBackupBlob as File).name || 'copia_seguridad.json',
        size: pendingBackupBlob.size || 0,
        status: 'restoring',
        statusText: `PIN verificado. Cargando datos: 0 B de ${formatFileSize(pendingBackupBlob.size)}...`,
        percent: 1,
      });

      const result = await importEncryptedBackupBlobStream(
        pendingBackupBlob,
        (loaded, total, count) => {
          const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 100;
          setSelectedBackupInfo({
            name: (pendingBackupBlob as File).name || 'copia_seguridad.json',
            size: pendingBackupBlob.size || 0,
            status: 'restoring',
            statusText: `Cargando datos: ${formatFileSize(loaded)} de ${formatFileSize(total)}... (${count} elementos)`,
            percent: Math.max(1, pct),
          });
        },
        true // overwriteCryptographicTokens = true
      );

      // Pass the new active derived key back to the application parent
      const oldMasterKey = masterKey;
      onMasterKeyUpdated(derivedKey, backupPinInput);
      try {
        sessionStorage.setItem('vault_session_pin', backupPinInput);
        localStorage.setItem('vault_pin_length', backupPinInput.length.toString());
      } catch {}
      try {
        await updateBiometricPinIfEnrolled(backupPinInput);
        if (oldMasterKey) {
          await rebindRecoveryKeyToNewMasterKey(oldMasterKey, derivedKey);
        }
      } catch {}

      if (result.importedCount === 0) {
        setSelectedBackupInfo({
          name: (pendingBackupBlob as File).name || 'copia_seguridad.json',
          size: pendingBackupBlob.size || 0,
          status: 'success',
          statusText: 'Copia sin elementos (0 elementos)',
          percent: 100,
        });
        showToast('Esta copia de seguridad no contiene elementos para restaurar (0 elementos)', 'info');
      } else {
        setSelectedBackupInfo({
          name: (pendingBackupBlob as File).name || 'copia_seguridad.json',
          size: pendingBackupBlob.size || 0,
          status: 'success',
          statusText: `¡Restauración exitosa! Se guardaron ${result.importedCount} elementos.`,
          percent: 100,
        });
        showToast(`Se restauraron ${result.importedCount} elementos a la bóveda con éxito`, 'success');
      }

      await onPhotosUpdated();
      setPendingBackupBlob(null);
      setPendingBackupHeader(null);
    } catch (err: any) {
      console.error('Error during backup restoration:', err);
      setBackupPinError(`Error al restaurar: ${err?.message || 'Error de descifrado'}`);
      setSelectedBackupInfo({
        name: (pendingBackupBlob as File)?.name || 'copia_seguridad.json',
        size: pendingBackupBlob?.size || 0,
        status: 'error',
        statusText: `Error al restaurar: ${err?.message || 'Fallo de descifrado'}`,
        percent: 0,
      });
    } finally {
      setIsVerifyingBackupPin(false);
      setIsImporting(false);
      setImportProgress(null);
      setTimeout(() => {
        (window as any).__isPickingFile = false;
        (window as any).__isProcessingBackup = false;
      }, 3000);
    }
  };

  const handleImportPastedText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedBackupText || !pastedBackupText.trim()) {
      showToast('Por favor, pega el contenido de la copia de seguridad.', 'error');
      return;
    }

    try {
      let sanitized = pastedBackupText;
      if (sanitized.charCodeAt(0) === 0xFEFF) {
        sanitized = sanitized.slice(1);
      }
      sanitized = sanitized.replace(/\0+$/, '').trim();

      const blob = new Blob([sanitized], { type: 'application/json' });
      const header = await readBackupHeaderFromBlob(blob);

      if (header.saltHex && header.testIvHex && header.testCipherHex) {
        let isCurrentKeyMatching = false;
        try {
          if (masterKey) {
            isCurrentKeyMatching = await verifyKey(masterKey, header.testIvHex, header.testCipherHex);
          }
        } catch {
          isCurrentKeyMatching = false;
        }

        if (isCurrentKeyMatching) {
          setIsImporting(true);
          (window as any).__isPickingFile = true;
          (window as any).__isProcessingBackup = true;

          const result = await importEncryptedBackupBlobStream(blob, undefined, true);

          if (result.importedCount === 0) {
            showToast('Esta copia de seguridad no contiene elementos para restaurar (0 elementos).', 'info');
          } else {
            showToast(`Se restauraron ${result.importedCount} elementos a la bóveda con éxito.`, 'success');
          }

          await onPhotosUpdated();
          setIsImporting(false);
          setImportProgress(null);
          setPastedBackupText('');
          setShowPasteInput(false);
          setTimeout(() => {
            (window as any).__isPickingFile = false;
            (window as any).__isProcessingBackup = false;
          }, 3000);
          return;
        }

        setPendingBackupBlob(blob);
        setPendingBackupHeader(header);
        setShowBackupPinPrompt(true);
        setBackupPinInput('');
        setBackupPinError(null);
      } else {
        // Legacy backup without salt
        setIsImporting(true);
        (window as any).__isPickingFile = true;
        (window as any).__isProcessingBackup = true;

        const result = await importEncryptedBackupBlobStream(blob);

        if (result.importedCount === 0) {
          showToast('Esta copia de seguridad no contiene elementos para restaurar (0 elementos)', 'info');
        } else {
          showToast(`Se restauraron ${result.importedCount} elementos a la bóveda con éxito`, 'success');
        }
        await onPhotosUpdated();
        setIsImporting(false);
        setImportProgress(null);
        setPastedBackupText('');
        setShowPasteInput(false);
        setTimeout(() => {
          (window as any).__isPickingFile = false;
          (window as any).__isProcessingBackup = false;
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error importing pasted text:', err);
      showToast(`Error al procesar el texto: ${err?.message || 'Texto dañado o inválido'}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--theme-bg-card, #0a121d)',
          borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Configuración y Seguridad</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-800/80 px-4 sm:px-6 pt-2 bg-slate-900/60 text-xs font-medium overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#00e5ff] text-[#00e5ff] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Seguridad & PIN
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'border-[#00e5ff] text-[#00e5ff] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Copia de Seguridad
          </button>
          <button
            onClick={() => setActiveTab('install')}
            className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'install'
                ? 'border-[#00e5ff] text-[#00e5ff] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Actualizaciones / APK</span>
            {updateCheckResult?.hasUpdate && (
              <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`pb-3 px-3 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'danger'
                ? 'border-rose-500 text-rose-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Zona de Peligro
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-sm">
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Auto-lock Settings */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Políticas de Bloqueo
                </h4>
                <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="text-xs font-semibold text-slate-200">Auto-bloqueo por inactividad</p>
                        <p className="text-[11px] text-slate-400">Bloquea la bóveda si no hay interacción</p>
                      </div>
                    </div>
                    <select
                      value={autoLockMinutes}
                      onChange={(e) => onAutoLockChange(Number(e.target.value))}
                      className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                    >
                      <option value={0.5}>30 segundos</option>
                      <option value={1}>1 minuto</option>
                      <option value={2}>2 minutos</option>
                      <option value={5}>5 minutos</option>
                      <option value={10}>10 minutos</option>
                      <option value={0}>Desactivado</option>
                    </select>
                  </div>

                  <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <EyeOff className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="text-xs font-semibold text-slate-200">Bloquear al salir de la app</p>
                        <p className="text-[11px] text-slate-400">Protege tu pantalla si sales o minimizas</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lockOnTabSwitch}
                        onChange={(e) => onLockOnTabSwitchChange(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Change Master PIN Form */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Cambiar PIN Maestro
                </h4>
                <form onSubmit={handleChangePin} className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">PIN Actual</label>
                    <div className="relative flex items-center">
                      <input
                        type={showCurrentPin ? 'text' : 'password'}
                        inputMode="numeric"
                        value={currentPin}
                        onChange={(e) => setCurrentPin(e.target.value)}
                        placeholder="••••"
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPin(!showCurrentPin)}
                        className="absolute right-2.5 text-slate-400 hover:text-slate-200 transition-colors p-1"
                        title={showCurrentPin ? 'Ocultar PIN' : 'Ver PIN'}
                      >
                        {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nuevo PIN</label>
                      <div className="relative flex items-center">
                        <input
                          type={showNewPin ? 'text' : 'password'}
                          inputMode="numeric"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value)}
                          placeholder="••••"
                          required
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPin(!showNewPin)}
                          className="absolute right-2.5 text-slate-400 hover:text-slate-200 transition-colors p-1"
                          title={showNewPin ? 'Ocultar PIN' : 'Ver PIN'}
                        >
                          {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Confirmar Nuevo</label>
                      <div className="relative flex items-center">
                        <input
                          type={showConfirmNewPin ? 'text' : 'password'}
                          inputMode="numeric"
                          value={confirmNewPin}
                          onChange={(e) => setConfirmNewPin(e.target.value)}
                          placeholder="••••"
                          required
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPin(!showConfirmNewPin)}
                          className="absolute right-2.5 text-slate-400 hover:text-slate-200 transition-colors p-1"
                          title={showConfirmNewPin ? 'Ocultar PIN' : 'Ver PIN'}
                        >
                          {showConfirmNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {pinChangeError && (
                    <div className="text-rose-400 text-xs bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                      {pinChangeError}
                    </div>
                  )}

                  {pinChangeSuccess && (
                    <div className="text-emerald-400 text-xs bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>PIN actualizado con éxito.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isChangingPin || !currentPin || !newPin || !confirmNewPin}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isChangingPin ? 'Re-cifrando bóveda...' : 'Actualizar PIN'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-200">Exportar Copia Cifrada</h5>
                    <p className="text-[11px] text-slate-400">
                      Descarga un archivo .json con todas tus fotos, videos y aplicaciones protegidas con su cifrado AES-GCM. Solo podrán abrirse con tu PIN.
                    </p>
                  </div>
                </div>

                {isExporting && exportProgress && (() => {
                  const percent = exportProgress.total > 0
                    ? Math.min(100, Math.round((exportProgress.current / exportProgress.total) * 100))
                    : 0;
                  return (
                    <div className="space-y-1.5 pt-1 animate-in fade-in">
                      <div className="flex justify-between text-[11px] text-indigo-400 font-semibold">
                        <span>Procesando y cifrando elementos...</span>
                        <span className="font-mono font-bold">{percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-200"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}



                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="w-full py-2.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Generando copia...' : 'Generar y Descargar Copia (.json)'}</span>
                </button>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-200">Restaurar Copia</h5>
                    <p className="text-[11px] text-slate-400">
                      Importa un archivo .json generado previamente para restaurar fotos, videos y aplicaciones en esta bóveda.
                    </p>
                  </div>
                </div>

                {/* Visual Progress / Loading Field Area */}
                {selectedBackupInfo && (
                  <div className="bg-[#101b2d] border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-lg animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-xl ${
                          selectedBackupInfo.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                          selectedBackupInfo.status === 'error' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {selectedBackupInfo.status === 'success' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : selectedBackupInfo.status === 'error' ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : (
                            <FileText className="w-5 h-5 animate-pulse" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate max-w-[190px] sm:max-w-xs">
                            {selectedBackupInfo.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatFileSize(selectedBackupInfo.size)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                          selectedBackupInfo.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                          selectedBackupInfo.status === 'error' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {selectedBackupInfo.percent}%
                        </span>
                      </div>
                    </div>

                    {/* Filling progress bar */}
                    <div className="space-y-1.5">
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            selectedBackupInfo.status === 'success'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : selectedBackupInfo.status === 'error'
                              ? 'bg-rose-500'
                              : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400'
                          }`}
                          style={{ width: `${selectedBackupInfo.percent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-medium flex items-center gap-1.5 truncate">
                          {selectedBackupInfo.status !== 'success' && selectedBackupInfo.status !== 'error' && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
                          )}
                          <span className="truncate">{selectedBackupInfo.statusText}</span>
                        </span>
                        {selectedBackupInfo.status === 'success' && (
                          <span className="text-emerald-400 font-semibold text-[10px] shrink-0">Completado</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <label
                  onClick={() => {
                    (window as any).__isPickingFile = true;
                    (window as any).__isProcessingBackup = true;
                    (window as any).__filePickingStartTime = Date.now();
                  }}
                  className={`w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    isImporting ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
                  }`}
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>
                    {selectedBackupInfo?.status === 'success'
                      ? 'Seleccionar otro archivo de respaldo'
                      : 'Seleccionar Archivo de Respaldo (.json)'}
                  </span>
                  <input
                    type="file"
                    accept=".json,application/json,text/plain,application/octet-stream,*/*"
                    onChange={handleImportBackup}
                    onClick={() => {
                      (window as any).__isPickingFile = true;
                      (window as any).__isProcessingBackup = true;
                      (window as any).__filePickingStartTime = Date.now();
                    }}
                    disabled={isImporting}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'install' && (
            <div className="space-y-5">
              {/* Tarjeta de Actualizaciones del Sistema */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-cyan-500/30 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-[#00e5ff] border border-cyan-500/20 flex items-center justify-center">
                      <RefreshCw className={`w-4.5 h-4.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-slate-100">Actualizaciones del Sistema</h5>
                        <span className="font-mono text-[11px] font-bold text-[#00e5ff] bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                          v{CURRENT_APP_VERSION}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">Lanzamiento: {CURRENT_RELEASE_DATE}</p>
                    </div>
                  </div>

                  {updateCheckResult?.hasUpdate ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#00e5ff] border border-cyan-500/30 animate-pulse">
                      Nueva versión
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                      Al día
                    </span>
                  )}
                </div>

                {updateCheckResult?.hasUpdate && (
                  <div className="p-3 bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-slate-900 border border-cyan-500/40 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#00e5ff]" />
                      <span>¡Nueva versión v{updateCheckResult.latestVersion} disponible!</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => updateService.applyUpdate()}
                      className="w-full py-2 bg-[#00e5ff] hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Actualizar Ahora</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCheckForUpdates}
                    disabled={isCheckingUpdate}
                    className="py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    <span>{isCheckingUpdate ? 'Buscando...' : 'Buscar Actualización'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowChangelogModal(true)}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#00e5ff]" />
                    <span>Ver Novedades</span>
                  </button>
                </div>
              </div>

              {/* Option 1: Direct PWA / WebAPK Installation */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-100">Instalar en este celular (WebAPK / PWA)</h5>
                    <p className="text-[11px] text-slate-400">Instalación directa oficial recomendada por Google y Android</p>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 text-xs text-slate-300 space-y-2">
                  <p className="leading-relaxed">
                    Al instalar la aplicación directamente desde el navegador (Google Chrome o Edge), el sistema Android crea un <b className="text-indigo-300">WebAPK nativo</b> en tu cajón de aplicaciones con:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                    <li>Funcionamiento <b className="text-slate-200">100% sin conexión a internet</b> (offline).</li>
                    <li>Pantalla completa inmersiva y máxima velocidad.</li>
                  </ul>
                </div>

                {isInstalled ? (
                  <div className="py-2.5 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">¡La aplicación ya está instalada en este dispositivo!</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await promptInstall();
                      if (success) {
                        showToast('¡Instalando aplicación en tu dispositivo!', 'success');
                      }
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar en mi pantalla de inicio</span>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-800/60 rounded-xl text-[11px] text-slate-300 space-y-1.5 border border-slate-700/50">
                    <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Cómo instalar desde Google Chrome en Android:</span>
                    </p>
                    <p className="text-slate-400">
                      1. Toca los <b>tres puntos (⋮)</b> arriba a la derecha en Chrome.
                    </p>
                    <p className="text-slate-400">
                      2. Selecciona <b>"Instalar aplicación"</b> o <b>"Añadir a la pantalla principal"</b>.
                    </p>
                    <p className="text-slate-400">
                      3. ¡Listo! Se creará el acceso nativo con icono en tu teléfono.
                    </p>
                  </div>
                )}
              </div>

              {/* Option 2: Generate Downloadable .APK via PWABuilder */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-100">Generar archivo instalador .APK</h5>
                    <p className="text-[11px] text-slate-400">Para empaquetar un archivo .apk descargable</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Si deseas un archivo <b className="text-amber-300">.apk</b> independiente para instalarlo manualmente en cualquier Android o distribuirlo, puedes generarlo con la herramienta oficial gratuita de empaquetado:
                </p>

                {/* Steps */}
                <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                    <div className="flex-1 space-y-1.5">
                      <p className="text-slate-300 font-medium">Copia la URL de tu bóveda:</p>
                      <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 truncate flex-1 font-mono">{appShareUrl}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(appShareUrl);
                            setCopiedUrl(true);
                            showToast('¡URL copiada al portapapeles!', 'success');
                            setTimeout(() => setCopiedUrl(false), 2500);
                          }}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 shrink-0"
                        >
                          {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2 border-t border-slate-800/60">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                    <div className="flex-1 space-y-1.5">
                      <p className="text-slate-300 font-medium">Abre el generador oficial PWABuilder:</p>
                      <a
                        href="https://www.pwabuilder.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir PWABuilder.com</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2 border-t border-slate-800/60">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                    <div className="flex-1">
                      <p className="text-slate-300 font-medium">Pega la URL y pulsa "Package for Android":</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PWABuilder analizará la aplicación y te entregará el archivo <b>.apk</b> listo para descargar e instalar en cualquier celular.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Zona Irreversible</span>
                </div>
                <p className="text-xs text-slate-400">
                  Las siguientes acciones borrarán de forma definitiva los datos, videos, fotos y aplicaciones almacenados en este dispositivo.
                </p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <h5 className="text-xs font-semibold text-slate-200">Vaciar Bóveda Completa</h5>
                <p className="text-[11px] text-slate-400">
                  Conserva tu PIN maestro configurado, pero elimina permanentemente todas las fotos, videos y aplicaciones cifradas.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('¿Confirmas que deseas eliminar todos los elementos de la bóveda? Esta acción no se puede deshacer.')) {
                      await clearVaultDatabase();
                      onPhotosUpdated();
                      showToast('Todos los elementos han sido eliminados', 'success');
                      onClose();
                    }
                  }}
                  className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Vaciar todos los archivos</span>
                </button>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <h5 className="text-xs font-semibold text-slate-200">Restablecer Bóveda por Completo</h5>
                <p className="text-[11px] text-slate-400">
                  Borra tu PIN maestro, las claves y todos los archivos. La aplicación volverá a la pantalla inicial de configuración.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de restablecer toda la bóveda? Se borrarán todas las fotos y configuraciones.')) {
                      onResetVault();
                    }
                  }}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Restablecer y borrar todo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backup PIN Verification Dialog */}
      {showBackupPinPrompt && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0e1626] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Desbloquear Copia de Seguridad</h4>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Esta copia fue creada con un PIN diferente al de tu sesión actual. Ingresa el PIN original de este archivo para descifrarlo y restaurarlo en tu bóveda.
              </p>
            </div>

            <form onSubmit={handleConfirmBackupPin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  PIN de la Copia de Seguridad
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={backupPinInput}
                  onChange={(e) => setBackupPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="••••"
                  className="w-full bg-[#162238] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-center text-lg font-bold text-white tracking-widest focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  disabled={isVerifyingBackupPin}
                  autoFocus
                />
              </div>

              {backupPinError && (
                <p className="text-[11px] text-rose-400 font-medium text-center bg-rose-500/10 py-2 px-3 rounded-xl border border-rose-500/20">
                  {backupPinError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBackupPinPrompt(false);
                    setPendingBackupBlob(null);
                    setPendingBackupHeader(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  disabled={isVerifyingBackupPin}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={backupPinInput.length < 4 || isVerifyingBackupPin}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>{isVerifyingBackupPin ? 'Verificando...' : 'Restaurar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Novedades y Actualizaciones */}
      <UpdateNotificationModal
        isOpen={showChangelogModal}
        onClose={() => setShowChangelogModal(false)}
        updateInfo={updateCheckResult}
        viewNotesOnly={!updateCheckResult?.hasUpdate}
      />
    </div>
  );
};
