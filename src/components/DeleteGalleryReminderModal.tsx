import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Trash2, Camera, Check, ExternalLink, Image, Smartphone, ChevronDown, ChevronUp, Folder } from 'lucide-react';
import { openNativeGallery, openNativeFileManager } from '../services/nativeVaultBridge';

interface DeleteGalleryReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
  recentItems?: { name: string; size: number }[];
  onOpenVaultCamera?: () => void;
}

export const DeleteGalleryReminderModal: React.FC<DeleteGalleryReminderModalProps> = ({
  isOpen,
  onClose,
  count,
  recentItems = [],
  onOpenVaultCamera,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showFileList, setShowFileList] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_delete_gallery_reminder', 'true');
    }
    onClose();
  };

  const handleOpenGallery = () => {
    openNativeGallery();
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 0.01) return '< 0.01 MB';
    if (mb < 1) return `${mb.toFixed(2)} MB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div
        className="w-full max-w-md border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--theme-bg-card, #0a121d)',
          borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
        }}
      >
        {/* Header Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              ¡{count} archivo{count > 1 ? 's' : ''} resguardado{count > 1 ? 's' : ''} con éxito!
            </h3>
            <p className="text-xs text-emerald-400 font-medium">
              Cifrado AES-256 completado dentro de tu bóveda privada
            </p>
          </div>
        </div>

        {/* Explicación Técnica y Por Qué */}
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 space-y-2 text-xs text-slate-200">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>¿Por qué siguen visibles en la galería o descargas?</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Por las políticas de privacidad y seguridad de <strong>Android (Scoped Storage)</strong> y de los navegadores, ninguna aplicación web puede <strong>borrar o alterar archivos originales de tu teléfono en segundo plano sin confirmación manual</strong>.
          </p>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Los archivos ya están <strong>100% copiados y cifrados de forma blindada dentro de esta bóveda</strong>. Para completar la privacidad total, debes eliminar los originales de tu dispositivo:
          </p>

          <div className="pt-2 border-t border-amber-500/20 space-y-2 text-[11px]">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                1
              </span>
              <p className="text-slate-200">
                Abre la <strong>Galería</strong> o <strong>Gestor de Archivos</strong> de tu teléfono con el botón de abajo.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                2
              </span>
              <p className="text-slate-200">
                Selecciona y elimina las fotos, videos, audios o documentos originales (y vacía la papelera).
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                ✓
              </span>
              <p className="text-emerald-300 font-medium">
                Tus archivos permanecen seguros en tu Bóveda y podrás recuperarlos o compartirlos en cualquier momento.
              </p>
            </div>
          </div>
        </div>

        {/* Lista desplegable de los archivos resguardados para que el usuario los reconozca fácilmente */}
        {recentItems.length > 0 && (
          <div className="bg-[#0b101d] border border-slate-800 rounded-2xl overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowFileList(!showFileList)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Image className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold text-[11px]">
                  Ver lista de {recentItems.length} archivo(s) para borrar
                </span>
              </div>
              {showFileList ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showFileList && (
              <div className="px-3 pb-2.5 max-h-32 overflow-y-auto space-y-1 divide-y divide-slate-800/60 no-scrollbar">
                {recentItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span className="truncate max-w-[200px] text-slate-200">{item.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">{formatSize(item.size)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Botones directos de Apertura en el Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleOpenGallery}
            className="w-full py-3 px-3 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span className="truncate">Abrir Galería de Fotos</span>
          </button>
          <button
            type="button"
            onClick={() => openNativeFileManager()}
            className="w-full py-3 px-3 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Folder className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="truncate">Abrir Archivos / Descargas</span>
          </button>
        </div>

        {/* Consejo Pro: Cámara directa a la bóveda */}
        <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-3 flex items-center gap-3 text-xs text-indigo-200">
          <Camera className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="flex-1 text-[11px]">
            <p>
              <strong>Evita este paso en el futuro:</strong> Usa la <strong>Cámara de la Bóveda</strong> (botón azul/morado abajo) para que las fotos se cifren al instante y <strong>NUNCA</strong> aparezcan en tu galería pública.
            </p>
            {onOpenVaultCamera && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVaultCamera();
                }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline mt-1 block"
              >
                Probar la Cámara ahora
              </button>
            )}
          </div>
        </div>

        {/* Action Button & Checkbox */}
        <div className="pt-1 space-y-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <span>Entendido, no volver a mostrar este aviso</span>
          </label>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Listo, cerrar recordatorio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
