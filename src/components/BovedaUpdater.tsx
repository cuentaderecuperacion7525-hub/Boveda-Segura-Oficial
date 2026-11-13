import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  RefreshCw,
  Download,
  Check,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { getSafeAppVersionCode, downloadAndInstallApk, onDownloadProgress, openApkInBrowser } from '../services/nativeUpdaterBridge';
import { updateService } from '../services/updateService';
import { CURRENT_APP_VERSION, CURRENT_BUILD_NUMBER } from '../version';
const APP_VERSION = CURRENT_APP_VERSION;

interface CambioNovedad {
  titulo?: string;
  texto: string;
}

interface BovedaUpdaterProps {
  onOpenChangelog?: () => void;
  onNavigateToBackup?: () => void;
}

export const BovedaUpdater: React.FC<BovedaUpdaterProps> = () => {
  const cachedCheck = updateService.getLastCheckResult();
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
  const [cambiosNovedades, setCambiosNovedades] = useState<CambioNovedad[]>([]);
  const [activeReleaseDate, setActiveReleaseDate] = useState<string>('');
  const [installCompleted, setInstallCompleted] = useState<boolean>(false);

  // Formatear hora de última comprobación estilo "03:08 p. m."
  const getFormattedTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const [lastCheckTime, setLastCheckTime] = useState<string>(() => getFormattedTime());

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  useEffect(() => {
    fetch("novedades.json", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar novedades.json");
        return res.json();
      })
      .then((data) => {
        if (data && typeof data.fecha === "string") {
          setActiveReleaseDate((prev) => prev || data.fecha);
        }
        if (data && Array.isArray(data.cambios) && data.cambios.length > 0) {
          setCambiosNovedades((prev) => (prev.length > 0 ? prev : data.cambios));
        }
      })
      .catch(() => {});
  }, []);

  // Lógica unificada de verificación de versiones
  const verificarActualizaciones = useCallback(async (esManual: boolean = false) => {
    setLoading(true);
    if (esManual) {
      setStatus('Comprobando actualizaciones del sistema...');
    }

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

      // 2. Comprobar a través del updateService
      const res = await updateService.checkForUpdates(true);

      setServerVersionName(res.latestVersion);
      if (res.buildNumber) {
        setServerVersionCode(res.buildNumber);
      }
      setLastCheckTime(getFormattedTime());

      if (res.error) {
        setUpdateAvailable(false);
        if (esManual) {
          setStatus(res.error);
        }
        return;
      }

      if (res.hasUpdate) {
        setUpdateAvailable(true);
        setDownloadUrl(res.downloadUrl || '');
        if (res.releaseDate) {
          setActiveReleaseDate(res.releaseDate);
        }
        if (Array.isArray(res.changelog) && res.changelog.length > 0) {
          setCambiosNovedades(
            res.changelog.map((line) => {
              const colonIdx = line.indexOf(':');
              if (colonIdx > 0 && colonIdx < 48) {
                return {
                  titulo: line.slice(0, colonIdx).trim(),
                  texto: line.slice(colonIdx + 1).trim(),
                };
              }
              return { texto: line };
            })
          );
        }

        const isSameTag = (res.latestVersion || '').trim().replace(/^v/, '') === (nombreActual || '').trim().replace(/^v/, '');
        setStatus(
          isSameTag && res.buildNumber
            ? `Nueva compilación v${res.latestVersion} (build ${res.buildNumber}) lista para instalar.`
            : `Nueva versión v${res.latestVersion} lista para instalar.`
        );
      } else {
        setUpdateAvailable(false);
        if (esManual) {
          setStatus(`Comprobación completada: Tu aplicación ya cuenta con la versión más reciente (v${nombreActual || CURRENT_APP_VERSION}). No hay nuevas versiones en el servidor.`);
        } else {
          setStatus('');
        }
      }
    } catch (error: any) {
      setUpdateAvailable(false);
      setLastCheckTime(getFormattedTime());
      if (esManual) {
        setStatus(error?.message || 'No se pudo conectar con el servidor. Revisa tu conexión.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Comprobación inicial al montar
  useEffect(() => {
    verificarActualizaciones(false);
  }, [verificarActualizaciones]);

  // Ejecución de la descarga e instalación automática
  const ejecutarActualizacion = async () => {
    if (!downloadUrl) return;
    setIsInstalling(true);
    setInstallCompleted(false);
    setDownloadPercent(8);
    setDownloadStage('Conectando con el servidor...');
    setDownloadSize('');

    let listenerHandle: { remove: () => void } | null = null;
    let progressTimer: any = null;
    let didFinish = false;

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

      progressTimer = setInterval(() => {
        setDownloadPercent((prev) => {
          if (prev < 92) {
            const step = prev < 35 ? 4 : (prev < 70 ? 3 : 1);
            const next = prev + step;
            if (next >= 30 && next < 65) {
              setDownloadStage('Descargando paquete APK...');
            } else if (next >= 65 && next < 88) {
              setDownloadStage('Verificando integridad del paquete...');
            } else if (next >= 88) {
              setDownloadStage('Preparando instalador de Android...');
            }
            return next;
          }
          return prev;
        });
      }, 350);

      const res = await downloadAndInstallApk(downloadUrl);

      clearInterval(progressTimer);

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
      clearInterval(progressTimer);
      setStatus(err.message || 'No se pudo completar la instalación automática. Puedes descargar el APK en el navegador.');
      setDownloadStage('');
      setIsInstalling(false);
      setDownloadPercent(0);
      setInstallCompleted(false);
    } finally {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
      if (!didFinish) {
        setTimeout(() => {
          setIsInstalling(false);
        }, 5000);
      }
    }
  };

  const abrirDescargaExterna = async () => {
    if (!downloadUrl) return;
    try {
      await openApkInBrowser(downloadUrl);
      setStatus('Descarga iniciada en el navegador. Abre el archivo APK descargado para actualizar.');
    } catch (err: any) {
      setStatus(err?.message || 'No se pudo abrir el enlace de descarga externa.');
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
          Última comprobación · {lastCheckTime}
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
            <>
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

              {downloadUrl && !isInstalling && (
                <button
                  type="button"
                  onClick={abrirDescargaExterna}
                  className="w-full max-w-[270px] min-h-[44px] py-2 px-4 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Descargar APK en navegador</span>
                </button>
              )}
            </>
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
      {/* SECCIÓN DE NOVEDADES DIRECTA (SIN TARJETAS EXTRA)         */}
      {/* ======================================================== */}
      <section className="pt-2 space-y-3.5 px-1 pb-16">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Novedades v{updateAvailable ? (serverVersionName || installedVersionName) : installedVersionName}
          </h3>
          <span className="text-xs text-slate-400 font-normal">
            {activeReleaseDate}
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {cambiosNovedades.length > 0 ? (
            cambiosNovedades.map((item, idx) => {
              const displayVer = updateAvailable ? (serverVersionName || installedVersionName) : installedVersionName;
              const formattedTexto = item.texto
                ? item.texto.replace(/Versi[oó]n\s+[0-9]+\.[0-9]+(\.[0-9]+)?/gi, `Versión ${displayVer}`)
                : '';
              const formattedTitulo = item.titulo
                ? item.titulo.replace(/v[0-9]+\.[0-9]+(\.[0-9]+)?/gi, `v${displayVer}`)
                : '';

              return (
                <div key={idx} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                  <span className="w-2 h-2 rounded-full bg-[#00d2ff] shrink-0 mt-2 shadow-[0_0_8px_rgba(0,210,255,0.7)]" />
                  <p className="flex-1">
                    {formattedTitulo ? (
                      <>
                        <strong className="text-white font-semibold">{formattedTitulo}</strong>: {formattedTexto}
                      </>
                    ) : (
                      formattedTexto
                    )}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
              <span className="w-2 h-2 rounded-full bg-[#00d2ff] shrink-0 mt-2 shadow-[0_0_8px_rgba(0,210,255,0.7)]" />
              <p className="flex-1">Mejoras de estabilidad y rendimiento</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
