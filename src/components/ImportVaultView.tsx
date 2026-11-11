import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Music,
  LayoutGrid,
  Lock,
  Plus,
  Loader2,
  ShieldCheck,
  Sparkles,
  FileText,
} from 'lucide-react';
import { encryptBuffer } from '../crypto/vaultCrypto';
import {
  saveEncryptedItems,
  getAllEncryptedItems,
  detectCategory,
  VaultItemCategory,
  EncryptedVaultItem,
} from '../db/vaultDb';
import { requestNativeBatchGalleryDeletion, isNativeApp } from '../services/nativeVaultBridge';

interface ImportVaultViewProps {
  masterKey: CryptoKey;
  onImportComplete: (
    importedItems?: { name: string; size: number; category: VaultItemCategory }[],
    shouldShowReminder?: boolean
  ) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'alert' | 'error') => void;
}

export const ImportVaultView: React.FC<ImportVaultViewProps> = ({
  masterKey,
  onImportComplete,
  showToast,
}) => {
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const [encryptProgress, setEncryptProgress] = useState<number>(0);
  const [encryptingName, setEncryptingName] = useState<string>('');
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(1);
  const [totalFilesToProcess, setTotalFilesToProcess] = useState<number>(1);

  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const appInputRef = useRef<HTMLInputElement | null>(null);

  // Safely trigger native or web file picker without triggering premature auto-lock
  const triggerPicker = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    (window as any).__isPickingFile = true;
    (window as any).__filePickingStartTime = Date.now();
    inputRef.current?.click();
  };

  const processFilesAutomatically = async (files: File[]) => {
    if (!files || files.length === 0) return;

    let existingInVault: { name: string; size: number }[] = [];
    try {
      const allVault = await getAllEncryptedItems();
      existingInVault = allVault.map((item) => ({ name: item.name, size: item.size }));
    } catch {}

    const uniqueFiles = files.filter((f) => {
      const alreadyExists = existingInVault.some(
        (v) => v.name === f.name && v.size === f.size
      );
      return !alreadyExists;
    });

    const duplicatesCount = files.length - uniqueFiles.length;
    if (duplicatesCount > 0) {
      showToast(`${duplicatesCount} archivo(s) ya existen en la bóveda y fueron omitidos`, 'alert');
    }

    if (uniqueFiles.length === 0) {
      return;
    }

    const total = uniqueFiles.length;
    setTotalFilesToProcess(total);
    setIsEncrypting(true);
    setEncryptProgress(5);
    showToast(`Iniciando cifrado de ${total} elemento(s)...`, 'info');

    const newRecords: EncryptedVaultItem[] = [];
    const baseTimestamp = Date.now();

    try {
      for (let i = 0; i < total; i++) {
        const file = uniqueFiles[i];
        setCurrentFileIndex(i + 1);
        setEncryptingName(file.name);

        const buffer = await file.arrayBuffer();
        const encrypted = await encryptBuffer(buffer, masterKey);
        const cat = detectCategory(file.name, file.type);
        const recordId = `item_${baseTimestamp}_${i}_${Math.random().toString(36).substring(2, 8)}`;

        newRecords.push({
          id: recordId,
          timestamp: baseTimestamp + i,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          iv: encrypted.iv,
          data: encrypted.data,
          album: 'General',
          isFavorite: false,
          category: cat,
          lastModified: file.lastModified || undefined,
        });

        setEncryptProgress(Math.round(((i + 1) / total) * 100));
      }

      // Guardar todos los registros en IndexedDB de forma atómica y segura
      if (newRecords.length > 0) {
        await saveEncryptedItems(newRecords);
      }

      // En Android nativo: solicitar inmediatamente la confirmación oficial del sistema para borrar los originales
      const mediaItemsToDelete = newRecords
        .filter((it) => it.category === 'photo' || it.category === 'video' || it.category === 'audio')
        .map((it) => ({
          filename: it.name,
          size: it.size,
          lastModified: it.lastModified,
          mimeType: it.mimeType,
        }));

      let handledNatively = false;
      if (isNativeApp() && mediaItemsToDelete.length > 0) {
        try {
          (window as any).__isPickingFile = true;
          (window as any).__filePickingStartTime = Date.now();
          const res = await requestNativeBatchGalleryDeletion(mediaItemsToDelete);
          if (res && (res.requested || res.success)) {
            handledNatively = true;
          }
        } catch (e) {
          console.warn('Native deletion request failed:', e);
        }
      }

      showToast(`¡${total} archivo(s) guardados y cifrados con éxito!`, 'success');
      setIsEncrypting(false);

      // Pasar a la bóveda (y si no fue nativo, mostrar recordatorio con botón "Abrir Galería")
      onImportComplete(
        newRecords.map((it) => ({ name: it.name, size: it.size, category: it.category })),
        !handledNatively && !isNativeApp()
      );
    } catch (err) {
      console.error('Error importing items automatically:', err);
      showToast('Error al cifrar archivos', 'error');
      setIsEncrypting(false);
    }
  };

  const handleCustomFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // CRITICAL: Convert FileList to Array BEFORE resetting input.value!
      // In Android Chrome / WebAPK, resetting input.value = '' empties e.target.files in place.
      const filesArray = Array.from(e.target.files);
      e.target.value = '';
      processFilesAutomatically(filesArray);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-28 animate-in fade-in duration-200 box-border">
      {/* Fixed Pinned Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-[#090d16]/95 backdrop-blur-xl border-b border-slate-800/80 safe-top-sticky pb-3 px-4 shadow-md shadow-black/40 transition-all">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-0.5">
            Impor<span className="text-[#00e5ff]">tar</span>
          </h1>
          <p className="text-[10px] font-semibold text-slate-400 tracking-[0.2em] uppercase">
            SELECCIONA ARCHIVOS PARA CIFRAR
          </p>
        </div>
      </header>

      {/* Spacer so content starts right below fixed header */}
      <div className="safe-top-header-spacer shrink-0 w-full mb-3" />

      {/* Main Options Box */}
      <div className="mb-4 bg-[#0a121d] border border-slate-800/90 rounded-3xl p-5 text-center shadow-xl">
        <div
          onClick={() => triggerPicker(mediaInputRef)}
          className="w-14 h-14 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] flex items-center justify-center mx-auto mb-3 shadow-md shadow-cyan-500/10 cursor-pointer active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">
          Selecciona archivos para tu Bóveda
        </h3>
        <p className="text-xs text-slate-400 mb-5 max-w-xs mx-auto">
          Elige fotos, videos, grabaciones o aplicaciones desde el almacenamiento de tu celular.
        </p>

        {/* 3 Carpetas Directas de Selección */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => triggerPicker(mediaInputRef)}
            disabled={isEncrypting}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-[#00e5ff]/40 text-left flex items-center justify-between transition-all active:scale-98 cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-blue-300">
                  Fotos y Videos
                </h4>
                <p className="text-[11px] text-slate-500">Galería, cámara y descargas</p>
              </div>
            </div>
            <Plus className="w-4 h-4 text-slate-500 group-hover:text-[#00e5ff] group-hover:scale-110 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => triggerPicker(audioInputRef)}
            disabled={isEncrypting}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left flex items-center justify-between transition-all active:scale-98 cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300">
                  Audio y Grabaciones
                </h4>
                <p className="text-[11px] text-slate-500">Música, audios de voz y grabadora</p>
              </div>
            </div>
            <Plus className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:scale-110 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => triggerPicker(docInputRef)}
            disabled={isEncrypting}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left flex items-center justify-between transition-all active:scale-98 cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">
                  Documentos (PDF, Word, TXT)
                </h4>
                <p className="text-[11px] text-slate-500">PDFs, Word .docx, textos y hojas de cálculo</p>
              </div>
            </div>
            <Plus className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:scale-110 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => triggerPicker(appInputRef)}
            disabled={isEncrypting}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left flex items-center justify-between transition-all active:scale-98 cursor-pointer group disabled:opacity-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">
                  Aplicaciones y Archivos (.apk)
                </h4>
                <p className="text-[11px] text-slate-500">Paquetes APK, ejecutables y archivos ZIP</p>
              </div>
            </div>
            <Plus className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:scale-110 transition-all" />
          </button>
        </div>
      </div>

      {/* Info Card: Cifrado Automático y Borrado de Galería */}
      <div className="bg-[#0a121d] border border-slate-800/90 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#00e5ff]/15 border border-[#00e5ff]/30 text-[#00e5ff] flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/10">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Cifrado local automático AES-256</span>
              <Sparkles className="w-3.5 h-3.5 text-[#00e5ff]" />
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Al seleccionar fotos o videos, se cifran automáticamente en tu Bóveda y Android te solicitará permiso para eliminarlos de la galería original.
            </p>
          </div>
        </div>
      </div>

      {/* Modal / Overlay de Cifrado en Tiempo Real */}
      {isEncrypting && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in">
          <div className="w-full max-w-sm bg-[#0e1626] border border-[#00e5ff]/40 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#00e5ff]/15 border border-[#00e5ff]/30 text-[#00e5ff] flex items-center justify-center animate-pulse shadow-lg shadow-cyan-500/20">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">
                Cifrando y guardando en Mi Bóveda
              </h4>
              <p className="text-xs text-slate-400 font-mono mt-1 truncate max-w-[260px] mx-auto">
                {encryptingName || `Archivo ${currentFileIndex} de ${totalFilesToProcess}`}
              </p>
              <p className="text-[11px] text-cyan-300 font-semibold mt-1">
                {currentFileIndex} de {totalFilesToProcess} procesado(s)
              </p>
            </div>

            {/* Cyan Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-[#00e5ff] to-cyan-300 transition-all duration-200 rounded-full shadow-sm shadow-cyan-500/50"
                  style={{ width: `${encryptProgress}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-slate-300">
                {encryptProgress}% completado
              </span>
            </div>

            <p className="text-[10px] text-slate-400">
              Generando clave criptográfica e IV único para cada archivo...
            </p>
          </div>
        </div>
      )}

      {/* Hidden file inputs for media, audio and documents */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onClick={() => {
          (window as any).__isPickingFile = true;
          (window as any).__filePickingStartTime = Date.now();
        }}
        onChange={handleCustomFileSelect}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onClick={() => {
          (window as any).__isPickingFile = true;
          (window as any).__filePickingStartTime = Date.now();
        }}
        onChange={handleCustomFileSelect}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.rtf,.md,.csv,.xlsx,.xls,.pptx,.ppt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        multiple
        className="hidden"
        onClick={() => {
          (window as any).__isPickingFile = true;
          (window as any).__filePickingStartTime = Date.now();
        }}
        onChange={handleCustomFileSelect}
      />
      <input
        ref={appInputRef}
        type="file"
        accept=".apk,.zip,.rar,.exe,.dmg,.pkg,.ipa,.bin,.tar,.gz,*/*"
        multiple
        className="hidden"
        onClick={() => {
          (window as any).__isPickingFile = true;
          (window as any).__filePickingStartTime = Date.now();
        }}
        onChange={handleCustomFileSelect}
      />
    </div>
  );
};
