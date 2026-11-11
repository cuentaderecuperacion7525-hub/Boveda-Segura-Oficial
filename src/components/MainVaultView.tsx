import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Settings,
  ImagePlus,
  Camera,
  Search,
  Heart,
  Trash2,
  Download,
  CheckSquare,
  Cpu,
  UploadCloud,
  LayoutGrid,
  Grid3X3,
  Film,
  Smartphone,
  Image as ImageIcon,
  FolderArchive,
  Layers,
  Play,
  Package,
  X,
  Folder,
  FolderPlus,
  ChevronRight,
  Plus,
  ArrowLeft,
  Edit2,
  Edit3,
  Music,
  FileText,
  Check,
  CheckCircle2,
  Clock,
  Home,
  Video,
  AlertTriangle,
  ShieldAlert,
  Maximize2,
  LayoutList,
  Rows3,
  User,
  Info,
  Moon,
  Sun,
} from 'lucide-react';
import {
  EncryptedVaultItem,
  getAllEncryptedItems,
  saveEncryptedItem,
  saveEncryptedItems,
  deleteEncryptedItem,
  deleteMultipleEncryptedItems,
  moveToTrash,
  batchMoveToTrash,
  updateItemMetadata,
  batchUpdateAlbum,
  batchRenameAlbum,
  detectCategory,
  VaultItemCategory,
  calculateVaultCategoryStats,
} from '../db/vaultDb';
import {
  encryptBuffer,
  decryptBuffer,
  checkIsUnencryptedMedia,
  deriveKeyFromPin,
  hexToBuf,
} from '../crypto/vaultCrypto';
import { PhotoViewerModal, DecryptedVaultItem } from './PhotoViewerModal';
import { CameraCaptureModal } from './CameraCaptureModal';
import { DeleteGalleryReminderModal } from './DeleteGalleryReminderModal';
import { CreateFolderModal, MoveToFolderModal, RenameFolderModal } from './FolderModals';
import { isNativeApp, requestNativeBatchGalleryDeletion, exportVaultItemToDevice, getNativeDeviceStorage } from '../services/nativeVaultBridge';
import { ImportVaultView } from './ImportVaultView';
import { SecurityVaultView } from './SecurityVaultView';
import { SettingsVaultView } from './SettingsVaultView';
import { ProfileVaultView } from './ProfileVaultView';
import { registerBackHandler, triggerBackAction } from '../services/backButtonService';
import { updateService, UpdateCheckResult } from '../services/updateService';
import { UpdateNotificationBanner } from './UpdateNotificationModal';
import { themeService, VaultTheme } from '../services/themeService';
import { formatSize } from '../utils/formatUtils';
import {
  EXTRA_PIN_FOLDER_NAME,
  isExtraPinAlbum,
  isExtraPinConfigured,
} from '../services/extraPinFolderService';
import { ExtraPinModal } from './ExtraPinModal';
import {
  generateVideoThumbnail,
  getCachedVideoThumbnail,
  getCachedVideoDuration,
  setCachedVideoThumbnail,
  setCachedVideoDuration,
} from '../services/videoThumbnailService';

export interface Carpeta {
  id: string;
  nombre: string;
}

export interface ArchivoCifrado {
  id: string;
  nombre: string;
  tipo: string;
  carpetaId: string;
}

/**
 * Componente para renderizar la miniatura real extraída de un video con badge de duración
 */
const VideoThumbnailCard: React.FC<{
  item: DecryptedVaultItem;
  aspectMode: 'real' | 'square';
  masterKey?: CryptoKey;
}> = ({ item, masterKey }) => {
  const [thumbUrl, setThumbUrl] = useState<string>(
    () => item.thumbnailUrl || getCachedVideoThumbnail(item.id) || ''
  );
  const [durationStr, setDurationStr] = useState<string>(() => {
    const d = item.duration || item.record.duration || getCachedVideoDuration(item.id) || 0;
    if (d > 0) {
      const m = Math.floor(d / 60);
      const s = Math.floor(d % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return '';
  });

  useEffect(() => {
    let isMounted = true;
    const cached = item.thumbnailUrl || getCachedVideoThumbnail(item.id);
    const cachedDur = item.duration || item.record.duration || getCachedVideoDuration(item.id) || 0;
    if (cached) {
      setThumbUrl(cached);
      if (cachedDur > 0) {
        const m = Math.floor(cachedDur / 60);
        const s = Math.floor(cachedDur % 60);
        setDurationStr(`${m}:${s.toString().padStart(2, '0')}`);
        return;
      }
    }

    generateVideoThumbnail(item.blobUrl, item.id)
      .then(async (res) => {
        if (!isMounted) return;
        if (res.thumbnailUrl) {
          setThumbUrl(res.thumbnailUrl);
        }
        if (res.duration > 0) {
          const m = Math.floor(res.duration / 60);
          const s = Math.floor(res.duration % 60);
          setDurationStr(`${m}:${s.toString().padStart(2, '0')}`);
        }
        // Guardar miniatura cifrada en IndexedDB para no regenerarla cada vez
        if (
          res.thumbnailUrl &&
          masterKey &&
          !item.record.thumbnailData &&
          sessionStorage.getItem('vault_is_duress_mode') !== 'true'
        ) {
          try {
            const encoder = new TextEncoder();
            const thumbBytes = encoder.encode(res.thumbnailUrl);
            const encThumb = await encryptBuffer(thumbBytes.buffer, masterKey);
            const updatedRec: EncryptedVaultItem = {
              ...item.record,
              thumbnailData: encThumb.data,
              thumbnailIv: encThumb.iv,
              duration: res.duration || item.record.duration || 0,
            };
            item.record.thumbnailData = encThumb.data;
            item.record.thumbnailIv = encThumb.iv;
            item.record.duration = updatedRec.duration;
            await saveEncryptedItem(updatedRec);
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [item.id, item.blobUrl, masterKey]);

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative pointer-events-none overflow-hidden rounded-2xl">
      {thumbUrl ? (
        <img
          src={thumbUrl}
          alt={item.record.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
          loading="lazy"
        />
      ) : (
        <video
          src={item.blobUrl}
          preload="metadata"
          className="w-full h-full object-cover opacity-75 group-hover:opacity-95 transition-opacity"
        />
      )}

      {/* Botón sutil de Play en el centro */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
          <Play className="w-4 h-4 fill-white ml-0.5" />
        </div>
      </div>

      {/* Badge de tipo VIDEO superior izquierdo */}
      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-purple-300 flex items-center gap-1 shadow-md">
        <Film className="w-3 h-3" />
        <span>VIDEO</span>
      </div>

      {/* Badge de duración inferior derecho si está disponible */}
      {durationStr && (
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono font-medium text-slate-200 shadow-md">
          {durationStr}
        </div>
      )}
    </div>
  );
};

interface MainVaultViewProps {
  masterKey: CryptoKey;
  sessionPin?: string | null;
  onLock: () => void;
  onOpenSettings: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'alert' | 'error') => void;
  refreshTrigger?: number;
  autoLockMinutes?: number;
  onAutoLockChange?: (mins: number) => void;
  lockOnTabSwitch?: boolean;
  onLockOnTabSwitchChange?: (enabled: boolean) => void;
  onMasterKeyUpdated?: (newKey: CryptoKey, newPin?: string) => void;
  onResetVault?: () => void;
  hasUpdatePending?: boolean;
}

export const MainVaultView: React.FC<MainVaultViewProps> = ({
  masterKey,
  sessionPin,
  onLock,
  onOpenSettings,
  showToast,
  refreshTrigger = 0,
  autoLockMinutes = 5,
  onAutoLockChange,
  lockOnTabSwitch = true,
  onLockOnTabSwitchChange,
  onMasterKeyUpdated,
  onResetVault,
  hasUpdatePending = false,
}) => {
  const [pendingUpdateInfo, setPendingUpdateInfo] = useState<UpdateCheckResult | null>(() => {
    const cached = updateService.getLastCheckResult();
    return cached?.hasUpdate ? cached : null;
  });
  const [showUpdateBanner, setShowUpdateBanner] = useState<boolean>(() => {
    const cached = updateService.getLastCheckResult();
    if (!cached?.hasUpdate) return false;
    return !updateService.isUpdateDismissed(cached.latestVersion);
  });
  const [liveUpdateAvailable, setLiveUpdateAvailable] = useState<boolean>(() => {
    return updateService.getLastCheckResult()?.hasUpdate || false;
  });

  useEffect(() => {
    return updateService.subscribe((res) => {
      setLiveUpdateAvailable(res.hasUpdate);
      if (res.hasUpdate) {
        setPendingUpdateInfo(res);
        if (!updateService.isUpdateDismissed(res.latestVersion)) {
          setShowUpdateBanner(true);
        }
      } else {
        setPendingUpdateInfo(null);
        setShowUpdateBanner(false);
      }
    });
  }, []);

  const [items, setItems] = useState<DecryptedVaultItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'photo' | 'video' | 'audio' | 'app' | 'document' | 'favorites'>('all');
  const [activeNavTab, setActiveNavTab] = useState<'vault' | 'import' | 'security' | 'profile' | 'settings'>('vault');
  const [activeCategory, setActiveCategory] = useState<VaultItemCategory | null>(null);
  const [lastAccessTime] = useState<string>(() => {
    return localStorage.getItem('nullvault_last_access') || '21:14';
  });
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(3);
  const [appSourceTab, setAppSourceTab] = useState<'installed' | 'packages'>('installed');
  const [aspectMode, setAspectMode] = useState<'real' | 'square'>(() => {
    return (localStorage.getItem('vault_aspect_mode') as 'real' | 'square') || 'real';
  });

  // Formato de vista de categorías: 'grid' (cuadrícula 2x2) o 'line' (en línea / lista estilo imagen 2)
  const [categoryLayout, setCategoryLayout] = useState<'grid' | 'line'>(() => {
    return (localStorage.getItem('vault_category_layout') as 'grid' | 'line') || 'line';
  });

  const handleSetCategoryLayout = (layout: 'grid' | 'line') => {
    setCategoryLayout(layout);
    localStorage.setItem('vault_category_layout', layout);
    showToast(
      layout === 'line'
        ? 'Vista de categorías: En línea'
        : 'Vista de categorías: Cuadrícula',
      'info'
    );
  };

  // Suscripción al tema activo para sincronización instantánea al cambiar de tema
  const [currentTheme, setCurrentTheme] = useState<VaultTheme>(() => themeService.getTheme());
  useEffect(() => {
    return themeService.subscribe((newTheme) => {
      setCurrentTheme(newTheme);
    });
  }, []);

  const toggleAspectMode = () => {
    const next = aspectMode === 'real' ? 'square' : 'real';
    setAspectMode(next);
    localStorage.setItem('vault_aspect_mode', next);
    showToast(next === 'real' ? 'Visualización: Tamaño y proporción real (sin recorte)' : 'Visualización: Cuadrícula cuadrada 1:1', 'info');
  };

  // Recordatorio de copia de seguridad (> 7 días)
  const [backupReminder, setBackupReminder] = useState<{
    show: boolean;
    days: number;
    hasNeverBackedUp: boolean;
  }>(() => {
    const lastBackupTime = Number(
      localStorage.getItem('nullvault_last_backup_timestamp') ||
      localStorage.getItem('vault_last_backup_timestamp') ||
      '0'
    );
    const dismissedUntil = Number(
      localStorage.getItem('nullvault_backup_reminder_dismissed_until') ||
      localStorage.getItem('vault_backup_reminder_dismissed_until') ||
      '0'
    );
    if (Date.now() < dismissedUntil) {
      return { show: false, days: 0, hasNeverBackedUp: false };
    }
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    if (lastBackupTime > 0) {
      const diffMs = Date.now() - lastBackupTime;
      if (diffMs > ONE_WEEK_MS) {
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        return { show: true, days, hasNeverBackedUp: false };
      }
    } else {
      return { show: true, days: 7, hasNeverBackedUp: true };
    }
    return { show: false, days: 0, hasNeverBackedUp: false };
  });

  useEffect(() => {
    const handleBackupUpdated = () => {
      setBackupReminder({ show: false, days: 0, hasNeverBackedUp: false });
    };
    window.addEventListener('vault_backup_updated', handleBackupUpdated);
    window.addEventListener('nullvault_backup_updated', handleBackupUpdated);
    return () => {
      window.removeEventListener('vault_backup_updated', handleBackupUpdated);
      window.removeEventListener('nullvault_backup_updated', handleBackupUpdated);
    };
  }, []);

  const dismissBackupReminder = () => {
    const nextDismiss = (Date.now() + 3 * 24 * 60 * 60 * 1000).toString();
    localStorage.setItem('vault_backup_reminder_dismissed_until', nextDismiss);
    localStorage.setItem('nullvault_backup_reminder_dismissed_until', nextDismiss);
    setBackupReminder({ show: false, days: 0, hasNeverBackedUp: false });
  };

  // Selection mode
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchExportModal, setShowBatchExportModal] = useState<boolean>(false);
  const [isExportingBatch, setIsExportingBatch] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportCurrentIndex, setExportCurrentIndex] = useState<number>(0);
  const [exportTotalCount, setExportTotalCount] = useState<number>(0);
  const [exportCurrentFileName, setExportCurrentFileName] = useState<string>('');
  const [isExportComplete, setIsExportComplete] = useState<boolean>(false);

  // Subfolders / Custom independent folders per category
  const [customFolders, setCustomFolders] = useState<{
    photo: string[];
    video: string[];
    audio: string[];
    app: string[];
    document: string[];
  }>(() => {
    const load = (cat: VaultItemCategory) => {
      try {
        const saved = localStorage.getItem(`vault_subfolders_${cat}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error(e);
      }
      return ['General'];
    };
    return {
      photo: load('photo'),
      video: load('video'),
      audio: load('audio'),
      app: load('app'),
      document: load('document'),
    };
  });

  // Estado para la carpeta activa ('todas' por defecto para mostrar el menú de carpetas)
  const [carpetaActiva, setCarpetaActiva] = useState<string>('todas');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const activeSubfolder = carpetaActiva === 'todas' ? null : carpetaActiva;
  const setActiveSubfolder = (folder: string | null) => {
    setCarpetaActiva(folder === null ? 'todas' : folder);
  };

  // Cerrar y limpiar automáticamente la barra de búsqueda de subcarpeta al volver a la vista general de álbumes
  useEffect(() => {
    if (carpetaActiva === 'todas' || !activeCategory) {
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  }, [carpetaActiva, activeCategory]);
  const [folderToRename, setFolderToRename] = useState<string | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState<boolean>(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState<boolean>(false);
  const [isExtraPinUnlocked, setIsExtraPinUnlocked] = useState<boolean>(false);
  const [showExtraPinModal, setShowExtraPinModal] = useState<boolean>(false);
  const [extraPinConfiguredState, setExtraPinConfiguredState] = useState<boolean>(() =>
    isExtraPinConfigured()
  );

  useEffect(() => {
    const syncExtraPin = () => setExtraPinConfiguredState(isExtraPinConfigured());
    window.addEventListener('vault_extra_pin_updated', syncExtraPin);
    return () => window.removeEventListener('vault_extra_pin_updated', syncExtraPin);
  }, []);

  // Modals
  const [activeViewerItem, setActiveViewerItem] = useState<DecryptedVaultItem | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cameraInitialMode, setCameraInitialMode] = useState<'photo' | 'video'>('photo');
  const [isWhatsAppFabOpen, setIsWhatsAppFabOpen] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState<boolean>(false);
  const [importedCountForReminder, setImportedCountForReminder] = useState<number>(0);
  const [recentImportedItems, setRecentImportedItems] = useState<{ name: string; size: number }[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState<boolean>(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState<boolean>(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggered = useRef<boolean>(false);
  const [encryptingProgress, setEncryptingProgress] = useState<{
    current: number;
    total: number;
    name: string;
  } | null>(null);

  // Hidden file inputs
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const appInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const blobUrlsRef = useRef<string[]>([]);
  const masterKeyRef = useRef<CryptoKey>(masterKey);
  const sessionPinRef = useRef<string | null | undefined>(sessionPin);
  const loadGenRef = useRef<number>(0);

  useEffect(() => {
    masterKeyRef.current = masterKey;
  }, [masterKey]);

  useEffect(() => {
    sessionPinRef.current = sessionPin;
  }, [sessionPin]);

  const handleInternalMasterKeyUpdated = (newKey: CryptoKey, newPin?: string) => {
    masterKeyRef.current = newKey;
    if (newPin) {
      sessionPinRef.current = newPin;
    }
    onMasterKeyUpdated?.(newKey, newPin);
  };

  // Trigger file picker safely preventing premature auto-lock
  const triggerPicker = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    (window as any).__isPickingFile = true;
    (window as any).__filePickingStartTime = Date.now();
    inputRef.current?.click();
  };

  // Revoke all decrypted Blob URLs in RAM immediately when the vault unmounts/locks
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, []);

  // Load and decrypt items into memory
  const loadVaultItems = async (overrideKey?: CryptoKey) => {
    const currentGen = ++loadGenRef.current;
    let activeKey = overrideKey || masterKeyRef.current || masterKey;
    if (overrideKey) {
      masterKeyRef.current = overrideKey;
    }

    setIsLoading(true);
    try {
      // CRITICAL SECURITY ISOLATION: If unlocked with Duress PIN (PIN de Coacción),
      // display a clean empty decoy vault without reading or touching real IndexedDB records!
      if (sessionStorage.getItem('vault_is_duress_mode') === 'true') {
        if (currentGen === loadGenRef.current) {
          blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
          blobUrlsRef.current = [];
          setItems([]);
          setIsLoading(false);
        }
        return;
      }

      const records = await getAllEncryptedItems();
      if (currentGen !== loadGenRef.current) return;
      records.sort((a, b) => b.timestamp - a.timestamp);

      const decryptedItems: DecryptedVaultItem[] = [];
      const newBlobUrls: string[] = [];

      // Lazy candidate key derivation in case vault_salt was updated by a backup restore
      let candidateKeys: CryptoKey[] | null = null;
      const getCandidateKeys = async (): Promise<CryptoKey[]> => {
        if (candidateKeys !== null) return candidateKeys;
        const saltHex = localStorage.getItem('vault_salt');
        const activePin = sessionPinRef.current || sessionPin || sessionStorage.getItem('vault_session_pin');
        if (!saltHex || !activePin) {
          candidateKeys = [];
          return candidateKeys;
        }
        try {
          const salt = hexToBuf(saltHex);
          const k = await deriveKeyFromPin(activePin, salt);
          candidateKeys = [k];
        } catch {
          candidateKeys = [];
        }
        return candidateKeys;
      };

      for (let i = 0; i < records.length; i++) {
        if (currentGen !== loadGenRef.current) {
          newBlobUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }
        const rec = records[i];
        try {
          let decryptedData: ArrayBuffer | null = null;
          const isProbablyUnencrypted = !rec.iv || rec.iv.length === 0 || checkIsUnencryptedMedia(rec.data);

          if (isProbablyUnencrypted) {
            decryptedData = rec.data;
          } else {
            // Attempt 1: active masterKey
            try {
              decryptedData = await decryptBuffer(rec.data, rec.iv, activeKey);
            } catch {
              // Primary key failed
            }

            // Attempt 2: test if raw bytes are unencrypted media with extended file signatures
            if (!decryptedData && checkIsUnencryptedMedia(rec.data)) {
              decryptedData = rec.data;
            }

            // Attempt 3: test candidate key derived from current localStorage vault_salt + sessionPin.
            // IMPORTANT: Do NOT re-encrypt the record in IndexedDB with activeKey here, because if
            // altKey (from current vault_salt) succeeded, the record in IndexedDB is ALREADY encrypted
            // with the authoritative vault_salt key (e.g. right after restoring a backup).
            if (!decryptedData) {
              const altKeys = await getCandidateKeys();
              for (const altKey of altKeys) {
                try {
                  const altDec = await decryptBuffer(rec.data, rec.iv, altKey);
                  if (altDec) {
                    decryptedData = altDec;
                    activeKey = altKey;
                    masterKeyRef.current = altKey;
                    break;
                  }
                } catch {
                  // candidate key did not match
                }
              }
            }
          }

          if (decryptedData) {
            const blob = new Blob([decryptedData], { type: rec.mimeType || 'application/octet-stream' });
            const blobUrl = URL.createObjectURL(blob);
            newBlobUrls.push(blobUrl);

            let thumbnailUrl: string | undefined = getCachedVideoThumbnail(rec.id);
            if (!thumbnailUrl && rec.thumbnailData && rec.thumbnailIv) {
              try {
                const thumbBuf = await decryptBuffer(rec.thumbnailData, rec.thumbnailIv, activeKey);
                const decoder = new TextDecoder();
                const dataUrl = decoder.decode(thumbBuf);
                if (dataUrl.startsWith('data:image/')) {
                  thumbnailUrl = dataUrl;
                  setCachedVideoThumbnail(rec.id, dataUrl);
                }
              } catch {}
            }
            if (rec.duration && rec.duration > 0) {
              setCachedVideoDuration(rec.id, rec.duration);
            }

            decryptedItems.push({
              id: rec.id,
              blobUrl,
              record: rec,
              thumbnailUrl,
              duration: rec.duration,
            });
          } else {
            // Never delete user records on decryption mismatch; skip safely.
            console.warn(`[Vault] Item ${rec.id} could not be decrypted with current key. Preserving encrypted record.`);
          }
        } catch (itemErr) {
          console.warn(`[Vault] Skipped item ${rec.id}:`, itemErr);
        }

        if (i > 0 && i % 10 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      if (currentGen !== loadGenRef.current) {
        newBlobUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current = newBlobUrls;
      setItems(decryptedItems);
    } catch (err) {
      console.warn('Error loading vault items:', err);
      showToast('Error al leer datos de la bóveda', 'error');
    } finally {
      if (currentGen === loadGenRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadVaultItems();

    // Reload folders in case a backup brought new custom folders
    const loadFolder = (cat: VaultItemCategory) => {
      try {
        const saved = localStorage.getItem(`vault_subfolders_${cat}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error(e);
      }
      return ['General'];
    };
    setCustomFolders({
      photo: loadFolder('photo'),
      video: loadFolder('video'),
      audio: loadFolder('audio'),
      app: loadFolder('app'),
      document: loadFolder('document'),
    });

    const handleTrashUpdated = () => {
      loadVaultItems();
    };
    window.addEventListener('vault_trash_updated', handleTrashUpdated);

    return () => {
      window.removeEventListener('vault_trash_updated', handleTrashUpdated);
      // Memory cleanup when component unmounts / locks
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, [masterKey, refreshTrigger]);

  // Android Back Button / Gesture Navigation Support
  const activeViewerItemRef = useRef(activeViewerItem);
  activeViewerItemRef.current = activeViewerItem;
  const wasViewerOpenRef = useRef(false);

  const isCameraOpenRef = useRef(isCameraOpen);
  isCameraOpenRef.current = isCameraOpen;
  const wasCameraOpenRef = useRef(false);

  const showBatchDeleteModalRef = useRef(showBatchDeleteModal);
  showBatchDeleteModalRef.current = showBatchDeleteModal;
  const wasDeleteModalOpenRef = useRef(false);

  const importedCountRef = useRef(importedCountForReminder);
  importedCountRef.current = importedCountForReminder;
  const wasReminderOpenRef = useRef(false);

  const isSelectModeRef = useRef(isSelectMode);
  isSelectModeRef.current = isSelectMode;
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const wasSelectingRef = useRef(false);

  const isCreateFolderOpenRef = useRef(isCreateFolderOpen);
  isCreateFolderOpenRef.current = isCreateFolderOpen;
  const wasCreateFolderOpenRef = useRef(false);

  const isMoveModalOpenRef = useRef(isMoveModalOpen);
  isMoveModalOpenRef.current = isMoveModalOpen;
  const wasMoveModalOpenRef = useRef(false);

  // Sync modal refs
  useEffect(() => {
    wasCreateFolderOpenRef.current = isCreateFolderOpen;
  }, [isCreateFolderOpen]);

  useEffect(() => {
    wasMoveModalOpenRef.current = isMoveModalOpen;
  }, [isMoveModalOpen]);

  // Reset activeSubfolder when changing activeTab
  useEffect(() => {
    setActiveSubfolder(null);
  }, [activeTab]);

  const activeSubfolderRef = useRef(activeSubfolder);
  activeSubfolderRef.current = activeSubfolder;
  const wasSubfolderOpenRef = useRef(false);

  const folderToRenameRef = useRef(folderToRename);
  folderToRenameRef.current = folderToRename;

  // Sync open subfolder ref
  useEffect(() => {
    wasSubfolderOpenRef.current = activeSubfolder !== null;
  }, [activeSubfolder]);

  // Auto-bloquear la Carpeta con PIN inmediatamente al salir de ella o cambiar de pestaña/categoría
  useEffect(() => {
    if (carpetaActiva !== EXTRA_PIN_FOLDER_NAME) {
      setIsExtraPinUnlocked(false);
    }
  }, [carpetaActiva, activeCategory, activeTab, activeNavTab]);

  // Dynamic list of all folders for active category (incluye siempre 'General' y 'Carpeta con PIN' en todas las categorías)
  const activeCategoryFolders = useMemo(() => {
    const targetCat =
      activeTab === 'favorites' || activeTab === 'all'
        ? activeCategory || 'photo'
        : activeTab;
    const list = customFolders[targetCat] || ['General'];
    const set = new Set<string>(['General', EXTRA_PIN_FOLDER_NAME, ...list]);
    items.forEach((it) => {
      if (
        (activeTab === 'favorites' ? it.record.isFavorite : it.record.category === targetCat) &&
        it.record.album
      ) {
        set.add(it.record.album);
      }
    });
    return Array.from(set);
  }, [activeTab, activeCategory, customFolders, items]);

  // Lista tipada de carpetas disponibles según la interfaz Carpeta
  const listaCarpetas: Carpeta[] = useMemo(() => {
    return activeCategoryFolders.map((fName) => ({
      id: fName,
      nombre: fName,
    }));
  }, [activeCategoryFolders]);

  // Robust Native Android Back Button & Gesture Navigation Stack
  useEffect(() => {
    if (activeViewerItem) {
      return registerBackHandler('main_viewer_item', () => {
        setActiveViewerItem(null);
        return true;
      }, 95);
    }
  }, [activeViewerItem]);

  useEffect(() => {
    if (isCameraOpen) {
      return registerBackHandler('main_camera_open', () => {
        setIsCameraOpen(false);
        return true;
      }, 90);
    }
  }, [isCameraOpen]);

  useEffect(() => {
    if (isAddSheetOpen) {
      return registerBackHandler('main_add_sheet', () => {
        setIsAddSheetOpen(false);
        return true;
      }, 85);
    }
  }, [isAddSheetOpen]);

  useEffect(() => {
    if (isCreateFolderOpen) {
      return registerBackHandler('main_create_folder', () => {
        setIsCreateFolderOpen(false);
        return true;
      }, 80);
    }
  }, [isCreateFolderOpen]);

  useEffect(() => {
    if (isMoveModalOpen) {
      return registerBackHandler('main_move_modal', () => {
        setIsMoveModalOpen(false);
        return true;
      }, 80);
    }
  }, [isMoveModalOpen]);

  useEffect(() => {
    if (folderToRename) {
      return registerBackHandler('main_rename_folder', () => {
        setFolderToRename(null);
        return true;
      }, 80);
    }
  }, [folderToRename]);

  useEffect(() => {
    if (showBatchDeleteModal) {
      return registerBackHandler('main_batch_delete', () => {
        setShowBatchDeleteModal(false);
        return true;
      }, 80);
    }
  }, [showBatchDeleteModal]);

  useEffect(() => {
    if (isWhatsAppFabOpen) {
      return registerBackHandler('main_whatsapp_fab', () => {
        setIsWhatsAppFabOpen(false);
        return true;
      }, 90);
    }
  }, [isWhatsAppFabOpen]);

  useEffect(() => {
    setIsWhatsAppFabOpen(false);
  }, [activeCategory, activeSubfolder, activeNavTab]);

  useEffect(() => {
    if (importedCountForReminder > 0) {
      return registerBackHandler('main_import_reminder', () => {
        setImportedCountForReminder(0);
        return true;
      }, 80);
    }
  }, [importedCountForReminder]);

  useEffect(() => {
    if (isSelectMode) {
      return registerBackHandler('main_select_mode', () => {
        setIsSelectMode(false);
        setSelectedIds(new Set());
        return true;
      }, 50);
    }
  }, [isSelectMode]);

  useEffect(() => {
    if (activeSubfolder !== null) {
      return registerBackHandler('main_subfolder_nav', () => {
        setActiveSubfolder(null);
        return true;
      }, 40);
    }
  }, [activeSubfolder]);

  useEffect(() => {
    if (activeCategory !== null) {
      return registerBackHandler('main_category_nav', () => {
        setActiveCategory(null);
        setActiveSubfolder(null);
        setIsSelectMode(false);
        setSelectedIds(new Set());
        return true;
      }, 30);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (activeNavTab !== 'vault') {
      return registerBackHandler('main_tab_nav', () => {
        setActiveNavTab('vault');
        setActiveCategory(null);
        return true;
      }, 20);
    }
  }, [activeNavTab]);

  const handleCreateFolder = (
    name: string,
    options?: { switchToFolder?: boolean; categoryOverride?: VaultItemCategory }
  ) => {
    const switchToFolder = options?.switchToFolder ?? true;
    const cat = (
      options?.categoryOverride ||
      activeCategory ||
      (activeTab !== 'all' && activeTab !== 'favorites' ? activeTab : 'photo')
    ) as VaultItemCategory;
    const currentList = customFolders[cat] || ['General'];
    if (!currentList.includes(name)) {
      const updated = [...currentList, name];
      setCustomFolders((prev) => ({ ...prev, [cat]: updated }));
      localStorage.setItem(`vault_subfolders_${cat}`, JSON.stringify(updated));
      showToast(`Carpeta "${name}" creada con éxito`, 'success');
      if (switchToFolder) {
        setActiveSubfolder(name);
        if (activeCategory === null) {
          openCategory(cat);
        }
      }
    }
  };

  const handleRenameFolder = async (oldName: string, newName: string) => {
    if (activeTab === 'all' || activeTab === 'favorites') return;
    if (oldName === 'General' || isExtraPinAlbum(oldName)) return;
    const cat = activeTab;

    await batchRenameAlbum(cat, oldName, newName);

    // Update in memory items
    setItems((prev) =>
      prev.map((it) => {
        const itemCat = it.record.category;
        const itemAlbum = it.record.album || 'General';
        if (itemCat === cat && itemAlbum === oldName) {
          return { ...it, record: { ...it.record, album: newName } };
        }
        return it;
      })
    );

    // Update custom folders
    const currentList = customFolders[cat] || ['General'];
    const updated = currentList.map((f) => (f === oldName ? newName : f));
    setCustomFolders((prev) => ({ ...prev, [cat]: updated }));
    localStorage.setItem(`vault_subfolders_${cat}`, JSON.stringify(updated));

    if (activeSubfolder === oldName) {
      setActiveSubfolder(newName);
    }

    setFolderToRename(null);
    showToast(`Carpeta renombrada a "${newName}"`, 'success');
  };

  const handleDeleteFolder = async (folderNameToDelete: string) => {
    if (
      folderNameToDelete === 'General' ||
      isExtraPinAlbum(folderNameToDelete) ||
      activeTab === 'all' ||
      activeTab === 'favorites'
    )
      return;
    const cat = activeTab;

    // Move any items in this folder back to 'General' in DB and memory
    const itemsInFolder = items.filter(
      (it) => it.record.category === cat && it.record.album === folderNameToDelete
    );

    if (itemsInFolder.length > 0) {
      const ids = itemsInFolder.map((it) => it.id);
      await batchUpdateAlbum(ids, 'General');
      setItems((prev) =>
        prev.map((it) =>
          ids.includes(it.id)
            ? { ...it, record: { ...it.record, album: 'General' } }
            : it
        )
      );
    }

    const currentList = customFolders[cat] || ['General'];
    const updated = currentList.filter((f) => f !== folderNameToDelete);
    setCustomFolders((prev) => ({ ...prev, [cat]: updated.length > 0 ? updated : ['General'] }));
    localStorage.setItem(`vault_subfolders_${cat}`, JSON.stringify(updated.length > 0 ? updated : ['General']));

    if (activeSubfolder === folderNameToDelete) {
      setActiveSubfolder(null);
    }
    showToast(`Carpeta "${folderNameToDelete}" eliminada (sus archivos se pasaron a General)`, 'info');
  };

  const handleMoveSelected = async (targetFolder: string) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await batchUpdateAlbum(ids, targetFolder);

    // Update in memory state
    setItems((prev) =>
      prev.map((it) =>
        ids.includes(it.id)
          ? { ...it, record: { ...it.record, album: targetFolder } }
          : it
      )
    );

    showToast(`${ids.length} elemento(s) movidos a "${targetFolder}"`, 'success');
    setSelectedIds(new Set());
    setIsSelectMode(false);
    setIsMoveModalOpen(false);
  };

  // Navigation tab and category state references
  const activeNavTabRef = useRef(activeNavTab);
  activeNavTabRef.current = activeNavTab;
  const activeCategoryRef = useRef(activeCategory);
  activeCategoryRef.current = activeCategory;

  const navigateToTab = (tab: 'vault' | 'import' | 'security' | 'profile' | 'settings') => {
    if (tab !== activeNavTab) {
      window.history.pushState({ vaultNav: tab }, '');
      setActiveNavTab(tab);
    }
  };

  useEffect(() => {
    if (activeNavTab !== 'settings') {
      sessionStorage.removeItem('vault_updates_menu_active');
      window.dispatchEvent(new CustomEvent('vault_updates_view_state', { detail: { isOpen: false } }));
    }
  }, [activeNavTab]);

  // Listener para redirigir directamente al menú de actualización cuando se toca el banner
  useEffect(() => {
    const handleOpenUpdatesMenu = () => {
      setActiveCategory(null);
      setIsSelectMode(false);
      setSelectedIds(new Set());
      navigateToTab('settings');
      sessionStorage.setItem('open_updates_tab_on_settings', 'true');
      // Enviar evento al sub-menú para abrir la sección de Actualizaciones de inmediato
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('settings_switch_submenu', { detail: { submenu: 'updates' } }));
      }, 50);
    };

    window.addEventListener('vault_open_updates_menu', handleOpenUpdatesMenu);
    return () => window.removeEventListener('vault_open_updates_menu', handleOpenUpdatesMenu);
  }, []);

  const openCategory = (cat: VaultItemCategory) => {
    window.history.pushState({ vaultCat: cat }, '');
    setActiveCategory(cat);
    setActiveTab(cat);
  };



  // Total storage calculated from real user files
  const totalStorageBytes = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.record.size || 0), 0);
  }, [items]);

  // Real device storage estimation
  const [deviceStorage, setDeviceStorage] = useState<{ quota: number; usage: number; free: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    getNativeDeviceStorage()
      .then((storage) => {
        if (!isMounted || !storage) return;
        setDeviceStorage(storage);
      })
      .catch(() => {
        // Fallback silencioso
      });

    return () => {
      isMounted = false;
    };
  }, [items.length]);

  // Percentage representing storage occupied by vault files
  const storagePercent = useMemo(() => {
    if (items.length === 0) return 0;
    if (deviceStorage && deviceStorage.quota > 0) {
      const pct = Math.round((totalStorageBytes / deviceStorage.quota) * 100);
      return Math.min(100, Math.max(1, pct));
    }
    const baseQuota = 500 * 1024 * 1024;
    return Math.min(100, Math.max(1, Math.round((totalStorageBytes / baseQuota) * 100)));
  }, [deviceStorage, items.length, totalStorageBytes]);

  // Recent files list matching real user saved files - exactly last 5 records (excluyendo archivos de Carpeta con PIN)
  const recentList = useMemo(() => {
    return items
      .filter((it) => !isExtraPinAlbum(it.record.album))
      .slice(0, 5)
      .map((it) => {
        const d = new Date(it.record.timestamp);
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const nameWithoutExt = it.record.name.replace(/\.[^/.]+$/, '');
        const encName = it.record.name.endsWith('.enc') ? it.record.name : `${nameWithoutExt}.enc`;
        const sizeMb = formatSize(it.record.size);
        return {
          id: it.id,
          name: encName,
          size: sizeMb,
          time: `Hoy ${timeStr}`,
          previewUrl: it.record.category === 'photo' || it.record.category === 'video' ? it.blobUrl : null,
          category: it.record.category,
          realItem: it,
        };
      });
  }, [items]);

  // Track last back press timestamp for Double-Back-To-Exit on root
  const lastBackPressTimeRef = useRef<number>(0);

  // Sync refs for state
  useEffect(() => {
    wasSelectingRef.current = isSelectMode || selectedIds.size > 0;
  }, [isSelectMode, selectedIds.size]);

  useEffect(() => {
    wasViewerOpenRef.current = !!activeViewerItem;
  }, [activeViewerItem]);

  useEffect(() => {
    wasCameraOpenRef.current = isCameraOpen;
  }, [isCameraOpen]);

  useEffect(() => {
    wasDeleteModalOpenRef.current = showBatchDeleteModal;
  }, [showBatchDeleteModal]);

  useEffect(() => {
    wasReminderOpenRef.current = importedCountForReminder > 0;
  }, [importedCountForReminder]);

  // History Pushing Effect 1: Subfolder
  const prevSubfolderRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeSubfolder !== null && prevSubfolderRef.current === null) {
      try {
        window.history.pushState({ vaultSubfolder: activeSubfolder }, '');
      } catch {}
    }
    prevSubfolderRef.current = activeSubfolder;
  }, [activeSubfolder]);

  // History Pushing Effect 2: Category
  const prevCategoryRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeCategory !== null && prevCategoryRef.current === null) {
      try {
        window.history.pushState({ vaultCat: activeCategory }, '');
      } catch {}
    }
    prevCategoryRef.current = activeCategory;
  }, [activeCategory]);

  // History Pushing Effect 3: NavTab
  const prevNavTabRef = useRef<string>('vault');
  useEffect(() => {
    if (activeNavTab !== 'vault' && prevNavTabRef.current === 'vault') {
      try {
        window.history.pushState({ vaultNav: activeNavTab }, '');
      } catch {}
    }
    prevNavTabRef.current = activeNavTab;
  }, [activeNavTab]);

  // History Pushing Effect 4: Viewer
  const prevViewerOpenRef = useRef<boolean>(false);
  useEffect(() => {
    if (activeViewerItem !== null && !prevViewerOpenRef.current) {
      try {
        window.history.pushState({ vaultViewer: true }, '');
      } catch {}
    }
    prevViewerOpenRef.current = !!activeViewerItem;
  }, [activeViewerItem]);

  // History Pushing Effect 5: Selection Mode
  const prevSelectingRef = useRef<boolean>(false);
  const isSelectingNow = isSelectMode || selectedIds.size > 0;
  useEffect(() => {
    if (isSelectingNow && !prevSelectingRef.current) {
      try {
        window.history.pushState({ vaultSelecting: true }, '');
      } catch {}
    }
    prevSelectingRef.current = isSelectingNow;
  }, [isSelectingNow]);

  // Initial Root History State
  useEffect(() => {
    try {
      window.history.pushState({ vaultRoot: true }, '');
    } catch {}
  }, []);

  // Process and encrypt incoming files (Photos, Videos, Apps)
  const processFilesForVault = async (files: File[]) => {
    if (!files || files.length === 0) return;

    // Filtrar archivos que ya existan en la bóveda por nombre y tamaño
    const uniqueFiles = files.filter((f) => {
      const alreadyExists = items.some(
        (it) => it.record.name === f.name && it.record.size === f.size
      );
      return !alreadyExists;
    });

    const duplicatesSkipped = files.length - uniqueFiles.length;
    if (duplicatesSkipped > 0) {
      showToast(`${duplicatesSkipped} archivo(s) ya existían en la bóveda y fueron omitidos`, 'alert');
    }

    if (uniqueFiles.length === 0) return;

    const total = uniqueFiles.length;
    showToast(`Iniciando cifrado de ${total} elemento(s)...`, 'info');

    const newRecords: EncryptedVaultItem[] = [];
    const baseTime = Date.now();

    for (let i = 0; i < total; i++) {
      const file = uniqueFiles[i];
      setEncryptingProgress({
        current: i + 1,
        total,
        name: file.name,
      });

      try {
        const buffer = await file.arrayBuffer();
        const encrypted = await encryptBuffer(buffer, masterKey);
        const category = detectCategory(file.name, file.type);

        newRecords.push({
          id: `item_${baseTime}_${i}_${Math.random().toString(36).substring(2, 8)}`,
          timestamp: baseTime + i, // preserve selection order
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          iv: encrypted.iv,
          data: encrypted.data,
          album: activeSubfolder !== null ? activeSubfolder : 'General',
          isFavorite: false,
          category,
          lastModified: file.lastModified || undefined,
        });
      } catch (err) {
        console.error(`Error encrypting file ${file.name}:`, err);
      }
    }

    setEncryptingProgress(null);

    if (newRecords.length > 0) {
      // Save all encrypted items in a single, fast IndexedDB transaction
      await saveEncryptedItems(newRecords);
      await loadVaultItems();

      let photoCount = 0;
      let videoCount = 0;
      let audioCount = 0;
      let appCount = 0;
      let docCount = 0;
      newRecords.forEach((r) => {
        if (r.category === 'photo') photoCount++;
        else if (r.category === 'video') videoCount++;
        else if (r.category === 'audio') audioCount++;
        else if (r.category === 'document') docCount++;
        else appCount++;
      });

      const destList: string[] = [];
      if (photoCount > 0) destList.push(`${photoCount} a Fotos`);
      if (videoCount > 0) destList.push(`${videoCount} a Videos`);
      if (audioCount > 0) destList.push(`${audioCount} a Audio`);
      if (docCount > 0) destList.push(`${docCount} a Documentos`);
      if (appCount > 0) destList.push(`${appCount} a Aplicaciones`);

      showToast(`Guardados en sus carpetas: ${destList.join(', ')}`, 'success');

      // Navigate to destination folder so user immediately sees their files if not already inside a category
      if (activeCategory === null) {
        if (docCount > 0 && photoCount === 0 && videoCount === 0 && audioCount === 0 && appCount === 0) {
          openCategory('document');
        } else if (photoCount > 0 && videoCount === 0 && audioCount === 0 && appCount === 0 && docCount === 0) {
          openCategory('photo');
        } else if (videoCount > 0 && photoCount === 0 && audioCount === 0 && appCount === 0 && docCount === 0) {
          openCategory('video');
        } else if (audioCount > 0 && photoCount === 0 && videoCount === 0 && appCount === 0 && docCount === 0) {
          openCategory('audio');
        } else if (appCount > 0 && photoCount === 0 && videoCount === 0 && audioCount === 0 && docCount === 0) {
          openCategory('app');
        }
      }

      const mediaRecords = newRecords.filter((r) => r.category === 'photo' || r.category === 'video' || r.category === 'audio');
      if (mediaRecords.length > 0) {
        setRecentImportedItems(mediaRecords.map((r) => ({ name: r.name, size: r.size })));

        let handledNatively = false;
        if (isNativeApp()) {
          const itemsToDelete = mediaRecords.map((r) => ({
            filename: r.name,
            size: r.size,
            lastModified: r.lastModified,
            mimeType: r.mimeType,
          }));
          const res = await requestNativeBatchGalleryDeletion(itemsToDelete);
          if (res && (res.requested || res.success)) {
            handledNatively = true;
          }
        }

        if (!handledNatively && !isNativeApp()) {
          setImportedCountForReminder(mediaRecords.length);
        }
      }
    } else {
      showToast('No se pudieron procesar los archivos seleccionados', 'alert');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // CRITICAL: Convert FileList to a concrete JavaScript array BEFORE clearing input.value!
      // In Chromium / Android Chrome, setting input.value = '' empties e.target.files in place.
      const filesArray = Array.from(e.target.files);
      e.target.value = '';
      processFilesForVault(filesArray);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      processFilesForVault(filesArray);
    }
  };

  // Delete & Favorite (Movidos a Papelera de reciclaje cifrada con auto-vaciado a 30 días)
  const handleDeleteItem = async (id: string) => {
    try {
      await moveToTrash(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
      setActiveViewerItem(null);
      showToast('Elemento movido a la Papelera de Reciclaje (30 días)', 'info');
    } catch (err) {
      console.error('Error moving item to trash:', err);
      showToast('Error al mover elemento a la papelera', 'error');
    }
  };

  const handleToggleFavorite = async (id: string, isFav: boolean) => {
    await updateItemMetadata(id, { isFavorite: isFav });
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, record: { ...p.record, isFavorite: isFav } } : p
      )
    );
    setActiveViewerItem((prev) =>
      prev && prev.id === id ? { ...prev, record: { ...prev.record, isFavorite: isFav } } : prev
    );
  };

  const handleRenameSingleItem = async (id: string, newName: string) => {
    await updateItemMetadata(id, { name: newName });
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, record: { ...p.record, name: newName } } : p
      )
    );
    setActiveViewerItem((prev) =>
      prev && prev.id === id ? { ...prev, record: { ...prev.record, name: newName } } : prev
    );
    showToast(`Nombre cambiado a "${newName}"`, 'success');
  };

  const handleMoveSingleItem = async (id: string, targetFolder: string) => {
    await batchUpdateAlbum([id], targetFolder);
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, record: { ...p.record, album: targetFolder } } : p
      )
    );
    setActiveViewerItem((prev) =>
      prev && prev.id === id ? { ...prev, record: { ...prev.record, album: targetFolder } } : prev
    );
    showToast(`Movido a la carpeta "${targetFolder}"`, 'success');
  };

  const handleCopySingleItem = async (id: string, targetFolder: string) => {
    const sourceItem = items.find((p) => p.id === id);
    if (!sourceItem) return;

    const currentAlbum = sourceItem.record.album || 'General';
    let copyName = sourceItem.record.name || 'archivo';
    if (currentAlbum === targetFolder) {
      const dotIdx = copyName.lastIndexOf('.');
      if (dotIdx > 0) {
        copyName = `${copyName.substring(0, dotIdx)} (copia)${copyName.substring(dotIdx)}`;
      } else {
        copyName = `${copyName} (copia)`;
      }
    }

    const newRecord: EncryptedVaultItem = {
      ...sourceItem.record,
      id: `item_${Date.now()}_copy_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      name: copyName,
      album: targetFolder,
    };

    await saveEncryptedItem(newRecord);

    const response = await fetch(sourceItem.blobUrl);
    const blob = await response.blob();
    const newBlobUrl = URL.createObjectURL(blob);
    blobUrlsRef.current.push(newBlobUrl);

    const newDecryptedItem: DecryptedVaultItem = {
      id: newRecord.id,
      blobUrl: newBlobUrl,
      record: newRecord,
    };

    setItems((prev) => [newDecryptedItem, ...prev]);
    showToast(`Copia guardada en la carpeta "${targetFolder}"`, 'success');
  };

  const handleUpdateItemBlob = async (id: string, newBlob: Blob): Promise<string | void> => {
    const targetItem = items.find((p) => p.id === id);
    if (!targetItem) return;

    const activeKey = masterKeyRef.current || masterKey;
    const arrayBuffer = await newBlob.arrayBuffer();
    const encrypted = await encryptBuffer(arrayBuffer, activeKey);

    const updatedRecord: EncryptedVaultItem = {
      ...targetItem.record,
      iv: encrypted.iv,
      data: encrypted.data,
      size: arrayBuffer.byteLength,
      mimeType: newBlob.type || targetItem.record.mimeType,
      lastModified: Date.now(),
    };

    await saveEncryptedItem(updatedRecord);

    const newBlobUrl = URL.createObjectURL(newBlob);
    blobUrlsRef.current.push(newBlobUrl);

    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, blobUrl: newBlobUrl, record: updatedRecord } : p
      )
    );
    setActiveViewerItem((prev) =>
      prev && prev.id === id ? { ...prev, blobUrl: newBlobUrl, record: updatedRecord } : prev
    );

    return newBlobUrl;
  };

  // Batch actions
  const toggleSelectItem = (id: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((p) => p.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setShowBatchDeleteModal(true);
  };

  const confirmBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeletingBatch(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      await batchMoveToTrash(idsToDelete);
      showToast(`${idsToDelete.length} elemento(s) movido(s) a la Papelera (30 días)`, 'info');
      setItems((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setShowBatchDeleteModal(false);
    } catch (err) {
      console.error('Error moving items to trash:', err);
      showToast('Error al mover elementos a la papelera', 'error');
    } finally {
      setIsDeletingBatch(false);
    }
  };

  const handleCardPointerDown = (id: string) => {
    isLongPressTriggered.current = false;
    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch {}
      }
      setIsSelectMode(true);
      setSelectedIds((prev) => new Set(prev).add(id));
    }, 400);
  };

  const handleCardPointerUp = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleBatchExport = () => {
    if (selectedIds.size === 0) return;
    setShowBatchExportModal(true);
  };

  const confirmBatchExport = async () => {
    if (selectedIds.size === 0 || isExportingBatch) return;
    setIsExportingBatch(true);
    setIsExportComplete(false);
    setExportProgress(5);
    const selected = items.filter((p) => selectedIds.has(p.id));
    setExportTotalCount(selected.length);
    setExportCurrentIndex(0);
    const exportedIds: string[] = [];

    try {
      for (let i = 0; i < selected.length; i++) {
        const item = selected[i];
        setExportCurrentIndex(i + 1);
        setExportCurrentFileName(item.record.name || `archivo_${i + 1}`);

        const startPct = Math.round((i / selected.length) * 100);
        setExportProgress(Math.max(8, startPct));

        // Yield slightly so browser repaints progress
        await new Promise((r) => setTimeout(r, 60));

        const res = await exportVaultItemToDevice({
          blobUrl: item.blobUrl,
          filename: item.record.name || `archivo_${item.id}`,
          mimeType: item.record.mimeType,
          category: item.record.category,
        });

        if (res.success) {
          exportedIds.push(item.id);
        }

        const donePct = Math.round(((i + 1) / selected.length) * 100);
        setExportProgress(donePct);

        // Small yield so user visibly sees the progress bar fill up
        await new Promise((r) => setTimeout(r, 120));
      }

      if (exportedIds.length > 0) {
        setIsExportComplete(true);
        setExportProgress(100);
        await new Promise((r) => setTimeout(r, 450));

        await deleteMultipleEncryptedItems(exportedIds);
        setItems((prev) => prev.filter((p) => !exportedIds.includes(p.id)));
        showToast(
          `${exportedIds.length} elemento(s) sacado(s) exitosamente a tu galería`,
          'success'
        );
      } else {
        showToast('No se pudieron exportar los elementos al dispositivo', 'error');
      }
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setShowBatchExportModal(false);
    } catch (err) {
      console.error('Error al sacar elementos:', err);
      showToast('Error al procesar la exportación a la galería', 'error');
    } finally {
      setIsExportingBatch(false);
      setIsExportComplete(false);
      setExportProgress(0);
    }
  };

  // Counts and sizes by category (sincronizado dinámicamente con vaultDb)
  const counts = useMemo(() => {
    const stats = calculateVaultCategoryStats(items.map((it) => it.record));

    return {
      ...stats,
      totalMB: (stats.totalBytes / (1024 * 1024)).toFixed(1),
      photoSize: formatSize(stats.photoBytes),
      videoSize: formatSize(stats.videoBytes),
      audioSize: formatSize(stats.audioBytes),
      appSize: formatSize(stats.appBytes),
      documentSize: formatSize(stats.documentBytes),
    };
  }, [items]);

  // Filtered items (aísla los elementos de Carpeta con PIN hasta que se desbloquee con su PIN de 4 dígitos)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const inExtraPinFolder = isExtraPinAlbum(item.record.album);

      if (activeSubfolder === EXTRA_PIN_FOLDER_NAME) {
        if (!isExtraPinUnlocked) return false;
        if (!inExtraPinFolder) return false;
        if (activeTab !== 'all' && activeTab !== 'favorites' && item.record.category !== activeTab) {
          return false;
        }
      } else {
        // Fuera de la Carpeta con PIN, nunca exponer sus archivos en búsquedas, favoritos ni vistas generales
        if (inExtraPinFolder) return false;

        if (activeTab === 'favorites') {
          if (!item.record.isFavorite) return false;
        } else if (activeTab !== 'all') {
          if (item.record.category !== activeTab) return false;

          // Subfolder filter
          if (activeSubfolder !== null) {
            const itemAlbum = item.record.album || 'General';
            if (itemAlbum !== activeSubfolder) return false;
          }
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (item.record.name || '').toLowerCase().includes(q);
        const matchesDate = new Date(item.record.timestamp).toLocaleDateString().includes(q);
        const matchesAlbum = (item.record.album || '').toLowerCase().includes(q);
        return matchesName || matchesDate || matchesAlbum;
      }

      return true;
    });
  }, [items, activeTab, activeSubfolder, searchQuery, isExtraPinUnlocked]);

  // PRUEBA DE FECHA: Formateo de fecha para agrupación cronológica
  const formatDateGroupLabel = (timestamp: number): string => {
    const fileDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday =
      fileDate.getFullYear() === today.getFullYear() &&
      fileDate.getMonth() === today.getMonth() &&
      fileDate.getDate() === today.getDate();

    if (isToday) return 'Hoy';

    const isYesterday =
      fileDate.getFullYear() === yesterday.getFullYear() &&
      fileDate.getMonth() === yesterday.getMonth() &&
      fileDate.getDate() === yesterday.getDate();

    if (isYesterday) return 'Ayer';

    const isSameYear = fileDate.getFullYear() === today.getFullYear();
    const options: Intl.DateTimeFormatOptions = isSameYear
      ? { day: 'numeric', month: 'long' }
      : { day: 'numeric', month: 'long', year: 'numeric' };

    return fileDate.toLocaleDateString('es-ES', options);
  };

  const isListCategoryView =
    activeCategory === 'audio' ||
    activeCategory === 'document' ||
    activeCategory === 'app' ||
    activeTab === 'audio' ||
    activeTab === 'document' ||
    activeTab === 'app';

  // PRUEBA DE FECHA: Agrupación cronológica de archivos ordenados por fecha
  const groupedByDate = useMemo(() => {
    const sorted = [...filteredItems].sort(
      (a, b) => (b.record.timestamp || 0) - (a.record.timestamp || 0)
    );
    const groups: { dateLabel: string; items: typeof filteredItems }[] = [];
    sorted.forEach((item) => {
      const label = formatDateGroupLabel(item.record.timestamp || Date.now());
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.dateLabel === label) {
        lastGroup.items.push(item);
      } else {
        groups.push({ dateLabel: label, items: [item] });
      }
    });
    return groups;
  }, [filteredItems]);

  // Agrupación dinámica para la vista de lista vertical (Audios, Documentos/Archivos, Aplicaciones)
  const groupedListSections = useMemo(() => {
    const sorted = [...filteredItems].sort(
      (a, b) => (b.record.timestamp || 0) - (a.record.timestamp || 0)
    );

    const getExtLower = (name: string): string => {
      const clean = (name || '').trim();
      const dotIdx = clean.lastIndexOf('.');
      if (dotIdx <= 0 || dotIdx === clean.length - 1) return '';
      return clean.slice(dotIdx + 1).trim().toLowerCase();
    };

    const isAudioSection = activeCategory === 'audio' || activeTab === 'audio';
    const isDocSection = activeCategory === 'document' || activeTab === 'document';
    const isAppSection = activeCategory === 'app' || activeTab === 'app';

    if (isAudioSection) {
      const knownAudioExts = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'wma', 'mid', 'midi'];
      const map = new Map<string, typeof filteredItems>();
      sorted.forEach((item) => {
        const ext = getExtLower(item.record.name);
        const sectionTitle =
          !ext || ext === 'opus' || ext === 'amr' || !knownAudioExts.includes(ext)
            ? 'Desconocida'
            : ext.toUpperCase();
        const existing = map.get(sectionTitle) || [];
        existing.push(item);
        map.set(sectionTitle, existing);
      });
      const entries = Array.from(map.entries()).map(([sectionTitle, sectionItems]) => ({
        sectionTitle,
        items: sectionItems,
      }));
      entries.sort((a, b) => {
        if (a.sectionTitle === 'Desconocida') return -1;
        if (b.sectionTitle === 'Desconocida') return 1;
        return a.sectionTitle.localeCompare(b.sectionTitle);
      });
      return entries;
    }

    if (isDocSection) {
      const map = new Map<string, typeof filteredItems>();
      sorted.forEach((item) => {
        const ext = getExtLower(item.record.name);
        const sectionTitle = ext ? ext.toUpperCase() : 'ARCHIVO';
        const existing = map.get(sectionTitle) || [];
        existing.push(item);
        map.set(sectionTitle, existing);
      });
      return Array.from(map.entries()).map(([sectionTitle, sectionItems]) => ({
        sectionTitle,
        items: sectionItems,
      }));
    }

    if (isAppSection) {
      const groups: { sectionTitle: string; items: typeof filteredItems }[] = [];
      sorted.forEach((item) => {
        const label = formatDateGroupLabel(item.record.timestamp || Date.now());
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.sectionTitle === label) {
          lastGroup.items.push(item);
        } else {
          groups.push({ sectionTitle: label, items: [item] });
        }
      });
      return groups;
    }

    return [];
  }, [filteredItems, activeCategory, activeTab, appSourceTab]);

  // Generador de icono nativo en SVG data URI para Aplicaciones (src={app.icon})
  const getAppIconSrc = (item: DecryptedVaultItem): string => {
    if (item.thumbnailUrl) return item.thumbnailUrl;
    const lower = (item.record.name || '').toLowerCase();

    if (lower.includes('boveda') || lower.includes('calculadora')) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88"><rect width="88" height="88" rx="22" fill="#131636"/><path d="M44 16L22 25v18c0 15.5 9.4 29.8 22 35 12.6-5.2 22-19.5 22-35V25L44 16z" fill="none" stroke="#4f6ef7" stroke-width="4.5"/><rect x="36" y="41" width="16" height="13" rx="3" fill="#6384ff"/><path d="M39 41v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#6384ff" stroke-width="3.5"/></svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
    if (lower.includes('whatsapp')) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88"><defs><linearGradient id="wa" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f97316"/><stop offset="100%" stop-color="#e11d48"/></linearGradient></defs><rect width="88" height="88" rx="22" fill="url(#wa)"/><path d="M44 20c-13.2 0-24 10.5-24 23.5 0 4.5 1.3 8.8 3.6 12.5L20 68l12.5-3.4c3.5 1.9 7.4 2.9 11.5 2.9 13.2 0 24-10.5 24-23.5S57.2 20 44 20z" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linejoin="round"/><path d="M36 34c-1.2 0-2.5 1.2-2.5 3.2 0 4.5 5 11.5 11.5 14.5 2 .9 3.8.2 4.8-1l1.8-2.2c.5-.6.3-1.5-.4-1.9l-4.2-2c-.6-.3-1.4-.1-1.8.4l-1.2 1.5c-2.5-1.3-4.6-3.3-5.8-5.8l1.4-1.2c.5-.4.7-1.2.4-1.8l-2-4.2c-.4-.7-1.2-.9-1.8-.5z" fill="#ffffff"/></svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
    if (lower.includes('youtube') || lower.includes('morphe')) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88"><rect width="88" height="88" rx="22" fill="#0f172a"/><path d="M22 60V28l22 18 22-18v32" fill="none" stroke="#14b8a6" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
    if (lower.includes('indrive')) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88"><rect width="88" height="88" rx="22" fill="#bef264"/><text x="44" y="56" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="36" fill="#0f172a">iD</text></svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    // Icono nativo Android APK (cuadrícula blueprint azul + robot Android blanco, idéntico a la captura)
    const apkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88">
      <rect width="88" height="88" rx="20" fill="#3b6998"/>
      <g stroke="rgba(255,255,255,0.18)" stroke-width="1">
        <line x1="0" y1="22" x2="88" y2="22"/>
        <line x1="0" y1="44" x2="88" y2="44"/>
        <line x1="0" y1="66" x2="88" y2="66"/>
        <line x1="22" y1="0" x2="22" y2="88"/>
        <line x1="44" y1="0" x2="44" y2="88"/>
        <line x1="66" y1="0" x2="66" y2="88"/>
      </g>
      <line x1="31" y1="42" x2="25" y2="32" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>
      <line x1="57" y1="42" x2="63" y2="32" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M22 68a22 20 0 0 1 44 0Z" fill="#ffffff"/>
      <circle cx="35" cy="55" r="2.6" fill="#3b6998"/>
      <circle cx="53" cy="55" r="2.6" fill="#3b6998"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(apkSvg)}`;
  };

  // Formateo de fecha DD/MM/AA y tamaño detallado (ej. "24/08/26 - 15.86 KB", "29/10/26 - 13.18 MB")
  const formatDetailedSizeStr = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes >= 1024 * 1024 * 1024) {
      return `${Number((bytes / (1024 * 1024 * 1024)).toFixed(2))} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${Number((bytes / (1024 * 1024)).toFixed(2))} MB`;
    }
    if (bytes >= 1024) {
      return `${Number((bytes / 1024).toFixed(2))} KB`;
    }
    return `${Math.max(0, bytes)} B`;
  };

  const formatFileRowMeta = (timestamp: number, sizeBytes: number): string => {
    const d = new Date(timestamp || Date.now());
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy} - ${formatDetailedSizeStr(sizeBytes)}`;
  };

  const formatAppRowMeta = (filename: string, sizeBytes: number): string => {
    const match =
      filename.match(/(?:v|ver|version|_|-|\s)(\d+(?:\.\d+){1,3})/i) ||
      filename.match(/(\d+\.\d+(?:\.\d+){0,2})/);
    const ver = match && match[1] ? match[1] : '1.0.0';
    return `Versión ${ver} - ${formatDetailedSizeStr(sizeBytes)}`;
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen flex flex-col relative select-none w-full max-w-full transition-colors duration-250"
      style={{
        backgroundColor: 'var(--theme-bg-main, #060b14)',
        color: 'var(--theme-text-main, #f8fafc)',
      }}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-[#0a121d]/90 backdrop-blur-md border-4 border-dashed border-[#00e5ff] flex flex-col items-center justify-center pointer-events-none transition-all">
          <UploadCloud className="w-16 h-16 text-[#00e5ff] animate-bounce mb-3" />
          <h3 className="text-xl font-bold text-white">Suelta fotos, videos o aplicaciones aquí</h3>
          <p className="text-sm text-cyan-200">Se cifrarán con AES-GCM de 256 bits inmediatamente</p>
        </div>
      )}

      {/* Screen 2: Importar Tab */}
      {activeNavTab === 'import' ? (
        <ImportVaultView
          masterKey={masterKey}
          onImportComplete={async (imported, shouldShowReminder) => {
            await loadVaultItems();
            setActiveNavTab('vault');
            if (imported && imported.length > 0) {
              const photoCount = imported.filter((i) => i.category === 'photo').length;
              const videoCount = imported.filter((i) => i.category === 'video').length;
              const appCount = imported.filter((i) => i.category === 'app').length;
              const audioCount = imported.filter((i) => i.category === 'audio').length;

              const media = imported.filter((i) => i.category === 'photo' || i.category === 'video' || i.category === 'audio');
              if (media.length > 0) {
                setRecentImportedItems(media.map((m) => ({ name: m.name, size: m.size })));
                if (shouldShowReminder && !isNativeApp()) {
                  setImportedCountForReminder(media.length);
                }
              }

              // Redirigir a la carpeta correspondiente para que el usuario vea sus fotos recién guardadas
              if (photoCount > 0 && videoCount === 0 && appCount === 0 && audioCount === 0) {
                setActiveCategory('photo');
                setActiveTab('photo');
              } else if (videoCount > 0 && photoCount === 0 && appCount === 0 && audioCount === 0) {
                setActiveCategory('video');
                setActiveTab('video');
              } else if (audioCount > 0 && photoCount === 0 && videoCount === 0 && appCount === 0) {
                setActiveCategory('audio');
                setActiveTab('audio');
              } else if (appCount > 0 && photoCount === 0 && videoCount === 0 && audioCount === 0) {
                setActiveCategory('app');
                setActiveTab('app');
              } else {
                setActiveCategory(null);
                setActiveTab('all');
              }
              setActiveSubfolder('General');
            }
          }}
          showToast={showToast}
        />
      ) : activeNavTab === 'security' ? (
        /* Screen 3: Seguridad Tab */
        <SecurityVaultView
          onOpenSettings={() => navigateToTab('settings')}
          showToast={showToast}
          sessionPin={sessionPin}
          onLock={onLock}
          masterKey={masterKey}
          onMasterKeyUpdated={handleInternalMasterKeyUpdated}
          autoLockMinutes={autoLockMinutes}
          onAutoLockChange={onAutoLockChange || (() => {})}
          lockOnTabSwitch={lockOnTabSwitch}
          onLockOnTabSwitchChange={onLockOnTabSwitchChange || (() => {})}
        />
      ) : activeNavTab === 'settings' ? (
        /* Screen 4: Configuración Tab */
        <SettingsVaultView
          masterKey={masterKey}
          sessionPin={sessionPin}
          onMasterKeyUpdated={handleInternalMasterKeyUpdated}
          autoLockMinutes={autoLockMinutes}
          onAutoLockChange={onAutoLockChange || (() => {})}
          lockOnTabSwitch={lockOnTabSwitch}
          onLockOnTabSwitchChange={onLockOnTabSwitchChange || (() => {})}
          onPhotosUpdated={loadVaultItems}
          onResetVault={onResetVault || (() => {})}
          showToast={showToast}
        />
      ) : activeNavTab === 'profile' ? (
        /* Screen 5: Pestaña Yo (Mi Perfil) */
        <ProfileVaultView
          counts={counts}
          showToast={showToast}
          onOpenSettings={() => navigateToTab('settings')}
          onNavigateToVault={() => {
            setActiveCategory(null);
            navigateToTab('vault');
          }}
        />
      ) : activeCategory === null ? (
        <div className="max-w-md mx-auto w-full px-4 pb-[max(calc(env(safe-area-inset-bottom,0px)+4.5rem),4.75rem)] flex flex-col">
          {/* Fixed Pinned Header */}
          <header
            className="fixed top-0 left-0 right-0 z-30 [backdrop-filter:blur(24px)] backdrop-blur-xl border-b safe-top-sticky pb-3 px-4 shadow-md"
            style={{
              backgroundColor: 'var(--theme-bg-header, rgba(255, 255, 255, 0.95))',
              borderColor: 'var(--theme-border, #cbd5e1)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            <div className="max-w-md mx-auto w-full flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-0.5" style={{ color: 'var(--theme-text-main, #0f172a)' }}>
                  Mi <span style={{ color: 'var(--theme-primary, #0284c7)' }}>Bóveda</span>
                </h1>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--theme-text-muted, #475569)' }}>
                  TUS ARCHIVOS, SIEMPRE PROTEGIDOS
                </p>
              </div>

              {/* Botón de cambio de tema: solo los iconos de Luna y Sol sin contenedor circular */}
              <button
                type="button"
                onClick={() => {
                  const nextTheme: VaultTheme = currentTheme === 'light' ? 'cyan' : 'light';
                  themeService.setTheme(nextTheme);
                }}
                className="p-2 flex items-center justify-center active:scale-90 transition-transform duration-150 cursor-pointer bg-transparent border-0 shadow-none outline-none focus:outline-none"
                aria-label={currentTheme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
                title={currentTheme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {currentTheme === 'light' ? (
                  <Moon className="w-6 h-6 text-slate-700 hover:text-slate-900 transition-colors" strokeWidth={2} />
                ) : (
                  <Sun className="w-6 h-6 text-amber-400 hover:text-amber-300 transition-colors" strokeWidth={2} />
                )}
              </button>
            </div>
          </header>

          {/* Spacer so content starts right below fixed header */}
          <div className="safe-top-header-spacer shrink-0 w-full mb-3" />

          {/* Banner de Actualización Disponible - Exclusivo del apartado principal de Bóveda */}
          {showUpdateBanner && pendingUpdateInfo && (
            <UpdateNotificationBanner
              updateInfo={pendingUpdateInfo}
              onOpenUpdateMenu={() => {
                setShowUpdateBanner(false);
                navigateToTab('settings');
                sessionStorage.setItem('open_updates_tab_on_settings', 'true');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('settings_switch_submenu', { detail: { submenu: 'updates' } }));
                }, 50);
              }}
              onDismiss={() => {
                setShowUpdateBanner(false);
                if (pendingUpdateInfo.latestVersion) {
                  updateService.dismissUpdate(pendingUpdateInfo.latestVersion);
                }
              }}
            />
          )}

          {/* Card: BÓVEDA SELLADA (Real Data) - Adaptada dinámicamente al tema */}
          <div
            className="border rounded-2xl p-2.5 sm:p-3 mb-3 shadow-lg flex items-center justify-between transition-colors"
            style={{
              backgroundColor: 'var(--theme-bg-card, #0a121d)',
              borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.8))',
            }}
          >
            {/* Circular Progress Gauge */}
            <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  style={{ color: 'var(--theme-bg-secondary, #1e293b)' }}
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  style={{ color: 'var(--theme-primary, #00e5ff)' }}
                  className="transition-all duration-500"
                  strokeDasharray={`${storagePercent}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span
                className="absolute text-[11px] font-bold font-mono"
                style={{ color: 'var(--theme-text-main, #ffffff)' }}
              >
                {storagePercent}%
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 px-2.5">
              <p
                className="text-[9px] font-bold tracking-widest uppercase"
                style={{ color: 'var(--theme-primary, #00e5ff)' }}
              >
                BÓVEDA SELLADA
              </p>
              <h3
                className="text-xs sm:text-sm font-bold truncate"
                style={{ color: 'var(--theme-text-main, #ffffff)' }}
              >
                {items.length} {items.length === 1 ? 'archivo cifrado' : 'archivos cifrados'}
              </h3>
              <p
                className="text-[10px] truncate"
                style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
              >
                {deviceStorage && deviceStorage.free > 0
                  ? `${formatSize(totalStorageBytes)} en bóveda · ${
                      deviceStorage.free >= 1024 * 1024 * 1024
                        ? `${(deviceStorage.free / (1024 * 1024 * 1024)).toFixed(1)} GB`
                        : `${Math.round(deviceStorage.free / (1024 * 1024))} MB`
                    } libres`
                  : items.length > 0
                  ? `${formatSize(totalStorageBytes)} usados · Hoy ${lastAccessTime}`
                  : `Último acceso: hoy ${lastAccessTime}`}
              </p>
            </div>

            {/* Shield with lock icon */}
            <div
              className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-md"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 30%, transparent)',
                color: 'var(--theme-primary, #00e5ff)',
              }}
            >
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Encabezado de Categorías con Selector Cuadrícula / Línea */}
          <div className="flex items-center justify-between px-1 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary, #00e5ff)' }} />
              <h3
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
              >
                CATEGORÍAS
              </h3>
            </div>

            {/* Selector de visualización: Cuadrícula (2x2) o En Línea (estilo Imagen 2) */}
            <div
              className="inline-flex items-center p-0.5 rounded-xl border text-xs"
              style={{
                backgroundColor: 'var(--theme-bg-secondary, #0f172a)',
                borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
              }}
            >
              <button
                type="button"
                onClick={() => handleSetCategoryLayout('grid')}
                title="Vista en Cuadrícula"
                aria-label="Vista en Cuadrícula"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer active:scale-95"
                style={{
                  backgroundColor: categoryLayout === 'grid' ? 'var(--theme-bg-card, #0a121d)' : 'transparent',
                  color: categoryLayout === 'grid' ? 'var(--theme-primary, #00e5ff)' : 'var(--theme-text-muted, #94a3b8)',
                  boxShadow: categoryLayout === 'grid' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cuadrícula</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetCategoryLayout('line')}
                title="Vista en Línea"
                aria-label="Vista en Línea"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer active:scale-95"
                style={{
                  backgroundColor: categoryLayout === 'line' ? 'var(--theme-bg-card, #0a121d)' : 'transparent',
                  color: categoryLayout === 'line' ? 'var(--theme-primary, #00e5ff)' : 'var(--theme-text-muted, #94a3b8)',
                  boxShadow: categoryLayout === 'line' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Línea</span>
              </button>
            </div>
          </div>

          {/* VISTA 1: EN LÍNEA (Estilo Imagen 2 - Tarjetas amplias horizontales con icono, metadata detallada y flecha) */}
          {categoryLayout === 'line' ? (
            <div className="space-y-2 mb-3.5 animate-in fade-in duration-200">
              {/* Fotos */}
              <button
                type="button"
                onClick={() => openCategory('photo')}
                className="w-full border rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-left transition-all active:scale-[0.99] group shadow-sm hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #0a121d)',
                  borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 14%, var(--theme-bg-secondary, #0f172a))',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 35%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                      boxShadow: '0 0 12px color-mix(in srgb, var(--theme-primary, #00e5ff) 20%, transparent)',
                    }}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className="text-sm sm:text-base font-bold tracking-tight truncate group-hover:text-[var(--theme-primary)] transition-colors"
                      style={{ color: 'var(--theme-text-main, #ffffff)' }}
                    >
                      Fotos
                    </h4>
                    <p
                      className="text-[11px] sm:text-xs truncate mt-0.5"
                      style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                    >
                      {counts.photos} {counts.photos === 1 ? 'foto cifrada' : 'fotos cifradas'} · {counts.photoSize}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 30%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                    }}
                  >
                    {counts.photos}
                  </span>
                  <ChevronRight
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  />
                </div>
              </button>

              {/* Videos */}
              <button
                type="button"
                onClick={() => openCategory('video')}
                className="w-full border rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-left transition-all active:scale-[0.99] group shadow-sm hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #0a121d)',
                  borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 14%, var(--theme-bg-secondary, #0f172a))',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 35%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                      boxShadow: '0 0 12px color-mix(in srgb, var(--theme-primary, #00e5ff) 20%, transparent)',
                    }}
                  >
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className="text-sm sm:text-base font-bold tracking-tight truncate group-hover:text-[var(--theme-primary)] transition-colors"
                      style={{ color: 'var(--theme-text-main, #ffffff)' }}
                    >
                      Videos
                    </h4>
                    <p
                      className="text-[11px] sm:text-xs truncate mt-0.5"
                      style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                    >
                      {counts.videos} {counts.videos === 1 ? 'video cifrado' : 'videos cifrados'} · {counts.videoSize}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 30%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                    }}
                  >
                    {counts.videos}
                  </span>
                  <ChevronRight
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  />
                </div>
              </button>

              {/* Audio */}
              <button
                type="button"
                onClick={() => openCategory('audio')}
                className="w-full border rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-left transition-all active:scale-[0.99] group shadow-sm hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #0a121d)',
                  borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 14%, var(--theme-bg-secondary, #0f172a))',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 35%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                      boxShadow: '0 0 12px color-mix(in srgb, var(--theme-primary, #00e5ff) 20%, transparent)',
                    }}
                  >
                    <Music className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className="text-sm sm:text-base font-bold tracking-tight truncate group-hover:text-[var(--theme-primary)] transition-colors"
                      style={{ color: 'var(--theme-text-main, #ffffff)' }}
                    >
                      Audios
                    </h4>
                    <p
                      className="text-[11px] sm:text-xs truncate mt-0.5"
                      style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                    >
                      {counts.audios} {counts.audios === 1 ? 'audio cifrado' : 'audios cifrados'} · {counts.audioSize}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 30%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                    }}
                  >
                    {counts.audios}
                  </span>
                  <ChevronRight
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  />
                </div>
              </button>

              {/* Apps */}
              <button
                type="button"
                onClick={() => openCategory('app')}
                className="w-full border rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-left transition-all active:scale-[0.99] group shadow-sm hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #0a121d)',
                  borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 14%, var(--theme-bg-secondary, #0f172a))',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 35%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                      boxShadow: '0 0 12px color-mix(in srgb, var(--theme-primary, #00e5ff) 20%, transparent)',
                    }}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className="text-sm sm:text-base font-bold tracking-tight truncate group-hover:text-[var(--theme-primary)] transition-colors"
                      style={{ color: 'var(--theme-text-main, #ffffff)' }}
                    >
                      Aplicaciones
                    </h4>
                    <p
                      className="text-[11px] sm:text-xs truncate mt-0.5"
                      style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                    >
                      {counts.apps} {counts.apps === 1 ? 'aplicación protegida' : 'aplicaciones protegidas'} · {counts.appSize}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 30%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                    }}
                  >
                    {counts.apps}
                  </span>
                  <ChevronRight
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  />
                </div>
              </button>

              {/* Documentos */}
              <button
                type="button"
                onClick={() => openCategory('document')}
                className="w-full border rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-left transition-all active:scale-[0.99] group shadow-sm hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #0a121d)',
                  borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 14%, var(--theme-bg-secondary, #0f172a))',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 35%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                      boxShadow: '0 0 12px color-mix(in srgb, var(--theme-primary, #00e5ff) 20%, transparent)',
                    }}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className="text-sm sm:text-base font-bold tracking-tight truncate group-hover:text-[var(--theme-primary)] transition-colors"
                      style={{ color: 'var(--theme-text-main, #ffffff)' }}
                    >
                      Documentos
                    </h4>
                    <p
                      className="text-[11px] sm:text-xs truncate mt-0.5"
                      style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                    >
                      {counts.documents} {counts.documents === 1 ? 'documento cifrado' : 'documentos cifrados'} · {counts.documentSize}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 30%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                    }}
                  >
                    {counts.documents}
                  </span>
                  <ChevronRight
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  />
                </div>
              </button>
            </div>
          ) : (
            /* VISTA 2: CUADRÍCULA (Estilo 2x2 elegante y compacto, adaptado al tema activo) */
            <div className="grid grid-cols-2 gap-2.5 mb-3.5 animate-in fade-in duration-200">
              {/* Fotos */}
              <button
                type="button"
                onClick={() => openCategory('photo')}
                className="border rounded-2xl p-3 flex flex-col justify-between text-left transition-all active:scale-[0.98] group shadow-sm hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #0a121d)',
                  borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 25%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                    }}
                  >
                    <ImageIcon className="w-4.5 h-4.5" />
                  </div>
                  <ChevronRight
                    className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  />
                </div>
                <div>
                  <p
                    className="text-[11px] font-medium"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  >
                    Fotos
                  </p>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <h4
                      className="text-lg font-bold leading-tight"
                      style={{ color: 'var(--theme-text-main, #ffffff)' }}
                    >
                      {counts.photos}
                    </h4>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                    >
                      {counts.photoSize}
                    </span>
                  </div>
                </div>
              </button>

              {/* Videos */}
              <button
                type="button"
                onClick={() => openCategory('video')}
                className="border rounded-2xl p-3 flex flex-col justify-between text-left transition-all active:scale-[0.98] group shadow-sm hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #0a121d)',
                  borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 25%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                    }}
                  >
                    <Video className="w-4.5 h-4.5" />
                  </div>
                  <ChevronRight
                    className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  />
                </div>
                <div>
                  <p
                    className="text-[11px] font-medium"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  >
                    Videos
                  </p>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <h4
                      className="text-lg font-bold leading-tight"
                      style={{ color: 'var(--theme-text-main, #ffffff)' }}
                    >
                      {counts.videos}
                    </h4>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                    >
                      {counts.videoSize}
                    </span>
                  </div>
                </div>
              </button>

              {/* Audio */}
              <button
                type="button"
                onClick={() => openCategory('audio')}
                className="border rounded-2xl p-3 flex flex-col justify-between text-left transition-all active:scale-[0.98] group shadow-sm hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #0a121d)',
                  borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 25%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                    }}
                  >
                    <Music className="w-4.5 h-4.5" />
                  </div>
                  <ChevronRight
                    className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  />
                </div>
                <div>
                  <p
                    className="text-[11px] font-medium"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  >
                    Audios
                  </p>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <h4
                      className="text-lg font-bold leading-tight"
                      style={{ color: 'var(--theme-text-main, #ffffff)' }}
                    >
                      {counts.audios}
                    </h4>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                    >
                      {counts.audioSize}
                    </span>
                  </div>
                </div>
              </button>

              {/* Apps */}
              <button
                type="button"
                onClick={() => openCategory('app')}
                className="border rounded-2xl p-3 flex flex-col justify-between text-left transition-all active:scale-[0.98] group shadow-sm hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #0a121d)',
                  borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 25%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                    }}
                  >
                    <LayoutGrid className="w-4.5 h-4.5" />
                  </div>
                  <ChevronRight
                    className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  />
                </div>
                <div>
                  <p
                    className="text-[11px] font-medium"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  >
                    Aplicaciones
                  </p>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <h4
                      className="text-lg font-bold leading-tight"
                      style={{ color: 'var(--theme-text-main, #ffffff)' }}
                    >
                      {counts.apps}
                    </h4>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                    >
                      {counts.appSize}
                    </span>
                  </div>
                </div>
              </button>

              {/* Documentos */}
              <button
                type="button"
                onClick={() => openCategory('document')}
                className="col-span-2 sm:col-span-1 border rounded-2xl p-3 flex flex-col justify-between text-left transition-all active:scale-[0.98] group shadow-sm hover:shadow-md cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #0a121d)',
                  borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.75))',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 25%, transparent)',
                      color: 'var(--theme-primary, #00e5ff)',
                    }}
                  >
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <ChevronRight
                    className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  />
                </div>
                <div>
                  <p
                    className="text-[11px] font-medium"
                    style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                  >
                    Documentos
                  </p>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <h4
                      className="text-lg font-bold leading-tight"
                      style={{ color: 'var(--theme-text-main, #ffffff)' }}
                    >
                      {counts.documents}
                    </h4>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                    >
                      {counts.documentSize}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Section: ARCHIVOS RECIENTES (Adaptado al tema activo) */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-1 mb-2">
              <h3
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
              >
                ARCHIVOS RECIENTES
              </h3>
              {recentList.length > 0 && (
                <button
                  type="button"
                  onClick={() => openCategory('photo')}
                  className="text-xs font-bold hover:underline cursor-pointer"
                  style={{ color: 'var(--theme-primary, #00e5ff)' }}
                >
                  VER TODO
                </button>
              )}
            </div>

            {recentList.length > 0 ? (
              <div className="space-y-1.5">
                {recentList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.realItem) {
                        setActiveViewerItem(item.realItem);
                      }
                    }}
                    className="flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all active:scale-[0.99] group shadow-sm hover:shadow-md"
                    style={{
                      backgroundColor: 'var(--theme-bg-card, #0a121d)',
                      borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.7))',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-lg overflow-hidden relative border shrink-0"
                        style={{
                          backgroundColor: 'var(--theme-bg-secondary, #0f172a)',
                          borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.8))',
                        }}
                      >
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{
                              backgroundColor: 'var(--theme-bg-secondary, #0f172a)',
                              color: 'var(--theme-primary, #00e5ff)',
                            }}
                          >
                            {item.category === 'audio' ? (
                              <Music className="w-4 h-4" />
                            ) : item.category === 'app' ? (
                              <LayoutGrid className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Lock className="w-3 h-3 text-white drop-shadow" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h4
                          className="text-xs font-semibold truncate transition-colors group-hover:text-[var(--theme-primary)]"
                          style={{ color: 'var(--theme-text-main, #ffffff)' }}
                        >
                          {item.name}
                        </h4>
                        <p
                          className="text-[10px]"
                          style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                        >
                          {item.size}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                      >
                        {item.time}
                      </span>
                      <ChevronRight
                        className="w-3.5 h-3.5 transition-colors group-hover:text-[var(--theme-primary)]"
                        style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="py-6 px-4 rounded-2xl border border-dashed text-center flex flex-col items-center justify-center"
                style={{
                  backgroundColor: 'var(--theme-bg-card, #0a121d)',
                  borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.6))',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary, #0f172a)',
                    color: 'var(--theme-primary, #00e5ff)',
                  }}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <h4
                  className="text-xs font-bold"
                  style={{ color: 'var(--theme-text-main, #ffffff)' }}
                >
                  No hay archivos recientes
                </h4>
                <p
                  className="text-[11px] max-w-xs mt-0.5"
                  style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                >
                  Guarda fotos, videos, audios o documentos para verlos cifrados aquí.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Detailed Category View */
        <div className="max-w-4xl w-full mx-auto p-4 pb-[max(calc(env(safe-area-inset-bottom,0px)+5rem),5.25rem)] flex-1 flex flex-col">
          {/* Fixed Pinned Header for Folders & Subfolders */}
          <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-900 safe-top-sticky pb-2.5 shadow-lg shadow-black/50 transition-all">
            <div className="max-w-4xl mx-auto w-full px-3 sm:px-4">
            {isSelectMode || selectedIds.size > 0 ? (
              /* Encabezado durante el modo de selección (Limpio y enfocado) */
              <div className="flex items-center justify-between gap-3 min-h-[42px]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="p-1.5 -ml-1 text-zinc-400 hover:text-zinc-100 transition-colors rounded-xl active:scale-95 cursor-pointer"
                    aria-label="Cancelar selección"
                  >
                    <X className="w-5 h-5 text-zinc-300" strokeWidth={1.5} />
                  </button>
                  <div>
                    <h1 className="font-bold text-base sm:text-lg text-zinc-100 tracking-tight flex items-center gap-2">
                      <span>{selectedIds.size}</span>
                      <span className="text-xs font-normal text-zinc-400">
                        {selectedIds.size === 1 ? 'seleccionado' : 'seleccionados'}
                      </span>
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-800 transition-all active:scale-95 cursor-pointer"
                  >
                    {selectedIds.size === filteredItems.length ? 'Deseleccionar' : 'Todos'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 min-h-[42px]">
                <button
                  type="button"
                  onClick={() => {
                    if (carpetaActiva !== 'todas') {
                      setCarpetaActiva('todas');
                    } else {
                      setActiveCategory(null);
                    }
                  }}
                  className="p-1 -ml-1 rounded-xl text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-2 active:scale-95 cursor-pointer min-w-0"
                >
                  <ArrowLeft className="w-5 h-5 text-zinc-400 shrink-0" strokeWidth={1.5} />
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <Folder size={18} strokeWidth={1.5} className="text-amber-400 shrink-0" />
                      <h1 className="font-bold text-base sm:text-lg text-zinc-100 tracking-tight truncate">
                        {carpetaActiva !== 'todas'
                          ? carpetaActiva
                          : `Carpetas de ${
                              activeCategory === 'photo'
                                ? 'Fotos'
                                : activeCategory === 'video'
                                ? 'Videos'
                                : activeCategory === 'audio'
                                ? 'Audios'
                                : activeCategory === 'document'
                                ? 'Documentos'
                                : 'Aplicaciones'
                            }`}
                      </h1>
                      {carpetaActiva !== 'todas' && (
                        <span className="text-xs font-normal text-zinc-500 font-mono shrink-0">
                          ({filteredItems.length})
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Controles de vista y búsqueda compactos a la derecha en todas las subcarpetas */}
                {carpetaActiva !== 'todas' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen((prev) => !prev)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isSearchOpen || searchQuery
                          ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                          : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                      }`}
                      title="Buscar"
                    >
                      <Search size={15} strokeWidth={1.5} />
                    </button>

                    <div className="flex items-center bg-zinc-900/60 border border-zinc-800 rounded-xl p-0.5 gap-0.5">
                      <button
                        type="button"
                        onClick={toggleAspectMode}
                        className={`p-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer text-[10px] font-semibold ${
                          aspectMode === 'real'
                            ? 'bg-zinc-800 text-zinc-200 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={aspectMode === 'real' ? 'Proporción real' : 'Cuadrícula 1:1'}
                      >
                        <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <div className="w-[1px] h-3.5 bg-zinc-800 mx-0.5" />
                      <button
                        onClick={() => setGridColumns(2)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          gridColumns === 2 ? 'bg-zinc-800 text-zinc-200 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title="2 Columnas"
                        aria-label="Vista 2 columnas"
                      >
                        <LayoutGrid size={15} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => setGridColumns(3)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          gridColumns === 3 ? 'bg-zinc-800 text-zinc-200 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title="3 Columnas"
                        aria-label="Vista 3 columnas"
                      >
                        <Grid3X3 size={15} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Barra de búsqueda desplegable compacta en todas las subcarpetas */}
            {carpetaActiva !== 'todas' && (isSearchOpen || searchQuery) && (
              <div className="relative mt-2 mb-1 animate-in fade-in duration-150">
                <Search size={15} strokeWidth={1.5} className="text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeCategory === 'app' || activeTab === 'app'
                      ? 'Buscar aplicaciones...'
                      : activeCategory === 'audio' || activeTab === 'audio'
                      ? 'Buscar archivos de audio...'
                      : 'Buscar en esta carpeta...'
                  }
                  autoFocus
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Content Type Filter Tabs - Solo visible cuando está en la vista general de carpetas */}
            {carpetaActiva === 'todas' && (
              <div
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-1.5 no-scrollbar text-xs w-full max-w-full touch-pan-x"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('photo');
                    setActiveTab('photo');
                    setActiveSubfolder(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    (activeCategory === 'photo' || activeTab === 'photo') && activeTab !== 'favorites'
                      ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-zinc-800/80'
                  }`}
                >
                  <ImageIcon size={15} strokeWidth={1.5} />
                  <span>Fotos ({counts.photos})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('video');
                    setActiveTab('video');
                    setActiveSubfolder(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeCategory === 'video' || activeTab === 'video'
                      ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-zinc-800/80'
                  }`}
                >
                  <Film size={15} strokeWidth={1.5} />
                  <span>Videos ({counts.videos})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('audio');
                    setActiveTab('audio');
                    setActiveSubfolder(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeCategory === 'audio' || activeTab === 'audio'
                      ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-zinc-800/80'
                  }`}
                >
                  <Music size={15} strokeWidth={1.5} />
                  <span>Audios ({counts.audios})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('app');
                    setActiveTab('app');
                    setActiveSubfolder(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeCategory === 'app' || activeTab === 'app'
                      ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-zinc-800/80'
                  }`}
                >
                  <Folder size={15} strokeWidth={1.5} />
                  <span>Aplicaciones ({counts.apps})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('document');
                    setActiveTab('document');
                    setActiveSubfolder(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeCategory === 'document' || activeTab === 'document'
                      ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-zinc-800/80'
                  }`}
                >
                  <FileText size={15} strokeWidth={1.5} />
                  <span>Documentos ({counts.documents})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('favorites');
                    setActiveSubfolder(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === 'favorites'
                      ? 'bg-red-500/15 border border-red-500/30 text-red-400 font-semibold shadow-sm'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-zinc-800/80'
                  }`}
                >
                  <Heart size={15} strokeWidth={1.5} className={activeTab === 'favorites' ? 'fill-red-500 text-red-500' : ''} />
                  <span>Favoritos ({counts.favs})</span>
                </button>
              </div>
            )}
            </div>
          </header>

          {/* Dynamic Spacer so content starts right below fixed header */}
          <div
            className="shrink-0 w-full transition-all"
            style={{
              height:
                carpetaActiva === 'todas' && !isSelectMode
                  ? 'max(calc(env(safe-area-inset-top, 0px) + 7.75rem), 8.75rem)'
                  : carpetaActiva !== 'todas' && (isSearchOpen || searchQuery)
                  ? 'max(calc(env(safe-area-inset-top, 0px) + 7.5rem), 8.5rem)'
                  : 'max(calc(env(safe-area-inset-top, 0px) + 4.75rem), 5.75rem)',
            }}
          />

        {/* Items Grid & Carpetas View */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Cpu className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-xs">Descifrando datos protegidos de Caja fuerte...</p>
          </div>
        ) : (
          /* VISTA DE CONTENIDO DE LA SECCIÓN */
          <div className="space-y-4">
            {/* Si carpetaActiva es 'todas' y no hay búsqueda activa:
                OCULTAR la cuadrícula de fotos y mostrar ÚNICAMENTE bloques grandes o tarjetas de subcarpetas */}
            {carpetaActiva === 'todas' && !searchQuery ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Folder size={15} strokeWidth={1.5} className="text-amber-400" />
                    <span>Álbumes de {activeCategory === 'photo' ? 'Fotos' : activeCategory === 'video' ? 'Videos' : activeCategory === 'audio' ? 'Audios' : activeCategory === 'document' ? 'Documentos' : activeCategory === 'app' ? 'Aplicaciones' : 'Favoritos'}</span>
                  </h2>
                  <span className="text-xs text-zinc-500 font-mono">
                    {listaCarpetas.length} {listaCarpetas.length === 1 ? 'carpeta' : 'carpetas'}
                  </span>
                </div>

                {/* Lista Vertical de Subcarpetas */}
                <div className="flex flex-col gap-2.5">
                  {listaCarpetas.map((carpeta) => {
                    const isExtraPin = carpeta.id === EXTRA_PIN_FOLDER_NAME || isExtraPinAlbum(carpeta.id);
                    const cantidadArchivos = items.filter((it) => {
                      const coincideCategoria =
                        activeTab === 'favorites'
                          ? it.record.isFavorite
                          : activeTab === 'all'
                          ? true
                          : it.record.category === (activeCategory || 'photo');
                      const carpetaId = it.record.album || 'General';
                      return coincideCategoria && carpetaId === carpeta.id;
                    }).length;

                    return (
                      <div
                        key={carpeta.id}
                        onClick={() => {
                          if (isExtraPin) {
                            setShowExtraPinModal(true);
                          } else {
                            setCarpetaActiva(carpeta.id);
                          }
                        }}
                        className="group relative bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between text-left transition-all duration-200 active:scale-[0.99] cursor-pointer shadow-md backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          {isExtraPin ? (
                            <div
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                              style={{
                                backgroundColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 12%, transparent)',
                                borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 30%, transparent)',
                                color: 'var(--theme-primary, #00e5ff)',
                              }}
                            >
                              <Lock size={21} strokeWidth={1.8} />
                            </div>
                          ) : (
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <Folder size={22} strokeWidth={1.5} className="text-amber-400/90" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm sm:text-base font-semibold text-zinc-100 group-hover:text-white truncate transition-colors">
                              {carpeta.nombre}
                            </h3>
                            {isExtraPin ? (
                              <p
                                className="text-xs mt-0.5 font-medium truncate"
                                style={{ color: 'var(--theme-primary, #00e5ff)' }}
                              >
                                {extraPinConfiguredState
                                  ? 'Protegida con PIN de 4 dígitos · Toca para abrir'
                                  : 'Toca para configurar tu PIN extra de 4 dígitos'}
                              </p>
                            ) : (
                              <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                                {cantidadArchivos} {cantidadArchivos === 1 ? 'archivo' : 'archivos'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          {carpeta.id !== 'General' && !isExtraPin && (
                            <div
                              className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => setFolderToRename(carpeta.id)}
                                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                title="Renombrar carpeta"
                              >
                                <Edit3 size={15} strokeWidth={1.5} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFolder(carpeta.id)}
                                className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                                title="Eliminar carpeta"
                              >
                                <Trash2 size={15} strokeWidth={1.5} />
                              </button>
                            </div>
                          )}

                          <ChevronRight size={18} strokeWidth={1.5} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* VISTA DE CONTENIDO DENTRO DE LA CARPETA ESPECÍFICA (O RESULTADOS DE BÚSQUEDA) */
              <div className="space-y-3 animate-in fade-in duration-200">
                {/* Clasificación de Aplicaciones: "Instaladas" / "Paquetes de instalación" */}
                {isListCategoryView && (activeCategory === 'app' || activeTab === 'app') && (
                  <div className="flex items-center justify-center gap-8 pt-2.5 pb-2 border-b border-black/5 dark:border-white/5 mb-2 select-none">
                    <button
                      type="button"
                      onClick={() => setAppSourceTab('installed')}
                      className="relative pb-2 text-sm font-semibold transition-colors cursor-pointer"
                      style={{
                        color:
                          appSourceTab === 'installed'
                            ? currentTheme === 'light'
                              ? '#0284c7'
                              : '#38bdf8'
                            : currentTheme === 'light'
                            ? '#64748b'
                            : '#9ca3af',
                      }}
                    >
                      <span>Instaladas</span>
                      {appSourceTab === 'installed' && (
                        <span
                          className="absolute left-0 right-0 bottom-0 h-[2.5px] rounded-full"
                          style={{
                            backgroundColor: currentTheme === 'light' ? '#0284c7' : '#38bdf8',
                          }}
                        />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppSourceTab('packages')}
                      className="relative pb-2 text-sm font-semibold transition-colors cursor-pointer"
                      style={{
                        color:
                          appSourceTab === 'packages'
                            ? currentTheme === 'light'
                              ? '#0284c7'
                              : '#38bdf8'
                            : currentTheme === 'light'
                            ? '#64748b'
                            : '#9ca3af',
                      }}
                    >
                      <span>Paquetes de instalación</span>
                      {appSourceTab === 'packages' && (
                        <span
                          className="absolute left-0 right-0 bottom-0 h-[2.5px] rounded-full"
                          style={{
                            backgroundColor: currentTheme === 'light' ? '#0284c7' : '#38bdf8',
                          }}
                        />
                      )}
                    </button>
                  </div>
                )}

                {filteredItems.length === 0 ? (
                  <div className="text-center py-20 px-4 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
                    <div className="w-16 h-16 bg-zinc-900/70 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400/80">
                      <Folder size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-semibold text-zinc-200 mb-1">
                      No hay elementos cifrados en este álbum
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
                      Esta carpeta no contiene archivos. Agrega contenido para guardarlo aquí de forma protegida.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeCategory === 'video') mediaInputRef.current?.click();
                          else if (activeCategory === 'audio') audioInputRef.current?.click();
                          else if (activeCategory === 'app') appInputRef.current?.click();
                          else mediaInputRef.current?.click();
                        }}
                        className="px-4 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Añadir a esta carpeta</span>
                      </button>
                      {!isListCategoryView && (
                        <button
                          type="button"
                          onClick={() => setIsCameraOpen(true)}
                          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-800 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-zinc-400" />
                          <span>Usar Cámara</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : isListCategoryView ? (
                  /* DISEÑO DE LISTA VERTICAL AGRUPADA PARA AUDIOS, DOCUMENTOS/ARCHIVOS Y APLICACIONES */
                  <div className="space-y-4 pt-1">
                    {groupedListSections.map((section) => (
                      <div key={section.sectionTitle} className="space-y-0.5">
                        {/* Subtítulo divisor en gris para cada grupo ("MP3", "WAV", "Desconocida", "ZIP", "PDF", "Hoy", "Ayer") */}
                        <div className="pt-2 pb-1.5 select-none">
                          <h3
                            className="text-[13px] font-medium tracking-tight"
                            style={{ color: currentTheme === 'light' ? '#64748b' : '#9ca3af' }}
                          >
                            {section.sectionTitle}
                          </h3>
                        </div>

                        <div className="flex flex-col">
                          {section.items.map((item) => {
                            const isSelected = selectedIds.has(item.id);
                            const isAudio = item.record.category === 'audio';
                            const isApp = item.record.category === 'app';
                            const cleanName = (item.record.name || '').trim();
                            const dotIdx = cleanName.lastIndexOf('.');
                            const extLower =
                              dotIdx > 0 && dotIdx < cleanName.length - 1
                                ? cleanName.slice(dotIdx + 1).trim().toLowerCase()
                                : '';
                            const extUpper = extLower ? extLower.toUpperCase() : 'DOC';

                            const isCompressedArchive = ['zip', 'rar', '7z', 'tar', 'gz'].includes(extLower);
                            const knownAudioExts = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'wma', 'mid', 'midi'];
                            const isUnknownAudio =
                              isAudio && (!extLower || extLower === 'opus' || extLower === 'amr' || !knownAudioExts.includes(extLower));

                            const getDocBadgeGradient = () => {
                              if (extLower === 'pdf') {
                                return 'linear-gradient(180deg, #ee776d 0%, #dc4c42 100%)';
                              }
                              if (extLower === 'doc' || extLower === 'docx') {
                                return 'linear-gradient(180deg, #4f8ff7 0%, #2563eb 100%)';
                              }
                              if (extLower === 'xls' || extLower === 'xlsx' || extLower === 'csv') {
                                return 'linear-gradient(180deg, #34d399 0%, #059669 100%)';
                              }
                              if (extLower === 'ppt' || extLower === 'pptx') {
                                return 'linear-gradient(180deg, #fb923c 0%, #ea580c 100%)';
                              }
                              return 'linear-gradient(180deg, #64748b 0%, #475569 100%)';
                            };

                            return (
                              <div
                                key={item.id}
                                onPointerDown={() => handleCardPointerDown(item.id)}
                                onPointerUp={handleCardPointerUp}
                                onPointerCancel={handleCardPointerUp}
                                onClick={() => {
                                  if (isLongPressTriggered.current) {
                                    isLongPressTriggered.current = false;
                                    return;
                                  }
                                  if (isSelectMode) {
                                    toggleSelectItem(item.id, {} as React.MouseEvent);
                                  } else {
                                    setActiveViewerItem(item);
                                  }
                                }}
                                className={`flex items-center gap-4 py-3 border-b border-white/5 cursor-pointer transition-colors select-none ${
                                  isSelected ? 'bg-white/[0.06] rounded-xl px-2' : 'hover:bg-white/[0.02]'
                                }`}
                              >
                                {/* Icono a la izquierda con tamaño fijo estricto (44x44 px) */}
                                <div className="relative w-[44px] h-[44px] min-w-[44px] min-h-[44px] max-w-[44px] max-h-[44px] shrink-0">
                                  {isCompressedArchive ? (
                                    /* Documentos comprimidos (ZIP/RAR): Contenedor cuadrado azul con cremallera y texto "ZIP" */
                                    <div
                                      style={{
                                        width: '44px',
                                        height: '44px',
                                        background: 'linear-gradient(180deg, #63a4ff 0%, #3b82f6 100%)',
                                      }}
                                      className="vault-file-type-badge w-[44px] h-[44px] rounded-[11px] relative flex items-center justify-center overflow-hidden shadow-xs"
                                    >
                                      {/* Cremallera superior derecha */}
                                      <div className="absolute top-0 right-3 w-[5px] h-[14px] flex flex-col justify-between py-[1px] opacity-90">
                                        <span className="w-full h-[2px] bg-white rounded-xs" />
                                        <span className="w-full h-[2px] bg-white rounded-xs" />
                                        <span className="w-full h-[2px] bg-white rounded-xs" />
                                        <span className="w-full h-[3px] border border-white rounded-xs" />
                                      </div>
                                      <span className="text-white font-bold text-[13px] tracking-tight leading-none mt-1">
                                        {extUpper.slice(0, 4)}
                                      </span>
                                    </div>
                                  ) : isApp ? (
                                    /* Aplicaciones: Logotipo nativo o icono de la aplicación (src={app.icon}) */
                                    <img
                                      src={getAppIconSrc(item)}
                                      alt={item.record.name}
                                      style={{ width: '44px', height: '44px' }}
                                      className="w-[44px] h-[44px] rounded-[11px] object-cover block shadow-xs"
                                    />
                                  ) : isAudio ? (
                                    isUnknownAudio ? (
                                      /* Audios desconocidos / notas de voz (.opus): Icono gris con signo de interrogación (?) */
                                      <div
                                        style={{
                                          width: '44px',
                                          height: '44px',
                                          background: 'linear-gradient(180deg, #b8c2ce 0%, #8f9ba8 100%)',
                                        }}
                                        className="w-[44px] h-[44px] rounded-[11px] flex items-center justify-center shadow-xs"
                                      >
                                        <div className="w-[24px] h-[24px] rounded-full bg-white flex items-center justify-center">
                                          <span
                                            style={{ color: '#8f9ba8' }}
                                            className="font-bold text-[15px] leading-none"
                                          >
                                            ?
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      /* Audios comunes (MP3/WAV/M4A): Contenedor cuadrado rosa con nota musical blanca */
                                      <div
                                        style={{
                                          width: '44px',
                                          height: '44px',
                                          background: 'linear-gradient(180deg, #ff756b 0%, #ec4899 100%)',
                                        }}
                                        className="vault-file-type-badge w-[44px] h-[44px] rounded-[11px] flex items-center justify-center shadow-xs"
                                      >
                                        <Music className="w-[24px] h-[24px] text-white stroke-[2.2]" />
                                      </div>
                                    )
                                  ) : (
                                    /* Documentos (PDF, DOCX, TXT, etc.): Contenedor cuadrado con texto de extensión en blanco */
                                    <div
                                      style={{
                                        width: '44px',
                                        height: '44px',
                                        background: getDocBadgeGradient(),
                                      }}
                                      className="vault-file-type-badge w-[44px] h-[44px] rounded-[11px] flex items-center justify-center shadow-xs"
                                    >
                                      <span className="text-white font-bold text-[13px] tracking-tight leading-none">
                                        {extUpper.slice(0, 4)}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Bloque vertical derecho: Nombre en blanco (truncate) + Metadatos en gris pequeño */}
                                <div className="flex flex-col flex-1 min-w-0">
                                  <p
                                    className="text-[15px] font-normal text-white truncate leading-snug"
                                    title={item.record.name}
                                  >
                                    {item.record.name}
                                  </p>
                                  <p
                                    className="text-xs text-zinc-400 truncate mt-0.5 leading-tight"
                                    style={{ whiteSpace: 'nowrap' }}
                                  >
                                    {isApp && !isCompressedArchive
                                      ? formatAppRowMeta(item.record.name, item.record.size || 0)
                                      : formatFileRowMeta(item.record.timestamp, item.record.size || 0)}
                                  </p>
                                </div>

                                {/* Indicadores opcionales a la derecha (Favorito o Modo Selección) */}
                                {item.record.isFavorite && !isSelectMode && (
                                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
                                )}
                                {isSelectMode && (
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                      isSelected
                                        ? 'bg-blue-500 text-white border-2 border-blue-500'
                                        : 'border border-zinc-600 bg-transparent text-transparent'
                                    }`}
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* VISTA DE CUADRÍCULA PARA FOTOS Y VIDEOS */
                  <div className="space-y-4">
                    {groupedByDate.map((group) => (
                      <div key={group.dateLabel} className="space-y-1.5">
                        {/* PRUEBA DE FECHA: Fecha delgada y limpia alineada a la derecha */}
                        <div className="flex justify-end px-1 pt-1 select-none">
                          <span
                            className="text-xs sm:text-sm font-medium tracking-tight"
                            style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
                          >
                            {group.dateLabel}
                          </span>
                        </div>

                        <div
                          className="grid gap-3"
                          style={{
                            gridTemplateColumns:
                              gridColumns === 3
                                ? 'repeat(3, minmax(0, 1fr))'
                                : gridColumns === 2
                                ? 'repeat(2, minmax(0, 1fr))'
                                : 'repeat(4, minmax(0, 1fr))',
                          }}
                        >
                          {group.items.map((item) => {
                            const isSelected = selectedIds.has(item.id);
                            const isPhoto = item.record.category === 'photo';
                            const isVideo = item.record.category === 'video';

                            return (
                              <div key={item.id} className="flex flex-col gap-1 min-w-0 w-full">
                                <div
                                  onPointerDown={() => handleCardPointerDown(item.id)}
                                  onPointerUp={handleCardPointerUp}
                                  onPointerCancel={handleCardPointerUp}
                                  onClick={() => {
                                    if (isLongPressTriggered.current) {
                                      isLongPressTriggered.current = false;
                                      return;
                                    }
                                    if (isSelectMode) {
                                      toggleSelectItem(item.id, {} as React.MouseEvent);
                                    } else {
                                      setActiveViewerItem(item);
                                    }
                                  }}
                                  style={{ aspectRatio: '1 / 1' }}
                                  className={`group relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-900 border cursor-pointer transition-all duration-200 select-none ${
                                    isSelected
                                      ? 'border-zinc-300 ring-2 ring-white/30 scale-[0.98]'
                                      : 'border-zinc-800/80 hover:border-zinc-700 active:scale-95'
                                  }`}
                                >
                                  {/* Photo Display */}
                                  {isPhoto && (
                                    <img
                                      src={item.blobUrl}
                                      alt={item.record.name}
                                      className={`w-full h-full ${
                                        aspectMode === 'real' ? 'object-contain p-0.5' : 'object-cover'
                                      } transition-transform duration-300 group-hover:scale-105 pointer-events-none`}
                                      loading="lazy"
                                    />
                                  )}

                                  {/* Video Thumbnail Display with extracted real frame */}
                                  {isVideo && (
                                    <VideoThumbnailCard
                                      item={item}
                                      aspectMode={aspectMode}
                                      masterKey={masterKeyRef.current || masterKey}
                                    />
                                  )}

                                  {/* Top-right Favorite indicator */}
                                  {item.record.isFavorite && (
                                    <div className="absolute top-2 right-2 p-1 bg-black/60 backdrop-blur-md rounded-lg text-rose-500 z-10 pointer-events-none">
                                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                                    </div>
                                  )}

                                  {/* Selection indicator - circular checkmark */}
                                  {isSelectMode && (
                                    <div className="absolute top-2 left-2 z-20 pointer-events-none">
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                          isSelected
                                            ? 'bg-zinc-100 text-zinc-950 shadow-md border-2 border-zinc-900 font-bold'
                                            : 'bg-black/60 border border-white/60 text-transparent'
                                        }`}
                                      >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Nombre del archivo debajo del cuadro */}
                                <div
                                  onClick={() => {
                                    if (isSelectMode) {
                                      toggleSelectItem(item.id, {} as React.MouseEvent);
                                    } else {
                                      setActiveViewerItem(item);
                                    }
                                  }}
                                  className="px-0.5 cursor-pointer text-center select-none"
                                >
                                  <p
                                    className="text-[10px] sm:text-[11px] font-medium truncate leading-tight"
                                    style={{ color: 'var(--theme-text-main, #f1f5f9)' }}
                                    title={item.record.name}
                                  >
                                    {item.record.name}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )}

      {/* Barra de Acciones Inferior para Modo Selección - Estilo Glassmorphism ahumado */}
      {isSelectMode || selectedIds.size > 0 ? (
        <footer
          className="fixed bottom-0 left-0 right-0 z-50 w-full [backdrop-filter:blur(24px)_saturate(190%)] backdrop-blur-2xl px-3 sm:px-8 py-2 pb-[max(calc(env(safe-area-inset-bottom,0px)+0.5rem),0.75rem)] flex items-center justify-around border-t shadow-[0_-8px_32px_rgba(0,0,0,0.5)] select-none animate-in slide-in-from-bottom duration-200 overflow-hidden"
          style={{
            backgroundColor: 'var(--theme-bg-header, rgba(6, 11, 20, 0.75))',
            borderColor: 'var(--theme-border, rgba(255, 255, 255, 0.14))',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
          }}
        >
          {/* Reflejo especular superior fino */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          {/* 1. Mover seleccionados a otra carpeta */}
          {activeTab !== 'all' && activeTab !== 'favorites' && (
            <button
              type="button"
              onClick={() => setIsMoveModalOpen(true)}
              disabled={selectedIds.size === 0}
              className="flex flex-col items-center gap-1 py-1 px-2.5 text-zinc-300 hover:text-amber-400 disabled:opacity-30 disabled:pointer-events-none transition-colors duration-200 active:scale-95 cursor-pointer group"
              title="Mover seleccionados a otra carpeta"
              aria-label="Mover"
            >
              <Folder size={22} strokeWidth={1.5} className="text-zinc-300 group-hover:text-amber-400 transition-colors" />
              <span className="text-[11px] font-medium tracking-tight">Mover</span>
            </button>
          )}

          {/* 2. Sacar de la Bóveda (Exportar/Restaurar a galería del celular) */}
          <button
            type="button"
            onClick={handleBatchExport}
            disabled={selectedIds.size === 0 || isExportingBatch}
            className="flex flex-col items-center gap-1 py-1 px-2.5 text-zinc-300 hover:text-emerald-400 disabled:opacity-30 disabled:pointer-events-none transition-colors duration-200 active:scale-95 cursor-pointer group"
            title="Sacar de la bóveda a tu galería libre"
            aria-label="Sacar de la bóveda"
          >
            <Download
              size={22}
              strokeWidth={1.5}
              className={isExportingBatch ? 'animate-bounce text-emerald-400' : 'text-zinc-300 group-hover:text-emerald-400 transition-colors'}
            />
            <span className="text-[11px] font-medium tracking-tight">
              Sacar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
            </span>
          </button>

          {/* 3. Eliminar de la Bóveda */}
          <button
            type="button"
            onClick={handleBatchDelete}
            disabled={selectedIds.size === 0 || isDeletingBatch}
            className="flex flex-col items-center gap-1 py-1 px-2.5 text-zinc-300 hover:text-red-400 disabled:opacity-30 disabled:pointer-events-none transition-colors duration-200 active:scale-95 cursor-pointer group"
            title="Eliminar permanentemente de la bóveda"
            aria-label="Eliminar"
          >
            <Trash2 size={22} strokeWidth={1.5} className="text-red-400/90 group-hover:text-red-400 transition-colors" />
            <span className="text-[11px] font-medium text-red-400/90 group-hover:text-red-400 tracking-tight">
              Eliminar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
            </span>
          </button>

          {/* 4. Seleccionar Todos / Ninguno */}
          <button
            type="button"
            onClick={handleSelectAll}
            className="flex flex-col items-center gap-1 py-1 px-2.5 text-zinc-400 hover:text-zinc-100 transition-colors duration-200 active:scale-95 cursor-pointer group"
            title={selectedIds.size === filteredItems.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            aria-label="Seleccionar todos"
          >
            <CheckSquare size={22} strokeWidth={1.5} className="group-hover:text-zinc-100 transition-colors" />
            <span className="text-[11px] font-medium tracking-tight">
              {selectedIds.size === filteredItems.length ? 'Ninguno' : 'Todos'}
            </span>
          </button>

          {/* 5. Listo / Cancelar selección */}
          <button
            type="button"
            onClick={() => {
              setIsSelectMode(false);
              setSelectedIds(new Set());
            }}
            className="flex flex-col items-center gap-1 py-1 px-2.5 text-zinc-400 hover:text-zinc-100 transition-colors duration-200 active:scale-95 cursor-pointer group"
            title="Listo / Salir de selección"
            aria-label="Listo"
          >
            <X size={22} strokeWidth={1.5} className="group-hover:text-zinc-100 transition-colors" />
            <span className="text-[11px] font-medium tracking-tight">Listo</span>
          </button>
        </footer>
      ) : (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 w-full [backdrop-filter:blur(24px)_saturate(190%)] backdrop-blur-2xl border-t shadow-[0_-8px_32px_rgba(0,0,0,0.5)] select-none pb-[max(var(--safe-bottom,env(safe-area-inset-bottom,0px)),0.5rem)] pt-2 transition-all"
          style={{
            backgroundColor: 'var(--theme-bg-header, rgba(6, 11, 20, 0.75))',
            borderColor: 'var(--theme-border, rgba(255, 255, 255, 0.14))',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
          }}
        >
          {/* Reflejo especular superior fino tipo iOS */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="max-w-md mx-auto w-full px-2 sm:px-4 flex items-center justify-around">
            {/* Botón 1: Mi Bóveda */}
            <button
              type="button"
              onClick={() => {
                setActiveCategory(null);
                navigateToTab('vault');
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-1 px-1.5 transition-all duration-200 cursor-pointer active:scale-95 group ${
                activeNavTab === 'vault' ? 'vault-nav-btn-active font-bold' : 'vault-nav-btn-inactive font-medium'
              }`}
            >
              <Home
                className="w-5 h-5 transition-all duration-200"
                style={{
                  transform: activeNavTab === 'vault' ? 'scale(1.08)' : undefined,
                }}
                strokeWidth={activeNavTab === 'vault' ? 2.2 : 1.6}
              />
              <span
                className={`vault-nav-indicator-line h-[3px] rounded-full transition-all duration-200 ${
                  activeNavTab === 'vault' ? 'w-9 opacity-100 scale-x-100' : 'w-0 opacity-0 scale-x-0'
                }`}
              />
              <span className={`text-[10px] sm:text-[11px] tracking-tight leading-none ${activeNavTab === 'vault' ? 'font-bold' : 'font-medium'}`}>
                Mi Bóveda
              </span>
            </button>

            {/* Botón 2: Seguridad */}
            <button
              type="button"
              onClick={() => {
                setActiveCategory(null);
                navigateToTab('security');
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-1 px-1.5 transition-all duration-200 cursor-pointer active:scale-95 group ${
                activeNavTab === 'security' ? 'vault-nav-btn-active font-bold' : 'vault-nav-btn-inactive font-medium'
              }`}
            >
              <Shield
                className="w-5 h-5 transition-all duration-200"
                style={{
                  transform: activeNavTab === 'security' ? 'scale(1.08)' : undefined,
                }}
                strokeWidth={activeNavTab === 'security' ? 2.2 : 1.6}
              />
              <span
                className={`vault-nav-indicator-line h-[3px] rounded-full transition-all duration-200 ${
                  activeNavTab === 'security' ? 'w-9 opacity-100 scale-x-100' : 'w-0 opacity-0 scale-x-0'
                }`}
              />
              <span className={`text-[10px] sm:text-[11px] tracking-tight leading-none ${activeNavTab === 'security' ? 'font-bold' : 'font-medium'}`}>
                Seguridad
              </span>
            </button>

            {/* Botón 3: Info */}
            <button
              type="button"
              onClick={() => {
                setActiveCategory(null);
                navigateToTab('profile');
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-1 px-1.5 transition-all duration-200 cursor-pointer active:scale-95 group ${
                activeNavTab === 'profile' ? 'vault-nav-btn-active font-bold' : 'vault-nav-btn-inactive font-medium'
              }`}
            >
              <Info
                className="w-5 h-5 transition-all duration-200"
                style={{
                  transform: activeNavTab === 'profile' ? 'scale(1.08)' : undefined,
                }}
                strokeWidth={activeNavTab === 'profile' ? 2.2 : 1.6}
              />
              <span
                className={`vault-nav-indicator-line h-[3px] rounded-full transition-all duration-200 ${
                  activeNavTab === 'profile' ? 'w-9 opacity-100 scale-x-100' : 'w-0 opacity-0 scale-x-0'
                }`}
              />
              <span className={`text-[10px] sm:text-[11px] tracking-tight leading-none ${activeNavTab === 'profile' ? 'font-bold' : 'font-medium'}`}>
                Info
              </span>
            </button>

            {/* Botón 4: Configuración */}
            <button
              type="button"
              onClick={() => {
                setActiveCategory(null);
                navigateToTab('settings');
              }}
              className={`flex-1 flex flex-col items-center gap-1 py-1 px-1.5 transition-all duration-200 cursor-pointer active:scale-95 group ${
                activeNavTab === 'settings' ? 'vault-nav-btn-active font-bold' : 'vault-nav-btn-inactive font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Settings
                  className="w-5 h-5 transition-all duration-200"
                  style={{
                    transform: activeNavTab === 'settings' ? 'scale(1.08)' : undefined,
                  }}
                  strokeWidth={activeNavTab === 'settings' ? 2.2 : 1.6}
                />
                {(hasUpdatePending || liveUpdateAvailable) && (
                  <span
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
                    style={{
                      backgroundColor: 'var(--theme-primary, #00e5ff)',
                      boxShadow: '0 0 8px var(--theme-primary, #00e5ff)',
                    }}
                  />
                )}
              </div>
              <span
                className={`vault-nav-indicator-line h-[3px] rounded-full transition-all duration-200 ${
                  activeNavTab === 'settings' ? 'w-9 opacity-100 scale-x-100' : 'w-0 opacity-0 scale-x-0'
                }`}
              />
              <span className={`text-[10px] sm:text-[11px] tracking-tight leading-none ${activeNavTab === 'settings' ? 'font-bold' : 'font-medium'}`}>
                Ajustes
              </span>
            </button>
          </div>
        </nav>
      )}

        {/* Hidden File Inputs */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onClick={() => {
            (window as any).__isPickingFile = true;
            (window as any).__filePickingStartTime = Date.now();
          }}
          onChange={handleFileInputChange}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onClick={() => {
            (window as any).__isPickingFile = true;
            (window as any).__filePickingStartTime = Date.now();
          }}
          onChange={handleFileInputChange}
        />
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
          onChange={handleFileInputChange}
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
          onChange={handleFileInputChange}
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
          onChange={handleFileInputChange}
        />
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.rtf,.md,.csv,.xlsx,.xls,.pptx,.ppt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          multiple
          className="hidden"
          onClick={() => {
            (window as any).__isPickingFile = true;
            (window as any).__filePickingStartTime = Date.now();
          }}
          onChange={handleFileInputChange}
        />

      {/* Botón flotante (+) estilo WhatsApp para todas las funciones de añadir e importar en carpetas y subcarpetas */}
      {activeNavTab === 'vault' && activeCategory !== null && !isSelectMode && selectedIds.size === 0 && (
        <>
          {/* Telón oscuro difuminado al desplegar opciones */}
          {isWhatsAppFabOpen && (
            <div
              className="vault-fab-backdrop fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
              style={{
                WebkitBackdropFilter: 'blur(6px)',
                backdropFilter: 'blur(6px)',
              }}
              onClick={() => setIsWhatsAppFabOpen(false)}
            />
          )}

          {/* Opciones desplegadas sobre el botón según la carpeta o subcarpeta actual */}
          {isWhatsAppFabOpen && (
            <div className="fixed safe-bottom-fab-menu right-5 sm:right-6 z-50 flex flex-col items-end gap-3 select-none animate-in slide-in-from-bottom-4 fade-in duration-200">
              {/* Opción 1: Nueva Carpeta */}
              <button
                type="button"
                onClick={() => {
                  setIsWhatsAppFabOpen(false);
                  setIsCreateFolderOpen(true);
                }}
                className="flex items-center gap-3 group cursor-pointer active:scale-95 transition-transform"
              >
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap backdrop-blur-md border ${
                    currentTheme === 'light'
                      ? 'bg-white text-slate-900 border-slate-300 shadow-slate-300/60'
                      : 'bg-[#090d16]/95 text-white border-cyan-500/30 shadow-black/60'
                  }`}
                >
                  Nueva carpeta
                </span>
                <div className="vault-fab-circle-primary w-12 h-12 rounded-full bg-[#00e5ff] hover:bg-[#00cce6] text-black flex items-center justify-center shadow-lg shadow-cyan-500/40 border border-cyan-200/50 transition-all">
                  <FolderPlus
                    className="w-5 h-5 stroke-[2.4]"
                    color={currentTheme === 'light' ? '#ffffff' : '#090d16'}
                    style={{
                      color: currentTheme === 'light' ? '#ffffff' : '#090d16',
                      stroke: currentTheme === 'light' ? '#ffffff' : '#090d16',
                    }}
                  />
                </div>
              </button>

              {/* Opción 2: Abrir Cámara / Grabar según la carpeta */}
              <button
                type="button"
                onClick={() => {
                  setIsWhatsAppFabOpen(false);
                  setCameraInitialMode(activeCategory === 'video' ? 'video' : 'photo');
                  setIsCameraOpen(true);
                }}
                className="flex items-center gap-3 group cursor-pointer active:scale-95 transition-transform"
              >
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap backdrop-blur-md border ${
                    currentTheme === 'light'
                      ? 'bg-white text-slate-900 border-slate-300 shadow-slate-300/60'
                      : 'bg-[#090d16]/95 text-white border-cyan-500/30 shadow-black/60'
                  }`}
                >
                  {activeCategory === 'video' ? 'Grabar video' : 'Abrir cámara'}
                </span>
                <div className="vault-fab-circle-primary w-12 h-12 rounded-full bg-[#00e5ff] hover:bg-[#00cce6] text-black flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-300/50 transition-all">
                  <Camera
                    className="w-5 h-5 stroke-[2.4]"
                    color={currentTheme === 'light' ? '#ffffff' : '#090d16'}
                    style={{
                      color: currentTheme === 'light' ? '#ffffff' : '#090d16',
                      stroke: currentTheme === 'light' ? '#ffffff' : '#090d16',
                    }}
                  />
                </div>
              </button>

              {/* Opción contextual según la categoría de la carpeta/subcarpeta */}
              {activeCategory === 'photo' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsWhatsAppFabOpen(false);
                    triggerPicker(photoInputRef);
                  }}
                  className="flex items-center gap-3 group cursor-pointer active:scale-95 transition-transform"
                >
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap backdrop-blur-md border ${
                      currentTheme === 'light'
                        ? 'bg-white text-slate-900 border-slate-300 shadow-slate-300/60'
                        : 'bg-[#090d16]/95 text-white border-cyan-500/30 shadow-black/60'
                    }`}
                  >
                    Añadir fotos
                  </span>
                  <div className="vault-fab-circle-blue w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/40 transition-all">
                    <ImageIcon
                      className="w-5 h-5 stroke-[2.4]"
                      color="#ffffff"
                      style={{ color: '#ffffff', stroke: '#ffffff' }}
                    />
                  </div>
                </button>
              )}

              {activeCategory === 'video' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsWhatsAppFabOpen(false);
                    triggerPicker(videoInputRef);
                  }}
                  className="flex items-center gap-3 group cursor-pointer active:scale-95 transition-transform"
                >
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap backdrop-blur-md border ${
                      currentTheme === 'light'
                        ? 'bg-white text-slate-900 border-slate-300 shadow-slate-300/60'
                        : 'bg-[#090d16]/95 text-white border-cyan-500/30 shadow-black/60'
                    }`}
                  >
                    Añadir videos
                  </span>
                  <div className="vault-fab-circle-indigo w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-indigo-400/40 transition-all">
                    <Film
                      className="w-5 h-5 stroke-[2.4]"
                      color="#ffffff"
                      style={{ color: '#ffffff', stroke: '#ffffff' }}
                    />
                  </div>
                </button>
              )}

              {activeCategory === 'audio' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsWhatsAppFabOpen(false);
                    triggerPicker(audioInputRef);
                  }}
                  className="flex items-center gap-3 group cursor-pointer active:scale-95 transition-transform"
                >
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap backdrop-blur-md border ${
                      currentTheme === 'light'
                        ? 'bg-white text-slate-900 border-slate-300 shadow-slate-300/60'
                        : 'bg-[#090d16]/95 text-white border-cyan-500/30'
                    }`}
                  >
                    Añadir audios
                  </span>
                  <div className="vault-fab-circle-amber w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-300/40 transition-all">
                    <Music
                      className="w-5 h-5 stroke-[2.4]"
                      color={currentTheme === 'light' ? '#ffffff' : '#090d16'}
                      style={{
                        color: currentTheme === 'light' ? '#ffffff' : '#090d16',
                        stroke: currentTheme === 'light' ? '#ffffff' : '#090d16',
                      }}
                    />
                  </div>
                </button>
              )}

              {activeCategory === 'app' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsWhatsAppFabOpen(false);
                    triggerPicker(appInputRef);
                  }}
                  className="flex items-center gap-3 group cursor-pointer active:scale-95 transition-transform"
                >
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap backdrop-blur-md border ${
                      currentTheme === 'light'
                        ? 'bg-white text-slate-900 border-slate-300 shadow-slate-300/60'
                        : 'bg-[#090d16]/95 text-white border-cyan-500/30'
                    }`}
                  >
                    Añadir aplicaciones
                  </span>
                  <div className="vault-fab-circle-emerald w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-emerald-300/40 transition-all">
                    <Package
                      className="w-5 h-5 stroke-[2.4]"
                      color={currentTheme === 'light' ? '#ffffff' : '#090d16'}
                      style={{
                        color: currentTheme === 'light' ? '#ffffff' : '#090d16',
                        stroke: currentTheme === 'light' ? '#ffffff' : '#090d16',
                      }}
                    />
                  </div>
                </button>
              )}

              {activeCategory === 'document' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsWhatsAppFabOpen(false);
                    triggerPicker(docInputRef);
                  }}
                  className="flex items-center gap-3 group cursor-pointer active:scale-95 transition-transform"
                >
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap backdrop-blur-md border ${
                      currentTheme === 'light'
                        ? 'bg-white text-slate-900 border-slate-300 shadow-slate-300/60'
                        : 'bg-[#090d16]/95 text-white border-cyan-500/30'
                    }`}
                  >
                    Añadir documentos
                  </span>
                  <div className="vault-fab-circle-blue w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/40 transition-all">
                    <FileText
                      className="w-5 h-5 stroke-[2.4]"
                      color="#ffffff"
                      style={{ color: '#ffffff', stroke: '#ffffff' }}
                    />
                  </div>
                </button>
              )}

              {/* Botón para añadir archivos de cualquier tipo si está dentro de una carpeta específica */}
              {activeCategory !== 'app' && activeCategory !== 'document' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsWhatsAppFabOpen(false);
                    triggerPicker(appInputRef);
                  }}
                  className="flex items-center gap-3 group cursor-pointer active:scale-95 transition-transform"
                >
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap backdrop-blur-md border ${
                      currentTheme === 'light'
                        ? 'bg-white text-slate-900 border-slate-300 shadow-slate-300/60'
                        : 'bg-[#090d16]/95 text-white border-cyan-500/30'
                    }`}
                  >
                    Otros archivos
                  </span>
                  <div className="vault-fab-circle-docs w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-[#00e5ff] flex items-center justify-center shadow-lg shadow-black/40 border border-slate-700 transition-all">
                    <FileText
                      className="w-5 h-5 stroke-[2.2]"
                      color={currentTheme === 'light' ? '#0284c7' : '#00e5ff'}
                      style={{
                        color: currentTheme === 'light' ? '#0284c7' : '#00e5ff',
                        stroke: currentTheme === 'light' ? '#0284c7' : '#00e5ff',
                      }}
                    />
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Botón flotante estilizado (FAB) */}
          <div className="fixed safe-bottom-fab right-5 sm:right-6 z-40 select-none">
            <button
              type="button"
              onClick={() => setIsWhatsAppFabOpen((prev) => !prev)}
              className="w-14 h-14 rounded-2xl bg-zinc-100 hover:bg-white active:scale-90 text-zinc-950 flex items-center justify-center shadow-xl shadow-black/40 border border-zinc-200/50 transition-all duration-300 cursor-pointer group"
              title={isWhatsAppFabOpen ? 'Cerrar opciones' : 'Añadir a esta carpeta'}
              aria-label="Añadir a esta carpeta"
            >
              <Plus
                size={26}
                strokeWidth={2}
                className={`text-zinc-950 transition-transform duration-300 ease-out ${
                  isWhatsAppFabOpen ? 'rotate-45' : 'rotate-0 group-hover:rotate-90'
                }`}
              />
            </button>
          </div>
        </>
      )}

      {/* Lightbox / Video / App Detail Modal */}
      {activeViewerItem && (
        <PhotoViewerModal
          currentItem={activeViewerItem}
          allItems={filteredItems}
          onClose={() => setActiveViewerItem(null)}
          onDelete={handleDeleteItem}
          onToggleFavorite={handleToggleFavorite}
          onRenameItem={handleRenameSingleItem}
          onMoveItem={handleMoveSingleItem}
          onCopyItemToFolder={handleCopySingleItem}
          onUpdateItemBlob={handleUpdateItemBlob}
          availableFolders={(() => {
            const itemCat = activeViewerItem.record.category || 'photo';
            const baseList = customFolders[itemCat] || ['General'];
            const folderSet = new Set<string>(baseList);
            items.forEach((it) => {
              if (it.record.category === itemCat && it.record.album) {
                folderSet.add(it.record.album);
              }
            });
            return Array.from(folderSet);
          })()}
          onCreateFolder={(folderName) =>
            handleCreateFolder(folderName, {
              switchToFolder: false,
              categoryOverride: activeViewerItem.record.category,
            })
          }
          showToast={showToast}
        />
      )}

      {/* Camera & Video Recorder Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        initialMode={cameraInitialMode}
        onClose={() => setIsCameraOpen(false)}
        onMediaCaptured={async (buffer, mimeType, filename) => {
          const encrypted = await encryptBuffer(buffer, masterKey);
          const category = detectCategory(filename, mimeType);
          const newRecord: EncryptedVaultItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            timestamp: Date.now(),
            name: filename,
            mimeType,
            size: buffer.byteLength,
            iv: encrypted.iv,
            data: encrypted.data,
            album: activeSubfolder !== null ? activeSubfolder : 'General',
            isFavorite: false,
            category,
          };
          await saveEncryptedItem(newRecord);
          await loadVaultItems();
          showToast(`Guardado en la carpeta ${category === 'photo' ? 'Fotos' : 'Videos'}`, 'success');
          setActiveTab(category === 'photo' ? 'photo' : 'video');
        }}
        showToast={showToast}
      />

      {/* Delete from phone gallery reminder modal */}
      <DeleteGalleryReminderModal
        isOpen={importedCountForReminder > 0}
        count={importedCountForReminder}
        recentItems={recentImportedItems}
        onOpenVaultCamera={() => setIsCameraOpen(true)}
        onClose={() => setImportedCountForReminder(0)}
      />

      {/* Batch Encryption Progress Overlay */}
      {encryptingProgress && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-sm bg-[#131c2e] border border-indigo-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center animate-pulse">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Cifrando con AES-256 ({encryptingProgress.current} de {encryptingProgress.total})
              </h4>
              <p className="text-xs text-slate-400 truncate max-w-[260px] mx-auto mt-1 font-mono">
                {encryptingProgress.name}
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-200"
                style={{
                  width: `${Math.round((encryptingProgress.current / encryptingProgress.total) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Cifrando y guardando localmente en tu teléfono...
            </p>
          </div>
        </div>
      )}

      {/* Batch Export / Sacar Confirmation & Progress Modal */}
      {showBatchExportModal && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-sm bg-[#0a121d] border border-slate-800/90 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            {isExportingBatch ? (
              <div className="space-y-4 py-1">
                <div className="w-14 h-14 bg-[#00e5ff]/10 border border-[#00e5ff]/30 rounded-2xl flex items-center justify-center mx-auto text-[#00e5ff] relative shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                  {isExportComplete ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-in zoom-in-75 duration-200" />
                  ) : (
                    <Download className="w-7 h-7 animate-bounce text-[#00e5ff]" />
                  )}
                </div>

                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    {isExportComplete
                      ? '¡Fotos sacadas con éxito!'
                      : `Sacando a tu galería (${exportCurrentIndex}/${exportTotalCount})`}
                  </h4>
                  <p className="text-xs text-slate-400 truncate max-w-[260px] mx-auto">
                    {isExportComplete
                      ? 'Los archivos se restauraron en tu celular'
                      : exportCurrentFileName || 'Procesando archivo...'}
                  </p>
                </div>

                {/* Barra de progreso interactiva y dinámica */}
                <div className="space-y-2 pt-1 text-left">
                  <div className="flex items-center justify-between text-xs font-semibold px-1">
                    <span className="text-slate-400 font-mono">
                      {exportCurrentIndex} de {exportTotalCount}
                    </span>
                    <span className="text-[#00e5ff] font-mono font-bold">
                      {Math.round(exportProgress)}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(0,229,255,0.5)]"
                      style={{ width: `${Math.min(100, Math.max(exportProgress, 5))}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 italic text-center">
                    Guardando en la galería y retirando de la bóveda...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 bg-[#00e5ff]/10 border border-[#00e5ff]/30 rounded-2xl flex items-center justify-center mx-auto text-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                  <Download className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    ¿Sacar {selectedIds.size} elemento{selectedIds.size > 1 ? 's' : ''} a tu galería?
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Los archivos se restaurarán a la galería y almacenamiento de tu teléfono, y se retirarán de la bóveda privada.
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBatchExportModal(false)}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmBatchExport}
                    className="flex-1 py-2.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4 stroke-[2]" />
                    <span>Sacar ({selectedIds.size})</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-xs bg-[#0a121d] border border-slate-800/90 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-1">
                ¿Eliminar {selectedIds.size} elemento{selectedIds.size > 1 ? 's' : ''}?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Esta acción es irreversible y eliminará permanentemente los archivos seleccionados de tu bóveda cifrada.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmBatchDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/50 transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create Subfolder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        category={activeTab === 'all' || activeTab === 'favorites' ? 'photo' : activeTab}
        existingFolders={activeCategoryFolders}
        onCreate={handleCreateFolder}
      />

      {/* Move Selected Items to Folder Modal */}
      <MoveToFolderModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        selectedCount={selectedIds.size}
        category={activeTab === 'all' || activeTab === 'favorites' ? 'photo' : activeTab}
        currentFolder={activeSubfolder !== null ? activeSubfolder : 'General'}
        folders={activeCategoryFolders}
        onMove={handleMoveSelected}
        onOpenCreateFolder={() => setIsCreateFolderOpen(true)}
      />

      {/* Rename Subfolder Modal */}
      {folderToRename && (
        <RenameFolderModal
          isOpen={!!folderToRename}
          onClose={() => setFolderToRename(null)}
          category={activeTab === 'all' || activeTab === 'favorites' ? 'photo' : activeTab}
          currentFolderName={folderToRename}
          existingFolders={activeCategoryFolders}
          onRename={handleRenameFolder}
        />
      )}

      {/* Modal de PIN Extra de 4 dígitos para abrir o crear la Carpeta con PIN */}
      <ExtraPinModal
        isOpen={showExtraPinModal}
        mode={extraPinConfiguredState ? 'unlock' : 'setup'}
        categoryLabel={
          activeCategory === 'photo'
            ? 'Fotos'
            : activeCategory === 'video'
            ? 'Videos'
            : activeCategory === 'audio'
            ? 'Audios'
            : activeCategory === 'document'
            ? 'Documentos'
            : 'Aplicaciones'
        }
        mainVaultPin={sessionPin}
        onClose={() => setShowExtraPinModal(false)}
        onSuccess={() => {
          setExtraPinConfiguredState(true);
          setIsExtraPinUnlocked(true);
          setShowExtraPinModal(false);
          setCarpetaActiva(EXTRA_PIN_FOLDER_NAME);
        }}
      />
    </div>
  );
};
