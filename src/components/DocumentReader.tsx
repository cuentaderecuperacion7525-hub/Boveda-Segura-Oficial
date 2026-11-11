import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Download,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  FileCode,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Package,
  Layers,
  ArrowLeft,
  Info,
  MoreVertical,
  Share2,
  Folder,
  CopyPlus,
  Heart,
  Edit2,
  Trash2,
} from 'lucide-react';
import { DecryptedVaultItem } from './PhotoViewerModal';
import { formatSize as formatBytes } from '../utils/formatUtils';
import { themeService, VaultTheme } from '../services/themeService';
import { registerBackHandler } from '../services/backButtonService';
import * as pdfjsLib from 'pdfjs-dist';

// Use embedded bundled worker via relative/inline path or data/blob or workerSrc
// pdfjs-dist 3.x ships with pdf.worker.min.js
// Configure workerSrc to use the local bundled pdfjs worker without external CDN
try {
  // @ts-ignore
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    // @ts-ignore
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url
    ).toString();
  }
} catch {
  // Fallback will run synchronously if worker fails
}

interface DocumentReaderProps {
  activeItem: DecryptedVaultItem;
  allItems?: DecryptedVaultItem[];
  currentIndex?: number;
  onClose?: () => void;
  onExport: () => void;
  isExporting: boolean;
  showToast: (msg: string, type?: 'info' | 'success' | 'alert' | 'error') => void;
  onShowDetails?: () => void;
  onShare?: () => void;
  onMove?: () => void;
  onCopy?: () => void;
  onToggleFavorite?: () => void;
  onRename?: () => void;
  onDeleteRequest?: () => void;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({
  activeItem,
  allItems = [],
  currentIndex = 0,
  onClose,
  onExport,
  isExporting,
  showToast,
  onShowDetails,
  onShare,
  onMove,
  onCopy,
  onToggleFavorite,
  onRename,
  onDeleteRequest,
}) => {
  const filename = activeItem.record.name || 'documento';
  const lowerName = filename.toLowerCase();
  const mimeType = (activeItem.record.mimeType || '').toLowerCase();

  // Theme support (Light / Cyan Dark)
  const [currentTheme, setCurrentTheme] = useState<VaultTheme>(() => themeService.getTheme());
  useEffect(() => {
    return themeService.subscribe((t) => setCurrentTheme(t));
  }, []);
  const isLight = currentTheme === 'light';

  // Detect format
  const isPdf = lowerName.endsWith('.pdf') || mimeType.includes('pdf');
  const isWord =
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc') ||
    mimeType.includes('word') ||
    mimeType.includes('msword') ||
    mimeType.includes('officedocument.wordprocessingml');
  const isTxt =
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.md') ||
    lowerName.endsWith('.log') ||
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.json') ||
    lowerName.endsWith('.xml') ||
    mimeType.startsWith('text/');

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Abriendo documento…');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // PDF & Document zoom states
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState<number>(1);
  const [displayScale, setDisplayScale] = useState<number>(1);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1, 2]));

  // TXT specific states
  const [textContent, setTextContent] = useState<string>('');
  const [txtFontSize, setTxtFontSize] = useState<number>(15);
  const [textEncoding, setTextEncoding] = useState<'utf-8' | 'latin1'>('utf-8');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Word specific states
  const [wordHtml, setWordHtml] = useState<string>('');

  // 3-dots dropdown menu state
  const [showMenu, setShowMenu] = useState<boolean>(false);

  useEffect(() => {
    if (showMenu) {
      return registerBackHandler(
        'document_options_menu',
        () => {
          setShowMenu(false);
          return true;
        },
        99
      );
    }
  }, [showMenu]);

  // Refs for cleanup, lazy loading, and 2-finger pinch-to-zoom
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const basePageDimsRef = useRef<Map<number, { width: number; height: number }>>(new Map());
  const renderTasksRef = useRef<Map<number, any>>(new Map());
  const pdfDocRef = useRef<any | null>(null);
  const arrayBufferRef = useRef<ArrayBuffer | null>(null);

  const pdfScaleRef = useRef<number>(1);
  const liveScaleRef = useRef<number>(1);
  const isPinchingDocRef = useRef<boolean>(false);
  const pinchStartDistRef = useRef<number>(0);
  const pinchStartScaleRef = useRef<number>(1);
  const pinchOriginRef = useRef<{
    contentX: number;
    contentY: number;
    viewportX: number;
    viewportY: number;
  }>({ contentX: 0, contentY: 0, viewportX: 0, viewportY: 0 });

  // Double tap detection for zoom reset to width
  const lastTapRef = useRef<number>(0);

  // Clean memory thoroughly on unmount or item switch (REQ 13)
  const cleanupDocument = useCallback(() => {
    // Cancel any ongoing render tasks
    renderTasksRef.current.forEach((task) => {
      try {
        task.cancel();
      } catch {}
    });
    renderTasksRef.current.clear();

    // Clear all canvases to immediately free GPU and RAM memory
    canvasRefs.current.forEach((canvas) => {
      try {
        canvas.width = 0;
        canvas.height = 0;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, 0, 0);
      } catch {}
    });
    canvasRefs.current.clear();
    pageRefs.current.clear();
    basePageDimsRef.current.clear();

    // Destroy pdf.js document
    if (pdfDocRef.current) {
      try {
        pdfDocRef.current.destroy();
      } catch {}
      pdfDocRef.current = null;
    }
    setPdfDoc(null);
    arrayBufferRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupDocument();
    };
  }, [cleanupDocument, activeItem.id]);

  // Load and decrypt file content based on type
  useEffect(() => {
    let isCancelled = false;
    cleanupDocument();
    setLoading(true);
    setLoadingMessage('Abriendo documento…');
    setLoadingProgress(0);
    setErrorMessage(null);
    setTextContent('');
    setWordHtml('');
    setNumPages(0);
    setCurrentPage(1);
    setPdfScale(1);
    setDisplayScale(1);
    pdfScaleRef.current = 1;
    liveScaleRef.current = 1;

    async function loadItem() {
      try {
        const response = await fetch(activeItem.blobUrl);
        if (!response.ok) throw new Error('No se pudo acceder al archivo cifrado.');
        const buffer = await response.arrayBuffer();
        if (isCancelled) return;
        arrayBufferRef.current = buffer;

        if (isPdf) {
          setLoadingMessage('Descifrando y preparando PDF…');
          // Load document with local pdf.js
          const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(buffer),
            cMapUrl: undefined,
            cMapPacked: true,
          });

          loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
            if (progressData.total > 0) {
              const pct = Math.round((progressData.loaded / progressData.total) * 100);
              setLoadingProgress(pct);
              setLoadingMessage(`Abriendo documento… ${pct}%`);
            }
          };

          const doc = await loadingTask.promise;
          if (isCancelled) {
            doc.destroy();
            return;
          }
          pdfDocRef.current = doc;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setVisiblePages(new Set([1, 2]));
          setLoading(false);
        } else if (isWord) {
          setLoadingMessage('Procesando documento Word…');
          if (lowerName.endsWith('.docx') || mimeType.includes('openxmlformats')) {
            try {
              // Dynamic import of mammoth.js included locally in node_modules
              // @ts-ignore
              const mammothModule = await import('mammoth');
              const mammoth = (mammothModule as any).default || mammothModule;
              const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
              if (!isCancelled) {
                if (result.value && result.value.trim().length > 0) {
                  setWordHtml(result.value);
                } else {
                  setWordHtml('<p class="italic text-slate-400">El documento no contiene texto visible.</p>');
                }
                setLoading(false);
              }
            } catch (err) {
              console.warn('Mammoth conversion error:', err);
              // Fallback to text decoder
              const decoder = new TextDecoder('utf-8');
              const text = decoder.decode(buffer);
              const printable = text.replace(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g, ' ').slice(0, 15000);
              if (!isCancelled) {
                setTextContent(printable);
                setLoading(false);
              }
            }
          } else {
            // Older binary .doc format
            const decoder = new TextDecoder('latin1');
            const text = decoder.decode(buffer);
            const printable = text.replace(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g, ' ').slice(0, 15000);
            if (!isCancelled) {
              setTextContent(printable);
              setLoading(false);
            }
          }
        } else if (isTxt) {
          setLoadingMessage('Leyendo texto…');
          // Auto-detect encoding or decode with selected encoding (UTF-8 or Latin-1) (REQ 7)
          try {
            const decoder = new TextDecoder(textEncoding, { fatal: true });
            const text = decoder.decode(buffer);
            if (!isCancelled) {
              setTextContent(text);
              setLoading(false);
            }
          } catch {
            // If UTF-8 failed due to invalid bytes, fallback to Latin-1
            const fallbackDecoder = new TextDecoder('latin1');
            const text = fallbackDecoder.decode(buffer);
            if (!isCancelled) {
              setTextContent(text);
              setTextEncoding('latin1');
              setLoading(false);
            }
          }
        } else {
          // Other generic formats (REQ 9)
          setLoading(false);
        }
      } catch (err: any) {
        console.error('DocumentReader loading error:', err);
        if (!isCancelled) {
          setErrorMessage('No se pudo mostrar este documento');
          setLoading(false);
        }
      }
    }

    loadItem();

    return () => {
      isCancelled = true;
    };
  }, [activeItem.id, isPdf, isWord, isTxt, lowerName, mimeType, textEncoding, cleanupDocument]);

  // Page tracking & Lazy Rendering via IntersectionObserver (REQ 3)
  useEffect(() => {
    if (!isPdf || !pdfDoc || numPages === 0 || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSet = new Set<number>();
        entries.forEach((entry) => {
          const pageNum = Number(entry.target.getAttribute('data-page-number'));
          if (entry.isIntersecting && pageNum > 0) {
            visibleSet.add(pageNum);
            // Pre-load immediate neighbors (current, prev, next)
            if (pageNum > 1) visibleSet.add(pageNum - 1);
            if (pageNum < numPages) visibleSet.add(pageNum + 1);
          }
        });

        if (visibleSet.size > 0) {
          // Find earliest visible page for top counter
          const sorted = Array.from(visibleSet).sort((a, b) => a - b);
          setCurrentPage(sorted[0]);
          setVisiblePages((prev) => {
            const next = new Set(prev);
            sorted.forEach((p) => next.add(p));
            // Evict pages that are too far away (> 4 pages away) to prevent memory leak on 30MB+ PDFs
            next.forEach((p) => {
              if (Math.abs(p - sorted[0]) > 4) {
                next.delete(p);
                // Wipe canvas of far page
                const canvas = canvasRefs.current.get(p);
                if (canvas) {
                  canvas.width = 0;
                  canvas.height = 0;
                }
              }
            });
            return next;
          });
        }
      },
      {
        root: containerRef.current,
        rootMargin: '250px 0px 250px 0px',
        threshold: 0.1,
      }
    );

    pageRefs.current.forEach((div) => {
      if (div) observer.observe(div);
    });

    return () => {
      observer.disconnect();
    };
  }, [isPdf, pdfDoc, numPages]);

  // Synchronously resize all PDF page containers & canvases during pinch or button zoom
  const applyScaleToDomSynchronously = useCallback((targetScale: number) => {
    const defaultDims = basePageDimsRef.current.get(1);
    pageRefs.current.forEach((pageDiv, pageNum) => {
      const dims = basePageDimsRef.current.get(pageNum) || defaultDims;
      if (!dims) return;
      const w = Math.floor(dims.width * targetScale);
      const h = Math.floor(dims.height * targetScale);
      pageDiv.style.width = `${w}px`;
      pageDiv.style.height = `${h}px`;
      const canvas = canvasRefs.current.get(pageNum);
      if (canvas) {
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
    });
  }, []);

  // Helper to update zoom from buttons or double-tap while keeping viewport center stable
  const updateZoomScale = useCallback(
    (nextScaleRaw: number) => {
      const clamped = Math.min(4.0, Math.max(0.6, Number(nextScaleRaw.toFixed(2))));
      const prevScale = liveScaleRef.current || 1;
      liveScaleRef.current = clamped;
      pdfScaleRef.current = clamped;
      setDisplayScale(clamped);
      setPdfScale(clamped);

      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const contentX = container.scrollLeft + centerX;
        const contentY = container.scrollTop + centerY;
        const ratio = clamped / prevScale;

        if (isPdf) {
          applyScaleToDomSynchronously(clamped);
        }

        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollLeft = Math.max(0, contentX * ratio - centerX);
            containerRef.current.scrollTop = Math.max(0, contentY * ratio - centerY);
          }
        });
      }
    },
    [isPdf, applyScaleToDomSynchronously]
  );

  // Render individual visible page in its canvas without white flicker (REQ 2 & 3)
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc) return;
      const canvas = canvasRefs.current.get(pageNumber);
      const containerDiv = pageRefs.current.get(pageNumber);
      if (!canvas || !containerDiv) return;

      // Cancel previous render on this page if running
      if (renderTasksRef.current.has(pageNumber)) {
        try {
          renderTasksRef.current.get(pageNumber).cancel();
        } catch {}
        renderTasksRef.current.delete(pageNumber);
      }

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const containerWidth =
          containerRef.current?.clientWidth || window.innerWidth || 390;
        // Compute scale to fit container width cleanly
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scaleToFit = Math.min(
          3.5,
          Math.max(0.4, (containerWidth - 24) / unscaledViewport.width)
        );
        const baseViewport = page.getViewport({ scale: scaleToFit });
        basePageDimsRef.current.set(pageNumber, {
          width: baseViewport.width,
          height: baseViewport.height,
        });

        const activeScale = liveScaleRef.current || pdfScale;
        const cssW = Math.floor(baseViewport.width * activeScale);
        const cssH = Math.floor(baseViewport.height * activeScale);
        containerDiv.style.width = `${cssW}px`;
        containerDiv.style.height = `${cssH}px`;
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;

        const finalScale = scaleToFit * pdfScale;
        const viewport = page.getViewport({ scale: finalScale });

        // Cap DPR so zoomed canvases stay crisp without exceeding mobile GPU texture limits
        const rawDpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const maxCanvasDim = 2600;
        const maxSide = Math.max(viewport.width, viewport.height, 1);
        const dpr = Math.min(rawDpr, maxCanvasDim / maxSide);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = Math.max(1, Math.floor(viewport.width * dpr));
        tempCanvas.height = Math.max(1, Math.floor(viewport.height * dpr));

        const tempCtx = tempCanvas.getContext('2d', { alpha: false });
        if (!tempCtx) return;
        tempCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: tempCtx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current.set(pageNumber, renderTask);
        await renderTask.promise;
        renderTasksRef.current.delete(pageNumber);

        // Atomically transfer rendered high-DPI page to visible canvas (zero white flash)
        canvas.width = tempCanvas.width;
        canvas.height = tempCanvas.height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          ctx.drawImage(tempCanvas, 0, 0);
        }
        tempCanvas.width = 0;
        tempCanvas.height = 0;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Error rendering PDF page ${pageNumber}:`, err);
        }
      }
    },
    [pdfDoc, pdfScale]
  );

  // Trigger render when visiblePages or pdfScale changes
  useEffect(() => {
    if (!isPdf || !pdfDoc) return;
    visiblePages.forEach((pageNum) => {
      renderPage(pageNum);
    });
  }, [isPdf, pdfDoc, visiblePages, pdfScale, renderPage]);

  // 2-Finger Pinch-to-Zoom Handlers on Document Container
  const handleContentTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (showMenu) {
      setShowMenu(false);
    }

    if (e.touches.length === 2 && containerRef.current) {
      isPinchingDocRef.current = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      pinchStartDistRef.current = Math.hypot(
        t1.clientX - t2.clientX,
        t1.clientY - t2.clientY
      );
      pinchStartScaleRef.current = liveScaleRef.current || pdfScaleRef.current || 1;

      const rect = containerRef.current.getBoundingClientRect();
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top;

      pinchOriginRef.current = {
        viewportX: midX,
        viewportY: midY,
        contentX: containerRef.current.scrollLeft + midX,
        contentY: containerRef.current.scrollTop + midY,
      };
    }
  };

  const handleContentTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.touches.length === 2 && isPinchingDocRef.current && containerRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      if (pinchStartDistRef.current > 8) {
        const factor = dist / pinchStartDistRef.current;
        const nextScale = Math.min(
          4.0,
          Math.max(0.6, pinchStartScaleRef.current * factor)
        );
        liveScaleRef.current = nextScale;
        setDisplayScale(Number(nextScale.toFixed(2)));

        if (isPdf) {
          applyScaleToDomSynchronously(nextScale);
        }

        const rect = containerRef.current.getBoundingClientRect();
        const curMidX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const curMidY = (t1.clientY + t2.clientY) / 2 - rect.top;
        const scaleRatio = nextScale / pinchStartScaleRef.current;

        containerRef.current.scrollLeft = Math.max(
          0,
          pinchOriginRef.current.contentX * scaleRatio - curMidX
        );
        containerRef.current.scrollTop = Math.max(
          0,
          pinchOriginRef.current.contentY * scaleRatio - curMidY
        );
      }
    }
  };

  const handleContentTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isPinchingDocRef.current && e.touches.length < 2) {
      isPinchingDocRef.current = false;
      const committed = Math.min(
        4.0,
        Math.max(0.6, Number(liveScaleRef.current.toFixed(2)))
      );
      liveScaleRef.current = committed;
      pdfScaleRef.current = committed;
      setDisplayScale(committed);
      setPdfScale(committed);
      lastTapRef.current = 0;
    }
  };

  // Double tap to reset zoom or toggle width fit (REQ 4)
  const handleDoubleTap = () => {
    if (isPinchingDocRef.current) return;
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      const target = liveScaleRef.current > 1.08 ? 1 : 1.8;
      updateZoomScale(target);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleCopyTxt = () => {
    if (textContent && navigator.clipboard) {
      navigator.clipboard.writeText(textContent);
      setIsCopied(true);
      showToast('Texto copiado al portapapeles', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const renderOptionsMenu = () => {
    if (!showMenu) return null;
    const primaryAccent = isLight ? '#0284c7' : '#00e5ff';
    const textMain = isLight ? '#0f172a' : '#f8fafc';
    const textMuted = isLight ? '#64748b' : '#94a3b8';
    const dividerColor = isLight ? '#e2e8f0' : 'rgba(51, 65, 85, 0.7)';
    const iconBoxBg = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)';

    return (
      <>
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(false);
          }}
        />

        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(14, 22, 38, 0.98)',
            borderColor: isLight ? '#cbd5e1' : 'rgba(0, 229, 255, 0.25)',
            color: textMain,
            boxShadow: isLight
              ? '0 16px 40px -4px rgba(15, 23, 42, 0.18), 0 4px 12px -2px rgba(15, 23, 42, 0.08)'
              : '0 16px 48px rgba(0, 0, 0, 0.85), 0 0 24px rgba(0, 229, 255, 0.08)',
          }}
          className="vault-more-menu-panel absolute top-[calc(var(--safe-top,env(safe-area-inset-top,0px))+3.45rem)] right-3 z-50 w-68 max-h-[80vh] overflow-y-auto no-scrollbar border rounded-2xl p-2 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 select-none space-y-0.5"
        >
          {/* 1. Sacar de la bóveda */}
          <button
            type="button"
            onClick={() => {
              setShowMenu(false);
              onExport();
            }}
            disabled={isExporting}
            className="vault-more-menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left text-xs cursor-pointer"
            style={{ color: textMain }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(0, 229, 255, 0.15)',
                color: primaryAccent,
              }}
            >
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold" style={{ color: textMain }}>
                Sacar de la bóveda
              </p>
              <p className="text-[10px] font-normal" style={{ color: textMuted }}>
                Guardar en tu dispositivo
              </p>
            </div>
          </button>

          <div className="h-[1px] my-1 mx-1" style={{ backgroundColor: dividerColor }} />

          {/* 2. Compartir */}
          {onShare && (
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onShare();
              }}
              className="vault-more-menu-item w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left text-xs cursor-pointer"
              style={{ color: textMain }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: iconBoxBg, color: textMain }}
              >
                <Share2 className="w-4 h-4" />
              </div>
              <span className="font-medium" style={{ color: textMain }}>
                Compartir
              </span>
            </button>
          )}

          {/* 3. Mover */}
          {onMove && (
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onMove();
              }}
              className="vault-more-menu-item w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left text-xs cursor-pointer"
              style={{ color: textMain }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: iconBoxBg, color: textMain }}
              >
                <Folder className="w-4 h-4" />
              </div>
              <span className="font-medium" style={{ color: textMain }}>
                Mover a carpeta
              </span>
            </button>
          )}

          {/* 4. Copiar */}
          {onCopy && (
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onCopy();
              }}
              className="vault-more-menu-item w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left text-xs cursor-pointer"
              style={{ color: textMain }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: iconBoxBg, color: textMain }}
              >
                <CopyPlus className="w-4 h-4" />
              </div>
              <span className="font-medium" style={{ color: textMain }}>
                Copiar a carpeta
              </span>
            </button>
          )}

          {/* 5. Favoritos */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onToggleFavorite();
              }}
              className="vault-more-menu-item w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left text-xs cursor-pointer"
              style={{ color: textMain }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: iconBoxBg,
                  color: activeItem.record.isFavorite ? '#ef4444' : textMain,
                }}
              >
                <Heart
                  className={`w-4 h-4 ${activeItem.record.isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                />
              </div>
              <span className="font-medium" style={{ color: textMain }}>
                {activeItem.record.isFavorite ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
              </span>
            </button>
          )}

          {/* 6. Cambiar nombre */}
          {onRename && (
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onRename();
              }}
              className="vault-more-menu-item w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left text-xs cursor-pointer"
              style={{ color: textMain }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: iconBoxBg, color: textMain }}
              >
                <Edit2 className="w-4 h-4" />
              </div>
              <span className="font-medium" style={{ color: textMain }}>
                Cambiar nombre
              </span>
            </button>
          )}

          {/* 7. Detalles del archivo */}
          {onShowDetails && (
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onShowDetails();
              }}
              className="vault-more-menu-item w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left text-xs cursor-pointer"
              style={{ color: textMain }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: iconBoxBg, color: textMain }}
              >
                <Info className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium" style={{ color: textMain }}>
                  Detalles del archivo
                </p>
                <p className="text-[10px]" style={{ color: textMuted }}>
                  {formatBytes(activeItem.record.size)}
                </p>
              </div>
            </button>
          )}

          {/* 8. Pantalla completa */}
          {(isPdf || isWord || isTxt) && (
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                setIsFullScreen(!isFullScreen);
              }}
              className="vault-more-menu-item w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left text-xs cursor-pointer"
              style={{ color: textMain }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: iconBoxBg, color: textMain }}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </div>
              <span className="font-medium" style={{ color: textMain }}>
                {isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              </span>
            </button>
          )}

          {/* Opciones de Control de Zoom para Documentos */}
          {(isPdf || isWord || isTxt) && (
            <>
              <div className="h-[1px] my-1 mx-1" style={{ backgroundColor: dividerColor }} />
              <div
                className="px-3 pt-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: textMuted }}
              >
                Control de Zoom
              </div>

              <div className="flex items-center justify-between px-2 py-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => updateZoomScale(displayScale - 0.25)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  style={{ backgroundColor: iconBoxBg, color: textMain }}
                  title="Alejar"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                  <span>Alejar</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateZoomScale(1)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
                  style={{ backgroundColor: iconBoxBg, color: primaryAccent }}
                  title="Restablecer al 100%"
                >
                  {Math.round(displayScale * 100)}%
                </button>

                <button
                  type="button"
                  onClick={() => updateZoomScale(displayScale + 0.25)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  style={{ backgroundColor: iconBoxBg, color: textMain }}
                  title="Acercar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Acercar</span>
                </button>
              </div>
            </>
          )}

          {/* Opciones específicas para TXT */}
          {isTxt && (
            <>
              <div className="h-[1px] my-1 mx-1" style={{ backgroundColor: dividerColor }} />
              <button
                type="button"
                onClick={() => {
                  handleCopyTxt();
                  setShowMenu(false);
                }}
                className="vault-more-menu-item w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left text-xs cursor-pointer"
                style={{ color: textMain }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: iconBoxBg, color: textMain }}
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </div>
                <span className="font-medium" style={{ color: textMain }}>
                  {isCopied ? '¡Texto copiado!' : 'Copiar todo el texto'}
                </span>
              </button>

              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-[11px]" style={{ color: textMuted }}>
                  Tamaño letra
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTxtFontSize((prev) => Math.max(11, prev - 2))}
                    className="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: iconBoxBg, color: textMain }}
                  >
                    A-
                  </button>
                  <span className="text-xs font-mono px-1.5" style={{ color: textMain }}>
                    {txtFontSize}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTxtFontSize((prev) => Math.min(26, prev + 2))}
                    className="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: iconBoxBg, color: textMain }}
                  >
                    A+
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 9. Eliminar */}
          {onDeleteRequest && (
            <>
              <div className="h-[1px] my-1 mx-1" style={{ backgroundColor: dividerColor }} />
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onDeleteRequest();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors text-left text-xs cursor-pointer"
                style={{ color: isLight ? '#e11d48' : '#fb7185' }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'rgba(244, 63, 94, 0.12)',
                    color: isLight ? '#e11d48' : '#fb7185',
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </div>
                <span className="font-semibold" style={{ color: isLight ? '#e11d48' : '#fb7185' }}>
                  Eliminar
                </span>
              </button>
            </>
          )}
        </div>
      </>
    );
  };

  // 1. ERROR STATE (REQ 10)
  if (errorMessage) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        style={{
          backgroundColor: isLight ? '#f1f5f9' : '#060b14',
          color: isLight ? '#0f172a' : '#f8fafc',
        }}
        className="w-full h-full flex flex-col items-center justify-center p-6 select-none text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 shadow-lg">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3
          className="text-base font-bold mb-2"
          style={{ color: isLight ? '#0f172a' : '#f8fafc' }}
        >
          {errorMessage}
        </h3>
        <p
          className="text-xs max-w-sm mb-6 leading-relaxed"
          style={{ color: isLight ? '#475569' : '#94a3b8' }}
        >
          El archivo está cifrado de forma segura en tu bóveda. Puedes exportarlo directamente a tu teléfono para abrirlo con una aplicación compatible.
        </p>
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="px-6 py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4 text-white" />
          <span className="text-white">
            {isExporting ? 'Sacando a tu dispositivo…' : 'Sacar a mi dispositivo'}
          </span>
        </button>
      </div>
    );
  }

  // 2. LOADING INDICATOR (REQ 6)
  if (loading) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        style={{
          backgroundColor: isLight ? '#f1f5f9' : '#060b14',
          color: isLight ? '#0f172a' : '#f8fafc',
        }}
        className="w-full h-full flex flex-col items-center justify-center p-6 select-none text-center"
      >
        <div
          className="w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 shadow-lg"
          style={{
            backgroundColor: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(0, 229, 255, 0.1)',
            borderColor: isLight ? 'rgba(2, 132, 199, 0.25)' : 'rgba(0, 229, 255, 0.25)',
            color: isLight ? '#0284c7' : '#00e5ff',
          }}
        >
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <h4
          className="text-sm font-bold mb-1.5"
          style={{ color: isLight ? '#0f172a' : '#f8fafc' }}
        >
          {loadingMessage}
        </h4>
        <p
          className="text-xs truncate max-w-[260px] font-mono"
          style={{ color: isLight ? '#475569' : '#94a3b8' }}
        >
          {filename}
        </p>
        {loadingProgress > 0 && (
          <div
            className="w-48 rounded-full h-1.5 mt-4 overflow-hidden"
            style={{ backgroundColor: isLight ? '#cbd5e1' : '#1e293b' }}
          >
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${loadingProgress}%`,
                backgroundColor: isLight ? '#0284c7' : '#00e5ff',
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // 3. GENERIC / UNSUPPORTED FORMAT DETAILS VIEW (REQ 9)
  if (!isPdf && !isWord && !isTxt) {
    const isSpreadsheet = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || mimeType.includes('spreadsheet');
    const isPresentation = lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt') || mimeType.includes('presentation');
    const isArchive = lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z');

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        style={{
          backgroundColor: isLight ? '#f1f5f9' : '#060b14',
          color: isLight ? '#0f172a' : '#f8fafc',
        }}
        className="fixed inset-0 z-50 flex flex-col justify-between select-none overflow-hidden"
      >
        {/* Header con 3 puntitos en esquina superior derecha */}
        <header
          style={{
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(6, 11, 20, 0.95)',
            borderColor: isLight ? '#cbd5e1' : 'rgba(51, 65, 85, 0.75)',
            color: isLight ? '#0f172a' : '#f8fafc',
          }}
          className="w-full px-4 safe-top-sticky py-3 border-b flex items-center justify-between shrink-0 backdrop-blur-md z-30"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{ color: isLight ? '#0f172a' : '#f8fafc' }}
                className="p-1.5 -ml-1 active:scale-95 transition-all cursor-pointer shrink-0"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="text-left min-w-0 flex-1">
              <h4
                className="text-[15px] font-semibold truncate leading-tight"
                style={{ color: isLight ? '#0f172a' : '#f8fafc' }}
              >
                {filename}
              </h4>
              <p
                className="text-[11px] truncate pt-0.5"
                style={{ color: isLight ? '#475569' : '#94a3b8' }}
              >
                {new Date(activeItem.record.timestamp).toLocaleDateString()} · {formatBytes(activeItem.record.size)}
              </p>
            </div>
          </div>

          <div className="flex items-center shrink-0 ml-2 relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              style={{
                color: showMenu ? (isLight ? '#0284c7' : '#00e5ff') : isLight ? '#0f172a' : '#f8fafc',
                backgroundColor: showMenu
                  ? isLight
                    ? 'rgba(2, 132, 199, 0.1)'
                    : 'rgba(0, 229, 255, 0.12)'
                  : 'transparent',
              }}
              className="p-2 rounded-xl transition-all cursor-pointer active:scale-95"
              aria-label="Más opciones"
              title="Más opciones"
            >
              <MoreVertical className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </header>

        {renderOptionsMenu()}

        {/* Big Icon & Metadata card (REQ 9) */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center my-auto overflow-y-auto">
          <div
            className="w-24 h-24 rounded-3xl border flex items-center justify-center mb-5 shadow-xl"
            style={{
              backgroundColor: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(0, 229, 255, 0.1)',
              borderColor: isLight ? 'rgba(2, 132, 199, 0.25)' : 'rgba(0, 229, 255, 0.25)',
              color: isLight ? '#0284c7' : '#00e5ff',
            }}
          >
            {isSpreadsheet ? (
              <FileSpreadsheet className="w-12 h-12" />
            ) : isPresentation ? (
              <Layers className="w-12 h-12" />
            ) : isArchive ? (
              <Package className="w-12 h-12" />
            ) : (
              <FileCode className="w-12 h-12" />
            )}
          </div>

          <h3
            className="text-lg font-bold mb-1.5 break-all max-w-md"
            style={{ color: isLight ? '#0f172a' : '#f8fafc' }}
          >
            {filename}
          </h3>
          <p className="text-xs mb-6" style={{ color: isLight ? '#475569' : '#94a3b8' }}>
            Archivo cifrado con AES-256 en tu caja fuerte
          </p>

          <div
            style={{
              backgroundColor: isLight ? '#ffffff' : '#0a121d',
              borderColor: isLight ? '#cbd5e1' : 'rgba(51, 65, 85, 0.75)',
            }}
            className="w-full max-w-sm border rounded-2xl p-4 text-left text-xs space-y-2.5 mb-6 shadow-sm"
          >
            <div className="flex justify-between">
              <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Tipo de archivo:</span>
              <span
                className="font-semibold uppercase"
                style={{ color: isLight ? '#0f172a' : '#f8fafc' }}
              >
                {filename.split('.').pop() || 'Archivo'}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Tamaño del archivo:</span>
              <span className="font-semibold" style={{ color: isLight ? '#0f172a' : '#f8fafc' }}>
                {formatBytes(activeItem.record.size)}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: isLight ? '#64748b' : '#94a3b8' }}>Carpeta:</span>
              <span className="font-semibold" style={{ color: isLight ? '#334155' : '#cbd5e1' }}>
                {activeItem.record.album || 'General'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            className="w-full max-w-sm py-3.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-5 h-5 text-white" />
            <span className="text-white">
              {isExporting ? 'Sacando a tu dispositivo…' : 'Sacar a mi dispositivo'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // 4. MAIN VIEWER (PDF, WORD, TXT)
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      style={{
        backgroundColor: isLight ? '#f1f5f9' : '#060b14',
        color: isLight ? '#0f172a' : '#f8fafc',
      }}
      className="fixed inset-0 z-50 flex flex-col select-none overflow-hidden transition-all"
    >
      {/* HEADER COMPACTO ADAPTADO AL TEMA CON MENÚ DE 3 PUNTITOS A LA DERECHA */}
      <header
        style={{
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(6, 11, 20, 0.95)',
          borderColor: isLight ? '#cbd5e1' : 'rgba(51, 65, 85, 0.75)',
          color: isLight ? '#0f172a' : '#f8fafc',
        }}
        className="w-full px-4 safe-top-sticky py-3 border-b flex items-center justify-between shrink-0 backdrop-blur-md z-30 shadow-xs"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ color: isLight ? '#0f172a' : '#f8fafc' }}
              className="p-1.5 -ml-1 active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Nombre del documento y metadatos */}
          <div className="min-w-0 flex-1 text-left">
            <h4
              className="text-[15px] font-semibold truncate leading-tight"
              style={{ color: isLight ? '#0f172a' : '#f8fafc' }}
            >
              {filename}
            </h4>
            <div
              className="flex items-center gap-1.5 text-[11px] font-normal leading-tight pt-0.5 truncate"
              style={{ color: isLight ? '#475569' : '#94a3b8' }}
            >
              <span>{new Date(activeItem.record.timestamp).toLocaleDateString()}</span>
              <span>·</span>
              <span>{activeItem.record.album || 'General'}</span>
              {isPdf && numPages > 0 && (
                <>
                  <span>·</span>
                  <span
                    className="font-semibold"
                    style={{ color: isLight ? '#0284c7' : '#00e5ff' }}
                  >
                    {currentPage} / {numPages}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Esquina superior derecha: Botón de 3 puntitos */}
        <div className="flex items-center shrink-0 ml-2 relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((prev) => !prev);
            }}
            style={{
              color: showMenu ? (isLight ? '#0284c7' : '#00e5ff') : isLight ? '#0f172a' : '#f8fafc',
              backgroundColor: showMenu
                ? isLight
                  ? 'rgba(2, 132, 199, 0.1)'
                  : 'rgba(0, 229, 255, 0.12)'
                : 'transparent',
            }}
            className="p-2 rounded-xl transition-all cursor-pointer active:scale-95"
            aria-label="Más opciones"
            title="Más opciones"
          >
            <MoreVertical className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Apartado de opciones desplegable en la esquina superior derecha (3 puntitos) */}
      {renderOptionsMenu()}

      {/* CONTENIDO PRINCIPAL CON SOPORTE TÁCTIL DE 2 DEDOS (PINCH-TO-ZOOM) Y DESPLAZAMIENTO FLUIDO */}
      <div
        ref={containerRef}
        onClick={handleDoubleTap}
        onTouchStart={handleContentTouchStart}
        onTouchMove={handleContentTouchMove}
        onTouchEnd={handleContentTouchEnd}
        onTouchCancel={handleContentTouchEnd}
        style={{
          backgroundColor: isLight ? '#e2e8f0' : '#0a121d',
          touchAction: 'pan-x pan-y',
          WebkitOverflowScrolling: 'touch',
        }}
        className="flex-1 w-full h-full overflow-y-auto overflow-x-auto relative custom-scrollbar select-text"
      >
        {/* 1. PDF CANVAS RENDERER (REQ 1, 2, 3, 4, 5) */}
        {isPdf && numPages > 0 && (
          <div className="w-fit min-w-full flex flex-col items-center gap-4 py-4 px-2 min-h-full">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                data-page-number={pageNum}
                ref={(el) => {
                  if (el) pageRefs.current.set(pageNum, el);
                  else pageRefs.current.delete(pageNum);
                }}
                className="relative bg-white rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                style={{
                  minHeight: '280px',
                  boxShadow: isLight
                    ? '0 6px 24px -4px rgba(15, 23, 42, 0.18), 0 2px 6px -1px rgba(15, 23, 42, 0.08)'
                    : '0 8px 30px -4px rgba(0, 0, 0, 0.55)',
                }}
              >
                <canvas
                  ref={(el) => {
                    if (el) canvasRefs.current.set(pageNum, el);
                    else canvasRefs.current.delete(pageNum);
                  }}
                  className="block bg-white"
                />
                {!visiblePages.has(pageNum) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-mono">
                    Página {pageNum}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 2. WORD (.docx) HTML CONVERSION (REQ 8) */}
        {isWord && (
          <div
            className="mx-auto p-4 sm:p-8 transition-none"
            style={{
              width: displayScale > 1 ? `${Math.round(displayScale * 100)}%` : '100%',
              maxWidth: displayScale > 1 ? 'none' : '48rem',
            }}
          >
            <div
              style={{
                backgroundColor: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(0, 229, 255, 0.1)',
                borderColor: isLight ? 'rgba(2, 132, 199, 0.25)' : 'rgba(0, 229, 255, 0.22)',
                color: isLight ? '#0369a1' : '#38bdf8',
              }}
              className="mb-4 p-3 border rounded-xl text-xs"
            >
              Vista simplificada. Para ver el formato original, abre el menú de 3 puntos y selecciona <b>Sacar de la bóveda</b>.
            </div>

            <div
              className="bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-xl leading-relaxed space-y-4"
              style={{ fontSize: `${Math.round(14 * displayScale)}px` }}
            >
              {wordHtml ? (
                <div
                  className="prose max-w-none text-slate-900"
                  style={{ fontSize: `${Math.round(14 * displayScale)}px` }}
                  dangerouslySetInnerHTML={{ __html: wordHtml }}
                />
              ) : textContent ? (
                <pre
                  className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed"
                  style={{ fontSize: `${Math.round(14 * displayScale)}px` }}
                >
                  {textContent}
                </pre>
              ) : (
                <p className="italic text-slate-400">Sin contenido que mostrar.</p>
              )}
            </div>
          </div>
        )}

        {/* 3. TXT VIEWER (REQ 7) */}
        {isTxt && (
          <div
            className="mx-auto p-4 sm:p-8"
            style={{
              width: displayScale > 1 ? `${Math.round(displayScale * 100)}%` : '100%',
              maxWidth: displayScale > 1 ? 'none' : '56rem',
            }}
          >
            <div
              className="flex items-center justify-between mb-3 text-xs"
              style={{ color: isLight ? '#475569' : '#94a3b8' }}
            >
              <span>Codificación: {textEncoding.toUpperCase()}</span>
              <button
                type="button"
                onClick={() =>
                  setTextEncoding((prev) => (prev === 'utf-8' ? 'latin1' : 'utf-8'))
                }
                style={{ color: isLight ? '#0284c7' : '#00e5ff' }}
                className="underline font-medium cursor-pointer"
              >
                Cambiar a {textEncoding === 'utf-8' ? 'Latin-1 (ANSI)' : 'UTF-8'}
              </button>
            </div>

            <div
              style={{
                backgroundColor: isLight ? '#ffffff' : '#0f172a',
                borderColor: isLight ? '#cbd5e1' : 'rgba(51, 65, 85, 0.75)',
                color: isLight ? '#0f172a' : '#e2e8f0',
              }}
              className="border rounded-2xl p-5 sm:p-8 shadow-xl"
            >
              <pre
                style={{
                  fontSize: `${Math.max(10, Math.round(txtFontSize * displayScale))}px`,
                  lineHeight: '1.65',
                  color: isLight ? '#0f172a' : '#e2e8f0',
                }}
                className="whitespace-pre-wrap break-words font-mono select-text"
              >
                {textContent}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Control flotante discreto de zoom en la esquina inferior derecha */}
      {(isPdf || isWord || isTxt) && !showMenu && (
        <div
          style={{
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(10, 18, 29, 0.94)',
            borderColor: isLight ? '#cbd5e1' : 'rgba(0, 229, 255, 0.25)',
            color: isLight ? '#0f172a' : '#f8fafc',
          }}
          className="fixed bottom-6 right-4 z-40 border backdrop-blur-xl rounded-full px-2 py-1 flex items-center gap-1 shadow-xl"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateZoomScale(displayScale - 0.25);
            }}
            style={{ color: isLight ? '#0f172a' : '#f8fafc' }}
            className="p-1.5 rounded-full hover:opacity-75 transition-opacity cursor-pointer"
            title="Alejar zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateZoomScale(1);
            }}
            style={{ color: isLight ? '#0284c7' : '#00e5ff' }}
            className="px-2 py-0.5 text-[11px] font-mono font-bold transition-colors cursor-pointer"
            title="Restablecer zoom al 100%"
          >
            {Math.round(displayScale * 100)}%
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateZoomScale(displayScale + 0.25);
            }}
            style={{ color: isLight ? '#0f172a' : '#f8fafc' }}
            className="p-1.5 rounded-full hover:opacity-75 transition-opacity cursor-pointer"
            title="Acercar zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
