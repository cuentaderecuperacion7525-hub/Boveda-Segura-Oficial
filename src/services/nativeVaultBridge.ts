import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NativeMediaItemIdentifier {
  filename: string;
  size?: number;
  lastModified?: number;
  mimeType?: string;
  uri?: string;
}

export interface NativeVaultMediaPlugin {
  /**
   * Elimina un archivo multimedia de la galería pública usando MediaStore en Android
   */
  deleteFromGallery(options: {
    uri?: string;
    filename?: string;
    size?: number;
    lastModified?: number;
  }): Promise<{ success: boolean; message?: string }>;

  /**
   * Elimina por lotes un conjunto de archivos multimedia de la galería pública usando un único
   * diálogo del sistema en Android 11+ (MediaStore.createDeleteRequest).
   */
  deleteBatchFromGallery(options: {
    items: NativeMediaItemIdentifier[];
  }): Promise<{
    success: boolean;
    requested?: boolean;
    confirmedByUser?: boolean;
    matchedCount?: number;
    deletedCount?: number;
    message?: string;
    error?: string;
  }>;

  /**
   * Abre la aplicación nativa de Galería del dispositivo
   */
  openGalleryApp(): Promise<{ success: boolean; error?: string }>;

  /**
   * Guarda y restaura un archivo multimedia o documento en el almacenamiento público del dispositivo / galería (MediaStore)
   */
  exportMediaToDevice(options: {
    base64Data: string;
    filename: string;
    mimeType?: string;
    category?: string;
  }): Promise<{ success: boolean; uri?: string; path?: string; message?: string }>;

  /**
   * Guarda una copia de seguridad (.json) directamente en la carpeta pública "Descargas" (Downloads) del teléfono
   */
  saveBackupToDownloads(options: {
    base64Data: string;
    filename: string;
    mimeType?: string;
  }): Promise<{ success: boolean; path?: string; folder?: string; filename?: string; message?: string }>;

  /**
   * Escribe la copia de seguridad por bloques (chunks) para evitar cualquier riesgo de Out-Of-Memory (OOM)
   */
  appendBackupChunk(options: {
    sessionKey: string;
    chunk: string;
    isFirst: boolean;
    isLast: boolean;
    filename: string;
    mimeType?: string;
  }): Promise<{ success: boolean; progress?: boolean; path?: string; folder?: string; filename?: string; message?: string }>;
}

export interface NativeVaultSecurityPlugin {
  enableScreenshotBlock(): Promise<{ success: boolean }>;
  disableScreenshotBlock(): Promise<{ success: boolean }>;
  setSystemBarsTheme(options: { isDark: boolean }): Promise<{ success: boolean }>;
  getRealDeviceStorage(): Promise<{
    success: boolean;
    freeBytes?: number;
    totalBytes?: number;
    usedBytes?: number;
    error?: string;
  }>;
}

// Registro del plugin nativo de Capacitor (se enlaza en Android con VaultMediaPlugin.java)
export const NativeVaultMedia = registerPlugin<NativeVaultMediaPlugin>('VaultMedia');

// Registro del plugin nativo de seguridad y hardware
export const NativeVaultSecurity = registerPlugin<NativeVaultSecurityPlugin>('VaultSecurity');

/**
 * Consulta el almacenamiento físico real del dispositivo (Android StatFs o Web Estimate)
 */
export const getNativeDeviceStorage = async (): Promise<{
  quota: number;
  usage: number;
  free: number;
} | null> => {
  if (isNativeApp()) {
    try {
      const res = await NativeVaultSecurity.getRealDeviceStorage();
      if (res && res.success && res.totalBytes && res.totalBytes > 0) {
        return {
          quota: res.totalBytes,
          usage: res.usedBytes || 0,
          free: res.freeBytes || 0,
        };
      }
    } catch (e) {
      console.warn('Native getRealDeviceStorage failed, fallback to web:', e);
    }
  }

  // Fallback web
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      const quota = est.quota || 0;
      const usage = est.usage || 0;
      const free = Math.max(0, quota - usage);
      return { quota, usage, free };
    } catch {}
  }
  return null;
};

/**
 * Retorna true si la app se está ejecutando como un APK nativo en Android o iOS
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Abre la app nativa de galería de fotos de Android o iOS de manera directa
 */
export const openNativeGallery = async (): Promise<boolean> => {
  if (isNativeApp()) {
    try {
      const res = await NativeVaultMedia.openGalleryApp();
      if (res && res.success) return true;
    } catch (e) {
      console.warn('Could not launch gallery via native plugin:', e);
    }
  }

  try {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      // Intent standard de Android para ver la Galería multimedia
      window.location.href = 'intent:#Intent;action=android.intent.action.VIEW;type=image/*;end';
    } else {
      window.open('photos-redirect://', '_blank');
    }
  } catch {}
  return true;
};

/**
 * Abre el explorador de archivos / gestor de descargas en Android
 */
export const openNativeFileManager = async (): Promise<boolean> => {
  try {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      // Abre el gestor de archivos / descargas de Android
      window.location.href = 'intent:#Intent;action=android.intent.action.GET_CONTENT;type=*/*;category=android.intent.category.OPENABLE;end';
    } else {
      window.open('shareddocuments://', '_blank');
    }
  } catch {}
  return true;
};

/**
 * Función unificada para borrar un archivo individual de la galería pública.
 */
export const requestNativeGalleryDeletion = async (
  filename: string,
  uri?: string,
  size?: number,
  lastModified?: number
): Promise<{ handledNatively: boolean; success: boolean }> => {
  if (!isNativeApp()) {
    return { handledNatively: false, success: false };
  }

  try {
    (window as any).__isPickingFile = true;
    (window as any).__filePickingStartTime = Date.now();
    const result = await NativeVaultMedia.deleteFromGallery({ uri, filename, size, lastModified });
    return { handledNatively: true, success: result.success };
  } catch (error) {
    console.warn('Native deletion not handled or rejected by user:', error);
    return { handledNatively: true, success: false };
  }
};

/**
 * Función por lotes para borrar múltiples archivos originales con un solo diálogo nativo.
 */
export const requestNativeBatchGalleryDeletion = async (
  items: NativeMediaItemIdentifier[]
): Promise<{ handledNatively: boolean; success: boolean; requested?: boolean }> => {
  if (!isNativeApp() || !items || items.length === 0) {
    return { handledNatively: false, success: false };
  }

  // 1. Intento por lote único
  try {
    (window as any).__isPickingFile = true;
    (window as any).__filePickingStartTime = Date.now();
    const result = await NativeVaultMedia.deleteBatchFromGallery({ items });
    if (result && (result.requested || result.success)) {
      return {
        handledNatively: true,
        success: result.success,
        requested: true,
      };
    }
  } catch (error) {
    console.warn('Native batch deletion error, trying single fallback:', error);
  }

  // 2. Fallback de respaldo: si el borrado por lote no fue ejecutado por el sistema,
  // intentar solicitar eliminación individual para cada archivo (el método que sí funciona en Android)
  try {
    let anyHandled = false;
    for (const item of items) {
      const res = await NativeVaultMedia.deleteFromGallery({
        filename: item.filename,
        uri: item.uri,
        size: item.size,
        lastModified: item.lastModified,
      });
      if (res && res.success) {
        anyHandled = true;
      }
    }
    if (anyHandled) {
      return { handledNatively: true, success: true, requested: true };
    }
  } catch (err) {
    console.warn('Fallback individual deletion error:', err);
  }

  return { handledNatively: false, success: false };
};

/**
 * Convierte un Blob a cadena base64 limpia (sin prefijo data URI)
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = (reader.result as string) || '';
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Guarda y restaura un archivo de la bóveda en la galería nativa de Android o almacenamiento del teléfono.
 * En la web, descarga el archivo directamente.
 */
export const exportVaultItemToDevice = async (item: {
  blobUrl: string;
  filename: string;
  mimeType?: string;
  category?: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(item.blobUrl);
    const blob = await res.blob();
    const effectiveMime = item.mimeType || blob.type || 'application/octet-stream';

    if (isNativeApp()) {
      try {
        const base64Data = await blobToBase64(blob);
        const nativeRes = await NativeVaultMedia.exportMediaToDevice({
          base64Data,
          filename: item.filename,
          mimeType: effectiveMime,
          category: item.category || 'photo',
        });
        if (nativeRes && nativeRes.success) {
          return { success: true };
        }
      } catch (nativeErr: any) {
        console.warn('Native export failed, attempting web download fallback:', nativeErr);
      }
    }

    // Web / Fallback standard download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }, 60000);

    return { success: true };
  } catch (err: any) {
    console.error('Error in exportVaultItemToDevice:', err);
    return { success: false, error: err?.message || 'Error al exportar archivo' };
  }
};

