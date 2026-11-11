/**
 * IndexedDB storage engine for Bóveda Segura.
 * Stores AES-GCM encrypted binary photos, videos, and application files locally.
 */

import { hexToBuf } from '../crypto/vaultCrypto';

export type VaultItemCategory = 'photo' | 'video' | 'audio' | 'app' | 'document';

export function detectCategory(filename: string, mimeType: string): VaultItemCategory {
  const lowerName = filename.toLowerCase();
  const lowerMime = (mimeType || '').toLowerCase();

  if (
    lowerMime.startsWith('video/') ||
    /\.(mp4|webm|mkv|mov|avi|flv|m4v|3gp|wmv|ts)$/i.test(lowerName)
  ) {
    return 'video';
  }

  if (
    lowerMime.startsWith('audio/') ||
    /\.(mp3|wav|ogg|m4a|aac|flac|opus|wma|amr|mid|midi)$/i.test(lowerName)
  ) {
    return 'audio';
  }

  // Documentos: PDF, Word, Excel, PowerPoint, Textos, RTF, Markdown, etc.
  if (
    lowerMime.includes('pdf') ||
    lowerMime.includes('word') ||
    lowerMime.includes('msword') ||
    lowerMime.includes('officedocument') ||
    lowerMime.includes('presentation') ||
    lowerMime.includes('spreadsheet') ||
    lowerMime.includes('excel') ||
    lowerMime.includes('powerpoint') ||
    lowerMime.includes('text/plain') ||
    lowerMime.includes('text/markdown') ||
    lowerMime.includes('text/csv') ||
    lowerMime.startsWith('text/') ||
    /\.(pdf|docx?|xlsx?|pptx?|txt|rtf|md|csv|odt|ods|odp|epub|log)$/i.test(lowerName) ||
    lowerName.startsWith('doc-') ||
    lowerName.includes('document')
  ) {
    return 'document';
  }

  if (
    lowerMime.includes('android.package-archive') ||
    lowerMime.includes('x-msdownload') ||
    lowerMime.includes('zip') ||
    lowerMime.includes('x-zip') ||
    lowerMime.includes('octet-stream') ||
    /\.(apk|exe|msi|dmg|pkg|deb|rpm|ipa|zip|rar|tar|gz|7z|bin|iso|appimage|jar)$/i.test(lowerName)
  ) {
    return 'app';
  }

  if (
    lowerMime.startsWith('image/') ||
    /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif|heic|ico)$/i.test(lowerName)
  ) {
    return 'photo';
  }

  // Fallback para documentos o archivos no reconocidos
  return 'document';
}

export interface EncryptedVaultItem {
  id: string;
  timestamp: number;
  name: string;
  mimeType: string;
  size: number;
  iv: number[];
  data: ArrayBuffer;
  album?: string;
  isFavorite?: boolean;
  category: VaultItemCategory;
  lastModified?: number;
  originalUri?: string;
  deletedAt?: number;
  thumbnailData?: ArrayBuffer;
  thumbnailIv?: number[];
  duration?: number;
}

// Backwards compatibility alias
export type EncryptedPhotoRecord = EncryptedVaultItem;

const DB_NAME = 'SecurePhotoVaultDB';
const STORE_NAME = 'encrypted_photos';
const DB_VERSION = 2;

let dbInstance: IDBDatabase | null = null;

export function openVaultDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

export async function saveEncryptedItem(record: EncryptedVaultItem): Promise<void> {
  return saveEncryptedItems([record]);
}

export async function saveEncryptedItems(records: EncryptedVaultItem[]): Promise<void> {
  if (!records || records.length === 0) return;
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);

    for (const record of records) {
      store.put(record);
    }
  });
}

// Alias for photo saving
export const saveEncryptedPhoto = saveEncryptedItem;

export async function getAllEncryptedItems(includeTrash: boolean = false): Promise<EncryptedVaultItem[]> {
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const all: EncryptedVaultItem[] = (request.result || []).map((raw: any) => {
        const name = raw.name || `item_${raw.id}`;
        const mimeType = raw.mimeType || (raw.category === 'video' ? 'video/mp4' : 'image/jpeg');
        let category: VaultItemCategory = raw.category || detectCategory(name, mimeType);

        // Migración/reclasificación automática: si un archivo previamente se catalogó como 'app' o desconocido,
        // pero detectCategory identifica que es un documento (ej: DOC-..., .pdf, .docx, .txt, etc.), asignarlo a 'document'.
        if (category === 'app' && detectCategory(name, mimeType) === 'document') {
          category = 'document';
        }

        return {
          id: raw.id,
          timestamp: raw.timestamp || Date.now(),
          name,
          mimeType,
          size: raw.size || (raw.data ? raw.data.byteLength : 0),
          iv: raw.iv,
          data: raw.data,
          album: raw.album || 'General',
          isFavorite: !!raw.isFavorite,
          category,
          lastModified: raw.lastModified,
          originalUri: raw.originalUri,
          deletedAt: raw.deletedAt,
        };
      });

      // Filter out items in trash unless explicitly requested
      const results = includeTrash ? all : all.filter((item) => !item.deletedAt);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

// Alias for photos
export const getAllEncryptedPhotos = getAllEncryptedItems;

/**
 * Get all items currently in the Encrypted Trash / Papelera de Reciclaje
 */
export async function getTrashItems(): Promise<EncryptedVaultItem[]> {
  const all = await getAllEncryptedItems(true);
  return all
    .filter((item) => typeof item.deletedAt === 'number' && item.deletedAt > 0)
    .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
}

/**
 * Move a single item to the trash (soft-delete with 30-day countdown)
 */
export async function moveToTrash(id: string): Promise<void> {
  return batchMoveToTrash([id]);
}

/**
 * Move multiple items to the trash
 */
export async function batchMoveToTrash(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const now = Date.now();

    ids.forEach((id) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (getReq.result) {
          store.put({ ...getReq.result, deletedAt: now });
        }
      };
    });

    transaction.oncomplete = () => {
      window.dispatchEvent(new CustomEvent('vault_trash_updated'));
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Restore an item from the trash back to the active vault
 */
export async function restoreFromTrash(id: string): Promise<void> {
  return batchRestoreFromTrash([id]);
}

/**
 * Restore multiple items from trash
 */
export async function batchRestoreFromTrash(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    ids.forEach((id) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (getReq.result) {
          const item = { ...getReq.result };
          delete item.deletedAt;
          store.put(item);
        }
      };
    });

    transaction.oncomplete = () => {
      window.dispatchEvent(new CustomEvent('vault_trash_updated'));
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Empty the entire trash permanently (hard-delete)
 */
export async function emptyTrash(): Promise<number> {
  const trashItems = await getTrashItems();
  if (trashItems.length === 0) return 0;

  const ids = trashItems.map((item) => item.id);
  await deleteMultipleEncryptedItems(ids);
  window.dispatchEvent(new CustomEvent('vault_trash_updated'));
  return ids.length;
}

/**
 * Automatically purge items that have been in the trash for more than maxDays (default 30 days)
 */
export async function autoPurgeTrash(maxDays: number = 30): Promise<number> {
  const trashItems = await getTrashItems();
  const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
  const expiredIds = trashItems
    .filter((item) => item.deletedAt && item.deletedAt < cutoff)
    .map((item) => item.id);

  if (expiredIds.length > 0) {
    await deleteMultipleEncryptedItems(expiredIds);
    window.dispatchEvent(new CustomEvent('vault_trash_updated'));
  }
  return expiredIds.length;
}

/**
 * Get statistics of the encrypted trash
 */
export async function getTrashStats(): Promise<{ count: number; totalBytes: number }> {
  const trash = await getTrashItems();
  let totalBytes = 0;
  trash.forEach((item) => {
    totalBytes += item.size || item.data?.byteLength || 0;
  });
  return {
    count: trash.length,
    totalBytes,
  };
}

export async function getEncryptedItemById(id: string): Promise<EncryptedVaultItem | null> {
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const raw = request.result;
      if (!raw) {
        resolve(null);
        return;
      }
      const name = raw.name || `item_${raw.id}`;
      const mimeType = raw.mimeType || 'image/jpeg';
      const category = raw.category || detectCategory(name, mimeType);

      resolve({
        id: raw.id,
        timestamp: raw.timestamp,
        name,
        mimeType,
        size: raw.size || (raw.data ? raw.data.byteLength : 0),
        iv: raw.iv,
        data: raw.data,
        album: raw.album || 'General',
        isFavorite: !!raw.isFavorite,
        category,
        deletedAt: raw.deletedAt,
      });
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteEncryptedItem(id: string): Promise<void> {
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export const deleteEncryptedPhoto = deleteEncryptedItem;

export async function deleteMultipleEncryptedItems(ids: string[]): Promise<void> {
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    ids.forEach((id) => {
      store.delete(id);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export const deleteMultipleEncryptedPhotos = deleteMultipleEncryptedItems;

export async function updateItemMetadata(
  id: string,
  updates: Partial<Omit<EncryptedVaultItem, 'id' | 'data' | 'iv'>>
): Promise<void> {
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const existing = request.result;
      if (!existing) {
        reject(new Error('Record not found'));
        return;
      }
      const updated = { ...existing, ...updates };
      const putRequest = store.put(updated);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export const updatePhotoMetadata = updateItemMetadata;

export async function batchUpdateAlbum(ids: string[], album: string): Promise<void> {
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    ids.forEach((id) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (getReq.result) {
          store.put({ ...getReq.result, album });
        }
      };
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function batchRenameAlbum(
  category: VaultItemCategory,
  oldAlbum: string,
  newAlbum: string
): Promise<void> {
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const item: EncryptedVaultItem = cursor.value;
        const currentAlbum = item.album || 'General';
        if (item.category === category && currentAlbum === oldAlbum) {
          cursor.update({ ...item, album: newAlbum });
        }
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function clearVaultDatabase(): Promise<void> {
  const db = await openVaultDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export interface VaultCategoryStat {
  id: VaultItemCategory;
  label: string;
  singularDesc: string;
  pluralDesc: string;
  count: number;
  bytes: number;
  dotColor: string;
  barColorClass: string;
}

export const VAULT_CATEGORIES_ORDER: VaultItemCategory[] = [
  'photo',
  'video',
  'audio',
  'app',
  'document',
];

export const VAULT_CATEGORY_META: Record<
  VaultItemCategory,
  {
    label: string;
    singularDesc: string;
    pluralDesc: string;
    dotColor: string;
    barColorClass: string;
  }
> = {
  photo: {
    label: 'Fotos',
    singularDesc: 'foto cifrada',
    pluralDesc: 'fotos cifradas',
    dotColor: '#3b82f6',
    barColorClass: 'bg-blue-500',
  },
  video: {
    label: 'Videos',
    singularDesc: 'video cifrado',
    pluralDesc: 'videos cifrados',
    dotColor: '#a855f7',
    barColorClass: 'bg-purple-500',
  },
  audio: {
    label: 'Audios',
    singularDesc: 'audio cifrado',
    pluralDesc: 'audios cifrados',
    dotColor: '#10b981',
    barColorClass: 'bg-emerald-500',
  },
  app: {
    label: 'Aplicaciones',
    singularDesc: 'aplicación protegida',
    pluralDesc: 'aplicaciones protegidas',
    dotColor: '#06b6d4',
    barColorClass: 'bg-cyan-500',
  },
  document: {
    label: 'Documentos',
    singularDesc: 'documento cifrado',
    pluralDesc: 'documentos cifrados',
    dotColor: '#f59e0b',
    barColorClass: 'bg-amber-500',
  },
};

export function calculateVaultCategoryStats(
  items: Array<{
    category?: VaultItemCategory;
    size?: number;
    data?: ArrayBuffer;
    isFavorite?: boolean;
    name?: string;
    mimeType?: string;
  }>
) {
  const countsMap: Record<VaultItemCategory, number> = {
    photo: 0,
    video: 0,
    audio: 0,
    app: 0,
    document: 0,
  };
  const bytesMap: Record<VaultItemCategory, number> = {
    photo: 0,
    video: 0,
    audio: 0,
    app: 0,
    document: 0,
  };
  let favs = 0;
  let totalBytes = 0;

  items.forEach((item) => {
    const sz = item.size || (item.data ? item.data.byteLength : 0) || 0;
    totalBytes += sz;
    const cat: VaultItemCategory =
      item.category && item.category in countsMap
        ? item.category
        : detectCategory(item.name || '', item.mimeType || '');
    countsMap[cat] += 1;
    bytesMap[cat] += sz;
    if (item.isFavorite) favs += 1;
  });

  const categories: VaultCategoryStat[] = VAULT_CATEGORIES_ORDER.map((catId) => ({
    id: catId,
    ...VAULT_CATEGORY_META[catId],
    count: countsMap[catId],
    bytes: bytesMap[catId],
  }));

  return {
    photos: countsMap.photo,
    videos: countsMap.video,
    audios: countsMap.audio,
    apps: countsMap.app,
    documents: countsMap.document,
    favs,
    totalBytes,
    photoBytes: bytesMap.photo,
    videoBytes: bytesMap.video,
    audioBytes: bytesMap.audio,
    appBytes: bytesMap.app,
    documentBytes: bytesMap.document,
    categories,
  };
}

export async function getVaultStats(): Promise<{
  count: number;
  totalBytes: number;
  photoCount: number;
  videoCount: number;
  audioCount: number;
  appCount: number;
  documentCount: number;
  photoBytes: number;
  videoBytes: number;
  audioBytes: number;
  appBytes: number;
  documentBytes: number;
  categories: VaultCategoryStat[];
}> {
  const items = await getAllEncryptedItems();
  const stats = calculateVaultCategoryStats(items);

  return {
    count: items.length,
    totalBytes: stats.totalBytes,
    photoCount: stats.photos,
    videoCount: stats.videos,
    audioCount: stats.audios,
    appCount: stats.apps,
    documentCount: stats.documents,
    photoBytes: stats.photoBytes,
    videoBytes: stats.videoBytes,
    audioBytes: stats.audioBytes,
    appBytes: stats.appBytes,
    documentBytes: stats.documentBytes,
    categories: stats.categories,
  };
}

/**
 * Fast synchronous binary buffer to Base64 conversion with 32KB chunks to prevent stack limits
 */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  try {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    const chunkSize = 0x8000; // 32KB chunks
    for (let i = 0; i < len; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)) as any);
    }
    return btoa(binary);
  } catch (err) {
    console.warn('bufferToBase64 fallback failed:', err);
    return '';
  }
}

/**
 * Creates exportable JSON containing encrypted blobs as Base64 strings.
 * Highly optimized native FileReader-based ArrayBuffer to Base64 conversion with fallback.
 */
async function arrayBufferToBase64Async(buffer: ArrayBuffer | Uint8Array | string | undefined | null): Promise<string> {
  if (!buffer) return '';
  if (typeof buffer === 'string') return buffer;

  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  return new Promise((resolve) => {
    try {
      const blob = new Blob([uint8 as unknown as BlobPart]);
      const reader = new FileReader();

      // Guard timeout in case FileReader hangs on mobile browser
      const timeoutId = setTimeout(() => {
        try {
          resolve(bufferToBase64(uint8));
        } catch {
          resolve('');
        }
      }, 2500);

      reader.onloadend = () => {
        clearTimeout(timeoutId);
        try {
          const dataUrl = reader.result as string;
          if (!dataUrl) {
            resolve(bufferToBase64(uint8));
            return;
          }
          const commaIndex = dataUrl.indexOf(',');
          const base64 = commaIndex > -1 ? dataUrl.substring(commaIndex + 1) : '';
          resolve(base64);
        } catch (e) {
          resolve(bufferToBase64(uint8));
        }
      };

      reader.onerror = () => {
        clearTimeout(timeoutId);
        resolve(bufferToBase64(uint8));
      };

      reader.readAsDataURL(blob);
    } catch (err) {
      try {
        resolve(bufferToBase64(uint8));
      } catch {
        resolve('');
      }
    }
  });
}

/**
 * Fast native conversion from Base64 to ArrayBuffer without fetch data URL memory limits.
 * Uses chunked decoding for large files to avoid V8 mobile heap exhaustion and atob string limits.
 */
function base64ToArrayBuffer(rawBase64: string): ArrayBuffer {
  if (!rawBase64) return new ArrayBuffer(0);
  try {
    let clean = rawBase64;
    const commaIdx = clean.indexOf(',');
    if (commaIdx !== -1) {
      clean = clean.substring(commaIdx + 1);
    }
    clean = clean.replace(/[\r\n\s]/g, '');

    const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
    const totalLen = Math.floor((clean.length * 3) / 4) - padding;
    if (totalLen <= 0) return new ArrayBuffer(0);

    const result = new Uint8Array(totalLen);
    const CHUNK_SIZE = 65536; // 64KB multiple of 4
    let destOffset = 0;

    for (let i = 0; i < clean.length; i += CHUNK_SIZE) {
      const chunkStr = clean.substring(i, Math.min(i + CHUNK_SIZE, clean.length));
      const binChunk = atob(chunkStr);
      for (let j = 0; j < binChunk.length && destOffset < totalLen; j++) {
        result[destOffset++] = binChunk.charCodeAt(j);
      }
    }
    return result.buffer;
  } catch (err) {
    console.error('Error decoding base64:', err);
    return new ArrayBuffer(0);
  }
}

async function base64ToArrayBufferAsync(base64: string): Promise<ArrayBuffer> {
  return base64ToArrayBuffer(base64);
}

function getSafeFolders(cat: string): string[] {
  try {
    const raw = localStorage.getItem(`vault_subfolders_${cat}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(`Error reading subfolders for ${cat}:`, e);
  }
  return ['General'];
}

/**
 * Exports all encrypted items and cryptographic salt to a Blob in streaming chunks
 */
export async function exportEncryptedBackupBlob(
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const db = await openVaultDatabase();
  const blobParts: BlobPart[] = [];

  const saltHex = localStorage.getItem('vault_salt') || '';
  const testIvHex = localStorage.getItem('vault_test_iv') || '';
  const testCipherHex = localStorage.getItem('vault_test_cipher') || '';
  const customFolders = {
    photo: getSafeFolders('photo'),
    video: getSafeFolders('video'),
    audio: getSafeFolders('audio'),
    app: getSafeFolders('app'),
  };

  blobParts.push('{\n');
  blobParts.push('  "version": 3,\n');
  blobParts.push('  "appName": "Bóveda Segura - Fotos, Videos y Apps",\n');
  blobParts.push(`  "exportedAt": ${JSON.stringify(new Date().toISOString())},\n`);
  blobParts.push(`  "saltHex": ${JSON.stringify(saltHex)},\n`);
  blobParts.push(`  "testIvHex": ${JSON.stringify(testIvHex)},\n`);
  blobParts.push(`  "testCipherHex": ${JSON.stringify(testCipherHex)},\n`);
  blobParts.push(`  "customFolders": ${JSON.stringify(customFolders)},\n`);
  blobParts.push('  "items": [\n');

  // Pre-flight key list query (uses very little memory)
  const keys = await new Promise<IDBValidKey[]>((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const req = store.getAllKeys();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });

  let firstItem = true;
  const totalCount = keys.length;

  // Process and stringify each item sequentially, opening fresh small transactions
  for (let i = 0; i < totalCount; i++) {
    const id = keys[i];

    if (onProgress) {
      onProgress(i + 1, totalCount);
    }

    const raw = await new Promise<any>((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    if (!raw) continue;

    try {
      const name = raw.name || `item_${raw.id}`;
      const mimeType = raw.mimeType || (raw.category === 'video' ? 'video/mp4' : 'image/jpeg');
      const category = raw.category || detectCategory(name, mimeType);

      // Memory-efficient native base64 conversion
      const base64Data = raw.data ? await arrayBufferToBase64Async(raw.data) : '';
      
      // IMMEDIATELY dereference raw.data to free binary memory from V8 heap
      raw.data = null;

      const itemObj = {
        id: raw.id,
        timestamp: raw.timestamp || Date.now(),
        name,
        mimeType,
        size: raw.size || 0,
        iv: Array.isArray(raw.iv) ? raw.iv : (raw.iv ? Array.from(raw.iv) : []),
        base64Data,
        album: raw.album || 'General',
        isFavorite: !!raw.isFavorite,
        category,
      };

      if (!firstItem) {
        blobParts.push(',\n');
      }
      blobParts.push('    ' + JSON.stringify(itemObj));
      firstItem = false;
    } catch (err) {
      console.error('Error exporting item details:', err);
    }

    // Force full yield to event loop and Garbage Collection between files
    await new Promise((r) => setTimeout(r, 30));
  }

  blobParts.push('\n  ]\n}');

  return new Blob(blobParts, { type: 'application/json' });
}

export async function exportEncryptedBackup(): Promise<string> {
  const blob = await exportEncryptedBackupBlob();
  return await blob.text();
}

/**
 * Attempts to repair truncated JSON files if missing closing brackets
 */
export function parseWithAutoRepair(jsonStr: string): any {
  let trimmed = jsonStr.trim();
  if (!trimmed) {
    throw new Error('El archivo de copia de seguridad está completamente vacío');
  }

  // Strip Byte Order Mark (BOM) if present
  if (trimmed.charCodeAt(0) === 0xFEFF) {
    trimmed = trimmed.slice(1);
  }
  // Strip trailing null characters and spaces
  trimmed = trimmed.replace(/\0+$/, '').trim();

  // Try direct parse first in case it was just padded
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    console.warn('Initial parse in auto-repair failed, attempting structural repair:', err);
  }

  // Bracket balancing scan ignoring string literals and escapes
  let inString = false;
  let escape = false;
  const stack: ('{' | '[')[] = [];

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') {
        stack.push('{');
      } else if (char === '[') {
        stack.push('[');
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }
  }

  // Find the last complete item ending with '}'
  const lastItemEnd = trimmed.lastIndexOf('}');
  if (lastItemEnd > 0) {
    let repaired = trimmed.substring(0, lastItemEnd + 1).trim();
    if (repaired.endsWith(',')) {
      repaired = repaired.slice(0, -1).trim();
    }

    // Now balance the stack for this repaired prefix
    const prefixStack: ('{' | '[')[] = [];
    inString = false;
    escape = false;
    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      if (escape) { escape = false; continue; }
      if (char === '\\') { escape = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      if (!inString) {
        if (char === '{') prefixStack.push('{');
        else if (char === '[') prefixStack.push('[');
        else if (char === '}') { if (prefixStack[prefixStack.length - 1] === '{') prefixStack.pop(); }
        else if (char === ']') { if (prefixStack[prefixStack.length - 1] === '[') prefixStack.pop(); }
      }
    }

    // Close open structures in reverse order
    while (prefixStack.length > 0) {
      const openToken = prefixStack.pop();
      if (openToken === '{') {
        repaired += '\n}';
      } else if (openToken === '[') {
        repaired += '\n  ]';
      }
    }

    try {
      return JSON.parse(repaired);
    } catch (err2: any) {
      console.error('Failed auto-repaired JSON parse:', err2);
      throw new Error(`El archivo de copia de seguridad está dañado: ${err2?.message || 'Unexpected end of JSON input'}`);
    }
  }

  throw new Error('El archivo de copia de seguridad está dañado o incompleto (Unexpected end of JSON input)');
}

export interface BackupHeaderInfo {
  saltHex?: string;
  testIvHex?: string;
  testCipherHex?: string;
  customFolders?: any;
  hasItems: boolean;
}

/**
 * Rapidly reads only the first ~512KB of the backup file to inspect header and cryptographic tokens,
 * without loading the rest of a multi-hundred-megabyte file into memory.
 */
export async function readBackupHeaderFromBlob(blob: Blob): Promise<BackupHeaderInfo> {
  const headerSlice = blob.slice(0, Math.min(blob.size, 512 * 1024));
  const headerText = await headerSlice.text();

  const saltMatch = headerText.match(/"saltHex"\s*:\s*"([a-fA-F0-9]+)"/);
  const ivMatch = headerText.match(/"testIvHex"\s*:\s*"([a-fA-F0-9]+)"/);
  const cipherMatch = headerText.match(/"testCipherHex"\s*:\s*"([a-fA-F0-9]+)"/);

  let customFolders: any = null;
  const foldersMatch = headerText.match(/"customFolders"\s*:\s*(\{.+?\})/s);
  if (foldersMatch) {
    try {
      customFolders = JSON.parse(foldersMatch[1]);
    } catch {}
  }

  const hasItems = /"items"\s*:\s*\[|"photos"\s*:\s*\[|"data"\s*:\s*\[|"records"\s*:\s*\[|^\s*\[/m.test(headerText);

  return {
    saltHex: saltMatch?.[1],
    testIvHex: ivMatch?.[1],
    testCipherHex: cipherMatch?.[1],
    customFolders,
    hasItems,
  };
}

async function saveItemsBatch(db: IDBDatabase, records: EncryptedVaultItem[]): Promise<void> {
  if (records.length === 0) return;
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const rec of records) {
        store.put(rec);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Error al escribir registros en IndexedDB'));
      tx.onabort = () => reject(new Error('Transacción abortada'));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Streams and restores encrypted items directly from a Blob or File of ANY size (e.g. 548MB+)
 * using a memory-constant chunked JSON object parser. It processes items one-by-one, saves
 * each to IndexedDB, and releases memory immediately, avoiding V8 string length limits and mobile crashes.
 */
export async function importEncryptedBackupBlobStream(
  blob: Blob,
  onProgress?: (loadedBytes: number, totalBytes: number, itemCount: number) => void,
  overwriteCryptographicTokens: boolean = true
): Promise<{ importedCount: number; saltHex?: string; testIvHex?: string; testCipherHex?: string }> {
  // First, verify header tokens if present
  const header = await readBackupHeaderFromBlob(blob);

  if (header.saltHex && header.testIvHex && header.testCipherHex) {
    if (overwriteCryptographicTokens || !localStorage.getItem('vault_salt')) {
      localStorage.setItem('vault_salt', header.saltHex);
      localStorage.setItem('vault_test_iv', header.testIvHex);
      localStorage.setItem('vault_test_cipher', header.testCipherHex);
      localStorage.setItem('vault_initialized', 'true');
    }
  }

  if (header.customFolders) {
    try {
      if (Array.isArray(header.customFolders.photo)) localStorage.setItem('vault_subfolders_photo', JSON.stringify(header.customFolders.photo));
      if (Array.isArray(header.customFolders.video)) localStorage.setItem('vault_subfolders_video', JSON.stringify(header.customFolders.video));
      if (Array.isArray(header.customFolders.audio)) localStorage.setItem('vault_subfolders_audio', JSON.stringify(header.customFolders.audio));
      if (Array.isArray(header.customFolders.app)) localStorage.setItem('vault_subfolders_app', JSON.stringify(header.customFolders.app));
    } catch {}
  }

  const db = await openVaultDatabase();
  let count = 0;
  const totalBytes = blob.size;
  const CHUNK_SIZE = 1024 * 1024 * 4; // 4MB stream slices for high throughput
  let offset = 0;

  let buffer = '';
  let inArray = false;
  let depth = 0;
  let inString = false;
  let escape = false;
  let itemStart = -1;
  let cursor = 0;

  let pendingBatch: EncryptedVaultItem[] = [];
  const decoder = new TextDecoder('utf-8', { fatal: false });

  const parseAndQueueItem = (item: any) => {
    let rawBase64 =
      item.base64Data ||
      item.base64 ||
      item.content ||
      item.dataUrl ||
      item.data_url ||
      item.base64_data ||
      item.fileData ||
      item.file_data ||
      '';
    if (!rawBase64 && typeof item.data === 'string') {
      rawBase64 = item.data;
    }

    let dataBuffer: ArrayBuffer;
    if (item.data instanceof ArrayBuffer) {
      dataBuffer = item.data;
    } else if (rawBase64) {
      dataBuffer = base64ToArrayBuffer(rawBase64);
    } else if (Array.isArray(item.data)) {
      dataBuffer = new Uint8Array(item.data).buffer;
    } else if (item.data && typeof item.data === 'object') {
      if (item.data.type === 'Buffer' && Array.isArray(item.data.data)) {
        dataBuffer = new Uint8Array(item.data.data).buffer;
      } else {
        const values = Object.values(item.data).map(Number);
        dataBuffer = new Uint8Array(values).buffer;
      }
    } else {
      dataBuffer = new ArrayBuffer(0);
    }

    // Auto-generate safe fallback ID and IV
    const id = item.id || `item_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    let iv: number[] = [];
    if (Array.isArray(item.iv)) {
      iv = item.iv;
    } else if (item.iv && typeof item.iv === 'object') {
      iv = Object.values(item.iv).map(Number);
    } else if (typeof item.iv === 'string') {
      if (/^[0-9a-fA-F]+$/.test(item.iv)) {
        iv = Array.from(hexToBuf(item.iv));
      } else {
        try {
          const bin = atob(item.iv);
          iv = Array.from(bin).map((c) => c.charCodeAt(0));
        } catch {}
      }
    }

    const name = item.name || item.fileName || item.filename || item.title || 'archivo_restaurado';
    const mimeType = item.mimeType || item.type || (item.category === 'video' ? 'video/mp4' : 'image/jpeg');
    const category: VaultItemCategory = item.category || detectCategory(name, mimeType);

    const record: EncryptedVaultItem = {
      id,
      timestamp: item.timestamp || Date.now(),
      name,
      mimeType,
      size: item.size || dataBuffer.byteLength,
      iv,
      data: dataBuffer,
      album: item.album || item.folder || item.subfolder || 'General',
      isFavorite: !!item.isFavorite,
      category,
    };

    pendingBatch.push(record);
    count++;
  };

  while (offset < totalBytes || cursor < buffer.length) {
    // Read next slice into buffer if needed
    if (offset < totalBytes && buffer.length - cursor < CHUNK_SIZE) {
      const nextOffset = Math.min(offset + CHUNK_SIZE, totalBytes);
      const slice = blob.slice(offset, nextOffset);
      const chunkText = decoder.decode(await slice.arrayBuffer(), { stream: nextOffset < totalBytes });
      offset = nextOffset;
      buffer += chunkText;
    }

    if (!inArray) {
      const arrayKeyMatches = [
        buffer.indexOf('"items":'),
        buffer.indexOf('"photos":'),
        buffer.indexOf('"files":'),
        buffer.indexOf('"archivos":'),
        buffer.indexOf('"data":'),
        buffer.indexOf('"records":'),
        buffer.indexOf('"media":'),
        buffer.indexOf('"elements":'),
        buffer.indexOf('"elementos":'),
      ].filter((idx) => idx !== -1);

      if (arrayKeyMatches.length > 0) {
        const earliestKeyIdx = Math.min(...arrayKeyMatches);
        const arrIdx = buffer.indexOf('[', earliestKeyIdx);
        if (arrIdx !== -1) {
          buffer = buffer.substring(arrIdx + 1);
          cursor = 0;
          inArray = true;
        } else {
          if (offset >= totalBytes) break;
          cursor = buffer.length;
        }
      } else {
        const arrIdx = buffer.indexOf('[');
        if (arrIdx !== -1 && !buffer.slice(0, arrIdx).includes('{')) {
          buffer = buffer.substring(arrIdx + 1);
          cursor = 0;
          inArray = true;
        } else {
          if (offset >= totalBytes) break;
          cursor = buffer.length;
        }
      }
    }

    if (inArray) {
      while (cursor < buffer.length) {
        const c = buffer[cursor];
        if (escape) {
          escape = false;
          cursor++;
          continue;
        }
        if (c === '\\') {
          escape = true;
          cursor++;
          continue;
        }
        if (c === '"') {
          inString = !inString;
          cursor++;
          continue;
        }
        if (!inString) {
          if (c === '{') {
            if (depth === 0) itemStart = cursor;
            depth++;
          } else if (c === '}') {
            depth--;
            if (depth === 0 && itemStart !== -1) {
              const itemJson = buffer.substring(itemStart, cursor + 1);
              try {
                const item = JSON.parse(itemJson);
                parseAndQueueItem(item);

                if (pendingBatch.length >= 10) {
                  await saveItemsBatch(db, pendingBatch);
                  pendingBatch = [];
                }
              } catch (parseErr) {
                console.warn('Skipping malformed item in stream:', parseErr);
              }

              // Discard parsed object from buffer immediately to free memory
              buffer = buffer.substring(cursor + 1);
              cursor = 0;
              itemStart = -1;
              continue;
            }
          } else if (c === ']' && depth === 0) {
            // End of items array reached
            buffer = '';
            offset = totalBytes;
            break;
          }
        }
        cursor++;
      }
    }

    if (onProgress) {
      onProgress(offset, totalBytes, count);
    }

    // If offset has reached totalBytes and no item is currently being read, we can finish
    if (offset >= totalBytes && itemStart === -1 && (!inArray || cursor >= buffer.length)) {
      break;
    }

    // Cooperative yield to keep UI responsive
    await new Promise((r) => setTimeout(r, 0));
  }

  // Save any remaining items in pendingBatch
  if (pendingBatch.length > 0) {
    await saveItemsBatch(db, pendingBatch);
    pendingBatch = [];
  }

  // Fallback for smaller files or unconventional JSON layout if stream found 0 items
  if (count === 0 && blob.size < 30 * 1024 * 1024) {
    try {
      const fullText = await blob.text();
      const parsed = parseWithAutoRepair(fullText);
      const itemsList =
        (Array.isArray(parsed) && parsed) ||
        (Array.isArray(parsed.items) && parsed.items) ||
        (Array.isArray(parsed.photos) && parsed.photos) ||
        (Array.isArray(parsed.files) && parsed.files) ||
        (Array.isArray(parsed.archivos) && parsed.archivos) ||
        (Array.isArray(parsed.data) && parsed.data) ||
        (Array.isArray(parsed.records) && parsed.records) ||
        (Array.isArray(parsed.media) && parsed.media) ||
        [];

      if (parsed && typeof parsed === 'object') {
        if (parsed.saltHex && parsed.testIvHex && parsed.testCipherHex) {
          header.saltHex = header.saltHex || parsed.saltHex;
          header.testIvHex = header.testIvHex || parsed.testIvHex;
          header.testCipherHex = header.testCipherHex || parsed.testCipherHex;
        }
      }
      if (itemsList.length > 0) {
        for (const it of itemsList) {
          parseAndQueueItem(it);
          if (pendingBatch.length >= 10) {
            await saveItemsBatch(db, pendingBatch);
            pendingBatch = [];
          }
        }
        if (pendingBatch.length > 0) {
          await saveItemsBatch(db, pendingBatch);
          pendingBatch = [];
        }
      }
    } catch (fbErr) {
      console.warn('Fallback full parse attempt error:', fbErr);
    }
  }

  if (header.saltHex && header.testIvHex && header.testCipherHex) {
    if (overwriteCryptographicTokens || !localStorage.getItem('vault_salt')) {
      localStorage.setItem('vault_salt', header.saltHex);
      localStorage.setItem('vault_test_iv', header.testIvHex);
      localStorage.setItem('vault_test_cipher', header.testCipherHex);
      localStorage.setItem('vault_initialized', 'true');
    }
  } else if (count > 0) {
    localStorage.setItem('vault_initialized', 'true');
  }

  if (onProgress) {
    onProgress(totalBytes, totalBytes, count);
  }

  return {
    importedCount: count,
    saltHex: header.saltHex,
    testIvHex: header.testIvHex,
    testCipherHex: header.testCipherHex,
  };
}

/**
 * Restores items and optional cryptographic tokens from a backup file (compatibility wrapper)
 */
export async function importEncryptedBackup(
  jsonContent: string,
  onProgress?: (current: number, total: number) => void,
  overwriteCryptographicTokens: boolean = false
): Promise<{ importedCount: number }> {
  const blob = new Blob([jsonContent], { type: 'application/json' });
  return importEncryptedBackupBlobStream(
    blob,
    (loaded, total, count) => {
      if (onProgress) onProgress(count, count);
    },
    overwriteCryptographicTokens
  );
}
