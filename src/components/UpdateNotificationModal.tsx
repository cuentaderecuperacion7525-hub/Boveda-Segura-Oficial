import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Calendar,
  Layers,
  Download,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { updateService, UpdateCheckResult } from '../services/updateService';
import { downloadAndInstallApk, onDownloadProgress, openApkInBrowser } from '../services/nativeUpdaterBridge';
import { CURRENT_APP_VERSION, CURRENT_RELEASE_DATE, CURRENT_CHANGELOG } from '../version';

interface UpdateNotificationModalProps {
  // Cuando se detecta una nueva actualización
  updateInfo: UpdateCheckResult | null;
  isOpen: boolean;
  onClose: () => void;
  // Si se abre solo para consultar las novedades de la versión actual
  viewNotesOnly?: boolean;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  updateInfo,
  isOpen,
  onClose,
  viewNotesOnly = false,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [downloadPercent, setDownloadPercent] = useState<number>(0);
  const [downloadStage, setDownloadStage] = useState<string>('Iniciando descarga segura...');
  const [downloadSize, setDownloadSize] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [dynamicNotes, setDynamicNotes] = useState<{ fecha: string; cambios: string[] }>({
    fecha: CURRENT_RELEASE_DATE,
    cambios: CURRENT_CHANGELOG,
  });

  useEffect(() => {
    if (!isOpen) return;
    fetch('novedades.json', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo cargar novedades.json');
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.cambios)) {
          const list = data.cambios.map((c: any) => {
            const raw = c.titulo ? `${c.titulo}: ${c.texto}` : c.texto || '';
            return raw.replace(/Versi[oó]n\s+[0-9]+\.[0-9]+(\.[0-9]+)?/gi, `Versión ${CURRENT_APP_VERSION}`);
          }).filter(Boolean);
          setDynamicNotes({
            fecha: typeof data.fecha === 'string' ? data.fecha : CURRENT_RELEASE_DATE,
            cambios: list.length > 0 ? list : ['Mejoras de estabilidad y rendimiento'],
          });
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const targetVersion = viewNotesOnly 
    ? CURRENT_APP_VERSION 
    : (updateInfo?.latestVersion || CURRENT_APP_VERSION);

  const releaseDate = viewNotesOnly 
    ? (dynamicNotes.fecha || CURRENT_RELEASE_DATE)
    : (updateInfo?.releaseDate || dynamicNotes.fecha || CURRENT_RELEASE_DATE);

  const changelog = viewNotesOnly
    ? (dynamicNotes.cambios.length > 0 ? dynamicNotes.cambios : CURRENT_CHANGELOG)
    : (updateInfo?.changelog && updateInfo.changelog.length > 0 ? updateInfo.changelog : dynamicNotes.cambios);

  const handleApplyUpdate = async () => {
    setIsApplying(true);
    setIsComplete(false);
    setInstallError(null);
    setDownloadPercent(8);
    setDownloadStage('Conectando con el servidor y preparando canal seguro...');

    let listenerHandle: { remove: () => void } | null = null;
    let progressTimer: any = null;

    try {
      listenerHandle = await onDownloadProgress((p) => {
        if (p && typeof p.percent === 'number') {
          const clamped = Math.min(Math.max(p.percent, 8), 98);
          setDownloadPercent(clamped);
          if (p.total > 0) {
            const loadedMb = (p.loaded / (1024 * 1024)).toFixed(1);
            const totalMb = (p.total / (1024 * 1024)).toFixed(1);
            setDownloadSize(`${loadedMb} / ${totalMb} MB`);
          }
          if (clamped < 35) {
            setDownloadStage('Descargando paquete de actualización APK...');
          } else if (clamped < 80) {
            setDownloadStage('Transfiriendo archivos del sistema y componentes...');
          } else {
            setDownloadStage('Verificando integridad del paquete...');
          }
        }
      });

      progressTimer = setInterval(() => {
        setDownloadPercent((prev) => {
          if (prev < 92) {
            const step = prev < 35 ? 4 : (prev < 70 ? 3 : 1);
            const next = prev + step;
            if (next >= 30 && next < 65) {
              setDownloadStage('Descargando paquete de actualización APK...');
            } else if (next >= 65 && next < 88) {
              setDownloadStage('Verificando integridad del archivo...');
            } else if (next >= 88) {
              setDownloadStage('Preparando instalador de Android...');
            }
            return next;
          }
          return prev;
        });
      }, 350);

      if (updateInfo?.downloadUrl) {
        const res = await downloadAndInstallApk(updateInfo.downloadUrl);
        clearInterval(progressTimer);

        if (res.needsPermission) {
          setIsApplying(false);
          setDownloadPercent(0);
          setInstallError(res.message || "Activa 'Permitir desde esta fuente' en Ajustes y vuelve a tocar 'Actualizar Ahora'.");
          return;
        }

        setDownloadPercent(100);
        setIsComplete(true);
        setDownloadStage('¡Descarga completada! Abriendo instalador de Android...');
        setTimeout(() => {
          onClose();
        }, 3000);
        return;
      }
      await updateService.applyUpdate();
    } catch (err: any) {
      clearInterval(progressTimer);
      setIsApplying(false);
      setDownloadPercent(0);
      setInstallError(err?.message || 'No se pudo completar la instalación automática. Usa la descarga en navegador.');
    } finally {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    }
  };

  const handleOpenExternalDownload = async () => {
    if (!updateInfo?.downloadUrl) return;
    try {
      await openApkInBrowser(updateInfo.downloadUrl);
      setInstallError('Descarga iniciada en el navegador. Abre el APK descargado para instalar.');
    } catch (err: any) {
      setInstallError(err?.message || 'No se pudo abrir la descarga externa.');
    }
  };

  const handleDismiss = () => {
    if (!viewNotesOnly && updateInfo?.latestVersion) {
      updateService.dismissUpdate(
        updateInfo.latestVersion,
        updateInfo.buildNumber,
        updateInfo.publishedAtMs
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0a121d] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,229,255,0.18)] relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isApplying}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado del aviso */}
        <div className="flex items-center gap-3.5 mb-4 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-[#00e5ff] flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/10">
            {viewNotesOnly ? (
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            ) : (
              <Sparkles className="w-6 h-6 stroke-[2] animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#00e5ff] border border-cyan-500/30">
                {viewNotesOnly ? 'Versión Instalada' : 'Nueva Actualización'}
              </span>
              <span className="font-mono text-xs font-bold text-white">
                v{targetVersion}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {viewNotesOnly 
                ? 'Novedades y Mejoras' 
                : '¡Nueva Versión Lista!'}
            </h3>
          </div>
        </div>

        {/* Resumen o mensaje */}
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {viewNotesOnly
            ? 'Tu bóveda cuenta con las optimizaciones más recientes para navegación, seguridad y visualización multimedia.'
            : 'Se han implementado mejoras importantes en el desplazamiento, zoom táctil y rendimiento general. Tus fotos y configuraciones permanecen 100% protegidas e intactas.'}
        </p>

        {/* Lista de cambios (Changelog) con scroll */}
        <div className="flex-1 overflow-y-auto space-y-2.5 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 mb-5 max-h-[42vh] custom-scrollbar">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Layers className="w-3.5 h-3.5 text-[#00e5ff]" />
              Cambios incluidos:
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Calendar className="w-3 h-3" />
              {releaseDate}
            </span>
          </div>

          <ul className="space-y-2.5 pt-1">
            {changelog.map((item, index) => (
              <li key={index} className="flex items-start gap-2.5 text-xs text-slate-200 leading-snug">
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* BARRA DE PROGRESO ANIMADA DURANTE LA ACTUALIZACIÓN (Opción 1) */}
        {isApplying && (
          <div className="p-3.5 rounded-2xl bg-[#0e1a2b] border border-cyan-500/60 space-y-2.5 mb-4 shadow-xl shadow-cyan-950/70 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                </span>
                <span className="font-bold text-white">
                  {isComplete ? '¡Descarga Finalizada!' : 'Progreso de la actualización'}
                </span>
              </div>
              <span className="font-mono text-xs font-extrabold text-cyan-200 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/40">
                {downloadPercent}%
              </span>
            </div>

            {/* Barrita animada con gradiente y brillo */}
            <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-700/80 p-0.5 overflow-hidden shadow-inner relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(0,229,255,0.7)] relative overflow-hidden"
                style={{ width: `${Math.max(downloadPercent, 5)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-pulse rounded-full" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
              <span className="truncate flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{downloadStage}</span>
              </span>
              {downloadSize && (
                <span className="text-cyan-300 font-bold shrink-0 ml-2">{downloadSize}</span>
              )}
            </div>
          </div>
        )}

        {/* Mensaje de error o permiso pendiente */}
        {installError && !isApplying && (
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs leading-relaxed mb-4 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{installError}</span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-2.5">
            {viewNotesOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Entendido</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={isApplying}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  Más tarde
                </button>
                <button
                  type="button"
                  onClick={handleApplyUpdate}
                  disabled={isApplying}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-75"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>{isComplete ? 'Instalando...' : 'Descargando...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-white" />
                      <span>Actualizar Ahora</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {!viewNotesOnly && updateInfo?.downloadUrl && !isApplying && (
            <button
              type="button"
              onClick={handleOpenExternalDownload}
              className="w-full min-h-[44px] py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Descargar APK en navegador</span>
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-500 text-center mt-3">
          {viewNotesOnly
            ? 'Cifrado permanente AES-GCM 256 bits activo.'
            : 'Tus archivos y configuraciones permanecen protegidos durante la actualización.'}
        </p>
      </div>
    </div>
  );
};

/**
 * Banner superior discreto que aparece al abrir la app si hay actualización lista.
 * Al tocarlo o pulsar el botón, redirige al menú de actualizaciones de la aplicación
 * en lugar de actualizar ahí mismo, permitiendo ver la barra de progreso animada (Opción 1).
 */
interface UpdateBannerProps {
  updateInfo: UpdateCheckResult;
  onOpenUpdateMenu: () => void;
  onOpenDetails?: () => void;
  onApplyUpdate?: () => void;
  onDismiss: () => void;
}

export const UpdateNotificationBanner: React.FC<UpdateBannerProps> = ({
  updateInfo,
  onOpenUpdateMenu,
  onOpenDetails,
  onApplyUpdate,
  onDismiss,
}) => {
  const handleGoToMenu = () => {
    if (onOpenUpdateMenu) {
      onOpenUpdateMenu();
    } else if (onOpenDetails) {
      onOpenDetails();
    } else if (onApplyUpdate) {
      onApplyUpdate();
    }
  };

  return (
    <aside 
      aria-label="Aviso de actualización disponible"
      role="button"
      tabIndex={0}
      onClick={handleGoToMenu}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleGoToMenu();
        }
      }}
      className="vault-update-banner w-full bg-[#08111d]/90 backdrop-blur-xl border border-cyan-500/35 rounded-full py-1.5 px-3 mb-2.5 shadow-[0_4px_16px_rgba(0,229,255,0.08)] flex items-center justify-between gap-2.5 text-white cursor-pointer active:scale-[0.99] transition-all select-none group"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="vault-update-banner-icon w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[#00e5ff] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
          <Sparkles className="w-3.5 h-3.5 text-current animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className="vault-update-banner-title text-xs font-bold text-white tracking-tight truncate">
            Nueva versión v{updateInfo.latestVersion}
          </span>
          <span className="vault-update-banner-desc text-[11px] font-medium text-cyan-300/80 hidden sm:inline shrink-0">
            · Toca para instalar
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleGoToMenu();
          }}
          className="vault-update-banner-btn px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
          title="Ir al menú de actualización"
        >
          <Download className="w-3 h-3 text-white" />
          <span className="text-white">Actualizar</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="vault-update-banner-close w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          title="Posponer aviso"
          aria-label="Posponer aviso"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
