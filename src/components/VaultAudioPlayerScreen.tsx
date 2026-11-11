import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DecryptedVaultItem } from './PhotoViewerModal';
import {
  vaultAudioEngine,
  stripAudioExtension,
  extractSubtitleFragment,
} from '../services/vaultAudioEngine';
import { registerBackHandler } from '../services/backButtonService';
import { formatSize as formatBytes } from '../utils/formatUtils';
import { themeService, VaultTheme } from '../services/themeService';

interface VaultAudioPlayerScreenProps {
  activeItem: DecryptedVaultItem;
  allItems: DecryptedVaultItem[];
  onSelectTrack: (item: DecryptedVaultItem) => void;
  onClose: () => void;
  onExport: () => void;
  onShare: () => void;
  onCopy: () => void;
  onDeleteRequest: () => void;
  isExporting?: boolean;
}

function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const VaultAudioPlayerScreen: React.FC<VaultAudioPlayerScreenProps> = ({
  activeItem,
  allItems,
  onSelectTrack,
  onClose,
  onExport,
  onShare,
  onCopy,
  onDeleteRequest,
  isExporting = false,
}) => {
  const [activeTab, setActiveTab] = useState<'songs' | 'info'>('songs');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(activeItem.duration || 0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Scrubber pointer drag state
  const [isDraggingScrubber, setIsDraggingScrubber] = useState<boolean>(false);
  const [dragTime, setDragTime] = useState<number>(0);
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Cover double-tap feedback (-10 / +10)
  const [seekFeedback, setSeekFeedback] = useState<{ side: 'left' | 'right'; text: string } | null>(
    null
  );
  const lastCoverTapRef = useRef<{ time: number; side: 'left' | 'right' | null }>({
    time: 0,
    side: null,
  });
  const feedbackTimerRef = useRef<any>(null);

  // Bottom sheets: Options Menu (⋮) and Queue Sheet
  const [isOptionsOpen, setIsOptionsOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [sheetDragY, setSheetDragY] = useState<number>(0);
  const sheetDragStartYRef = useRef<number | null>(null);
  const [currentTheme, setCurrentTheme] = useState<VaultTheme>(themeService.getTheme());

  useEffect(() => {
    const unsubscribe = themeService.subscribe((t) => setCurrentTheme(t));
    return unsubscribe;
  }, []);

  const isLightTheme = currentTheme === 'light';
  const sheetBg = isLightTheme ? '#ffffff' : '#0e1626';
  const sheetBorder = isLightTheme ? '1px solid #cbd5e1' : '1px solid rgba(0, 229, 255, 0.22)';
  const sheetHandleBg = isLightTheme ? '#94a3b8' : '#64748b';
  const sheetPrimaryText = isLightTheme ? '#0f172a' : '#f8fafc';
  const sheetSecondaryText = isLightTheme ? '#64748b' : '#94a3b8';
  const sheetAccentText = isLightTheme ? '#0284c7' : '#00e5ff';
  const sheetActiveRowBg = isLightTheme ? 'rgba(2, 132, 199, 0.1)' : 'rgba(0, 229, 255, 0.12)';
  const sheetPillBg = isLightTheme ? '#f1f5f9' : 'rgba(0, 229, 255, 0.14)';
  const sheetDangerColor = isLightTheme ? '#dc2626' : '#f87171';

  // Marquee measurement refs and states
  const marqueeContainerRef = useRef<HTMLDivElement | null>(null);
  const marqueeUnitRef = useRef<HTMLDivElement | null>(null);
  const [marqueeDurationSec, setMarqueeDurationSec] = useState<number>(10);
  const [repeatMultiplier, setRepeatMultiplier] = useState<number>(1);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Filter audio items from the current folder/list
  const audioItems = useMemo(() => {
    const filtered = allItems.filter(
      (it) => it.record.category === 'audio' || it.record.mimeType?.startsWith('audio/')
    );
    return filtered.length > 0 ? filtered : [activeItem];
  }, [allItems, activeItem]);

  const currentAudioIndex = useMemo(() => {
    const idx = audioItems.findIndex((it) => it.id === activeItem.id);
    return idx >= 0 ? idx : 0;
  }, [audioItems, activeItem.id]);

  const titleWithoutExt = useMemo(
    () => stripAudioExtension(activeItem.record.name || 'Audio'),
    [activeItem.record.name]
  );

  const subtitleText = useMemo(
    () => extractSubtitleFragment(activeItem.record.name || '', activeItem.record.album),
    [activeItem.record.name, activeItem.record.album]
  );

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Calculate marquee speed (constant ~40px/s) on track change and screen resize/rotation
  const recalculateMarquee = useCallback(() => {
    const unitEl = marqueeUnitRef.current;
    const containerEl = marqueeContainerRef.current;
    if (!unitEl || !containerEl) return;

    const unitWidth = unitEl.getBoundingClientRect().width;
    const containerWidth = containerEl.getBoundingClientRect().width;

    if (unitWidth > 0) {
      // Ensure one half of the track is at least as wide as the container so even short names loop with zero gap
      const neededRepeats = Math.max(1, Math.ceil((containerWidth + 32) / unitWidth));
      setRepeatMultiplier(neededRepeats);
      const halfTrackWidth = unitWidth * neededRepeats;
      const seconds = Math.max(2.5, halfTrackWidth / 40);
      setMarqueeDurationSec(seconds);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(recalculateMarquee, 30);
    window.addEventListener('resize', recalculateMarquee);
    window.addEventListener('orientationchange', recalculateMarquee);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', recalculateMarquee);
      window.removeEventListener('orientationchange', recalculateMarquee);
    };
  }, [titleWithoutExt, activeTab, recalculateMarquee]);

  // Connect to persistent VaultAudioEngine
  useEffect(() => {
    const initialState = vaultAudioEngine.getState();
    setIsShuffle(initialState.isShuffle);
    setPlaybackRate(initialState.playbackRate);

    const unsubscribe = vaultAudioEngine.subscribe({
      onPlayStateChange: (playing) => {
        setIsPlaying(playing);
      },
      onTimeUpdate: (cur, dur) => {
        if (!isDraggingRef.current) {
          setCurrentTime(cur);
        }
        if (dur > 0) {
          setDuration(dur);
        }
      },
      onTrackChange: (nextItem) => {
        onSelectTrack(nextItem);
      },
      onRateChange: (rate) => {
        setPlaybackRate(rate);
      },
      onCoverChange: (url) => {
        setCoverUrl(url);
      },
    });

    vaultAudioEngine.loadAndPlay(activeItem, audioItems, true).then(() => {
      const st = vaultAudioEngine.getState();
      setIsPlaying(st.isPlaying);
      setCurrentTime(st.currentTime);
      if (st.duration > 0) setDuration(st.duration);
      setCoverUrl(st.coverUrl);
    });

    return () => {
      unsubscribe();
    };
  }, [activeItem.id]);

  // Keep engine playlist updated if items change
  useEffect(() => {
    vaultAudioEngine.setPlaylist(audioItems, activeItem.id);
  }, [audioItems, activeItem.id]);

  // Back button handlers: when options menu or queue sheet is open, Android Back closes ONLY the sheet
  useEffect(() => {
    if (isOptionsOpen) {
      return registerBackHandler(
        'audio_options_sheet',
        () => {
          setIsOptionsOpen(false);
          setSheetDragY(0);
          return true;
        },
        99
      );
    }
  }, [isOptionsOpen]);

  useEffect(() => {
    if (isQueueOpen) {
      return registerBackHandler(
        'audio_queue_sheet',
        () => {
          setIsQueueOpen(false);
          setSheetDragY(0);
          return true;
        },
        99
      );
    }
  }, [isQueueOpen]);

  const handleCloseScreen = () => {
    // If paused/ended when closing, revoke the temporary audio blob URL immediately;
    // if playing, the top-level <audio> keeps playing in the background as requested.
    vaultAudioEngine.revokeIfStoppedOnClose();
    onClose();
  };

  // Double tap on left/right half of the cover art (-10s / +10s)
  const handleCoverTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const side: 'left' | 'right' = clickX < rect.width / 2 ? 'left' : 'right';
    const now = Date.now();

    if (
      now - lastCoverTapRef.current.time < 320 &&
      lastCoverTapRef.current.side === side
    ) {
      const delta = side === 'left' ? -10 : 10;
      vaultAudioEngine.seekRelative(delta);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      setSeekFeedback({ side, text: side === 'left' ? '-10' : '+10' });
      feedbackTimerRef.current = setTimeout(() => {
        setSeekFeedback(null);
      }, 650);
      lastCoverTapRef.current = { time: 0, side: null };
    } else {
      lastCoverTapRef.current = { time: now, side };
    }
  };

  // Pointer Events Scrubber
  const computeTimeFromPointer = (clientX: number): number => {
    const bar = scrubberRef.current;
    const effectiveDur = duration > 0 ? duration : 0;
    if (!bar || effectiveDur <= 0) return 0;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * effectiveDur;
  };

  const handleScrubberPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDraggingScrubber(true);
    const newTime = computeTimeFromPointer(e.clientX);
    setDragTime(newTime);
    setCurrentTime(newTime);
  };

  const handleScrubberPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    const newTime = computeTimeFromPointer(e.clientX);
    setDragTime(newTime);
    setCurrentTime(newTime);
  };

  const handleScrubberPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    const finalTime = computeTimeFromPointer(e.clientX);
    isDraggingRef.current = false;
    setIsDraggingScrubber(false);
    vaultAudioEngine.seekTo(finalTime);
  };

  // Bottom sheet touch/pointer drag-to-close
  const handleSheetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    sheetDragStartYRef.current = e.clientY;
  };

  const handleSheetPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (sheetDragStartYRef.current === null) return;
    const dy = e.clientY - sheetDragStartYRef.current;
    if (dy > 0) {
      setSheetDragY(dy);
    }
  };

  const handleSheetPointerUp = () => {
    if (sheetDragY > 70) {
      setIsOptionsOpen(false);
      setIsQueueOpen(false);
    }
    setSheetDragY(0);
    sheetDragStartYRef.current = null;
  };

  const displayedTime = isDraggingScrubber ? dragTime : currentTime;
  const progressPercent =
    duration > 0 ? Math.max(0, Math.min(100, (displayedTime / duration) * 100)) : 0;

  const hasMultipleAudios = audioItems.length > 1;
  const isNextDisabled = !hasMultipleAudios || (!isShuffle && currentAudioIndex >= audioItems.length - 1);

  const fileExtension = useMemo(() => {
    const parts = (activeItem.record.name || '').split('.');
    return parts.length > 1 ? parts.pop()!.toUpperCase() : 'AUDIO';
  }, [activeItem.record.name]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="vault-audio-player-screen fixed inset-0 z-50 bg-[#6A3A35] text-[#F6E8E5] flex flex-col justify-between select-none overflow-hidden"
      style={{
        backgroundColor: '#6A3A35',
        color: '#F6E8E5',
        fontFamily: "'Roboto', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Contenedor central de referencia mobile-first (ancho de referencia 390px, centrado en pantallas grandes) */}
      <div className="w-full max-w-[430px] mx-auto h-full flex flex-col justify-between safe-top-sticky pb-6">
        {/* ENCABEZADO */}
        <header className="w-full px-[12px] pt-1 pb-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            {/* Izquierda: Flecha hacia abajo (chevron) que cierra la pantalla */}
            <button
              type="button"
              onClick={handleCloseScreen}
              aria-label="Cerrar reproductor"
              className="vault-audio-btn min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full active:opacity-75 transition-opacity cursor-pointer"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F6E8E5"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dos pestañas de texto junto al botón: "Canciones" e "Información" */}
            <nav className="flex items-center gap-5 ml-2" aria-label="Secciones del reproductor">
              <button
                type="button"
                onClick={() => setActiveTab('songs')}
                aria-label="Pestaña Canciones"
                aria-current={activeTab === 'songs' ? 'page' : undefined}
                className="vault-audio-tab relative min-h-[48px] flex items-center px-1 text-[18px] transition-colors duration-150 cursor-pointer"
                style={{
                  color: activeTab === 'songs' ? '#FFFFFF' : '#C9A6A2',
                  fontWeight: activeTab === 'songs' ? 700 : 500,
                }}
              >
                <span>Canciones</span>
                {activeTab === 'songs' && (
                  <span
                    className="absolute bottom-[6px] left-0 right-0 h-[2px] rounded-full transition-all duration-150"
                    style={{ backgroundColor: '#FFFFFF' }}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('info')}
                aria-label="Pestaña Información"
                aria-current={activeTab === 'info' ? 'page' : undefined}
                className="vault-audio-tab relative min-h-[48px] flex items-center px-1 text-[18px] transition-colors duration-150 cursor-pointer"
                style={{
                  color: activeTab === 'info' ? '#FFFFFF' : '#C9A6A2',
                  fontWeight: activeTab === 'info' ? 700 : 500,
                }}
              >
                <span>Información</span>
                {activeTab === 'info' && (
                  <span
                    className="absolute bottom-[6px] left-0 right-0 h-[2px] rounded-full transition-all duration-150"
                    style={{ backgroundColor: '#FFFFFF' }}
                  />
                )}
              </button>
            </nav>
          </div>

          {/* Derecha: Botón de tres puntitos verticales */}
          <button
            type="button"
            onClick={() => setIsOptionsOpen(true)}
            aria-label="Más opciones"
            className="vault-audio-btn min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full active:opacity-75 transition-opacity cursor-pointer"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F6E8E5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="5" r="1.4" fill="#F6E8E5" />
              <circle cx="12" cy="12" r="1.4" fill="#F6E8E5" />
              <circle cx="12" cy="19" r="1.4" fill="#F6E8E5" />
            </svg>
          </button>
        </header>

        {/* CONTENIDO DE PESTAÑA */}
        {activeTab === 'songs' ? (
          <main className="flex-1 flex flex-col justify-between min-h-0 pt-2 pb-1 transition-opacity duration-200">
            {/* BLOQUE SUPERIOR: Portada + Título en marquesina + Subtítulo y chip Cifrado */}
            <div className="w-full flex flex-col">
              {/* PORTADA: cuadrado de ancho casi completo (24 px de margen lateral), esquinas redondeadas de 28 px */}
              <div className="px-[24px] w-full">
                <div
                  onClick={handleCoverTap}
                  role="region"
                  aria-label="Portada del audio. Doble toque a la izquierda o derecha para retroceder o adelantar 10 segundos"
                  className="relative w-full aspect-square rounded-[28px] overflow-hidden cursor-pointer select-none"
                  style={{
                    backgroundColor: '#B0605A',
                  }}
                >
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={titleWithoutExt}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      draggable={false}
                    />
                  ) : (
                    <>
                      {/* Degradado suave y difuminado en tonos coral #B0605A y malva #B07BA0 con manchas mezcladas */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(135deg, #B86B58 0%, #B0605A 42%, #9E554C 75%, #B07BA0 100%)',
                        }}
                      />
                      <div
                        className="absolute -top-10 -left-10 w-[72%] h-[72%] rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, #C87D65 0%, transparent 70%)',
                          filter: 'blur(28px)',
                          opacity: 0.85,
                        }}
                      />
                      <div
                        className="absolute top-[18%] -left-8 w-[65%] h-[65%] rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, #B07BA0 0%, transparent 72%)',
                          filter: 'blur(34px)',
                          opacity: 0.75,
                        }}
                      />
                      <div
                        className="absolute -bottom-12 -right-8 w-[75%] h-[75%] rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, #B07BA0 0%, #B0605A 55%, transparent 75%)',
                          filter: 'blur(30px)',
                          opacity: 0.9,
                        }}
                      />
                      <div
                        className="absolute top-[25%] right-[12%] w-[55%] h-[55%] rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, #9A4E46 0%, transparent 70%)',
                          filter: 'blur(26px)',
                          opacity: 0.7,
                        }}
                      />

                      {/* Ícono de nota musical grande, semitransparente, en el centro */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg
                          width="136"
                          height="136"
                          viewBox="0 0 120 120"
                          fill="none"
                          aria-hidden="true"
                          style={{ opacity: 0.22 }}
                        >
                          <path
                            d="M46 84V32C46 28.5 48.5 25.6 52 25L92 18C96 17.3 99.5 20.4 99.5 24.5V72"
                            stroke="#F6E8E5"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M46 44L99.5 35"
                            stroke="#F6E8E5"
                            strokeWidth="9"
                            strokeLinecap="round"
                          />
                          <ellipse cx="34" cy="86" rx="14" ry="11" fill="#F6E8E5" />
                          <ellipse cx="87.5" cy="74" rx="14" ry="11" fill="#F6E8E5" />
                        </svg>
                      </div>
                    </>
                  )}

                  {/* Animación de doble toque "-10" / "+10" */}
                  {seekFeedback && (
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 px-4 py-2 rounded-full text-[18px] font-medium tracking-wide pointer-events-none transition-opacity duration-150 ${
                        seekFeedback.side === 'left' ? 'left-7' : 'right-7'
                      }`}
                      style={{
                        backgroundColor: 'rgba(106, 58, 53, 0.72)',
                        color: '#FFFFFF',
                        backdropFilter: 'blur(6px)',
                      }}
                    >
                      {seekFeedback.text}
                    </div>
                  )}
                </div>
              </div>

              {/* TÍTULO CON DESPLAZAMIENTO (Marquesina continua de derecha a izquierda a ~40px/s) */}
              <div
                ref={marqueeContainerRef}
                className="mt-[24px] mx-[24px] overflow-hidden relative"
                style={
                  prefersReducedMotion
                    ? undefined
                    : {
                        maskImage:
                          'linear-gradient(to right, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)',
                        WebkitMaskImage:
                          'linear-gradient(to right, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)',
                      }
                }
              >
                {prefersReducedMotion ? (
                  <div
                    className="text-[24px] font-medium whitespace-nowrap overflow-hidden text-ellipsis leading-tight"
                    style={{ color: '#F6E8E5' }}
                  >
                    {titleWithoutExt}
                  </div>
                ) : (
                  <>
                    {/* Elemento oculto de medición exacta para 1 unidad (texto + separador de 64px) */}
                    <div
                      ref={marqueeUnitRef}
                      aria-hidden="true"
                      className="fixed -top-[9999px] left-0 inline-flex items-center whitespace-nowrap pointer-events-none opacity-0 text-[24px] font-medium"
                    >
                      <span>{titleWithoutExt}</span>
                      <span className="inline-flex items-center justify-center w-[64px]">•</span>
                    </div>

                    {/* Pista animada de 0 a -50% en bucle infinito continuo */}
                    <div
                      className="vault-audio-marquee-track inline-flex items-center whitespace-nowrap"
                      style={{
                        animationDuration: `${marqueeDurationSec}s`,
                      }}
                    >
                      {/* Primera mitad */}
                      <div className="inline-flex items-center whitespace-nowrap">
                        {Array.from({ length: repeatMultiplier }).map((_, idx) => (
                          <React.Fragment key={`m1-${idx}`}>
                            <span
                              className="text-[24px] font-medium leading-tight"
                              style={{ color: '#F6E8E5' }}
                            >
                              {titleWithoutExt}
                            </span>
                            <span
                              aria-hidden="true"
                              className="inline-flex items-center justify-center w-[64px] text-[18px]"
                              style={{ color: '#C9A6A2' }}
                            >
                              •
                            </span>
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Segunda mitad idéntica para bucle perfecto sin saltos */}
                      <div aria-hidden="true" className="inline-flex items-center whitespace-nowrap">
                        {Array.from({ length: repeatMultiplier }).map((_, idx) => (
                          <React.Fragment key={`m2-${idx}`}>
                            <span
                              className="text-[24px] font-medium leading-tight"
                              style={{ color: '#F6E8E5' }}
                            >
                              {titleWithoutExt}
                            </span>
                            <span
                              className="inline-flex items-center justify-center w-[64px] text-[18px]"
                              style={{ color: '#C9A6A2' }}
                            >
                              •
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* SUBTÍTULO Y CHIP "CIFRADO" */}
              <div className="px-[24px] mt-2.5 flex items-center gap-3 min-w-0">
                <span
                  className="text-[16px] font-normal truncate"
                  style={{ color: '#C9A6A2' }}
                >
                  {subtitleText}
                </span>

                <span
                  className="inline-flex items-center gap-1.5 rounded-full shrink-0 text-[14px] font-normal leading-none"
                  style={{
                    backgroundColor: '#7F4D47',
                    color: '#F6E8E5',
                    padding: '8px 16px',
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F6E8E5"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Cifrado</span>
                </span>
              </div>
            </div>

            {/* BLOQUE INFERIOR: Barra de progreso + Controles */}
            <div className="w-full px-[24px] mt-auto pt-4">
              {/* BARRA DE PROGRESO (2px alto, pista #8F6560, avance blanco #FFFFFF, círculo de 18px, zona táctil >= 40px) */}
              <div className="w-full">
                <div
                  ref={scrubberRef}
                  role="slider"
                  aria-label="Barra de progreso del audio"
                  aria-valuemin={0}
                  aria-valuemax={Math.round(duration || 0)}
                  aria-valuenow={Math.round(displayedTime)}
                  tabIndex={0}
                  onPointerDown={handleScrubberPointerDown}
                  onPointerMove={handleScrubberPointerMove}
                  onPointerUp={handleScrubberPointerUp}
                  onPointerCancel={handleScrubberPointerUp}
                  className="relative w-full h-[44px] flex items-center cursor-pointer touch-none select-none"
                >
                  {/* Burbuja de tiempo mientras se arrastra */}
                  {isDraggingScrubber && (
                    <div
                      className="absolute -top-8 -translate-x-1/2 px-2.5 py-1 rounded-full text-[12px] font-medium pointer-events-none shadow-md"
                      style={{
                        left: `${progressPercent}%`,
                        backgroundColor: '#FFFFFF',
                        color: '#6A3A35',
                      }}
                    >
                      {formatAudioTime(displayedTime)}
                    </div>
                  )}

                  {/* Pista limpia (#8F6560) con avance blanco (#FFFFFF) sin bolita */}
                  <div
                    className="w-full h-[3px] rounded-full relative overflow-hidden"
                    style={{ backgroundColor: '#8F6560' }}
                  >
                    {/* Avance blanco (#FFFFFF) */}
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>
                </div>

                {/* Tiempo transcurrido a la izquierda y duración total a la derecha (14px, #C9A6A2) */}
                <div
                  className="flex items-center justify-between text-[14px] -mt-1 font-normal"
                  style={{ color: '#C9A6A2' }}
                >
                  <span>{formatAudioTime(displayedTime)}</span>
                  <span>{formatAudioTime(duration)}</span>
                </div>
              </div>

              {/* CONTROLES (una sola fila, espaciados uniformemente) */}
              <div className="w-full flex items-center justify-between mt-5 mb-2">
                {/* 1. Izquierda: Aleatorio (shuffle) */}
                <button
                  type="button"
                  onClick={() => {
                    const nextShuffle = vaultAudioEngine.toggleShuffle();
                    setIsShuffle(nextShuffle);
                  }}
                  aria-label="Modo aleatorio"
                  aria-pressed={isShuffle}
                  className="vault-audio-btn min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full active:scale-95 transition-transform cursor-pointer"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isShuffle ? '#FFFFFF' : '#C9A6A2'}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                    <line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                </button>

                {/* 2. Anterior (|◀) */}
                <button
                  type="button"
                  onClick={() => vaultAudioEngine.playPrevious()}
                  aria-label="Audio anterior"
                  className="vault-audio-btn min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full active:scale-95 transition-transform cursor-pointer"
                >
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="#FFFFFF"
                    stroke="#FFFFFF"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="19 20 9 12 19 4 19 20" />
                    <line x1="5" y1="19" x2="5" y2="5" strokeWidth="2.2" />
                  </svg>
                </button>

                {/* 3. Centro: Play/Pausa grande (56px, blanco, SIN círculo de fondo) */}
                <button
                  type="button"
                  onClick={() => vaultAudioEngine.togglePlayPause()}
                  aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                  className="vault-audio-btn min-w-[64px] min-h-[64px] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                >
                  {isPlaying ? (
                    <svg
                      width="56"
                      height="56"
                      viewBox="0 0 24 24"
                      fill="#FFFFFF"
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="6" y="4" width="4" height="16" rx="1.5" />
                      <rect x="14" y="4" width="4" height="16" rx="1.5" />
                    </svg>
                  ) : (
                    <svg
                      width="56"
                      height="56"
                      viewBox="0 0 24 24"
                      fill="#FFFFFF"
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                  )}
                </button>

                {/* 4. Siguiente (▶|) */}
                <button
                  type="button"
                  disabled={isNextDisabled}
                  onClick={() => vaultAudioEngine.playNext()}
                  aria-label="Siguiente audio"
                  className="vault-audio-btn min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full active:scale-95 transition-transform cursor-pointer disabled:opacity-35 disabled:pointer-events-none"
                >
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="#FFFFFF"
                    stroke="#FFFFFF"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 4 15 12 5 20 5 4" />
                    <line x1="19" y1="5" x2="19" y2="19" strokeWidth="2.2" />
                  </svg>
                </button>

                {/* 5. Derecha: Cola de reproducción (queue) */}
                <button
                  type="button"
                  onClick={() => setIsQueueOpen(true)}
                  aria-label="Cola de reproducción"
                  className="vault-audio-btn min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full active:scale-95 transition-transform cursor-pointer"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9A6A2"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="6" x2="13" y2="6" />
                    <line x1="3" y1="12" x2="11" y2="12" />
                    <line x1="3" y1="18" x2="11" y2="18" />
                    <path d="M17 18V6l4 2" />
                    <circle cx="15" cy="18" r="2" />
                  </svg>
                </button>
              </div>
            </div>
          </main>
        ) : (
          /* PESTAÑA "INFORMACIÓN": Lista simple de datos del archivo sin tarjetas */
          <main className="flex-1 overflow-y-auto px-[24px] pt-6 pb-8 space-y-6 transition-opacity duration-200 no-scrollbar">
            <div>
              <p className="text-[14px] font-normal mb-1" style={{ color: '#C9A6A2' }}>
                Nombre completo
              </p>
              <p
                className="text-[18px] font-medium leading-snug break-words"
                style={{ color: '#F6E8E5' }}
              >
                {activeItem.record.name}
              </p>
            </div>

            <div>
              <p className="text-[14px] font-normal mb-1" style={{ color: '#C9A6A2' }}>
                Formato
              </p>
              <p className="text-[16px] font-normal" style={{ color: '#F6E8E5' }}>
                {fileExtension} ({activeItem.record.mimeType || 'audio/mpeg'})
              </p>
            </div>

            <div>
              <p className="text-[14px] font-normal mb-1" style={{ color: '#C9A6A2' }}>
                Tamaño
              </p>
              <p className="text-[16px] font-normal" style={{ color: '#F6E8E5' }}>
                {formatBytes(activeItem.record.size)}
              </p>
            </div>

            <div>
              <p className="text-[14px] font-normal mb-1" style={{ color: '#C9A6A2' }}>
                Duración
              </p>
              <p className="text-[16px] font-normal" style={{ color: '#F6E8E5' }}>
                {formatAudioTime(duration)}
              </p>
            </div>

            <div>
              <p className="text-[14px] font-normal mb-1" style={{ color: '#C9A6A2' }}>
                Fecha en que se guardó en la bóveda
              </p>
              <p className="text-[16px] font-normal" style={{ color: '#F6E8E5' }}>
                {new Date(activeItem.record.timestamp).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div>
              <p className="text-[14px] font-normal mb-1" style={{ color: '#C9A6A2' }}>
                Estado
              </p>
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F6E8E5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-[16px] font-medium" style={{ color: '#F6E8E5' }}>
                  Cifrado en la bóveda
                </span>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* HOJA INFERIOR: COLA DE REPRODUCCIÓN (Queue) adaptada al tema de la aplicación */}
      {isQueueOpen && (
        <div
          onClick={() => setIsQueueOpen(false)}
          className="fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-200"
          style={{ backgroundColor: isLightTheme ? 'rgba(15, 23, 42, 0.4)' : 'rgba(0, 0, 0, 0.65)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={handleSheetPointerUp}
            onPointerCancel={handleSheetPointerUp}
            className="vault-more-menu-panel w-full max-w-[430px] mx-auto rounded-t-[28px] pt-3 pb-6 max-h-[70dvh] flex flex-col transition-transform duration-200 animate-in slide-in-from-bottom shadow-2xl"
            style={{
              backgroundColor: sheetBg,
              borderTop: sheetBorder,
              transform: `translateY(${sheetDragY}px)`,
            }}
          >
            {/* Indicador de arrastre arriba */}
            <div
              className="w-10 h-1 rounded-full mx-auto mb-3 opacity-60"
              style={{ backgroundColor: sheetHandleBg }}
            />

            <div className="px-6 pb-3 flex items-center justify-between">
              <span className="text-[16px] font-semibold" style={{ color: sheetPrimaryText }}>
                Cola de reproducción ({audioItems.length})
              </span>
              <span className="text-[13px] font-medium" style={{ color: sheetSecondaryText }}>
                {activeItem.record.album || 'General'}
              </span>
            </div>

            <div className="overflow-y-auto px-3 space-y-0.5 no-scrollbar">
              {audioItems.map((item, idx) => {
                const isCurrent = item.id === activeItem.id;
                const cleanTitle = stripAudioExtension(item.record.name || 'Audio');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setIsQueueOpen(false);
                      onSelectTrack(item);
                      vaultAudioEngine.loadAndPlay(item, audioItems, true);
                    }}
                    aria-label={`Reproducir ${cleanTitle}`}
                    className="w-full min-h-[56px] px-3 rounded-2xl flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                    style={{
                      backgroundColor: isCurrent ? sheetActiveRowBg : 'transparent',
                      color: isCurrent ? sheetAccentText : sheetPrimaryText,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className="w-6 text-center text-[14px] shrink-0 font-medium"
                        style={{ color: isCurrent ? sheetAccentText : sheetSecondaryText }}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[15px] truncate"
                          style={{
                            color: isCurrent ? sheetAccentText : sheetPrimaryText,
                            fontWeight: isCurrent ? 700 : 500,
                          }}
                        >
                          {cleanTitle}
                        </p>
                        <p className="text-[12px] truncate" style={{ color: sheetSecondaryText }}>
                          {formatBytes(item.record.size)}
                        </p>
                      </div>
                    </div>

                    {isCurrent && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={sheetAccentText}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MENÚ DE OPCIONES (tres puntitos) adaptado al tema de la aplicación */}
      {isOptionsOpen && (
        <div
          onClick={() => setIsOptionsOpen(false)}
          className="fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-200"
          style={{ backgroundColor: isLightTheme ? 'rgba(15, 23, 42, 0.4)' : 'rgba(0, 0, 0, 0.65)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={handleSheetPointerUp}
            onPointerCancel={handleSheetPointerUp}
            className="vault-more-menu-panel w-full max-w-[430px] mx-auto rounded-t-[28px] pt-3 pb-6 transition-transform duration-200 animate-in slide-in-from-bottom shadow-2xl"
            style={{
              backgroundColor: sheetBg,
              borderTop: sheetBorder,
              transform: `translateY(${sheetDragY}px)`,
            }}
          >
            {/* Indicador de arrastre arriba */}
            <div
              className="w-10 h-1 rounded-full mx-auto mb-2 opacity-60"
              style={{ backgroundColor: sheetHandleBg }}
            />

            <div className="vault-more-menu-list flex flex-col">
              {/* 1. Sacar a mi dispositivo */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => {
                  setIsOptionsOpen(false);
                  onExport();
                }}
                aria-label="Sacar a mi dispositivo"
                className="vault-more-menu-item w-full h-[56px] px-6 flex items-center gap-4 text-left transition-colors cursor-pointer"
                style={{ color: sheetPrimaryText }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={sheetAccentText}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span className="text-[16px] font-medium" style={{ color: sheetPrimaryText }}>
                  Sacar a mi dispositivo
                </span>
              </button>

              {/* 2. Compartir */}
              <button
                type="button"
                onClick={() => {
                  setIsOptionsOpen(false);
                  onShare();
                }}
                aria-label="Compartir"
                className="vault-more-menu-item w-full h-[56px] px-6 flex items-center gap-4 text-left transition-colors cursor-pointer"
                style={{ color: sheetPrimaryText }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={sheetAccentText}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span className="text-[16px] font-medium" style={{ color: sheetPrimaryText }}>
                  Compartir
                </span>
              </button>

              {/* 3. Copiar */}
              <button
                type="button"
                onClick={() => {
                  setIsOptionsOpen(false);
                  onCopy();
                }}
                aria-label="Copiar"
                className="vault-more-menu-item w-full h-[56px] px-6 flex items-center gap-4 text-left transition-colors cursor-pointer"
                style={{ color: sheetPrimaryText }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={sheetAccentText}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span className="text-[16px] font-medium" style={{ color: sheetPrimaryText }}>
                  Copiar
                </span>
              </button>

              {/* 4. Velocidad de reproducción (0.75x -> 1x -> 1.25x -> 1.5x -> 2x) */}
              <button
                type="button"
                onClick={() => {
                  const nextRate = vaultAudioEngine.cyclePlaybackRate();
                  setPlaybackRate(nextRate);
                }}
                aria-label={`Velocidad de reproducción: ${playbackRate}x`}
                className="vault-more-menu-item w-full h-[56px] px-6 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer"
                style={{ color: sheetPrimaryText }}
              >
                <div className="flex items-center gap-4">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={sheetAccentText}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a10 10 0 1 0 10 10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="text-[16px] font-medium" style={{ color: sheetPrimaryText }}>
                    Velocidad de reproducción
                  </span>
                </div>
                <span
                  className="text-[14px] font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: sheetPillBg, color: sheetAccentText }}
                >
                  {playbackRate}x
                </span>
              </button>

              {/* 5. Eliminar */}
              <button
                type="button"
                onClick={() => {
                  setIsOptionsOpen(false);
                  onDeleteRequest();
                }}
                aria-label="Eliminar"
                className="w-full h-[56px] px-6 flex items-center gap-4 text-left transition-colors cursor-pointer"
                style={{ color: sheetDangerColor }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={sheetDangerColor}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                <span className="text-[16px] font-semibold" style={{ color: sheetDangerColor }}>
                  Eliminar
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
