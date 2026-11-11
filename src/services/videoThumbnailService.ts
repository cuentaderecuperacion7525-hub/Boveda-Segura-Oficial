/**
 * Servicio para generar y cachear miniaturas (thumbnails) reales de videos.
 * Extrae un fotograma del video en el segundo 0.5 o al inicio mediante un canvas en memoria.
 */

const thumbnailCache = new Map<string, string>();
const durationCache = new Map<string, number>();

/**
 * Genera una miniatura en DataURL o BlobURL a partir de la URL de un video en memoria.
 */
export async function generateVideoThumbnail(
  videoBlobUrl: string,
  cacheKey?: string
): Promise<{ thumbnailUrl: string; duration: number }> {
  if (cacheKey && thumbnailCache.has(cacheKey)) {
    return {
      thumbnailUrl: thumbnailCache.get(cacheKey)!,
      duration: durationCache.get(cacheKey) || 0,
    };
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    (video as any).playsInline = true;
    video.crossOrigin = 'anonymous';

    let isResolved = false;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    const captureFrame = () => {
      if (isResolved) return;
      isResolved = true;

      try {
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (width > 0 && height > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            const duration = video.duration || 0;

            if (cacheKey) {
              thumbnailCache.set(cacheKey, dataUrl);
              durationCache.set(cacheKey, duration);
            }

            cleanup();
            resolve({ thumbnailUrl: dataUrl, duration });
            return;
          }
        }
      } catch (err) {
        console.warn('[VideoThumbnail] Error capturing frame:', err);
      }

      cleanup();
      resolve({ thumbnailUrl: '', duration: video.duration || 0 });
    };

    video.onloadeddata = () => {
      // Intentar adelantar 0.2s para evitar pantallas negras al inicio
      try {
        if (video.duration && video.duration > 0.3) {
          video.currentTime = Math.min(0.5, video.duration / 2);
        } else {
          captureFrame();
        }
      } catch {
        captureFrame();
      }
    };

    video.onseeked = () => {
      captureFrame();
    };

    video.onerror = () => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve({ thumbnailUrl: '', duration: 0 });
      }
    };

    // Timeout de seguridad en caso de códecs no soportados en segundo plano
    setTimeout(() => {
      if (!isResolved) {
        captureFrame();
      }
    }, 2500);

    video.src = videoBlobUrl;
  });
}

/**
 * Establece la miniatura en caché directamente
 */
export function setCachedVideoThumbnail(cacheKey: string, dataUrl: string): void {
  thumbnailCache.set(cacheKey, dataUrl);
}

/**
 * Establece la duración en caché directamente
 */
export function setCachedVideoDuration(cacheKey: string, duration: number): void {
  durationCache.set(cacheKey, duration);
}

/**
 * Obtiene la miniatura en caché si ya existe de forma síncrona
 */
export function getCachedVideoThumbnail(cacheKey: string): string | undefined {
  return thumbnailCache.get(cacheKey);
}

/**
 * Obtiene la duración en caché si ya existe de forma síncrona
 */
export function getCachedVideoDuration(cacheKey: string): number | undefined {
  return durationCache.get(cacheKey);
}
