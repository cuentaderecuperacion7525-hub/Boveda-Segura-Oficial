import { Capacitor, registerPlugin } from '@capacitor/core';
import { CURRENT_BUILD_NUMBER, CURRENT_APP_VERSION } from '../version';

export interface DownloadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export interface UpdaterPluginInterface {
  getAppVersionCode(): Promise<{ versionCode: number; versionName?: string }>;
  downloadAndInstall(options: { url: string }): Promise<{ success: boolean; message?: string }>;
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
export async function getSafeAppVersionCode(): Promise<{ versionCode: number; versionName: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { versionCode: CURRENT_BUILD_NUMBER, versionName: CURRENT_APP_VERSION };
  }

  try {
    const res = await UpdaterPlugin.getAppVersionCode();
    if (res && typeof res.versionCode === 'number') {
      return {
        versionCode: res.versionCode,
        versionName: res.versionName || CURRENT_APP_VERSION
      };
    }
    return { versionCode: CURRENT_BUILD_NUMBER, versionName: CURRENT_APP_VERSION };
  } catch (err) {
    console.warn('[NativeUpdater] UpdaterPlugin no disponible en este entorno nativo, usando buildNumber:', err);
    return { versionCode: CURRENT_BUILD_NUMBER, versionName: CURRENT_APP_VERSION };
  }
}

/**
 * Descarga e instala la APK usando el instalador nativo si está disponible,
 * o redirige al enlace de descarga si está en el navegador
 */
export async function downloadAndInstallApk(apkUrl: string): Promise<{ success: boolean; message?: string }> {
  if (!apkUrl) {
    throw new Error('No se especificó la URL de descarga del APK');
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const res = await UpdaterPlugin.downloadAndInstall({ url: apkUrl });
      return { success: true, message: res?.message || 'Instalador abierto con éxito' };
    } catch (nativeErr: any) {
      console.error('[NativeUpdater] Error en UpdaterPlugin nativo:', nativeErr);
      throw new Error(nativeErr?.message || 'No se pudo abrir el instalador de Android. Comprueba los permisos.');
    }
  } else {
    // Entorno Web: no abrir GitHub automáticamente en nueva pestaña si falla
    throw new Error('La instalación automática directa de APK solo está disponible en la app Android instalada.');
  }
}
