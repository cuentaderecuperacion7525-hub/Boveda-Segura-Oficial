import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Download,
  Trash2,
  RotateCcw,
  RotateCw,
  Copy,
  Info,
  Calendar,
  HardDrive,
  Folder,
  FolderPlus,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Share2,
  Plus,
  MoreVertical,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Smartphone,
  Box,
  FileCode,
  PackageCheck,
  Music,
  Check,
  Edit2,
} from 'lucide-react';
import { EncryptedVaultItem } from '../db/vaultDb';
import { registerBackHandler } from '../services/backButtonService';
import { exportVaultItemToDevice } from '../services/nativeVaultBridge';
import { BarraAccionesInferior } from './BarraAccionesInferior';
import { ModalEliminar } from './ModalEliminar';
import { formatSize as formatBytes } from '../utils/formatUtils';
import { DocumentReader } from './DocumentReader';
import { generateVideoThumbnail, getCachedVideoThumbnail } from '../services/videoThumbnailService';
import { VaultAudioPlayerScreen } from './VaultAudioPlayerScreen';
import { vaultAudioEngine } from '../services/vaultAudioEngine';

export interface DecryptedVaultItem {
  id: string;
  blobUrl: string;
  record: EncryptedVaultItem;
  thumbnailUrl?: string;
  duration?: number;
}

interface VaultItemViewerModalProps {
  currentItem: DecryptedVaultItem | null;
  allItems: DecryptedVaultItem[];
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onToggleFavorite: (id: string, isFav: boolean) => Promise<void>;
  onRenameItem?: (id: string, newName: string) => Promise<void>;
  onMoveItem?: (id: string, targetFolder: string) => Promise<void>;
  onCopyItemToFolder?: (id: string, targetFolder: string) => Promise<void>;
  onUpdateItemBlob?: (id: string, newBlob: Blob) => Promise<string | void>;
  availableFolders?: string[];
  onCreateFolder?: (folderName: string) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'alert' | 'error') => void;
}

export const PhotoViewerModal: React.FC<VaultItemViewerModalProps> = ({
  currentItem,
  allItems,
  onClose,
  onDelete,
  onToggleFavorite,
  onRenameItem,
  onMoveItem,
  onCopyItemToFolder,
  onUpdateItemBlob,
  availableFolders = ['General'],
  onCreateFolder,
  showToast,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [isImmersive, setIsImmersive] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStage, setExportStage] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Nuevos estados para el menú "Más (⋮)" y modales funcionales
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [renameValue, setRenameValue] = useState<string>('');
  const [renameError, setRenameError] = useState<string>('');
  const [isMoveModalOpen, setIsMoveModalOpen] = useState<boolean>(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);
  const [newFolderInputOpen, setNewFolderInputOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isRotatingSave, setIsRotatingSave] = useState<boolean>(false);

  // Video playback controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [videoPoster, setVideoPoster] = useState<string>('');
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showUnmutePrompt, setShowUnmutePrompt] = useState<boolean>(false);
  const [showVideoControls, setShowVideoControls] = useState<boolean>(true);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<{ side: 'left' | 'right'; label: string } | null>(null);
  const hideControlsTimerRef = useRef<any>(null);
  const doubleTapFeedbackTimerRef = useRef<any>(null);
  const lastVideoTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  // Back button handlers for sub-modals and menus inside the viewer

  useEffect(() => {
    if (isRenameModalOpen || isMoveModalOpen || isCopyModalOpen) {
      return registerBackHandler('viewer_submodal', () => {
        setIsRenameModalOpen(false);
        setIsMoveModalOpen(false);
        setIsCopyModalOpen(false);
        setNewFolderInputOpen(false);
        return true;
      }, 98);
    }
  }, [isRenameModalOpen, isMoveModalOpen, isCopyModalOpen]);

  useEffect(() => {
    if (showMoreMenu) {
      return registerBackHandler('viewer_more_menu', () => {
        setShowMoreMenu(false);
        return true;
      }, 97);
    }
  }, [showMoreMenu]);

  // Back button in immersive mode exits immersive mode first
  useEffect(() => {
    if (isImmersive) {
      return registerBackHandler('viewer_immersive', () => {
        setIsImmersive(false);
        setScale(1);
        setPosition({ x: 0, y: 0 });
        return true;
      }, 96);
    }
  }, [isImmersive]);

  const activeItemIdRef = useRef<string | null>(null);
  const prevInitialItemIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentItem) {
      onClose();
      return;
    }

    const isNewOpen = prevInitialItemIdRef.current !== currentItem.id;
    prevInitialItemIdRef.current = currentItem.id;

    if (isNewOpen) {
      const idx = allItems.findIndex((p) => p.id === currentItem.id);
      if (idx === -1 && allItems.length > 0) {
        onClose();
        return;
      }
      activeItemIdRef.current = currentItem.id;
      setCurrentIndex(idx);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setIsPlaying(false);
      setVideoProgress(0);
      setIsImmersive(false);
      setShowMoreMenu(false);
      return;
    }

    // Si cambió la lista (p. ej. al mover, copiar o eliminar mientras se navega en el visor)
    if (allItems.length === 0) {
      onClose();
      return;
    }

    const trackedId = activeItemIdRef.current || currentItem.id;
    const existingIdx = allItems.findIndex((p) => p.id === trackedId);
    if (existingIdx !== -1) {
      setCurrentIndex(existingIdx);
    } else {
      // El elemento actual salió de la carpeta actual (ej. se movió a otra carpeta): avanzar al contiguo
      const clampedIdx = Math.min(Math.max(0, currentIndex), allItems.length - 1);
      setCurrentIndex(clampedIdx);
      activeItemIdRef.current = allItems[clampedIdx]?.id || null;
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setIsPlaying(false);
      setShowMoreMenu(false);
    }
  }, [currentItem?.id, allItems.length]);

  const activeItem = currentIndex >= 0 && allItems[currentIndex] ? allItems[currentIndex] : currentItem;
  if (activeItem) {
    activeItemIdRef.current = activeItem.id;
  }

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const nextIdx = currentIndex - 1;
      activeItemIdRef.current = allItems[nextIdx]?.id || null;
      setCurrentIndex(nextIdx);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setIsPlaying(false);
      setIsImmersive(false);
      setShowMoreMenu(false);
    }
  }, [currentIndex, allItems]);

  const handleNext = useCallback(() => {
    if (currentIndex < allItems.length - 1) {
      const nextIdx = currentIndex + 1;
      activeItemIdRef.current = allItems[nextIdx]?.id || null;
      setCurrentIndex(nextIdx);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setIsPlaying(false);
      setIsImmersive(false);
      setShowMoreMenu(false);
    }
  }, [currentIndex, allItems]);

  // Gestos táctiles: Pellizco (Pinch-to-zoom) y arrastre acotado a los bordes de la imagen
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const isPinchingRef = useRef<boolean>(false);
  const pinchStartDistRef = useRef<number>(0);
  const pinchStartScaleRef = useRef<number>(1);
  const pinchStartCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const posStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);

  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const positionRef = useRef(position);
  positionRef.current = position;

  const getBounds = useCallback((curScale: number) => {
    const container = containerRef.current;
    const img = imageRef.current;
    if (!container || !img) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxX = Math.max(0, (vw * curScale - vw) / 2);
      const maxY = Math.max(0, (vh * curScale - vh) / 2);
      return { maxX, maxY };
    }

    const vw = container.clientWidth;
    const vh = container.clientHeight;

    const w0 = img.clientWidth || img.offsetWidth || img.naturalWidth || vw;
    const h0 = img.clientHeight || img.offsetHeight || img.naturalHeight || vh;

    const isRotated90 = Math.abs(rotation % 180) !== 0;
    const baseW = isRotated90 ? h0 : w0;
    const baseH = isRotated90 ? w0 : h0;

    const displayW = baseW * curScale;
    const displayH = baseH * curScale;

    const maxX = Math.max(0, (displayW - vw) / 2);
    const maxY = Math.max(0, (displayH - vh) / 2);

    return { maxX, maxY };
  }, [rotation]);

  const clampWithDamping = (val: number, max: number) => {
    if (max <= 0) {
      return val * 0.15;
    }
    if (val > max) {
      return max + (val - max) * 0.2;
    }
    if (val < -max) {
      return -max + (val + max) * 0.2;
    }
    return val;
  };

  const clampPosition = useCallback((pos: { x: number; y: number }, curScale: number) => {
    if (curScale <= 1.05) {
      return { x: 0, y: 0 };
    }
    const { maxX, maxY } = getBounds(curScale);
    return {
      x: maxX > 0 ? Math.min(Math.max(pos.x, -maxX), maxX) : 0,
      y: maxY > 0 ? Math.min(Math.max(pos.y, -maxY), maxY) : 0,
    };
  }, [getBounds]);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const isDraggingMouseRef = useRef<boolean>(false);
  const mouseStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (
      activeItem?.record.category === 'document' ||
      activeItem?.record.category === 'audio' ||
      activeItem?.record.mimeType?.startsWith('audio/')
    ) {
      return;
    }
    if (showMoreMenu) {
      setShowMoreMenu(false);
    }
    hasMovedRef.current = false;

    if (e.touches.length === 2) {
      isPinchingRef.current = true;
      setIsInteracting(true);
      hasMovedRef.current = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      pinchStartDistRef.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      pinchStartScaleRef.current = scaleRef.current;
      pinchStartCenterRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      pinchStartPosRef.current = { ...positionRef.current };
      panStartRef.current = null;
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }

    if (e.touches.length === 1) {
      isPinchingRef.current = false;
      const t = e.touches[0];

      if (scaleRef.current > 1.05) {
        setIsInteracting(true);
        panStartRef.current = { x: t.clientX, y: t.clientY };
        posStartRef.current = { ...positionRef.current };
        touchStartXRef.current = null;
        touchStartYRef.current = null;
      } else {
        panStartRef.current = null;
        touchStartXRef.current = t.clientX;
        touchStartYRef.current = t.clientY;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      activeItem?.record.category === 'document' ||
      activeItem?.record.category === 'audio' ||
      activeItem?.record.mimeType?.startsWith('audio/')
    ) {
      return;
    }
    if (e.touches.length === 2 && isPinchingRef.current) {
      hasMovedRef.current = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      if (pinchStartDistRef.current > 0) {
        const factor = dist / pinchStartDistRef.current;
        const targetScale = Math.min(Math.max(pinchStartScaleRef.current * factor, 0.75), 8);
        setScale(targetScale);

        const curCenter = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };
        const dx = curCenter.x - pinchStartCenterRef.current.x;
        const dy = curCenter.y - pinchStartCenterRef.current.y;
        const rawX = pinchStartPosRef.current.x + dx;
        const rawY = pinchStartPosRef.current.y + dy;

        const { maxX, maxY } = getBounds(targetScale);
        setPosition({
          x: clampWithDamping(rawX, maxX),
          y: clampWithDamping(rawY, maxY),
        });
      }
      return;
    }

    if (e.touches.length === 1 && scaleRef.current > 1.05 && panStartRef.current) {
      const t = e.touches[0];
      const dx = t.clientX - panStartRef.current.x;
      const dy = t.clientY - panStartRef.current.y;

      if (Math.hypot(dx, dy) > 3) {
        hasMovedRef.current = true;
      }

      const { maxX, maxY } = getBounds(scaleRef.current);
      const rawX = posStartRef.current.x + dx;
      const rawY = posStartRef.current.y + dy;

      setPosition({
        x: clampWithDamping(rawX, maxX),
        y: clampWithDamping(rawY, maxY),
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (
      activeItem?.record.category === 'document' ||
      activeItem?.record.category === 'audio' ||
      activeItem?.record.mimeType?.startsWith('audio/')
    ) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }
    setIsInteracting(false);

    if (isPinchingRef.current) {
      if (e.touches && e.touches.length === 1 && scaleRef.current > 1.05) {
        isPinchingRef.current = false;
        const t = e.touches[0];
        panStartRef.current = { x: t.clientX, y: t.clientY };
        posStartRef.current = { ...positionRef.current };
        return;
      }
      isPinchingRef.current = false;
      if (scaleRef.current <= 1.05) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition(clampPosition(positionRef.current, scaleRef.current));
      }
      return;
    }

    if (panStartRef.current) {
      panStartRef.current = null;
      if (scaleRef.current <= 1.05) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition(clampPosition(positionRef.current, scaleRef.current));
      }
      return;
    }

    if (touchStartXRef.current !== null && touchStartYRef.current !== null && e.changedTouches && e.changedTouches.length > 0) {
      const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
      const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
      touchStartXRef.current = null;
      touchStartYRef.current = null;

      if (scaleRef.current <= 1.05) {
        if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
          hasMovedRef.current = true;
          if (deltaX < 0) {
            handleNext();
          } else {
            handlePrev();
          }
        } else if (Math.abs(deltaY) > 80 && Math.abs(deltaY) > Math.abs(deltaX) * 1.3) {
          hasMovedRef.current = true;
          onClose();
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!activeItem || activeItem.record.category !== 'photo') return;
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setScale((prev) => {
      const next = Math.min(Math.max(prev + delta, 1), 6);
      if (next <= 1.02) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      setPosition((curPos) => clampPosition(curPos, next));
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1.05) {
      isDraggingMouseRef.current = true;
      setIsInteracting(true);
      mouseStartRef.current = { x: e.clientX, y: e.clientY };
      posStartRef.current = { ...position };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingMouseRef.current && mouseStartRef.current && scaleRef.current > 1.05) {
      hasMovedRef.current = true;
      const dx = e.clientX - mouseStartRef.current.x;
      const dy = e.clientY - mouseStartRef.current.y;
      const { maxX, maxY } = getBounds(scaleRef.current);
      const rawX = posStartRef.current.x + dx;
      const rawY = posStartRef.current.y + dy;
      setPosition({
        x: clampWithDamping(rawX, maxX),
        y: clampWithDamping(rawY, maxY),
      });
    }
  };

  const handleMouseUp = () => {
    if (isDraggingMouseRef.current) {
      isDraggingMouseRef.current = false;
      setIsInteracting(false);
      mouseStartRef.current = null;
      setPosition(clampPosition(positionRef.current, scaleRef.current));
    }
  };

  const singleTapTimeoutRef = useRef<any>(null);
  const lastTapRef = useRef<number>(0);

  const handlePhotoTap = (e?: React.MouseEvent) => {
    if (
      activeItem?.record.category === 'document' ||
      activeItem?.record.category === 'audio' ||
      activeItem?.record.mimeType?.startsWith('audio/')
    ) {
      return;
    }
    if (e) {
      e.stopPropagation();
    }
    if (showMoreMenu) {
      setShowMoreMenu(false);
      return;
    }
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }

    const ahora = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (ahora - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      if (scale > 1.05) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2.5);
        setPosition({ x: 0, y: 0 });
      }
    } else {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
      singleTapTimeoutRef.current = setTimeout(() => {
        setIsImmersive((prev) => {
          const next = !prev;
          if (next) {
            setShowDetails(false);
            setShowMoreMenu(false);
          }
          return next;
        });
        singleTapTimeoutRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
    lastTapRef.current = ahora;
  };

  useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDeleteConfirm || isRenameModalOpen || isMoveModalOpen || isCopyModalOpen) return;
      if (e.key === 'Escape') {
        if (showMoreMenu) {
          setShowMoreMenu(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === ' ' && activeItem?.record.category === 'video') {
        e.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onClose,
    handlePrev,
    handleNext,
    showDeleteConfirm,
    isRenameModalOpen,
    isMoveModalOpen,
    isCopyModalOpen,
    showMoreMenu,
    activeItem,
  ]);

  if (!activeItem) return null;

  const isVideo = activeItem.record.category === 'video';
  const isAudio = activeItem.record.category === 'audio' || activeItem.record.mimeType?.startsWith('audio/');
  const isDocument = activeItem.record.category === 'document';
  const isApp = activeItem.record.category === 'app';
  const isPhoto = activeItem.record.category === 'photo';

  const handleExport = async () => {
    if (!activeItem || isExporting) return;
    setIsExporting(true);
    setExportProgress(15);
    setExportStage('Preparando archivo...');
    try {
      await new Promise((r) => setTimeout(r, 120));
      setExportProgress(45);
      setExportStage('Guardando en la galería de tu dispositivo...');

      const res = await exportVaultItemToDevice({
        blobUrl: activeItem.blobUrl,
        filename: activeItem.record.name || `archivo_caja_fuerte_${activeItem.id}`,
        mimeType: activeItem.record.mimeType,
        category: activeItem.record.category,
      });

      if (!res.success) {
        showToast(res.error || 'No se pudo guardar el archivo en el dispositivo', 'error');
        return;
      }

      setExportProgress(85);
      setExportStage('Retirando de la bóveda privada...');
      if (isAudio) {
        vaultAudioEngine.stopAndRevoke();
      }
      await onDelete(activeItem.id);

      setExportProgress(100);
      setExportStage('¡Listo! Guardado en tu galería');
      await new Promise((r) => setTimeout(r, 400));

      showToast(
        isApp
          ? 'Aplicación / Archivo sacado de la caja fuerte a tu dispositivo'
          : isAudio
          ? 'Audio sacado de la caja fuerte a tu dispositivo'
          : isVideo
          ? 'Video sacado de la caja fuerte a tu galería'
          : 'Foto sacada de la caja fuerte a tu galería',
        'success'
      );
      onClose();
    } catch (err: any) {
      console.error('Error al sacar elemento:', err);
      showToast('Error al sacar el elemento de la bóveda', 'error');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportStage('');
    }
  };

  // 1. COMPARTIR (Usa el menú nativo de compartir del sistema o descarga segura si no está soportado)
  const handleShare = async () => {
    if (!activeItem) return;
    setShowMoreMenu(false);
    try {
      const response = await fetch(activeItem.blobUrl);
      const blob = await response.blob();
      const mimeType = activeItem.record.mimeType || blob.type || 'image/jpeg';
      const file = new File([blob], activeItem.record.name || 'archivo.jpg', { type: mimeType });

      if (typeof navigator !== 'undefined' && navigator.share) {
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          (window as any).__isPickingFile = true;
          (window as any).__filePickingStartTime = Date.now();
          try {
            await navigator.share({
              files: [file],
              title: activeItem.record.name,
            });
          } finally {
            setTimeout(() => {
              (window as any).__isPickingFile = false;
            }, 3000);
          }
          return;
        }
      }

      // Fallback de descarga directa si el navegador/WebView no soporta Web Share API con archivos
      const a = document.createElement('a');
      a.href = activeItem.blobUrl;
      a.download = activeItem.record.name || 'archivo';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Archivo preparado para compartir / guardar', 'success');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      showToast('No se pudo abrir el menú de compartir en este dispositivo', 'alert');
    }
  };

  // 2. GIRAR (Gira 90° a la derecha y guarda permanentemente en la bóveda cifrada)
  const handleRotate90AndPersist = async () => {
    if (!activeItem) return;
    setShowMoreMenu(false);

    if (!isPhoto) {
      setRotation((prev) => (prev + 90) % 360);
      return;
    }

    if (!onUpdateItemBlob || isRotatingSave) {
      setRotation((prev) => (prev + 90) % 360);
      showToast('Imagen girada 90°', 'info');
      return;
    }

    setIsRotatingSave(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
        img.src = activeItem.blobUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalHeight || img.height;
      canvas.height = img.naturalWidth || img.width;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Error de lienzo');

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      const outMime = activeItem.record.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
      const rotatedBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), outMime, 0.94)
      );

      if (rotatedBlob) {
        await onUpdateItemBlob(activeItem.id, rotatedBlob);
        setRotation(0);
        setScale(1);
        setPosition({ x: 0, y: 0 });
        showToast('Imagen girada y guardada', 'success');
      }
    } catch (err) {
      console.error('Error al girar y guardar imagen:', err);
      setRotation((prev) => (prev + 90) % 360);
      showToast('Imagen girada', 'info');
    } finally {
      setIsRotatingSave(false);
    }
  };

  // 3. ABRIR MODAL CAMBIAR NOMBRE
  const handleOpenRenameModal = () => {
    if (!activeItem) return;
    setShowMoreMenu(false);
    setRenameValue(activeItem.record.name || '');
    setRenameError('');
    setIsRenameModalOpen(true);
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError('El nombre no puede estar vacío');
      return;
    }

    // Conservar extensión original si el usuario no escribió ninguna extensión
    const oldName = activeItem.record.name || '';
    const dotIdx = oldName.lastIndexOf('.');
    const oldExt = dotIdx > 0 ? oldName.substring(dotIdx) : '';
    const finalName =
      oldExt && !trimmed.includes('.') ? `${trimmed}${oldExt}` : trimmed;

    try {
      if (onRenameItem) {
        await onRenameItem(activeItem.id, finalName);
      }
      setIsRenameModalOpen(false);
    } catch {
      setRenameError('Error al cambiar el nombre');
    }
  };

  // 5. COPIAR AL PORTAPAPELES
  const handleCopyToClipboard = async () => {
    try {
      const response = await fetch(activeItem.blobUrl);
      const blob = await response.blob();
      const item = new ClipboardItem({ [blob.type || 'image/png']: blob });
      await navigator.clipboard.write([item]);
      showToast('Imagen copiada al portapapeles', 'success');
      setIsCopyModalOpen(false);
    } catch {
      showToast('No se puede copiar directamente al portapapeles este archivo', 'alert');
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeItem) return;
    setIsDeleting(true);
    try {
      setShowDeleteConfirm(false);
      if (isAudio) {
        vaultAudioEngine.stopAndRevoke();
      }
      await onDelete(activeItem.id);
      showToast('Elemento movido a la Papelera de Reciclaje (30 días)', 'info');
      onClose();
    } catch {
      showToast('Error al eliminar el elemento', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Video playback lifecycle and thumbnail loading
  useEffect(() => {
    if (!activeItem || activeItem.record.category !== 'video') {
      setIsVideoReady(false);
      setVideoPoster('');
      setIsEnded(false);
      setShowUnmutePrompt(false);
      return;
    }

    const autoSound = localStorage.getItem('vault_video_auto_sound') !== 'false';
    setIsVideoReady(false);
    setIsPlaying(false);
    setIsEnded(false);
    setVideoProgress(0);
    setIsMuted(!autoSound);
    setShowUnmutePrompt(false);
    // Ocultar controles inicialmente para que el video ocupe toda la pantalla limpia y aparezcan al tocar el video
    setShowVideoControls(false);

    const cached = activeItem.thumbnailUrl || getCachedVideoThumbnail(activeItem.id);
    if (cached) {
      setVideoPoster(cached);
    } else {
      generateVideoThumbnail(activeItem.blobUrl, activeItem.id)
        .then((res) => {
          if (res.thumbnailUrl) {
            setVideoPoster(res.thumbnailUrl);
          }
          if (res.duration > 0 && !videoDuration) {
            setVideoDuration(res.duration);
          }
        })
        .catch(() => {});
    }
  }, [activeItem?.id]);

  // Clean up video playback on unmount or item change
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
        } catch {}
      }
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      if (doubleTapFeedbackTimerRef.current) {
        clearTimeout(doubleTapFeedbackTimerRef.current);
      }
    };
  }, [activeItem?.id]);

  // Pause video on background/tab switch
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Auto-hide controls and header after 3s without touch interaction
  const resetHideControlsTimer = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowVideoControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (showVideoControls) {
      resetHideControlsTimer();
    } else if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
      hideControlsTimerRef.current = null;
    }
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [showVideoControls, resetHideControlsTimer]);

  // Autoplay handler when video can play (reproduce siempre con sonido directamente en el visor de video)
  const handleCanPlay = useCallback(() => {
    setIsVideoReady(true);
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = playbackRate;
    video.muted = false;
    setIsMuted(false);

    video
      .play()
      .then(() => {
        setIsPlaying(true);
        setShowUnmutePrompt(false);
      })
      .catch(() => {
        // Si el navegador bloquea el inicio con audio, reintenta en silencio y muestra botón blanco "Activar sonido"
        video.muted = true;
        setIsMuted(true);
        video
          .play()
          .then(() => {
            setIsPlaying(true);
            setShowUnmutePrompt(true);
          })
          .catch(() => {
            setIsPlaying(false);
            setShowUnmutePrompt(false);
            setShowVideoControls(true);
          });
      });
  }, [playbackRate]);

  // Seeker relative (+10s / -10s)
  const seekRelative = (delta: number) => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || videoDuration || 0;
    const next = Math.max(0, Math.min(dur, cur + delta));
    videoRef.current.currentTime = next;
    setVideoProgress(next);
    setIsEnded(false);
    resetHideControlsTimer();
  };

  const showDoubleTapFeedback = (side: 'left' | 'right', label: string) => {
    if (doubleTapFeedbackTimerRef.current) {
      clearTimeout(doubleTapFeedbackTimerRef.current);
    }
    setDoubleTapFeedback({ side, label });
    doubleTapFeedbackTimerRef.current = setTimeout(() => {
      setDoubleTapFeedback(null);
    }, 650);
  };

  // Tap handler on the video area (single tap toggles controls, double tap seeks 10s)
  const handleVideoAreaTap = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }

    const now = Date.now();
    const isDoubleTap = now - lastVideoTapRef.current.time < 320;
    const clientX = e.clientX;

    if (isDoubleTap) {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      const isLeftSide = clientX < window.innerWidth / 2;
      if (isLeftSide) {
        seekRelative(-10);
        showDoubleTapFeedback('left', '-10s');
      } else {
        seekRelative(10);
        showDoubleTapFeedback('right', '+10s');
      }
      lastVideoTapRef.current = { time: 0, x: 0 };
    } else {
      lastVideoTapRef.current = { time: now, x: clientX };
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
      singleTapTimeoutRef.current = setTimeout(() => {
        setShowVideoControls((prev) => !prev);
        singleTapTimeoutRef.current = null;
      }, 280);
    }
  };

  const handleUnmuteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      setShowUnmutePrompt(false);
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const toggleFullscreen = () => {
    const elem = videoRef.current;
    if (!elem) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if ((elem as any).webkitEnterFullscreen) {
      (elem as any).webkitEnterFullscreen();
    }
    resetHideControlsTimer();
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isEnded) {
      videoRef.current.currentTime = 0;
      setVideoProgress(0);
      setIsEnded(false);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      return;
    }
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    resetHideControlsTimer();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      setShowUnmutePrompt(false);
    }
    resetHideControlsTimer();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none overflow-hidden">
      {/* Top Bar para videos (estilo Google Fotos) y para apps */}
      {!isPhoto && !isAudio && !isDocument && (
        <header
          className={`vault-video-header absolute top-0 left-0 right-0 px-4 safe-top-sticky pb-6 bg-gradient-to-b from-black/90 via-black/55 to-transparent flex items-center justify-between text-white z-30 transition-opacity duration-300 ease-in-out ${
            isImmersive || (isVideo && !showVideoControls)
              ? 'opacity-0 pointer-events-none'
              : 'opacity-100'
          }`}
        >
          {isVideo ? (
            <>
              {/* Izquierda: Botón minimalista de regresar */}
              <button
                type="button"
                onClick={onClose}
                className="vault-video-btn-minimal p-2 -ml-1 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer shrink-0"
                title="Atrás"
              >
                <ArrowLeft className="w-6 h-6 text-white" strokeWidth={2} />
              </button>

              {/* Centro: Fecha y hora al estilo Google Fotos */}
              <button
                type="button"
                onClick={() => {
                  setShowDetails(!showDetails);
                  resetHideControlsTimer();
                }}
                className="vault-video-btn-minimal flex flex-col items-center justify-center text-center cursor-pointer px-3"
                title="Ver detalles del video"
              >
                <div className="flex items-center gap-0.5 text-[16px] font-medium text-white leading-tight drop-shadow">
                  <span>
                    {new Date(activeItem.record.timestamp).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <ChevronRight className="w-4 h-4 text-white/90" strokeWidth={2} />
                </div>
                <span className="text-[12px] text-white/85 font-normal leading-tight pt-0.5 drop-shadow">
                  {new Date(activeItem.record.timestamp).toLocaleTimeString('es-ES', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </button>

              {/* Derecha: Menú de 3 puntos minimalista */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu((prev) => !prev);
                  resetHideControlsTimer();
                }}
                className="vault-video-btn-minimal p-2 -mr-1 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer shrink-0"
                title="Más opciones"
              >
                <MoreVertical className="w-6 h-6 text-white" strokeWidth={2} />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="vault-video-btn-glass w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer shrink-0"
                  title="Cerrar (Esc)"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <div className="text-left min-w-0">
                  <h4 className="text-[15px] font-medium text-white truncate leading-tight drop-shadow">
                    {activeItem.record.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[12px] text-white/90 font-normal leading-tight pt-0.5 drop-shadow">
                    <span>{new Date(activeItem.record.timestamp).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>
                      {activeItem.record.category === 'document'
                        ? 'Documentos'
                        : activeItem.record.category === 'app'
                        ? 'Aplicaciones'
                        : 'Audio'}
                    </span>
                    <span>·</span>
                    <span>
                      {currentIndex + 1} de {allItems.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="vault-video-btn-glass w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer"
                  title="Detalles"
                >
                  <Info className="w-5 h-5 text-white" />
                </button>
              </div>
            </>
          )}
        </header>
      )}

      {/* Main Content Stage */}
      <div
        ref={containerRef}
        onClick={handlePhotoTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: scale > 1.05 ? 'none' : 'pan-y' }}
        className={`relative flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-pointer select-none ${
          isImmersive || isVideo ? 'p-0' : 'p-2 sm:p-6'
        }`}
      >
        {/* Floating Zoom Indicator & Reset when zoomed in */}
        {scale > 1.05 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="vault-viewer-floating-btn absolute top-20 right-4 z-30 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs font-mono text-zinc-200 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Toca para volver a tamaño normal (1x)"
          >
            <span>{scale.toFixed(1)}x</span>
            <span className="text-[10px] text-zinc-400">· 1x</span>
          </button>
        )}

        {/* PHOTO VIEW */}
        {isPhoto && (
          <div className="w-full h-full max-w-full max-h-full flex items-center justify-center">
            <img
              ref={imageRef}
              src={activeItem.blobUrl}
              alt={activeItem.record.name}
              onClick={handlePhotoTap}
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale}) rotate(${rotation}deg)`,
                transition: isInteracting ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
                maxHeight: isImmersive ? '100vh' : 'calc(100vh - 160px)',
                maxWidth: isImmersive ? '100vw' : '100%',
                imageRendering: 'auto',
                touchAction: 'none',
                willChange: 'transform',
              }}
              className="object-contain rounded-xl shadow-2xl select-none pointer-events-auto cursor-grab active:cursor-grabbing"
              draggable={false}
              title="Pellizca con 2 dedos para zoom y arrastra por la pantalla"
            />
          </div>
        )}

        {/* VIDEO VIEW (ESTILO GOOGLE FOTOS) */}
        {isVideo && (
          <div
            onClick={handleVideoAreaTap}
            style={{ objectFit: 'contain' }}
            className="vault-video-player-ui vault-video-stage-black relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none"
          >
            {/* Video Element - tamaño y proporción real sin deformarse */}
            <video
              ref={videoRef}
              src={activeItem.blobUrl}
              playsInline
              preload="auto"
              controls={false}
              controlsList="nodownload"
              onCanPlay={handleCanPlay}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setVideoProgress(videoRef.current.currentTime);
                  if (videoRef.current.duration) {
                    setVideoDuration(videoRef.current.duration);
                  }
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current?.duration) {
                  setVideoDuration(videoRef.current.duration);
                }
              }}
              onPlay={() => {
                setIsPlaying(true);
                setIsEnded(false);
              }}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                setIsPlaying(false);
                setIsEnded(true);
                setShowVideoControls(true);
              }}
              style={{
                backgroundColor: '#000000',
                maxWidth: '100vw',
                maxHeight: '100dvh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
              className={`max-w-full max-h-full w-auto h-auto object-contain m-auto transition-opacity duration-300 ${
                isVideoReady ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Portada real del video (segundo 0.5) con velo oscuro e indicador circular de carga mientras descifra */}
            {!isVideoReady && (
              <div className="vault-video-stage-black absolute inset-0 flex items-center justify-center bg-black z-20 pointer-events-none">
                {videoPoster ? (
                  <img
                    src={videoPoster}
                    alt="Portada"
                    style={{
                      maxWidth: '100vw',
                      maxHeight: '100dvh',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                    className="max-w-full max-h-full w-auto h-auto object-contain m-auto"
                  />
                ) : null}
                <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />

                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <div className="w-12 h-12 border-3 border-white/25 border-t-white rounded-full animate-spin mb-3 shadow-lg" />
                  <span className="text-sm font-medium text-white tracking-wide drop-shadow-md">
                    Descifrando video…
                  </span>
                </div>
              </div>
            )}

            {/* Double-tap visual feedback (-10s / +10s) */}
            {doubleTapFeedback && (
              <div
                className={`vault-video-btn-glass absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center gap-2 px-4 py-2.5 rounded-full text-white font-semibold text-sm shadow-2xl animate-in zoom-in-95 duration-150 ${
                  doubleTapFeedback.side === 'left' ? 'left-8' : 'right-8'
                }`}
              >
                {doubleTapFeedback.side === 'left' ? (
                  <RotateCcw className="w-5 h-5 text-white" />
                ) : (
                  <RotateCw className="w-5 h-5 text-white" />
                )}
                <span className="text-white">{doubleTapFeedback.label}</span>
              </div>
            )}

            {/* Botón flotante "Activar sonido" si el navegador rechazó reproducción con sonido */}
            {showUnmutePrompt && isPlaying && (
              <button
                type="button"
                onClick={handleUnmuteClick}
                className="vault-video-btn-glass absolute bottom-44 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full text-white text-xs font-semibold shadow-2xl flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <VolumeX className="w-4 h-4 text-white" />
                <span className="text-white">Activar sonido</span>
              </button>
            )}

            {/* Controles inferiores unificados estilo Google Fotos (se desvanecen suavemente tras 3 s) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute bottom-0 left-0 right-0 z-30 pt-14 pb-safe bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col gap-3 transition-opacity duration-300 select-none ${
                !showVideoControls || isImmersive
                  ? 'opacity-0 pointer-events-none'
                  : 'opacity-100'
              } ${!isVideoReady ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {/* Fila 1: Play/Pausa a la izquierda, Tiempo al centro, Sonido a la derecha (iconos blancos minimalistas sin fondo circular) */}
              <div className="w-full px-5 flex items-center justify-between">
                <button
                  type="button"
                  disabled={!isVideoReady}
                  onClick={handlePlayPause}
                  className="vault-video-btn-minimal p-2 -ml-2 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
                  title={isEnded ? 'Repetir' : isPlaying ? 'Pausar' : 'Reproducir'}
                >
                  {isEnded ? (
                    <RotateCcw className="w-6 h-6 text-white" strokeWidth={2} />
                  ) : isPlaying ? (
                    <Pause className="vault-video-icon-filled w-6 h-6 fill-white text-white" />
                  ) : (
                    <Play className="vault-video-icon-filled w-6 h-6 fill-white text-white" />
                  )}
                </button>

                <span className="text-[14px] font-medium text-white tracking-wide select-none drop-shadow">
                  {formatTime(videoProgress)} / {formatTime(videoDuration)}
                </span>

                <button
                  type="button"
                  disabled={!isVideoReady}
                  onClick={toggleMute}
                  className="vault-video-btn-minimal p-2 -mr-2 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
                  title={isMuted ? 'Activar sonido' : 'Silenciar'}
                >
                  {isMuted ? (
                    <VolumeX className="w-6 h-6 text-white" strokeWidth={2} />
                  ) : (
                    <Volume2 className="w-6 h-6 text-white" strokeWidth={2} />
                  )}
                </button>
              </div>

              {/* Fila 2: Barra de progreso estilo Google Fotos con indicador vertical blanco */}
              <div className="w-full px-5 flex items-center">
                <div className="relative w-full flex items-center h-8">
                  <input
                    type="range"
                    min={0}
                    max={videoDuration || 100}
                    step={0.05}
                    disabled={!isVideoReady}
                    value={isVideoReady ? videoProgress : 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (videoRef.current) {
                        videoRef.current.currentTime = val;
                        setVideoProgress(val);
                        setIsEnded(false);
                        resetHideControlsTimer();
                      }
                    }}
                    className="vault-video-slider w-full h-[8px] rounded-full appearance-none cursor-pointer select-none"
                    style={{
                      background: `linear-gradient(to right, #ffffff 0%, #ffffff ${
                        videoDuration > 0 && isVideoReady ? (videoProgress / videoDuration) * 100 : 0
                      }%, rgba(255, 255, 255, 0.45) ${
                        videoDuration > 0 && isVideoReady ? (videoProgress / videoDuration) * 100 : 0
                      }%, rgba(255, 255, 255, 0.45) 100%)`,
                    }}
                  />
                  {/* Punto blanco sutil al extremo derecho de la barra (estilo Google Fotos) */}
                  <span className="w-1.5 h-1.5 rounded-full bg-white pointer-events-none absolute right-1" />
                </div>
              </div>

              {/* Fila 3: Barra de Acciones Inferior estilo Google Fotos (iconos minimalistas blancos sin fondo circular ni bordes) */}
              <div className="w-full px-2 pt-2 pb-3 flex items-center justify-around">
                {/* 1. Compartir */}
                <button
                  type="button"
                  onClick={() => {
                    resetHideControlsTimer();
                    handleShare();
                  }}
                  className="vault-video-btn-minimal flex flex-col items-center justify-center gap-1.5 py-1 px-3 text-white active:scale-95 transition-transform cursor-pointer"
                  aria-label="Compartir"
                >
                  <Share2 className="w-[22px] h-[22px] text-white" strokeWidth={1.8} />
                  <span className="text-[12px] font-medium text-white tracking-tight">Compartir</span>
                </button>

                {/* 2. Agregar a (Copiar a carpeta) */}
                <button
                  type="button"
                  onClick={() => {
                    resetHideControlsTimer();
                    setShowMoreMenu(false);
                    setNewFolderInputOpen(false);
                    setIsCopyModalOpen(true);
                  }}
                  className="vault-video-btn-minimal flex flex-col items-center justify-center gap-1.5 py-1 px-3 text-white active:scale-95 transition-transform cursor-pointer"
                  aria-label="Agregar a"
                >
                  <Plus className="w-[24px] h-[24px] text-white" strokeWidth={1.8} />
                  <span className="text-[12px] font-medium text-white tracking-tight">Agregar a</span>
                </button>

                {/* 3. Maximizar / Pantalla completa (justo a la izquierda del botón de Eliminar) */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="vault-video-btn-minimal flex flex-col items-center justify-center gap-1.5 py-1 px-3 text-white active:scale-95 transition-transform cursor-pointer"
                  aria-label="Maximizar"
                >
                  <Maximize2 className="w-[21px] h-[21px] text-white" strokeWidth={1.8} />
                  <span className="text-[12px] font-medium text-white tracking-tight">Maximizar</span>
                </button>

                {/* 4. Eliminar (icono clásico de bote de basura) */}
                <button
                  type="button"
                  onClick={() => {
                    resetHideControlsTimer();
                    setShowMoreMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="vault-video-btn-minimal flex flex-col items-center justify-center gap-1.5 py-1 px-3 text-white active:scale-95 transition-transform cursor-pointer"
                  aria-label="Eliminar"
                >
                  <Trash2 className="w-[22px] h-[22px] text-white" strokeWidth={1.8} />
                  <span className="text-[12px] font-medium text-white tracking-tight">Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AUDIO VIEW (Reproductor de Audio Personalizado #6A3A35) */}
        {isAudio && (
          <VaultAudioPlayerScreen
            activeItem={activeItem}
            allItems={allItems}
            onSelectTrack={(nextItem) => {
              const idx = allItems.findIndex((it) => it.id === nextItem.id);
              if (idx !== -1) {
                activeItemIdRef.current = nextItem.id;
                setCurrentIndex(idx);
              }
            }}
            onClose={onClose}
            onExport={handleExport}
            onShare={handleShare}
            onCopy={() => {
              setShowMoreMenu(false);
              setNewFolderInputOpen(false);
              setIsCopyModalOpen(true);
            }}
            onDeleteRequest={() => {
              setShowMoreMenu(false);
              setShowDeleteConfirm(true);
            }}
            isExporting={isExporting}
          />
        )}

        {/* APPLICATION / PACKAGE VIEW */}
        {isApp && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0a121d] border border-slate-800/90 rounded-3xl p-6 sm:p-8 text-center shadow-2xl"
          >
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg shadow-emerald-500/10">
              {activeItem.record.name.endsWith('.apk') ? (
                <Smartphone className="w-10 h-10" />
              ) : activeItem.record.name.endsWith('.zip') || activeItem.record.name.endsWith('.rar') ? (
                <Box className="w-10 h-10" />
              ) : (
                <FileCode className="w-10 h-10" />
              )}
            </div>

            <h3 className="text-lg font-bold text-white mb-1 break-all">
              {activeItem.record.name}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Aplicación / Paquete protegido con AES-GCM 256 bits
            </p>

            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between text-slate-400">
                <span>Tipo de paquete:</span>
                <span className="font-semibold text-slate-200">
                  {activeItem.record.name.split('.').pop()?.toUpperCase() || 'BINARIO'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tamaño:</span>
                <span className="font-semibold text-slate-200">
                  {formatBytes(activeItem.record.size)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cifrado en reposo:</span>
                <span className="text-emerald-400 font-mono text-[11px]">Activo (Local)</span>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PackageCheck className={`w-5 h-5 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Sacando paquete...' : 'Descargar e Instalar / Ejecutar'}</span>
            </button>
            <p className="text-[11px] text-slate-500 mt-2">
              El archivo se descifrará en tu navegador para que puedas guardarlo o abrirlo en tu dispositivo.
            </p>
          </div>
        )}

        {/* DOCUMENT VIEW & READER (Lector PDF Canvas local, Word y TXT) */}
        {isDocument && (
          <DocumentReader
            activeItem={activeItem}
            allItems={allItems}
            currentIndex={currentIndex}
            onClose={onClose}
            onExport={handleExport}
            isExporting={isExporting}
            showToast={showToast}
            onShowDetails={() => setShowDetails((prev) => !prev)}
            onShare={handleShare}
            onMove={() => {
              setNewFolderInputOpen(false);
              setIsMoveModalOpen(true);
            }}
            onCopy={() => {
              setNewFolderInputOpen(false);
              setIsCopyModalOpen(true);
            }}
            onToggleFavorite={async () => {
              const nextFav = !activeItem.record.isFavorite;
              await onToggleFavorite(activeItem.id, nextFav);
              showToast(
                nextFav ? 'Agregado a Favoritos' : 'Quitado de Favoritos',
                'success'
              );
            }}
            onRename={handleOpenRenameModal}
            onDeleteRequest={() => setShowDeleteConfirm(true)}
          />
        )}

        {/* Details Flyout adaptado a ambos temas y con z-index superior a DocumentReader */}
        {showDetails && !isImmersive && (
          <>
            <div
              className="fixed inset-0 z-[64] bg-transparent"
              onClick={() => setShowDetails(false)}
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className="vault-more-menu-panel fixed right-4 top-[calc(var(--safe-top,env(safe-area-inset-top,0px))+3.6rem)] z-[65] w-72 bg-[#0e1626]/98 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h5 className="font-semibold text-slate-200">Información del archivo</h5>
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4 text-[#00e5ff] shrink-0" />
                <span>{new Date(activeItem.record.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <HardDrive className="w-4 h-4 text-[#00e5ff] shrink-0" />
                <span>Tamaño cifrado: {formatBytes(activeItem.record.size)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Folder className="w-4 h-4 text-[#00e5ff] shrink-0" />
                <span>Álbum: {activeItem.record.album || 'General'}</span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
                Cifrado: AES-GCM 256 bits · Almacenado localmente en IndexedDB.
              </div>
            </div>
          </>
        )}
      </div>

      {/* Menú Flotante "Más (⋮)" adaptado a los temas de la aplicación (Cian Neón y Tema Claro) */}
      {showMoreMenu && !isImmersive && (
        <>
          <div
            className="fixed inset-0 z-[55] bg-transparent"
            onClick={() => setShowMoreMenu(false)}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className={`vault-more-menu-panel fixed z-[60] bg-[#0e1626]/95 backdrop-blur-2xl rounded-[28px] shadow-[0_16px_48px_rgba(0,0,0,0.85)] border border-slate-800/90 overflow-hidden animate-in fade-in duration-200 ${
              isVideo
                ? 'top-[calc(var(--safe-top,env(safe-area-inset-top,0px))+3.45rem)] right-4 w-72 zoom-in-95'
                : 'bottom-[76px] left-5 right-5 sm:left-auto sm:right-6 sm:w-80 slide-in-from-bottom-3'
            }`}
          >
            <div className="vault-more-menu-list flex flex-col divide-y divide-slate-800/80">
              {/* 1. Girar (solo para imágenes) */}
              {isPhoto && (
                <button
                  type="button"
                  onClick={handleRotate90AndPersist}
                  disabled={isRotatingSave}
                  className="vault-more-menu-item w-full px-6 py-4 text-left text-[15px] font-medium text-slate-100 hover:text-[#00e5ff] active:opacity-75 transition-colors cursor-pointer"
                >
                  Girar
                </button>
              )}

              {/* 2. Mover */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  setNewFolderInputOpen(false);
                  setIsMoveModalOpen(true);
                }}
                className="vault-more-menu-item w-full px-6 py-4 text-left text-[15px] font-medium text-slate-100 hover:text-[#00e5ff] active:opacity-75 transition-colors cursor-pointer"
              >
                Mover
              </button>

              {/* 3. Agregar a Favoritos / Quitar de Favoritos */}
              <button
                type="button"
                onClick={async () => {
                  setShowMoreMenu(false);
                  const nextFav = !activeItem.record.isFavorite;
                  await onToggleFavorite(activeItem.id, nextFav);
                  showToast(
                    nextFav ? 'Agregado a Favoritos' : 'Quitado de Favoritos',
                    'success'
                  );
                }}
                className="vault-more-menu-item w-full px-6 py-4 text-left text-[15px] font-medium text-slate-100 hover:text-[#00e5ff] active:opacity-75 transition-colors cursor-pointer"
              >
                {activeItem.record.isFavorite ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
              </button>

              {/* 4. Cambiar nombre */}
              <button
                type="button"
                onClick={handleOpenRenameModal}
                className="vault-more-menu-item w-full px-6 py-4 text-left text-[15px] font-medium text-slate-100 hover:text-[#00e5ff] active:opacity-75 transition-colors cursor-pointer"
              >
                Cambiar nombre
              </button>

              {/* 5. Información del archivo */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowDetails((prev) => !prev);
                }}
                className="vault-more-menu-item w-full px-6 py-4 text-left text-[15px] font-medium text-slate-100 hover:text-[#00e5ff] active:opacity-75 transition-colors cursor-pointer"
              >
                Información del archivo
              </button>
            </div>
          </div>
        </>
      )}

      {/* Barra de Acciones Inferior para fotos/apps (videos, audios y documentos usan su propia interfaz integrada) */}
      {!isVideo && !isAudio && !isDocument && (
        <BarraAccionesInferior
          onCompartir={handleShare}
          onCopiar={() => {
            setShowMoreMenu(false);
            setNewFolderInputOpen(false);
            setIsCopyModalOpen(true);
          }}
          onEliminar={() => {
            setShowMoreMenu(false);
            setShowDeleteConfirm(true);
          }}
          onMas={() => setShowMoreMenu((prev) => !prev)}
          menuMasAbierto={showMoreMenu}
          esInmersivo={isImmersive}
        />
      )}

      {/* Modal: Cambiar nombre */}
      {isRenameModalOpen && (
        <div
          onClick={() => setIsRenameModalOpen(false)}
          className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#0a121d] border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[#00e5ff]">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Cambiar nombre</h3>
                  <p className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                    {activeItem.record.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRenameModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRename} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Nuevo nombre del archivo
                </label>
                <input
                  type="text"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => {
                    setRenameValue(e.target.value);
                    setRenameError('');
                  }}
                  maxLength={80}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
                />
                {renameError && (
                  <p className="text-[11px] text-rose-400 mt-1">{renameError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!renameValue.trim()}
                  className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-950 text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mover a carpeta */}
      {isMoveModalOpen && (
        <div
          onClick={() => setIsMoveModalOpen(false)}
          className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#0a121d] border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Mover a carpeta</h3>
                  <p className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                    Carpeta actual: {activeItem.record.album || 'General'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoveModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
              {availableFolders.map((folder) => {
                const isCurrent = (activeItem.record.album || 'General') === folder;
                return (
                  <button
                    key={folder}
                    type="button"
                    onClick={async () => {
                      if (onMoveItem) {
                        await onMoveItem(activeItem.id, folder);
                      }
                      setIsMoveModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      isCurrent
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 font-semibold'
                        : 'bg-zinc-950/60 hover:bg-zinc-800/60 border-zinc-800 text-zinc-300 hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Folder className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-amber-400' : 'text-zinc-500'}`} />
                      <span className="text-xs truncate">{folder}</span>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                        Actual
                      </span>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {newFolderInputOpen ? (
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nombre de la nueva carpeta..."
                  maxLength={40}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewFolderInputOpen(false);
                      setNewFolderName('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!newFolderName.trim()}
                    onClick={async () => {
                      const trimmed = newFolderName.trim();
                      if (!trimmed) return;
                      onCreateFolder?.(trimmed);
                      if (onMoveItem) {
                        await onMoveItem(activeItem.id, trimmed);
                      }
                      setNewFolderName('');
                      setNewFolderInputOpen(false);
                      setIsMoveModalOpen(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-bold cursor-pointer"
                  >
                    Crear y Mover
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setNewFolderInputOpen(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1.5 transition-colors p-1 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>+ Crear nueva carpeta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Copiar elemento */}
      {isCopyModalOpen && (
        <div
          onClick={() => setIsCopyModalOpen(false)}
          className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#0a121d] border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[#00e5ff]">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Copiar archivo</h3>
                  <p className="text-[11px] text-zinc-400">
                    Elige dónde guardar la copia en tu bóveda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
              {availableFolders.map((folder) => {
                const isCurrent = (activeItem.record.album || 'General') === folder;
                return (
                  <button
                    key={folder}
                    type="button"
                    onClick={async () => {
                      if (onCopyItemToFolder) {
                        await onCopyItemToFolder(activeItem.id, folder);
                      }
                      setIsCopyModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border bg-zinc-950/60 hover:bg-zinc-800/60 border-zinc-800 text-zinc-200 hover:text-white transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Folder className="w-4 h-4 shrink-0 text-[#00e5ff]" />
                      <span className="text-xs truncate">
                        {folder} {isCurrent ? '(Duplicar aquí)' : ''}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  </button>
                );
              })}
            </div>

            {isPhoto && (
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className="w-full py-2.5 px-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-[#00e5ff]" />
                <span>Copiar imagen al portapapeles</span>
              </button>
            )}

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <ModalEliminar
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirmar={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Export Progress Modal */}
      {isExporting && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-xs bg-[#131c2e] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto text-[#00e5ff] relative">
              {exportProgress === 100 ? (
                <Check className="w-7 h-7 text-emerald-400 animate-in zoom-in-75 duration-200" />
              ) : (
                <Download className="w-7 h-7 animate-bounce text-[#00e5ff]" />
              )}
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-1">
                {exportProgress === 100 ? '¡Foto sacada con éxito!' : 'Sacando a tu galería...'}
              </h4>
              <p className="text-xs text-slate-400">
                {exportStage || 'Guardando archivo en tu dispositivo'}
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold px-1">
                <span className="text-slate-400">Progreso</span>
                <span className="text-[#00e5ff] font-mono font-bold">{exportProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700/60 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-[#00e5ff] to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(0,229,255,0.7)]"
                  style={{ width: `${Math.min(100, Math.max(exportProgress, 5))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

