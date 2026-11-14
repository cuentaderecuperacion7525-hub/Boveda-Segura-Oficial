import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  RefreshCw,
  Download,
  Check,
  Sparkles,
} from 'lucide-react';
import { getSafeAppVersionCode, downloadAndInstallApk, onDownloadProgress } from '../services/nativeUpdaterBridge';
import { updateService, NovedadItem } from '../services/updateService';
import { CURRENT_APP_VERSION, CURRENT_BUILD_NUMBER } from '../version';
const APP_VERSION = CURRENT_APP_VERSION;

interface BovedaUpdaterProps {
  onOpenChangelog?: () => void;
  onNavigateToBackup?: () => void;
}

export const BovedaUpdater: React.FC<BovedaUpdaterProps> = () => {
  const cachedCheck = updateService.getLastCheckResult();
  const cachedNotes = updateService.getCachedReleaseNotes();
  const isCachedTrulyNew = Boolean(cachedCheck?.hasUpdate);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(isCachedTrulyNew);
  const [downloadUrl, setDownloadUrl] = useState<string>(() => cachedCheck?.downloadUrl || '');
  const [serverVersionName, setServerVersionName] = useState<string>(() => cachedCheck?.latestVersion || '');
  const [serverVersionCode, setServerVersionCode] = useState<number>(() => cachedCheck?.buildNumber || 0);
  const [currentInstalledCode, setCurrentInstalledCode] = useState<number>(CURRENT_BUILD_NUMBER);
  const [installedVersionName, setInstalledVersionName] = useState<string>(APP_VERSION);
  const [loading, setLoading] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [downloadPercent, setDownloadPercent] = useState<number>(0);
  const [downloadStage, setDownloadStage] = useState<string>('Iniciando canal seguro...');
  const [downloadSize, setDownloadSize] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isNative, setIsNative] = useState<boolean>(false);
  const [novedadesList, setNovedadesList] = useState<NovedadItem[]>(() => {
    if (cachedCheck?.novedades && cachedCheck.novedades.length > 0) {
      return cachedCheck.novedades;
    }
    return cachedNotes?.novedades || [];
  });
  const [notesVersion, setNotesVersion] = useState<string>(() => {
    return (
      cachedCheck?.serverVersion ||
      cachedCheck?.latestVersion ||
      cachedNotes?.version ||
      ''
    );
  });
  const [activeReleaseDate, setActiveReleaseDate] = useState<string>(() => {
    if (cachedCheck?.releaseDate) return cachedCheck.releaseDate;
    if (cachedNotes?.fecha) return updateService.formatSpanishDate(cachedNotes.fecha);
    return '';
  });
  const [installCompleted, setInstallCompleted] = useState<boolean>(false);

  const LAST_CHECK_TS_KEY = 'vault_last_update_check';

  const getSavedCheckTimestamp = (): number | null => {
    try {
      const saved = localStorage.getItem(LAST_CHECK_TS_KEY);
      if (saved) {
        const parsed = Number(saved);
        if (!Number.isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return null;
  };

  // Formatear fecha y hora de última comprobación en 24 hrs:
  // "Hoy, 15:08" | "Ayer, 15:08" | "12 de noviembre 2026, 15:08"
  const formatLastCheckTimestamp = (ts: number | null): string => {
    if (!ts) return 'Aún sin comprobar';
    const date = new Date(ts);
    const now = new Date();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const diffDays = Math.round((startOfToday - startOfTarget) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Hoy, ${timeStr}`;
    }
    if (diffDays === 1) {
      return `Ayer, ${timeStr}`;
    }

    const months = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    return `${date.getDate()} de ${months[date.getMonth()]} ${date.getFullYear()}, ${timeStr}`;
  };

  const [lastCheckTimestamp, setLastCheckTimestamp] = useState<number | null>(() =>
    getSavedCheckTimestamp()
  );

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const aplicarNovedadesDesdeCache = useCallback(() => {
    const saved = updateService.getCachedReleaseNotes();
    if (saved) {
      if (saved.version) setNotesVersion(saved.version);
      if (saved.fecha) setActiveReleaseDate(updateService.formatSpanishDate(saved.fecha));
      setNovedadesList(saved.novedades || []);
    }
  }, []);

  // Lógica unificada de verificación de versiones y descarga de version.json
  const verificarActualizaciones = useCallback(async (esManual: boolean = false) => {
    setLoading(true);
    setStatus('');

    try {
      // 1. Obtener versión instalada en el dispositivo
      let versionActual = CURRENT_BUILD_NUMBER;
      let nombreActual = APP_VERSION;
      try {
        const info = await getSafeAppVersionCode();
        if (info.versionCode) {
          versionActual = info.versionCode;
          setCurrentInstalledCode(versionActual);
        }
        if (info.versionName) {
          nombreActual = info.versionName;
          setInstalledVersionName(nombreActual);
        }
      } catch {
        setCurrentInstalledCode(CURRENT_BUILD_NUMBER);
      }

      // 2. Descargar version.json desde GitHub Releases (o fallback) mediante updateService
      const res = await updateService.checkForUpdates(true);

      setServerVersionName(res.latestVersion);
      if (res.buildNumber) {
        setServerVersionCode(res.buildNumber);
      }

      if (res.error) {
        setUpdateAvailable(false);
        aplicarNovedadesDesdeCache();
        if (esManual) {
          setStatus(res.error);
        }
        return;
      }

      const checkedAt = Date.now();
      try {
        localStorage.setItem(LAST_CHECK_TS_KEY, String(checkedAt));
      } catch {}
      setLastCheckTimestamp(checkedAt);

      if (res.serverVersion || res.latestVersion) {
        setNotesVersion(res.serverVersion || res.latestVersion);
      }
      if (res.releaseDate || res.fecha) {
        setActiveReleaseDate(res.releaseDate || updateService.formatSpanishDate(res.fecha));
      }
      if (Array.isArray(res.novedades)) {
        setNovedadesList(res.novedades);
      }

      if (res.hasUpdate) {
        setUpdateAvailable(true);
        setDownloadUrl(res.downloadUrl || '');
        setStatus('');
      } else {
        setUpdateAvailable(false);
        setStatus('');
      }
    } catch (error: any) {
      setUpdateAvailable(false);
      aplicarNovedadesDesdeCache();
      if (esManual) {
        setStatus(error?.message || 'No se pudo conectar con el servidor. Revisa tu conexión.');
      }
    } finally {
      setLoading(false);
    }
  }, [aplicarNovedadesDesdeCache]);

  // Comprobación inicial al montar
  useEffect(() => {
    verificarActualizaciones(false);
  }, [verificarActualizaciones]);

  // Ejecución de la descarga e instalación automática
  const ejecutarActualizacion = async () => {
    if (!downloadUrl) return;
    setIsInstalling(true);
    setInstallCompleted(false);
    setStatus('');
    setDownloadPercent(2);
    setDownloadStage('Conectando con el servidor...');
    setDownloadSize('');

    let listenerHandle: { remove: () => void } | null = null;
    let progressTimer: any = null;
    let receivedRealProgress = false;
    let didFinish = false;
    (window as any).__isInstallingUpdate = true;

    try {
      listenerHandle = await onDownloadProgress((p) => {
        if (p && typeof p.percent === 'number') {
          if (!receivedRealProgress) {
            receivedRealProgress = true;
            if (progressTimer) {
              clearInterval(progressTimer);
              progressTimer = null;
            }
          }
          const clamped = Math.min(Math.max(p.percent, 2), 99);
          setDownloadPercent((prev) => Math.max(prev, clamped));
          if (p.total > 0) {
            const loadedMb = (p.loaded / (1024 * 1024)).toFixed(1);
            const totalMb = (p.total / (1024 * 1024)).toFixed(1);
            setDownloadSize(`${loadedMb} / ${totalMb} MB`);
          }
          if (clamped < 30) {
            setDownloadStage('Descargando paquete APK...');
          } else if (clamped < 75) {
            setDownloadStage('Transfiriendo archivos del sistema...');
          } else if (clamped < 95) {
            setDownloadStage('Verificando integridad del paquete...');
          } else {
            setDownloadStage('Finalizando descarga...');
          }
        }
      });

      // Avance suave inicial solo mientras conecta y aún no llegan bytes reales
      progressTimer = setInterval(() => {
        if (receivedRealProgress) {
          clearInterval(progressTimer);
          progressTimer = null;
          return;
        }
        setDownloadPercent((prev) => (prev < 15 ? prev + 1 : prev));
      }, 450);

      const res = await downloadAndInstallApk(downloadUrl);

      if (progressTimer) clearInterval(progressTimer);

      if (res.needsPermission) {
        didFinish = true;
        setIsInstalling(false);
        setInstallCompleted(false);
        setDownloadPercent(0);
        setDownloadStage('');
        setStatus(res.message || "Activa 'Permitir desde esta fuente' en Ajustes y vuelve a tocar 'Instalar actualización'.");
        return;
      }

      didFinish = true;
      setDownloadPercent(100);
      setInstallCompleted(true);
      setDownloadStage('¡Descarga completada! Abriendo instalador...');
      setStatus(res.message || 'Instalador abierto. Confirma la instalación.');
    } catch (err: any) {
      if (progressTimer) clearInterval(progressTimer);
      setStatus(err.message || 'No se pudo completar la instalación automática. Verifica tu conexión e inténtalo de nuevo.');
      setDownloadStage('');
      setIsInstalling(false);
      setDownloadPercent(0);
      setInstallCompleted(false);
    } finally {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
      if (didFinish) {
        setTimeout(() => {
          (window as any).__isInstallingUpdate = false;
        }, 5000);
      } else {
        (window as any).__isInstallingUpdate = false;
      }
      if (!didFinish) {
        setTimeout(() => {
          setIsInstalling(false);
        }, 5000);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 font-sans select-none box-border pt-1">
      {/* ======================================================== */}
      {/* TARJETA PRINCIPAL DESTACADA (HERO CARD)                  */}
      {/* ======================================================== */}
      <section className="bg-[#0b1322]/85 backdrop-blur-xl border border-slate-800/80 rounded-[32px] p-6 sm:p-7 shadow-2xl relative flex flex-col items-center text-center overflow-hidden">
        {/* Resplandor sutil ambiental */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Círculo central con Icono de Estado */}
        {updateAvailable ? (
          <div className="w-20 h-20 rounded-full border-2 border-blue-400/90 flex items-center justify-center bg-blue-500/15 mb-4 shadow-[0_0_25px_rgba(59,130,246,0.25)] relative z-10 animate-in zoom-in-95 duration-200">
            <Sparkles className="w-10 h-10 text-blue-400" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full border-2 border-emerald-400 flex items-center justify-center bg-emerald-500/10 mb-4 shadow-[0_0_25px_rgba(16,185,129,0.2)] relative z-10">
            <Check className="w-10 h-10 text-emerald-400 stroke-[2.5]" />
          </div>
        )}

        {/* Título y Subtítulo de Estado */}
        <h2 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight mb-1 relative z-10">
          {updateAvailable ? 'Actualización disponible' : 'Sistema actualizado'}
        </h2>
        <p className="text-sm text-slate-400 mb-6 relative z-10">
          {updateAvailable
            ? `Nueva versión v${serverVersionName || 'disponible'} lista para instalar`
            : 'Tienes la última versión disponible'}
        </p>

        {/* Dos bloques compactos: Instalada y GitHub */}
        <div className="w-full grid grid-cols-2 gap-3 mb-4 text-left relative z-10">
          <div className="bg-[#080d19]/90 border border-slate-800/70 rounded-2xl p-3.5">
            <span className="text-xs text-slate-400 block mb-1">Instalada</span>
            <span className="text-base font-bold text-white font-mono tabular-nums block truncate">
              v{installedVersionName}
            </span>
          </div>

          <div className="bg-[#080d19]/90 border border-slate-800/70 rounded-2xl p-3.5">
            <span className="text-xs text-slate-400 block mb-1">Servidor</span>
            <span className="text-base font-semibold text-emerald-400 flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse shrink-0" />
              En línea
            </span>
          </div>
        </div>

        {/* Texto de última comprobación */}
        <p className="text-xs text-slate-400 text-center mb-5 font-normal relative z-10 tabular-nums">
          Última comprobación · {formatLastCheckTimestamp(lastCheckTimestamp)}
        </p>

        {/* Estado en curso de instalación si aplica */}
        {isInstalling && (
          <div className="w-full p-4 mb-4 rounded-2xl bg-slate-950/90 border border-indigo-500/60 space-y-2.5 text-left relative z-10">
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="font-semibold text-white truncate">{downloadStage}</span>
              <span className="font-mono tabular-nums text-xs font-bold text-blue-300 shrink-0">{downloadPercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-700/80 p-0.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
                style={{ width: `${Math.max(downloadPercent, 5)}%` }}
              />
            </div>
            {downloadSize && (
              <span className="text-[11px] text-slate-400 font-mono tabular-nums block text-right">{downloadSize}</span>
            )}
          </div>
        )}

        {/* Mensaje de estado dinámico */}
        {status && !isInstalling && (
          <div className="w-full p-3 mb-4 rounded-2xl text-xs font-medium border bg-slate-950/60 border-slate-800 text-slate-300 text-left relative z-10 leading-relaxed">
            {status}
          </div>
        )}

        {/* Botones de Acción Proporcionales con área táctil >= 44px */}
        <div className="w-full flex flex-col items-center gap-2.5 relative z-10">
          {updateAvailable ? (
            <button
              type="button"
              onClick={ejecutarActualizacion}
              disabled={isInstalling}
              className="w-full max-w-[270px] min-h-[44px] py-2.5 sm:py-3 px-5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:from-blue-600 hover:to-purple-600 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Download className={`w-4 h-4 ${isInstalling ? 'animate-bounce' : ''}`} />
              <span>
                {isInstalling ? 'Instalando...' : 'Instalar actualización'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => verificarActualizaciones(true)}
              disabled={loading || isInstalling}
              className="w-full max-w-[260px] min-h-[44px] py-2.5 sm:py-3 px-5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:from-blue-600 hover:to-purple-600 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Buscando...' : 'Buscar actualizaciones'}</span>
            </button>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECCIÓN DE NOVEDADES DINÁMICAS DESDE version.json        */}
      {/* ======================================================== */}
      <section className="pt-2 space-y-3.5 px-1 pb-16">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {notesVersion ? `Novedades v${notesVersion}` : `Novedades v${installedVersionName}`}
          </h3>
          {activeReleaseDate && (
            <span className="text-xs text-slate-400 font-normal shrink-0">
              {activeReleaseDate}
            </span>
          )}
        </div>

        <div className="space-y-3 pt-1">
          {novedadesList.length > 0 ? (
            novedadesList.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-[#00d2ff] shrink-0 mt-2 shadow-[0_0_8px_rgba(0,210,255,0.7)]" />
                <p className="flex-1">
                  {item.titulo ? (
                    <>
                      <strong className="text-white font-semibold">{item.titulo}</strong>
                      {item.descripcion ? `: ${item.descripcion}` : ''}
                    </>
                  ) : (
                    item.descripcion
                  )}
                </p>
              </div>
            ))
          ) : (
            <div className="flex items-start gap-3 text-sm text-slate-400 leading-relaxed">
              <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0 mt-2" />
              <p className="flex-1">Sin novedades disponibles</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
