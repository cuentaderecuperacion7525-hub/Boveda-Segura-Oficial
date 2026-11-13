import { Capacitor, registerPlugin } from '@capacitor/core';
import { CURRENT_BUILD_NUMBER, CURRENT_APP_VERSION } from '../version';

export interface DownloadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export interface UpdaterPluginInterface {
  getAppVersionCode(): Promise<{ versionCode: number; versionName?: string; lastUpdateTime?: number }>;
  downloadAndInstall(options: { url: string }): Promise<{ success: boolean; needsPermission?: boolean; message?: string }>;
  openExternalDownload(options: { url: string }): Promise<{ success: boolean }>;
}

// Registro del plugin nativo Capacitor con nombre 'UpdaterPlugin'
export const UpdaterPlugin = registerPlugin<UpdaterPluginInterface>('UpdaterPlugin');

export function onDownloadProgress(callback: (progress: DownloadProgress) => void): Promise<{ remove: () => void }> {
  if (Capacitor.isNativePlatform() && typeof (UpdaterPlugin as any).addListener === 'function') {
    return (UpdaterPlugin as any).addListener('downloadProgress', callback);
  }
  return Promise.resolve({ remove: () => {} });
}

/**
 * Obtiene de forma segura el código de versión del APK o el build actual si corre en web
 */
export async function getSafeAppVersionCode(): Promise<{ versionCode: number; versionName: string; lastUpdateTime: number }> {
  if (!Capacitor.isNativePlatform()) {
    return { versionCode: CURRENT_BUILD_NUMBER, versionName: CURRENT_APP_VERSION, lastUpdateTime: 0 };
  }

  try {
    const res = await UpdaterPlugin.getAppVersionCode();
    if (res && typeof res.versionCode === 'number') {
      return {
        versionCode: res.versionCode,
        versionName: res.versionName || CURRENT_APP_VERSION,
        lastUpdateTime: typeof res.lastUpdateTime === 'number' ? res.lastUpdateTime : 0,
      };
    }
    return { versionCode: CURRENT_BUILD_NUMBER, versionName: CURRENT_APP_VERSION, lastUpdateTime: 0 };
  } catch (err) {
    console.warn('[NativeUpdater] UpdaterPlugin no disponible en este entorno nativo, usando buildNumber:', err);
    return { versionCode: CURRENT_BUILD_NUMBER, versionName: CURRENT_APP_VERSION, lastUpdateTime: 0 };
  }
}

/**
 * Descarga e instala la APK usando el instalador nativo si está disponible
 */
export async function downloadAndInstallApk(apkUrl: string): Promise<{ success: boolean; needsPermission?: boolean; message?: string }> {
  if (!apkUrl) {
    throw new Error('No se especificó la URL de descarga del APK');
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const res = await UpdaterPlugin.downloadAndInstall({ url: apkUrl });
      if (res?.needsPermission) {
        return {
          success: false,
          needsPermission: true,
          message: res.message || "Activa 'Permitir desde esta fuente' en Ajustes y vuelve a tocar 'Instalar actualización'.",
        };
      }
      return {
        success: res?.success ?? true,
        needsPermission: false,
        message: res?.message || 'Instalador abierto con éxito',
      };
    } catch (nativeErr: any) {
      console.error('[NativeUpdater] Error en UpdaterPlugin nativo:', nativeErr);
      throw new Error(nativeErr?.message || 'No se pudo abrir el instalador de Android. Comprueba los permisos.');
    }
  } else {
    throw new Error('La instalación automática directa de APK solo está disponible en la app Android instalada.');
  }
}

/**
 * Abre el enlace directo del APK en el navegador predeterminado como respaldo confiable
 */
export async function openApkInBrowser(apkUrl: string): Promise<void> {
  if (!apkUrl) {
    throw new Error('No hay enlace de descarga disponible');
  }

  if (Capacitor.isNativePlatform()) {
    await UpdaterPlugin.openExternalDownload({ url: apkUrl });
    return;
  }

  const link = document.createElement('a');
  link.href = apkUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
