import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Calendar,
  Edit3,
  HardDrive,
  ShieldCheck,
  FileText,
  LifeBuoy,
  CheckCircle2,
  ChevronRight,
  X,
  Save,
  Info,
  LogOut,
  RefreshCw,
  Code2,
  Cpu,
  RotateCcw,
  Loader2,
  ArrowLeft,
  Check,
  Lock,
  Copy,
  AlertCircle,
  Shield,
  Camera,
  Image as ImageIcon,
  Trash2,
  Pencil,
  Plus,
  Database,
} from 'lucide-react';
import {
  userProfileService,
  UserProfile,
  calculateAgeFromBirthDate,
  formatBirthDateMask,
} from '../services/userProfileService';
import { signOutFromFirebase, syncUserProfile } from '../services/firebaseAuthService';
import { signInWithNativeGoogle } from '../services/nativeGoogleAuthService';
import { themeService, VaultTheme } from '../services/themeService';
import { CURRENT_APP_VERSION as APP_VERSION } from '../version';
import { formatSize } from '../utils/formatUtils';
import { getNativeDeviceStorage } from '../services/nativeVaultBridge';
import {
  getVaultStats,
  VAULT_CATEGORIES_ORDER,
  VAULT_CATEGORY_META,
  VaultCategoryStat,
} from '../db/vaultDb';

interface ProfileVaultViewProps {
  counts: {
    photos: number;
    videos: number;
    audios: number;
    apps: number;
    documents?: number;
    totalBytes: number;
    photoBytes?: number;
    videoBytes?: number;
    audioBytes?: number;
    appBytes?: number;
    documentBytes?: number;
    categories?: VaultCategoryStat[];
  };
  showToast: (message: string, type?: 'info' | 'success' | 'alert' | 'error') => void;
  onOpenSettings?: () => void;
  onNavigateToVault?: () => void;
}

export const ProfileVaultView: React.FC<ProfileVaultViewProps> = ({
  counts,
  showToast,
  onOpenSettings,
  onNavigateToVault,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(() => userProfileService.getUserProfile());
  const [currentTheme, setCurrentTheme] = useState<VaultTheme>(() => themeService.getTheme());
  const [showFullEmail, setShowFullEmail] = useState(false);
  const emailRevealTimerRef = useRef<any>(null);
  const [deviceStorage, setDeviceStorage] = useState<{ freeBytes: number; totalQuotaBytes: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (emailRevealTimerRef.current) {
        clearTimeout(emailRevealTimerRef.current);
      }
    };
  }, []);

  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editCalculatedAge, setEditCalculatedAge] = useState<number | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState<string | undefined>(undefined);
  const [editError, setEditError] = useState<string | null>(null);
  const [isChangingGoogle, setIsChangingGoogle] = useState(false);

  // Modals for Support, Terms, and Developer
  const [activeInfoModal, setActiveInfoModal] = useState<'privacy' | 'terms' | 'support' | 'developer' | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (email: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(email);
    }
    setCopiedEmail(true);
    showToast('Correo copiado al portapapeles: ' + email, 'success');
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  useEffect(() => {
    return userProfileService.subscribe((updated) => {
      setProfile(updated);
      if (updated?.email) {
        setEditEmail(updated.email);
      }
      setIsChangingGoogle(false);
    });
  }, []);

  useEffect(() => {
    const unsub = themeService.subscribe((t) => setCurrentTheme(t));
    const handleThemeEvent = (e: any) => {
      if (e.detail?.theme) setCurrentTheme(e.detail.theme);
    };
    window.addEventListener('vault_theme_changed', handleThemeEvent);
    return () => {
      unsub();
      window.removeEventListener('vault_theme_changed', handleThemeEvent);
    };
  }, []);

  const [dbCategoryStats, setDbCategoryStats] = useState<{
    totalItems: number;
    totalBytes: number;
    categories: VaultCategoryStat[];
  } | null>(null);

  // Consultar espacio de almacenamiento real del dispositivo y sincronizar categorías de vaultDb
  useEffect(() => {
    let isMounted = true;
    getNativeDeviceStorage().then((storage) => {
      if (!isMounted) return;
      if (storage && storage.quota > 0) {
        setDeviceStorage({ freeBytes: storage.free, totalQuotaBytes: storage.quota });
      }
    }).catch(() => {});

    const syncFromDb = () => {
      getVaultStats()
        .then((stats) => {
          if (!isMounted) return;
          setDbCategoryStats({
            totalItems: stats.count,
            totalBytes: stats.totalBytes,
            categories: stats.categories,
          });
        })
        .catch(() => {});
    };

    syncFromDb();
    window.addEventListener('vault_trash_updated', syncFromDb);
    return () => {
      isMounted = false;
      window.removeEventListener('vault_trash_updated', syncFromDb);
    };
  }, [
    counts.totalBytes,
    counts.photos,
    counts.videos,
    counts.audios,
    counts.apps,
    counts.documents,
  ]);

  const openEditModal = () => {
    if (profile) {
      setEditFirst(profile.firstName);
      setEditLast(profile.lastName || '');
      setEditBirthDate(profile.birthDate || '');
      setEditCalculatedAge(profile.age || (profile.birthDate ? calculateAgeFromBirthDate(profile.birthDate) : null));
      setEditEmail(profile.email);
      setEditPhotoURL(profile.photoURL);
    } else {
      setEditFirst('');
      setEditLast('');
      setEditBirthDate('');
      setEditCalculatedAge(null);
      setEditEmail('');
      setEditPhotoURL(undefined);
    }
    setIsChangingGoogle(false);
    setEditError(null);
    setIsEditing(true);
  };

  const handleBirthDateEdit = (val: string) => {
    const masked = formatBirthDateMask(val);
    setEditBirthDate(masked);
    setEditError(null);
    if (masked.length === 10) {
      const a = calculateAgeFromBirthDate(masked);
      setEditCalculatedAge(a);
    } else {
      setEditCalculatedAge(null);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona una imagen válida', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (dataUrl) {
        setEditPhotoURL(dataUrl);
        showToast('Foto de perfil actualizada', 'success');
        setShowPhotoModal(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setEditPhotoURL('');
    showToast('Foto de perfil eliminada', 'info');
    setShowPhotoModal(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = editFirst.replace(/\s+/g, ' ').trim();
    const cleanLast = editLast.replace(/\s+/g, ' ').trim();
    const cleanEmail = editEmail.trim().toLowerCase();

    if (!cleanFirst) {
      setEditError('El nombre es obligatorio.');
      return;
    }

    let age: number | undefined = undefined;
    if (editBirthDate) {
      if (editBirthDate.length !== 10) {
        setEditError('La fecha de nacimiento debe tener el formato DD/MM/AAAA.');
        return;
      }
      const calc = calculateAgeFromBirthDate(editBirthDate);
      if (calc === null || calc < 1 || calc > 120) {
        setEditError('Por favor, ingresa una fecha de nacimiento válida.');
        return;
      }
      age = calc;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setEditError('Ingresa un correo electrónico válido.');
      return;
    }

    const currentEmail = (profile?.email || '').trim().toLowerCase();
    const isEmailChanging = currentEmail && cleanEmail !== currentEmail;

    // Save profile directly preserving original authProvider ('google.com' or 'password')
    const savedProfile = userProfileService.saveUserProfile({
      firstName: cleanFirst,
      lastName: cleanLast,
      birthDate: editBirthDate || undefined,
      age: age ?? profile?.age,
      email: cleanEmail,
      emailVerified: true,
      photoURL: editPhotoURL !== undefined ? editPhotoURL : profile?.photoURL,
      authProvider: profile?.authProvider || 'password',
    });

    // Sincronizar también en localStorage de cuenta registrada y Firestore para que el nombre completo persista
    try {
      const acctKey = `vault_registered_acct_${cleanEmail}`;
      const rawAcct = localStorage.getItem(acctKey);
      if (rawAcct) {
        const parsedAcct = JSON.parse(rawAcct);
        parsedAcct.firstName = cleanFirst;
        parsedAcct.lastName = cleanLast;
        localStorage.setItem(acctKey, JSON.stringify(parsedAcct));
      }
    } catch {}

    try {
      const b64Email = btoa(cleanEmail).replace(/=/g, '');
      const prefix = savedProfile.authProvider === 'google.com' ? 'google_' : 'vault_';
      syncUserProfile(`${prefix}${b64Email}`, {
        firstName: savedProfile.firstName,
        lastName: savedProfile.lastName,
        birthDate: savedProfile.birthDate,
        age: savedProfile.age,
        email: savedProfile.email,
        emailVerified: true,
        photoURL: savedProfile.photoURL,
        authProvider: savedProfile.authProvider,
      }).catch(() => {});
    } catch {}

    setProfile(savedProfile);
    setIsEditing(false);
    showToast(isEmailChanging ? 'Correo confirmado y actualizado' : 'Perfil actualizado correctamente', 'success');
  };

  const handleChangeGoogleAccount = async () => {
    if (isChangingGoogle) return;
    setIsChangingGoogle(true);
    try {
      const typedFirst = editFirst.replace(/\s+/g, ' ').trim();
      const typedLast = editLast.replace(/\s+/g, ' ').trim();
      const res = await signInWithNativeGoogle();
      if (res.success && res.profile) {
        const newEmail = res.profile.email.trim().toLowerCase();
        const handle = newEmail.split('@')[0] || 'Usuario';
        const googleFirst =
          res.profile.firstName ||
          handle.charAt(0).toUpperCase() + handle.slice(1);
        // Si el usuario ya escribió dos nombres en la caja de texto "Nombre" (ej. "José Manuel"), conservarlos
        const cleanFirstName =
          typedFirst && typedFirst.includes(' ')
            ? typedFirst
            : googleFirst;
        const cleanLastName = res.profile.lastName || typedLast || '';
        const cleanPhotoURL = res.profile.photoURL || '';

        // Actualizar con los datos de la nueva cuenta de Google seleccionada
        const freshProfile = userProfileService.saveUserProfile({
          firstName: cleanFirstName,
          lastName: cleanLastName,
          birthDate: undefined,
          age: undefined,
          email: newEmail,
          emailVerified: true,
          photoURL: cleanPhotoURL,
          authProvider: 'google.com',
        });

        setEditFirst(cleanFirstName);
        setEditLast(cleanLastName);
        setEditBirthDate('');
        setEditCalculatedAge(null);
        setEditEmail(newEmail);
        setEditPhotoURL(cleanPhotoURL);
        setProfile(freshProfile);
        setEditError(null);
        showToast(`Cuenta de Google autorizada: ${newEmail}`, 'success');
        return;
      }
      if (res.cancelled) {
        return;
      }
      if (res.error === 'web_environment') {
        showToast('En el teléfono Android abre el selector nativo de Google', 'info');
        return;
      }
      if (res.error) {
        showToast(res.error, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'No se pudo abrir el selector de Google', 'error');
    } finally {
      setIsChangingGoogle(false);
    }
  };

  // Lista dinámica de carpetas/categorías sincronizada con MainVaultView y vaultDb
  const dynamicCategories: VaultCategoryStat[] =
    counts.categories && counts.categories.length > 0
      ? counts.categories
      : dbCategoryStats?.categories && dbCategoryStats.categories.length > 0
      ? dbCategoryStats.categories
      : VAULT_CATEGORIES_ORDER.map((catId) => {
          const meta = VAULT_CATEGORY_META[catId];
          const count =
            catId === 'photo'
              ? counts.photos || 0
              : catId === 'video'
              ? counts.videos || 0
              : catId === 'audio'
              ? counts.audios || 0
              : catId === 'app'
              ? counts.apps || 0
              : counts.documents || 0;
          const bytes =
            catId === 'photo'
              ? counts.photoBytes || 0
              : catId === 'video'
              ? counts.videoBytes || 0
              : catId === 'audio'
              ? counts.audioBytes || 0
              : catId === 'app'
              ? counts.appBytes || 0
              : counts.documentBytes || 0;
          return {
            id: catId,
            ...meta,
            count,
            bytes,
          };
        });

  const totalItems = dynamicCategories.reduce((acc, cat) => acc + cat.count, 0);
  const totalVaultBytes =
    counts.totalBytes > 0
      ? counts.totalBytes
      : dynamicCategories.reduce((acc, cat) => acc + cat.bytes, 0);
  const initials = userProfileService.getInitials(profile);

  // Formato estricto en "MB" para todas las categorías de la bóveda
  const formatStorageMB = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 0.01) return '< 0.01 MB';
    if (mb < 1) return `${mb.toFixed(2)} MB`;
    return `${mb.toFixed(1)} MB`;
  };

  // Formato para el almacenamiento libre del dispositivo (GB si >= 1 GB, o MB)
  const formatFreeDeviceStorage = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return 'Calculando...';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Enmascarar el correo: primeras 3 letras, puntos "••••••" y el dominio (ej. "cue••••••@gmail.com")
  const maskEmail = (emailStr?: string): string => {
    if (!emailStr) return 'Sin correo vinculado';
    const atIndex = emailStr.indexOf('@');
    if (atIndex === -1) return emailStr;
    const namePart = emailStr.slice(0, atIndex);
    const domainPart = emailStr.slice(atIndex); // incluye el @
    const visiblePrefix = namePart.slice(0, Math.min(3, namePart.length));
    const hiddenCount = Math.max(4, Math.min(8, namePart.length - visiblePrefix.length));
    const bulletDots = '•'.repeat(hiddenCount);
    return `${visiblePrefix}${bulletDots}${domainPart}`;
  };

  const handleToggleEmailReveal = () => {
    if (emailRevealTimerRef.current) {
      clearTimeout(emailRevealTimerRef.current);
      emailRevealTimerRef.current = null;
    }
    if (showFullEmail) {
      setShowFullEmail(false);
    } else {
      setShowFullEmail(true);
      emailRevealTimerRef.current = setTimeout(() => {
        setShowFullEmail(false);
        emailRevealTimerRef.current = null;
      }, 5000);
    }
  };

  // Espacio libre real del dispositivo (obtenido de Android StatFs nativo o Web Storage)
  const freeDeviceBytes = deviceStorage?.freeBytes || 0;
  const totalDeviceQuota = deviceStorage?.totalQuotaBytes || 0;
  const calculatedVaultPct = totalDeviceQuota > 0
    ? (totalVaultBytes / totalDeviceQuota) * 100
    : 0;
  // Franja mínima visible si la bóveda tiene contenido
  const vaultBarWidthPct = totalItems > 0 ? Math.max(3.5, Math.min(100, calculatedVaultPct)) : 0;

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-[max(calc(env(safe-area-inset-bottom,0px)+4.75rem),5rem)] animate-in fade-in duration-200 select-none box-border space-y-4">
      {/* Fixed Pinned Header */}
      <header
        className="fixed top-0 left-0 right-0 z-30 [backdrop-filter:blur(24px)] backdrop-blur-xl border-b safe-top-sticky pb-3 px-4 shadow-md transition-all"
        style={{
          backgroundColor: 'var(--theme-bg-header, rgba(6, 11, 20, 0.94))',
          borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.8))',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="max-w-md mx-auto w-full flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-0.5" style={{ color: 'var(--theme-text-main, #ffffff)' }}>
              Informa<span style={{ color: 'var(--theme-primary, #00e5ff)' }}>ción</span>
            </h1>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>
              ALMACENAMIENTO, SOPORTE Y CRÉDITOS
            </p>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="safe-top-header-spacer shrink-0 w-full mb-3" />

      {/* 1. ENCABEZADO DE PERFIL CON DISEÑO CENTRADO */}
      <div
        className="rounded-[26px] p-6 shadow-xl border transition-colors flex flex-col items-center text-center"
        style={{
          backgroundColor: 'var(--theme-bg-card, #0d1624)',
          borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.6))',
        }}
      >
        {/* 1. Avatar circular de 76 px con inicial de 32 px peso medio y degradado verde-turquesa */}
        <div className="relative shrink-0 flex items-center justify-center">
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.firstName}
              className="w-[76px] h-[76px] rounded-full object-cover shadow-lg border border-cyan-500/30"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-[76px] h-[76px] rounded-full flex items-center justify-center text-white text-[32px] font-medium shadow-lg select-none"
              style={{
                background: 'linear-gradient(135deg, #00f0b5, #00b4d8)',
              }}
            >
              {profile?.firstName ? profile.firstName.trim().charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>

        {/* 2. Nombre en 22 px, peso medio, a 10 px debajo del avatar */}
        <h2
          className="mt-[10px] text-[22px] font-medium tracking-tight truncate max-w-full leading-tight"
          style={{ color: 'var(--theme-text-main, #ffffff)' }}
        >
          {profile ? `${profile.firstName} ${profile.lastName || ''}`.trim() : 'Usuario'}
        </h2>

        {/* 3. Correo enmascarado en 13 px (cue••••••@gmail.com) con revelado de 5s o al re-tocar */}
        <div
          onClick={handleToggleEmailReveal}
          role="button"
          tabIndex={0}
          title="Toca para mostrar el correo completo durante 5 segundos"
          className="mt-1.5 cursor-pointer select-none group inline-block max-w-full px-2"
        >
          <p
            className="text-[13px] font-mono tracking-tight break-words leading-relaxed group-hover:opacity-90 transition-opacity"
            style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
          >
            {showFullEmail ? (profile?.email || 'Sin correo vinculado') : maskEmail(profile?.email)}
          </p>
        </div>

        {/* 4. Etiqueta en forma de píldora en una sola línea (nowrap) */}
        <div className="mt-3">
          {profile?.emailVerified !== false ? (
            <div
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-emerald-500/30 text-xs font-medium text-emerald-400 whitespace-nowrap select-none"
              style={{
                backgroundColor: currentTheme === 'light' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(6, 78, 59, 0.45)',
              }}
            >
              <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5] text-emerald-400" />
              <span className="whitespace-nowrap">Correo verificado</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={openEditModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-amber-500/40 text-xs font-medium text-amber-400 whitespace-nowrap select-none cursor-pointer active:scale-95 transition-all"
              style={{
                backgroundColor: currentTheme === 'light' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(120, 53, 15, 0.45)',
              }}
              title="Toca para verificar correo"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 stroke-[2.5] text-amber-400" />
              <span className="whitespace-nowrap">Verificar correo</span>
            </button>
          )}
        </div>

        {/* 5. Botón ancho "Editar perfil" al final: texto azul, borde fino azul, sin relleno, min-h 44px */}
        <button
          type="button"
          onClick={openEditModal}
          className="w-full mt-5 min-h-[44px] py-2.5 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none active:scale-[0.99] border bg-transparent"
          style={{
            borderColor: currentTheme === 'light' ? '#0284c7' : '#00e5ff',
            color: currentTheme === 'light' ? '#0284c7' : '#00e5ff',
          }}
        >
          <Pencil
            className="w-4 h-4 shrink-0"
            style={{ color: currentTheme === 'light' ? '#0284c7' : '#00e5ff' }}
          />
          <span
            className="font-semibold"
            style={{ color: currentTheme === 'light' ? '#0284c7' : '#00e5ff' }}
          >
            Editar perfil
          </span>
        </button>
      </div>

      {/* 2. TARJETA DE RESUMEN DE ALMACENAMIENTO (ESTILO EXACTO A LA CAPTURA) */}
      <div
        className="rounded-[26px] p-5 shadow-xl border transition-colors space-y-4"
        style={{
          backgroundColor: 'var(--theme-bg-card, #0d1624)',
          borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.6))',
        }}
      >
        {/* Encabezado: Icono Database en contenedor azul redondeado + Título y conteo de archivos */}
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0"
            style={{
              backgroundColor: currentTheme === 'light' ? 'rgba(2, 132, 199, 0.12)' : 'rgba(0, 150, 255, 0.15)',
              borderColor: currentTheme === 'light' ? 'rgba(2, 132, 199, 0.3)' : 'rgba(0, 150, 255, 0.35)',
              color: 'var(--theme-primary, #38bdf8)',
            }}
          >
            <Database className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <h3
              className="font-bold text-base sm:text-lg tracking-tight leading-tight truncate"
              style={{ color: 'var(--theme-text-main, #ffffff)' }}
            >
              Almacenamiento protegido
            </h3>
            <p
              className="text-xs mt-0.5 truncate font-normal"
              style={{ color: 'var(--theme-text-muted, #94a3b8)' }}
            >
              {totalItems} archivos en este dispositivo
            </p>
          </div>
        </div>

        {/* Cifra grande del almacenamiento total en MB */}
        <div className="pt-0.5">
          <span
            className="text-4xl sm:text-5xl font-black font-mono tracking-tight"
            style={{ color: 'var(--theme-primary, #60a5fa)' }}
          >
            {formatStorageMB(totalVaultBytes)}
          </span>
        </div>

        {/* Barra Visual de Almacenamiento Segmentada con franja mínima si hay archivos */}
        <div>
          <div
            className="w-full h-3 rounded-full overflow-hidden flex border p-0.5"
            style={{
              backgroundColor: 'var(--theme-bg-secondary, #141b27)',
              borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.7))',
            }}
          >
            {totalItems > 0 ? (
              <div
                className="h-full flex overflow-hidden rounded-full transition-all duration-500"
                style={{
                  width: `${vaultBarWidthPct}%`,
                  minWidth: totalItems > 0 ? '16px' : '0px',
                }}
              >
                {dynamicCategories
                  .filter((cat) => cat.bytes > 0 || cat.count > 0)
                  .map((cat) => {
                    const rawPct =
                      totalVaultBytes > 0 ? (cat.bytes / totalVaultBytes) * 100 : 0;
                    const segmentPct = Math.max(rawPct, cat.bytes > 0 ? 15 : 8);
                    return (
                      <div
                        key={cat.id}
                        className={`h-full ${cat.barColorClass} transition-all duration-300`}
                        style={{
                          width: `${segmentPct}%`,
                        }}
                      />
                    );
                  })}
              </div>
            ) : (
              <div className="h-full w-0" />
            )}
          </div>

          {/* Lista dinámica de todas las carpetas/categorías de la bóveda (sincronizada con MainVaultView) */}
          <div className="space-y-3 pt-3.5 text-sm sm:text-base font-normal">
            {dynamicCategories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${cat.barColorClass} shrink-0`} />
                  <span style={{ color: 'var(--theme-text-main, #ffffff)' }}>{cat.label}</span>
                </div>
                <span className="font-mono text-sm" style={{ color: 'var(--theme-text-muted, #cbd5e1)' }}>
                  {formatStorageMB(cat.bytes)}
                </span>
              </div>
            ))}

            {/* Libre en el dispositivo (círculo gris con borde, sin relleno) */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full border-2 border-slate-500 bg-transparent shrink-0" />
                <span style={{ color: 'var(--theme-text-main, #ffffff)' }}>Libre en el dispositivo</span>
              </div>
              <span className="font-mono text-sm font-semibold" style={{ color: 'var(--theme-text-muted, #cbd5e1)' }}>
                {formatFreeDeviceStorage(freeDeviceBytes)}
              </span>
            </div>
          </div>
        </div>

        {/* Estado cuando hay 0 archivos: mensaje y botón para agregar archivos */}
        {totalItems === 0 && (
          <div
            className="p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition-all mt-2"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--theme-bg-secondary, #0f172a) 85%, transparent)',
              borderColor: 'color-mix(in srgb, var(--theme-primary, #00e5ff) 25%, var(--theme-border, #334155))',
            }}
          >
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--theme-text-main, #ffffff)' }}>
                Tu bóveda está vacía
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>
                Protege tus fotos, videos, audios, aplicaciones y documentos con cifrado militar.
              </p>
            </div>
            {onNavigateToVault && (
              <button
                type="button"
                onClick={onNavigateToVault}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95 border shadow-sm"
                style={{
                  backgroundColor: 'var(--theme-primary, #00e5ff)',
                  borderColor: 'var(--theme-primary, #00e5ff)',
                  color: currentTheme === 'light' ? '#ffffff' : '#000000',
                }}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Agregar archivos</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. SECCIÓN DE SOPORTE, TÉRMINOS Y LICENCIA */}
      <div
        className="rounded-3xl p-5 shadow-xl border transition-colors space-y-3"
        style={{
          backgroundColor: 'var(--theme-bg-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-wider px-1"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          Soporte y Legal
        </h3>

        <div className="space-y-1.5">
          {/* Privacidad Total */}
          <button
            type="button"
            onClick={() => setActiveInfoModal('privacy')}
            className="w-full p-3.5 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer group"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, transparent)',
                  color: 'var(--theme-primary)',
                }}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold" style={{ color: 'var(--theme-text-main)' }}>
                  Privacidad y Cero Rastreo
                </p>
                <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                  Cifrado militar local en tu dispositivo
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--theme-text-subtle)' }} />
          </button>

          {/* Términos y Licencia */}
          <button
            type="button"
            onClick={() => setActiveInfoModal('terms')}
            className="w-full p-3.5 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer group"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, transparent)',
                  color: 'var(--theme-primary)',
                }}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold" style={{ color: 'var(--theme-text-main)' }}>
                  Términos de Uso y Licencia
                </p>
                <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                  Licencia Apache-2.0 de software seguro
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--theme-text-subtle)' }} />
          </button>

          {/* Asistencia y Soporte */}
          <button
            type="button"
            onClick={() => setActiveInfoModal('support')}
            className="w-full p-3.5 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer group"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, transparent)',
                  color: 'var(--theme-primary)',
                }}
              >
                <LifeBuoy className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold" style={{ color: 'var(--theme-text-main)' }}>
                  Centro de Ayuda y Preguntas
                </p>
                <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                  Recuperación de clave, respaldo y dudas
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--theme-text-subtle)' }} />
          </button>

          {/* Acerca del Desarrollador */}
          <button
            type="button"
            onClick={() => setActiveInfoModal('developer')}
            className="w-full p-3.5 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer group"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, transparent)',
                  color: 'var(--theme-primary)',
                }}
              >
                <Code2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold" style={{ color: 'var(--theme-text-main)' }}>
                  Acerca del Desarrollador
                </p>
                <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                  Creado por José Manuel Martínez Ayala • Criptografía y Privacidad
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--theme-text-subtle)' }} />
          </button>
        </div>

        {/* Versión de la App */}
        <div
          className="mt-4 pt-3 border-t flex items-center justify-between text-[11px]"
          style={{
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-subtle)',
          }}
        >
          <span>Versión Instalada</span>
          <span className="font-mono font-bold" style={{ color: 'var(--theme-text-main)' }}>
            v{APP_VERSION}
          </span>
        </div>
      </div>

      {/* 4. PIE DE PÁGINA */}
      <div className="text-center pt-1 pb-3 space-y-1">
        <p className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--theme-text-subtle)' }}>
          José Manuel Martínez Ayala • Licencia Apache-2.0
        </p>
        <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
          Bóveda Segura — Proyecto de Código Abierto
        </p>
      </div>

      {/* MODAL: EDITAR MIS DATOS (IMAGEN 2 - CENTRADO EN PANTALLA) */}
      {isEditing && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditing(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto"
        >
          <div
            className="w-full max-w-[340px] rounded-[26px] p-5 sm:p-6 shadow-2xl border transition-all animate-in zoom-in-95 duration-200 my-auto bg-[#090f1d] border-slate-800/80"
            style={{
              backgroundColor: 'var(--theme-bg-card, #090f1d)',
              borderColor: 'var(--theme-border, rgba(30, 41, 59, 0.8))',
            }}
          >
            {/* Cabecera: Flecha atrás + Editar perfil */}
            <div className="flex items-center gap-3 mb-5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 -ml-1 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Editar perfil
              </h3>
            </div>

            {/* Avatar circular con doble aro degradado + botón de cámara */}
            <div className="flex flex-col items-center mb-5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(true)}
                  className="block relative rounded-full group cursor-pointer focus:outline-none"
                  title="Cambiar foto de perfil"
                >
                  <div className="p-[3px] rounded-full bg-gradient-to-tr from-[#2563eb] via-[#00d4ff] to-[#00f0b5] shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                    <div
                      className="p-[3px] rounded-full bg-[#090f1d]"
                      style={{ backgroundColor: 'var(--theme-bg-card, #090f1d)' }}
                    >
                      {(editPhotoURL !== undefined ? editPhotoURL : profile?.photoURL) ? (
                        <img
                          src={editPhotoURL !== undefined ? editPhotoURL : profile?.photoURL}
                          alt={editFirst || profile?.firstName || 'Perfil'}
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="profile-edit-avatar-circle w-20 h-20 rounded-full bg-gradient-to-b from-[#00d2b8] to-[#1d63e8] flex items-center justify-center text-white text-4xl font-bold select-none">
                          {(editFirst.trim() || editEmail.trim() || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badge botón camarita */}
                  <div className="profile-edit-camera-badge absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-100 border-2 border-[#090f1d] flex items-center justify-center text-slate-900 shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-2.5">
                Toca la cámara para cambiar tu foto
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveEdit} className="space-y-3 text-left">
              {/* Campo Nombre (tipo placeholder) */}
              <div
                className="w-full rounded-2xl bg-[#111927] border border-slate-700/60 px-4 py-3 flex items-center gap-3.5 focus-within:border-[#00f0b5] transition-colors"
                style={{
                  backgroundColor: 'var(--theme-bg-secondary, #111927)',
                  borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.6))',
                }}
              >
                <User className="w-5 h-5 text-[#00f0b5] shrink-0" />
                <input
                  type="text"
                  value={editFirst}
                  onChange={(e) => {
                    setEditFirst(e.target.value);
                    setEditError(null);
                  }}
                  required
                  placeholder="Nombre"
                  className="w-full bg-transparent border-0 p-0 text-sm text-white placeholder-slate-400 font-normal focus:ring-0 outline-none"
                />
              </div>

              {/* Campo Apellidos (tipo placeholder) */}
              <div
                className="w-full rounded-2xl bg-[#111927] border border-slate-700/60 px-4 py-3 flex items-center gap-3.5 focus-within:border-[#00f0b5] transition-colors"
                style={{
                  backgroundColor: 'var(--theme-bg-secondary, #111927)',
                  borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.6))',
                }}
              >
                <svg
                  className="w-5 h-5 text-[#00f0b5] shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="9" cy="11" r="2" />
                  <path d="M15 10h2" />
                  <path d="M15 14h2" />
                  <path d="M7 15h4" />
                </svg>
                <input
                  type="text"
                  value={editLast}
                  onChange={(e) => {
                    setEditLast(e.target.value);
                    setEditError(null);
                  }}
                  placeholder="Apellidos · opcional"
                  className="w-full bg-transparent border-0 p-0 text-sm text-white placeholder-slate-400 font-normal focus:ring-0 outline-none"
                />
              </div>

              {/* Sección CORREO */}
              <div className="pt-1">
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2">
                  CORREO
                </label>
                <div
                  className="w-full rounded-2xl bg-[#111927] border border-slate-700/60 p-3.5 space-y-3"
                  style={{
                    backgroundColor: 'var(--theme-bg-secondary, #111927)',
                    borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.6))',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm text-white font-normal truncate">
                      {editEmail || profile?.email || 'Sin correo'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleChangeGoogleAccount}
                    disabled={isChangingGoogle}
                    className="profile-change-email-btn w-full py-2.5 px-4 rounded-xl border border-[#00f0b5]/40 bg-[#0b1320]/60 text-xs font-medium text-[#00f0b5] hover:bg-[#00f0b5]/10 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isChangingGoogle ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Abriendo...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Cambiar correo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {editError && (
                <div className="p-2.5 rounded-xl text-xs border border-rose-500/30 bg-rose-500/10 text-rose-400">
                  {editError}
                </div>
              )}

              {/* Botones inferiores: Guardar cambios (degradado) y Cancelar */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#00e5a3] via-[#00b4d8] to-[#1d63ff] flex items-center justify-center shadow-[0_6px_20px_rgba(0,180,216,0.28)] active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Guardar cambios</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full py-1.5 text-sm font-medium text-slate-400 hover:text-white cursor-pointer transition-colors text-center block"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FOTO DEL PERFIL (IMAGEN 3 - CENTRADO EN PANTALLA) */}
      {showPhotoModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPhotoModal(false);
          }}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div
            className="w-full max-w-sm rounded-[28px] p-6 shadow-2xl border transition-all animate-in zoom-in-95 duration-200 my-auto bg-[#0a111e] border-slate-700/70"
            style={{
              backgroundColor: 'var(--theme-bg-card, #0a111e)',
              borderColor: 'var(--theme-border, rgba(51, 65, 85, 0.7))',
            }}
          >
            {/* Cabecera: Cerrar (X) + Título + Papelera */}
            <div className="flex justify-between items-center mb-6">
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-colors"
                title="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-xl font-bold text-white tracking-tight">
                Foto del perfil
              </h3>

              <button
                type="button"
                onClick={handleRemovePhoto}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
                title="Eliminar foto"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>

            {/* Opciones: Cámara y Galería */}
            <div className="space-y-2">
              {/* Opción Cámara */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-4 px-4 rounded-2xl flex items-center gap-4 hover:bg-slate-800/40 active:bg-slate-800/70 transition-colors text-left cursor-pointer group"
              >
                <Camera className="w-6 h-6 text-slate-300 group-hover:text-cyan-400 transition-colors" />
                <span className="text-base font-medium text-white">
                  Cámara
                </span>
              </button>

              {/* Opción Galería */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-4 px-4 rounded-2xl flex items-center gap-4 hover:bg-slate-800/40 active:bg-slate-800/70 transition-colors text-left cursor-pointer group"
              >
                <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-cyan-400 transition-colors" />
                <span className="text-base font-medium text-white">
                  Galería
                </span>
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoFileChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoFileChange}
            />
          </div>
        </div>
      )}


      {/* MODAL: INFO MODAL (PRIVACY / TERMS / SUPPORT / DEVELOPER) */}
      {activeInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all max-h-[85vh] flex flex-col"
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-main)',
            }}
          >
            <div className="flex justify-between items-center pb-3 border-b mb-3" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center gap-2">
                {activeInfoModal === 'developer' ? (
                  <Code2 className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                ) : (
                  <Info className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                )}
                <h3 className="font-bold text-sm" style={{ color: 'var(--theme-text-main)' }}>
                  {activeInfoModal === 'privacy' && 'Privacidad y Cero Rastreo'}
                  {activeInfoModal === 'terms' && 'Términos de Uso y Licencia'}
                  {activeInfoModal === 'support' && 'Centro de Ayuda y Preguntas'}
                  {activeInfoModal === 'developer' && 'Acerca del Desarrollador'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveInfoModal(null)}
                className="p-1.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3.5 text-xs pr-1 leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
              {activeInfoModal === 'developer' && (
                <>
                  {/* Tarjeta del Creador */}
                  <div
                    className="p-4 rounded-2xl border space-y-2 relative overflow-hidden"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, var(--theme-bg-secondary))',
                      borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, var(--theme-border))',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center border shadow-sm shrink-0"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--theme-primary) 35%, transparent)',
                          color: 'var(--theme-primary)',
                        }}
                      >
                        <Code2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm" style={{ color: 'var(--theme-text-main)' }}>
                          José Manuel Martínez Ayala
                        </h4>
                        <p className="text-[11px] font-medium" style={{ color: 'var(--theme-primary)' }}>
                          Creador y Desarrollador de Bóveda Segura
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                          Arquitectura de Software & Criptografía Aplicada
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] leading-relaxed pt-1" style={{ color: 'var(--theme-text-muted)' }}>
                      Esta aplicación fue concebida y desarrollada por <strong>José Manuel Martínez Ayala</strong> como una solución integral de almacenamiento privado de máxima seguridad, garantizando la soberanía absoluta de los datos personales sin depender de servidores centralizados.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs mb-1" style={{ color: 'var(--theme-text-main)' }}>
                      Filosofía de Conocimiento Cero (Zero-Knowledge)
                    </h4>
                    <p>
                      Ningún desarrollador, empresa o servidor en la nube tiene acceso a tus archivos, contraseñas ni multimedia. Cada elemento se procesa y cifra de forma matemáticamente aislada dentro del procesador de tu dispositivo.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs mb-1" style={{ color: 'var(--theme-text-main)' }}>
                      Estándares Tecnológicos Implementados
                    </h4>
                    <div className="space-y-1.5 text-[11px] pt-1">
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: 'var(--theme-primary)' }} />
                        <span><strong>Cifrado Simétrico:</strong> AES-256-GCM con Vector de Inicialización (IV) de 96 bits aleatorio por archivo.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: 'var(--theme-primary)' }} />
                        <span><strong>Derivación de Claves:</strong> PBKDF2 con SHA-256 y 100,000 iteraciones + Salt único criptográfico.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: 'var(--theme-primary)' }} />
                        <span><strong>Stack Nativo:</strong> React 19, TypeScript, Tailwind CSS, Web Crypto API y Progressive Web App (PWA).</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: 'var(--theme-primary)' }} />
                        <span><strong>Privacidad Digital:</strong> 100% libre de rastreadores analíticos, telemetría comercial y publicidad invasiva.</span>
                      </div>
                    </div>
                  </div>

                  {/* Sello de Código Abierto */}
                  <div className="text-center pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                    <p className="text-[10px] font-semibold" style={{ color: 'var(--theme-text-subtle)' }}>
                      Bóveda Segura — Software Libre y Código Abierto
                    </p>
                  </div>
                </>
              )}

              {activeInfoModal === 'privacy' && (
                <>
                  <div
                    className="p-3.5 rounded-2xl border"
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      borderColor: 'rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <p className="font-bold text-emerald-600 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      100% Privado y en tu Teléfono
                    </p>
                    <p>
                      Esta aplicación no envía absolutamente ningún archivo, foto, video, contraseña ni dato personal a servidores externos ni en la nube.
                    </p>
                  </div>
                  <p>
                    Todo el cifrado se realiza matemáticamente en el procesador de tu dispositivo utilizando el algoritmo <strong>AES-256-GCM</strong> con derivación de claves PBKDF2 y sal aleatoria única.
                  </p>
                  <p>
                    Ni los creadores de la app, ni terceros, ni operadoras pueden acceder al contenido de tu bóveda sin tu PIN maestro.
                  </p>
                </>
              )}

              {activeInfoModal === 'terms' && (
                <>
                  <p>
                    <strong>Licencia de Software:</strong> Bóveda Segura se distribuye bajo términos de código abierto Apache-2.0.
                  </p>
                  <p>
                    <strong>Seguridad de tu Cuenta:</strong> Al ser una aplicación con arquitectura de conocimiento cero (Zero-Knowledge), tus archivos se cifran localmente en tu dispositivo.
                  </p>
                  <p>
                    Mantén siempre acceso a tu <strong>correo electrónico registrado</strong> para poder verificar tu identidad con un código de 6 dígitos si alguna vez olvidas tu contraseña o tu PIN de 4 dígitos.
                  </p>
                </>
              )}

              {activeInfoModal === 'support' && (
                <>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--theme-text-main)' }}>
                      ¿Cómo recupero mi bóveda si olvido el PIN?
                    </p>
                    <p className="mt-0.5">
                      En la pantalla de bloqueo selecciona &quot;¿Olvidaste tu PIN?&quot;, escribe tu correo electrónico registrado, ingresa el código de verificación de 6 dígitos enviado a tu correo y define tu nuevo PIN de 4 dígitos sin perder ningún archivo.
                    </p>
                  </div>

                  <div className="pt-1">
                    <p className="font-semibold" style={{ color: 'var(--theme-text-main)' }}>
                      ¿Cómo paso mi información a otro teléfono?
                    </p>
                    <p className="mt-0.5">
                      Ve a <strong>Ajustes &gt; Copia de Seguridad</strong> y descarga tu archivo cifrado <code>.vault</code>. Pásalo a tu nuevo teléfono e impórtalo usando tu misma clave o PIN.
                    </p>
                  </div>

                  {/* Tarjeta: Reporte de fallos */}
                  <div
                    className="p-3.5 rounded-2xl border space-y-2.5 mt-3"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, var(--theme-bg-secondary))',
                      borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, var(--theme-border))',
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, transparent)',
                          color: 'var(--theme-primary)',
                        }}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold" style={{ color: 'var(--theme-text-main)' }}>
                          ¿Encontraste un error?
                        </p>
                        <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                          Si encuentras algún fallo o problema técnico, repórtalo directamente a:
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between gap-2 p-2 rounded-xl border text-[11px]"
                      style={{
                        backgroundColor: 'var(--theme-bg-card)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <a
                        href="mailto:jmmrtinez5121@gmail.com?subject=Reporte%20de%20fallo%20-%20B%C3%B3veda%20Segura"
                        className="font-mono underline font-medium hover:opacity-80 break-all text-[11px]"
                        style={{ color: 'var(--theme-primary)' }}
                      >
                        jmmrtinez5121@gmail.com
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail('jmmrtinez5121@gmail.com')}
                        title="Copiar correo"
                        className="px-2 py-1 rounded-lg border text-[10px] font-semibold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                        style={{
                          backgroundColor: 'var(--theme-bg-secondary)',
                          borderColor: 'var(--theme-border)',
                          color: copiedEmail ? 'var(--theme-primary)' : 'var(--theme-text-main)',
                        }}
                      >
                        {copiedEmail ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedEmail ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t mt-4" style={{ borderColor: 'var(--theme-border)' }}>
              <button
                type="button"
                onClick={() => setActiveInfoModal(null)}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white cursor-pointer transition-all"
                style={{
                  background: 'linear-gradient(135deg, var(--theme-primary), #2563eb)',
                  boxShadow: '0 4px 14px -2px var(--theme-glow)',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
