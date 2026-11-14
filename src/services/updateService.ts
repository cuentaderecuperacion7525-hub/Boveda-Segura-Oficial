/**
 * Servicio de detección, notificación y aplicación de actualizaciones para la aplicación.
 */

import { CURRENT_APP_VERSION, CURRENT_BUILD_NUMBER, VersionInfo } from '../version';
import { getSafeAppVersionCode } from './nativeUpdaterBridge';

const OFFICIAL_GITHUB_REPO = 'cuentaderecuperacion7525-hub/Boveda-Segura-Oficial';
const STALE_GITHUB_REPOS = new Set([
  'cuentaderecuperacion7525-hub/Mi-B-veda.-',
  'cuentaderecuperacion7525-hub/Mi-Boveda.-',
  'cuentadecuperacion7525-hub/Mi-B-veda.-',
  'cuentaderecuperacion7525-hub/Mi-Boveda',
  'cuentaderecuperacion7525-hub/Mi-B-veda',
]);

export interface NovedadItem {
  titulo: string;
  descripcion: string;
}

export interface CachedReleaseNotes {
  version: string;
  fecha: string;
  novedades: NovedadItem[];
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  serverVersion?: string;
  buildNumber?: number;
  publishedAtMs?: number;
  repoName?: string;
  fecha?: string;
  releaseDate?: string;
  novedades?: NovedadItem[];
  changelog?: string[];
  mandatory?: boolean;
  isServiceWorkerReady?: boolean;
  downloadUrl?: string;
  error?: string;
}

type UpdateListener = (result: UpdateCheckResult) => void;

class UpdateService {
  private listeners: Set<UpdateListener> = new Set();
  private lastCheckResult: UpdateCheckResult | null = null;
  private isChecking: boolean = false;

  constructor() {
    this.initServiceWorkerListener();
  }

  /**
   * Escucha si el service worker detecta un nuevo bundle listo en segundo plano.
   */
  private initServiceWorkerListener() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // El nuevo worker ha tomado control
      console.log('[UpdateService] Controller cambiado, nuevo SW activo');
    });
  }

  /**
   * Compara dos versiones semver (ej. "1.2.0" y "1.2.1").
   * Retorna 1 si v1 > v2, -1 si v1 < v2, y 0 si son iguales.
   */
  public compareVersions(v1: string, v2: string): number {
    const clean1 = v1.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
    const clean2 = v2.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);

    for (let i = 0; i < Math.max(clean1.length, clean2.length); i++) {
      const num1 = clean1[i] || 0;
      const num2 = clean2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  private parseNovedadesItems(rawData: any): NovedadItem[] {
    if (Array.isArray(rawData?.novedades) && rawData.novedades.length > 0) {
      return rawData.novedades
        .map((item: any) => ({
          titulo: String(item?.titulo ?? '').trim(),
          descripcion: String(item?.descripcion ?? item?.texto ?? '').trim(),
        }))
        .filter((item: NovedadItem) => item.titulo.length > 0 || item.descripcion.length > 0);
    }

    const legacyArray = Array.isArray(rawData?.changelog)
      ? rawData.changelog
      : Array.isArray(rawData?.cambios)
      ? rawData.cambios
      : null;

    if (legacyArray && legacyArray.length > 0 && !this.isLegacyStaticChangelog(legacyArray)) {
      return legacyArray
        .map((entry: any) => {
          if (entry && typeof entry === 'object') {
            return {
              titulo: String(entry.titulo ?? '').trim(),
              descripcion: String(entry.descripcion ?? entry.texto ?? '').trim(),
            };
          }
          const line = String(entry || '').trim();
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0 && colonIdx < 60) {
            return {
              titulo: line.slice(0, colonIdx).trim(),
              descripcion: line.slice(colonIdx + 1).trim(),
            };
          }
          return { titulo: '', descripcion: line };
        })
        .filter((item: NovedadItem) => item.titulo.length > 0 || item.descripcion.length > 0);
    }

    return [];
  }

  private parseReleaseBodyLines(body?: string): string[] {
    if (!body || typeof body !== 'string') return [];
    const lines = body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('---') && !/^sha256/i.test(line))
      .map((line) => line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').trim())
      .filter((line) => line.length >= 6 && !/descarga.*apk|archivo adjunto/i.test(line));
    return lines.slice(0, 6);
  }

  private isLegacyStaticChangelog(changelog?: unknown): boolean {
    if (!Array.isArray(changelog) || changelog.length === 0) return false;
    return changelog.some(
      (line) =>
        typeof line === 'string' &&
        /nueva interfaz minimalista de registro e inicio de sesi[oó]n con verificaci[oó]n de correo mediante c[oó]digo de 6 d[ií]gitos/i.test(line)
    );
  }

  public formatSpanishDate(fechaRaw?: string): string {
    const raw = String(fechaRaw || '').trim();
    if (!raw) return '';

    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const monthIdx = Number(isoMatch[2]) - 1;
      const day = Number(isoMatch[3]);
      const months = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      if (monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
        return `${day} de ${months[monthIdx]} de ${year}`;
      }
    }

    return raw;
  }

  public getCachedReleaseNotes(): CachedReleaseNotes | null {
    try {
      const raw = localStorage.getItem('vault_cached_release_notes_v1');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      const novedades = this.parseNovedadesItems(parsed);
      const version = String(parsed.version || '').replace(/^v/, '').trim();
      const fecha = String(parsed.fecha || '').trim();
      if (!version && !fecha && novedades.length === 0) return null;
      return { version, fecha, novedades };
    } catch {
      return null;
    }
  }

  public saveCachedReleaseNotes(notes: CachedReleaseNotes): void {
    try {
      localStorage.setItem('vault_cached_release_notes_v1', JSON.stringify(notes));
    } catch {}
  }

  private computeBuildFromTag(tag: string): number {
    const clean = tag.replace(/^v/, '');
    const parts = clean.split('.');
    if (parts.length >= 3) {
      const patch = parseInt(parts[2], 10);
      if (!isNaN(patch)) {
        return patch >= 1000 ? patch : 2000 + patch;
      }
    }
    return 2000;
  }

  /**
   * Comprueba si hay una actualización disponible consultando GitHub Releases, CDN de releases y version.json.
   */
  public async checkForUpdates(force: boolean = false): Promise<UpdateCheckResult> {
    if (this.isChecking && !force) {
      return this.lastCheckResult || {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
      };
    }

    this.isChecking = true;

    try {
      // Limpiar repositorio obsoleto almacenado si existiera
      const cachedRepo = localStorage.getItem('vault_github_repo');
      if (cachedRepo && STALE_GITHUB_REPOS.has(cachedRepo.trim())) {
        localStorage.setItem('vault_github_repo', OFFICIAL_GITHUB_REPO);
      }

      // 1. Verificar si hay un Service Worker esperando (update pendiente de PWA)
      let swHasUpdate = false;
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update();
            if (reg.waiting) {
              swHasUpdate = true;
            }
          }
        } catch (swErr) {
          console.warn('[UpdateService] No se pudo verificar ServiceWorker:', swErr);
        }
      }

      // 2. Obtener versión instalada en el dispositivo (APK nativo o web)
      let installedBuildNumber = CURRENT_BUILD_NUMBER;
      let installedVersionName = CURRENT_APP_VERSION;
      let installedLastUpdateTime = 0;
      try {
        const nativeVer = await getSafeAppVersionCode();
        if (nativeVer && typeof nativeVer.versionCode === 'number') {
          installedBuildNumber = nativeVer.versionCode;
        }
        if (nativeVer && nativeVer.versionName) {
          installedVersionName = nativeVer.versionName;
        }
        if (nativeVer && typeof nativeVer.lastUpdateTime === 'number') {
          installedLastUpdateTime = nativeVer.lastUpdateTime;
        }
      } catch {
        installedBuildNumber = CURRENT_BUILD_NUMBER;
        installedVersionName = CURRENT_APP_VERSION;
        installedLastUpdateTime = 0;
      }

      const cacheBuster = `_t=${Date.now()}`;
      let remoteData: (VersionInfo & { fecha?: string; novedades?: NovedadItem[] }) | null = null;
      let directApkUrl = '';
      let remoteBuild = 0;
      let remoteVersionStr = installedVersionName;
      let remotePublishedMs = 0;
      let resolvedRepo = this.getGitHubRepo();

      const reposToTry = this.getCandidateRepos();
      for (const repo of reposToTry) {
        // 2A. Consultar API oficial de GitHub Releases
        try {
          const ghApiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
          const ghApiRes = await fetch(ghApiUrl, {
            headers: { 'Accept': 'application/vnd.github.v3+json' },
            cache: 'no-store'
          });

          if (ghApiRes.ok) {
            const release = await ghApiRes.json();
            if (release && release.tag_name) {
              const tag = String(release.tag_name).replace(/^v/, '');
              remoteVersionStr = tag;
              remoteBuild = this.computeBuildFromTag(tag);
              remotePublishedMs = release.published_at ? Date.parse(release.published_at) || 0 : 0;

              const apkAsset = release.assets?.find((a: any) =>
                a.name && a.name.toLowerCase().endsWith('.apk')
              );
              directApkUrl = apkAsset?.browser_download_url ||
                `https://github.com/${repo}/releases/download/${release.tag_name}/Boveda-Calculadora.apk`;

              let resolvedNovedades: NovedadItem[] = [];
              let resolvedRawFecha = '';
              if (release.published_at) {
                const pubDate = new Date(release.published_at);
                if (!Number.isNaN(pubDate.getTime())) {
                  resolvedRawFecha = `${pubDate.getFullYear()}-${String(pubDate.getMonth() + 1).padStart(2, '0')}-${String(pubDate.getDate()).padStart(2, '0')}`;
                }
              }

              const versionJsonAsset = release.assets?.find((a: any) =>
                a.name && a.name.toLowerCase() === 'version.json'
              );
              if (versionJsonAsset?.browser_download_url) {
                try {
                  const vjRes = await fetch(`${versionJsonAsset.browser_download_url}?${cacheBuster}`, { cache: 'no-store' });
                  if (vjRes.ok) {
                    const vjData = await vjRes.json();
                    const vjBuild = Number(vjData.version_code ?? vjData.buildNumber ?? 0);
                    if (vjBuild > 0) remoteBuild = vjBuild;
                    if (vjData.version || vjData.version_name) {
                      remoteVersionStr = String(vjData.version || vjData.version_name).replace(/^v/, '');
                    }
                    if (typeof vjData.fecha === 'string' && vjData.fecha.trim()) {
                      resolvedRawFecha = vjData.fecha.trim();
                    } else if (typeof vjData.releaseDate === 'string' && vjData.releaseDate.trim()) {
                      resolvedRawFecha = vjData.releaseDate.trim();
                    }
                    resolvedNovedades = this.parseNovedadesItems(vjData);
                  }
                } catch {
                  // Fallback al cuerpo de la release
                }
              }

              if (resolvedNovedades.length === 0) {
                const bodyLines = this.parseReleaseBodyLines(release.body);
                resolvedNovedades = this.parseNovedadesItems({ changelog: bodyLines });
              }

              remoteData = {
                version: remoteVersionStr,
                buildNumber: remoteBuild,
                fecha: resolvedRawFecha,
                releaseDate: this.formatSpanishDate(resolvedRawFecha),
                novedades: resolvedNovedades,
                changelog: resolvedNovedades.map((n) => (n.titulo ? `${n.titulo}: ${n.descripcion}` : n.descripcion)),
                mandatory: false
              };
              resolvedRepo = repo;
              localStorage.setItem('vault_github_repo', repo);
              break;
            }
          }
        } catch (apiErr) {
          console.warn(`[UpdateService] Error consultando API GitHub para ${repo}:`, apiErr);
        }

        // 2B. Fallback directo por CDN de Releases (sin límite de peticiones de API)
        if (!remoteData) {
          try {
            const releaseJsonUrl = `https://github.com/${repo}/releases/latest/download/version.json?${cacheBuster}`;
            const cdnRes = await fetch(releaseJsonUrl, { cache: 'no-store' });
            if (cdnRes.ok) {
              const cdnData = await cdnRes.json();
              remoteVersionStr = String(cdnData.version ?? cdnData.version_name ?? installedVersionName).replace(/^v/, '');
              remoteBuild = Number(cdnData.version_code ?? cdnData.buildNumber ?? this.computeBuildFromTag(remoteVersionStr));
              remotePublishedMs = cdnData.published_at ? Date.parse(cdnData.published_at) || 0 : 0;
              directApkUrl = cdnData.download_url || `https://github.com/${repo}/releases/latest/download/Boveda-Calculadora.apk`;
              const cdnFecha = String(cdnData.fecha || cdnData.releaseDate || '').trim();
              const cdnNovedades = this.parseNovedadesItems(cdnData);
              remoteData = {
                version: remoteVersionStr,
                buildNumber: remoteBuild,
                fecha: cdnFecha,
                releaseDate: this.formatSpanishDate(cdnFecha),
                novedades: cdnNovedades,
                changelog: cdnNovedades.map((n) => (n.titulo ? `${n.titulo}: ${n.descripcion}` : n.descripcion)),
                mandatory: Boolean(cdnData.mandatory),
              };
              resolvedRepo = repo;
              localStorage.setItem('vault_github_repo', repo);
              break;
            }
          } catch {
            // Continúa con raw.githubusercontent
          }
        }

        // 2C. Último fallback a raw.githubusercontent.com
        if (!remoteData) {
          try {
            const ghUrlPrincipal = `https://raw.githubusercontent.com/${repo}/principal/public/version.json?${cacheBuster}`;
            const ghUrlMain = `https://raw.githubusercontent.com/${repo}/main/public/version.json?${cacheBuster}`;
            let ghRes = await fetch(ghUrlPrincipal, { cache: 'no-store' });
            if (!ghRes.ok) {
              ghRes = await fetch(ghUrlMain, { cache: 'no-store' });
            }
            if (ghRes.ok) {
              const rawData = await ghRes.json();
              remoteVersionStr = String(rawData.version ?? rawData.version_name ?? installedVersionName).replace(/^v/, '');
              remoteBuild = Number(rawData.version_code ?? rawData.buildNumber ?? this.computeBuildFromTag(remoteVersionStr));
              directApkUrl = rawData.download_url || `https://github.com/${repo}/releases/latest/download/Boveda-Calculadora.apk`;
              const rawFecha = String(rawData.fecha || rawData.releaseDate || '').trim();
              const rawNovedades = this.parseNovedadesItems(rawData);
              remoteData = {
                version: remoteVersionStr,
                buildNumber: remoteBuild,
                fecha: rawFecha,
                releaseDate: this.formatSpanishDate(rawFecha),
                novedades: rawNovedades,
                changelog: rawNovedades.map((n) => (n.titulo ? `${n.titulo}: ${n.descripcion}` : n.descripcion)),
                mandatory: Boolean(rawData.mandatory),
              };
              resolvedRepo = repo;
              break;
            }
          } catch {
            // Continúa
          }
        }
      }

      // 3. Fallback solo en entorno Web: consultar ruta local /version.json
      const isNativeEnv = typeof window !== 'undefined' && (
        Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
        navigator.userAgent.includes('wv')
      );

      if (!remoteData && !isNativeEnv) {
        const response = await fetch(`/version.json?${cacheBuster}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });

        if (response.ok) {
          const rawData = await response.json();
          remoteBuild = Number(rawData.version_code ?? rawData.buildNumber ?? 0);
          remoteVersionStr = String(rawData.version ?? rawData.version_name ?? CURRENT_APP_VERSION).replace(/^v/, '');
          directApkUrl = rawData.download_url || '/';
          const localFecha = String(rawData.fecha || rawData.releaseDate || '').trim();
          const localNovedades = this.parseNovedadesItems(rawData);
          remoteData = {
            version: remoteVersionStr,
            buildNumber: remoteBuild,
            fecha: localFecha,
            releaseDate: this.formatSpanishDate(localFecha),
            novedades: localNovedades,
            changelog: localNovedades.map((n) => (n.titulo ? `${n.titulo}: ${n.descripcion}` : n.descripcion)),
            mandatory: Boolean(rawData.mandatory),
          };
        }
      }

      if (!remoteData) {
        if (isNativeEnv) {
          throw new Error('No se detectó ninguna Release en GitHub. Verifica tu conexión a internet y que el repositorio público tenga al menos un Release publicado.');
        } else {
          throw new Error('No se pudo obtener información de versión del servidor.');
        }
      }

      // Guardar en localStorage la última respuesta válida descargada de version.json
      const resolvedNovedades = remoteData.novedades || this.parseNovedadesItems(remoteData);
      const resolvedFecha = String(remoteData.fecha || remoteData.releaseDate || '').trim();
      if (remoteVersionStr || resolvedFecha || resolvedNovedades.length > 0) {
        this.saveCachedReleaseNotes({
          version: remoteVersionStr,
          fecha: resolvedFecha,
          novedades: resolvedNovedades,
        });
      }

      // Comparar versión SemVer, buildNumber (versionCode) y fecha de publicación en GitHub
      const cleanRemote = remoteVersionStr.trim().replace(/^v/, '');
      const cleanInstalled = installedVersionName.trim().replace(/^v/, '');
      const versionDiff = this.compareVersions(cleanRemote, cleanInstalled);

      const hasHigherSemver = versionDiff > 0;
      const hasHigherBuild = versionDiff === 0 && remoteBuild > installedBuildNumber;
      const hasNewerPublishedApk =
        versionDiff === 0 &&
        installedLastUpdateTime > 0 &&
        remotePublishedMs > installedLastUpdateTime + 120000;

      const hasRemoteUpdate = hasHigherSemver || hasHigherBuild || hasNewerPublishedApk;
      const hasUpdate = isNativeEnv ? hasRemoteUpdate : (hasRemoteUpdate || swHasUpdate);

      // Si hay una compilación o publicación más nueva que la descartada, limpiar el descarte anterior
      if (hasRemoteUpdate) {
        const dismissedBuild = Number(localStorage.getItem('vault_dismissed_update_build') || '0');
        const dismissedPub = Number(localStorage.getItem('vault_dismissed_update_published') || '0');
        if (
          (remoteBuild > 0 && remoteBuild > dismissedBuild) ||
          (remotePublishedMs > 0 && remotePublishedMs > dismissedPub)
        ) {
          this.clearDismissedUpdate();
        }
      }

      const effectiveDownloadUrl = directApkUrl || (remoteData as any).download_url ||
        `https://github.com/${resolvedRepo}/releases/latest/download/Boveda-Calculadora.apk`;

      const result: UpdateCheckResult = {
        hasUpdate,
        currentVersion: cleanInstalled,
        latestVersion: hasRemoteUpdate ? cleanRemote : cleanInstalled,
        serverVersion: cleanRemote,
        buildNumber: remoteBuild,
        publishedAtMs: remotePublishedMs || undefined,
        repoName: resolvedRepo,
        fecha: resolvedFecha,
        releaseDate: this.formatSpanishDate(resolvedFecha),
        novedades: resolvedNovedades,
        changelog: resolvedNovedades.map((n) => (n.titulo ? `${n.titulo}: ${n.descripcion}` : n.descripcion)),
        mandatory: remoteData.mandatory || false,
        isServiceWorkerReady: swHasUpdate,
        downloadUrl: effectiveDownloadUrl,
      };

      this.lastCheckResult = result;
      localStorage.setItem('vault_last_update_check', Date.now().toString());

      if (hasUpdate) {
        this.notifyListeners(result);
      }

      return result;
    } catch (err: any) {
      console.warn('[UpdateService] Error al verificar actualizaciones:', err);
      const fallbackResult: UpdateCheckResult = {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
        error: err?.message || 'No se pudo conectar al servidor de actualizaciones',
      };
      this.lastCheckResult = fallbackResult;
      return fallbackResult;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Aplica la actualización recargando la aplicación y liberando cachés de forma limpia.
   */
  public async applyUpdate(): Promise<void> {
    try {
      sessionStorage.setItem('vault_just_updated', 'true');
      sessionStorage.setItem('vault_updated_version', CURRENT_APP_VERSION);

      // 1. Enviar SKIP_WAITING a los Service Workers en espera
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      // 2. Limpiar caches del navegador para garantizar assets frescos
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch (cErr) {
          console.warn('[UpdateService] Error al limpiar caches:', cErr);
        }
      }

      // 3. Breve pausa para asegurar propagación y recargar
      setTimeout(() => {
        window.location.reload();
      }, 250);
    } catch (e) {
      console.error('[UpdateService] Error al aplicar actualización:', e);
      window.location.reload();
    }
  }

  /**
   * Suscribirse a avisos de actualización
   */
  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    if (this.lastCheckResult && this.lastCheckResult.hasUpdate) {
      listener(this.lastCheckResult);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(result: UpdateCheckResult) {
    this.listeners.forEach((listener) => {
      try {
        listener(result);
      } catch (err) {
        console.error('[UpdateService] Error en listener:', err);
      }
    });
  }

  /**
   * Verifica si el usuario activó la comprobación automática al entrar
   */
  public isAutoCheckEnabled(): boolean {
    const saved = localStorage.getItem('vault_auto_check_updates');
    return saved !== null ? saved === 'true' : true;
  }

  public setAutoCheckEnabled(enabled: boolean): void {
    localStorage.setItem('vault_auto_check_updates', enabled ? 'true' : 'false');
  }

  /**
   * Gestión de versión pospuesta / descartada para no molestar continuamente
   */
  public isUpdateDismissed(version: string): boolean {
    const dismissed = localStorage.getItem('vault_dismissed_update_version');
    return dismissed === version;
  }

  public dismissUpdate(version: string, buildNumber?: number, publishedAtMs?: number): void {
    localStorage.setItem('vault_dismissed_update_version', version);
    if (buildNumber) {
      localStorage.setItem('vault_dismissed_update_build', String(buildNumber));
    }
    if (publishedAtMs) {
      localStorage.setItem('vault_dismissed_update_published', String(publishedAtMs));
    }
  }

  public clearDismissedUpdate(): void {
    localStorage.removeItem('vault_dismissed_update_version');
    localStorage.removeItem('vault_dismissed_update_build');
    localStorage.removeItem('vault_dismissed_update_published');
  }

  public getLastCheckTime(): number | null {
    const t = localStorage.getItem('vault_last_update_check');
    return t ? Number(t) : null;
  }

  public getLastCheckResult(): UpdateCheckResult | null {
    return this.lastCheckResult;
  }

  public getGitHubRepo(): string {
    const saved = localStorage.getItem('vault_github_repo');
    if (!saved || STALE_GITHUB_REPOS.has(saved.trim())) {
      return OFFICIAL_GITHUB_REPO;
    }
    return saved.trim();
  }

  public getCandidateRepos(): string[] {
    const saved = localStorage.getItem('vault_github_repo');
    const customValid = saved && !STALE_GITHUB_REPOS.has(saved.trim()) ? saved.trim() : null;
    const candidates = [
      OFFICIAL_GITHUB_REPO,
      customValid,
    ].filter((r): r is string => Boolean(r && r.trim()));

    return Array.from(new Set(candidates));
  }

  public setGitHubRepo(repo: string): void {
    const cleaned = repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    if (cleaned && !STALE_GITHUB_REPOS.has(cleaned)) {
      localStorage.setItem('vault_github_repo', cleaned);
    } else {
      localStorage.setItem('vault_github_repo', OFFICIAL_GITHUB_REPO);
    }
  }
}

export const updateService = new UpdateService();
