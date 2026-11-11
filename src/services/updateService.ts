/**
 * Servicio de detección, notificación y aplicación de actualizaciones para la aplicación.
 */

import { CURRENT_APP_VERSION, CURRENT_BUILD_NUMBER, CURRENT_RELEASE_DATE, CURRENT_CHANGELOG, VersionInfo } from '../version';
import { getSafeAppVersionCode } from './nativeUpdaterBridge';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  buildNumber?: number;
  repoName?: string;
  releaseDate?: string;
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
    const clean1 = v1.replace(/^v/, '').split('.').map(Number);
    const clean2 = v2.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < Math.max(clean1.length, clean2.length); i++) {
      const num1 = clean1[i] || 0;
      const num2 = clean2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  /**
   * Comprueba si hay una actualización disponible consultando version.json y el Service Worker.
   */
  public async checkForUpdates(force: boolean = false): Promise<UpdateCheckResult> {
    if (this.isChecking) {
      return this.lastCheckResult || {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
      };
    }

    this.isChecking = true;

    try {
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

      // 2. Determinar la fuente de comprobación (Local / Servidor web o Remoto de GitHub)
      const cacheBuster = `_t=${Date.now()}`;
      let remoteData: VersionInfo | null = null;
      let directApkUrl = '';
      let remoteBuild = 0;
      let remoteVersionStr = CURRENT_APP_VERSION;

      // Obtener versión instalada en el dispositivo (APK nativo o web)
      let installedBuildNumber = CURRENT_BUILD_NUMBER;
      let installedVersionName = CURRENT_APP_VERSION;
      try {
        const nativeVer = await getSafeAppVersionCode();
        if (nativeVer && typeof nativeVer.versionCode === 'number') {
          installedBuildNumber = nativeVer.versionCode;
        }
        if (nativeVer && nativeVer.versionName) {
          installedVersionName = nativeVer.versionName;
        }
      } catch {
        installedBuildNumber = CURRENT_BUILD_NUMBER;
        installedVersionName = CURRENT_APP_VERSION;
      }

      // Si hay candidatos de repositorio en GitHub, consultarlos
      const reposToTry = this.getCandidateRepos();
      for (const repo of reposToTry) {
        try {
          const ghApiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
          const ghApiRes = await fetch(ghApiUrl, {
            headers: { 'Accept': 'application/vnd.github.v3+json' },
            cache: 'no-store'
          });

          if (ghApiRes.ok) {
            const release = await ghApiRes.json();
            if (release && release.tag_name) {
              const tag = release.tag_name.replace(/^v/, '');
              remoteVersionStr = tag;

              // Calcular build number
              let parsedBuild = 1;
              const parts = tag.split('.');
              if (parts.length >= 3) {
                const patch = parseInt(parts[2], 10);
                if (!isNaN(patch)) {
                  parsedBuild = patch;
                }
              }
              remoteBuild = parsedBuild;

              // Buscar el asset Boveda-Calculadora.apk
              const apkAsset = release.assets?.find((a: any) =>
                a.name && a.name.toLowerCase().endsWith('.apk')
              );
              directApkUrl = apkAsset?.browser_download_url ||
                `https://github.com/${repo}/releases/latest/download/Boveda-Calculadora.apk`;

              // Buscar asset version.json si está adjunto en la release
              const versionJsonAsset = release.assets?.find((a: any) =>
                a.name && a.name.toLowerCase() === 'version.json'
              );
              let resolvedChangelog: string[] = CURRENT_CHANGELOG;
              if (versionJsonAsset?.browser_download_url) {
                try {
                  const vjRes = await fetch(versionJsonAsset.browser_download_url, { cache: 'no-store' });
                  if (vjRes.ok) {
                    const vjData = await vjRes.json();
                    if (vjData.version_code || vjData.buildNumber) {
                      remoteBuild = vjData.version_code || vjData.buildNumber;
                    }
                    if (vjData.version || vjData.version_name) {
                      remoteVersionStr = (vjData.version || vjData.version_name).replace(/^v/, '');
                    }
                    if (
                      Array.isArray(vjData.changelog) &&
                      vjData.changelog.length > 0 &&
                      !vjData.changelog.some((line: string) =>
                        /compilaci[oó]n autom[aá]tica|generada en github|nueva interfaz minimalista de registro e inicio de sesi[oó]n con verificaci[oó]n de correo mediante c[oó]digo de 6 d[ií]gitos/i.test(line)
                      )
                    ) {
                      resolvedChangelog = vjData.changelog;
                    }
                  }
                } catch {
                  // Fallback a tag
                }
              }

              remoteData = {
                version: remoteVersionStr,
                buildNumber: remoteBuild,
                releaseDate: release.published_at ? new Date(release.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : CURRENT_RELEASE_DATE,
                changelog: resolvedChangelog,
                mandatory: false
              };

              // Guardar repo activo
              if (!localStorage.getItem('vault_github_repo')) {
                localStorage.setItem('vault_github_repo', repo);
              }
              break;
            }
          }
        } catch (apiErr) {
          console.warn(`[UpdateService] Error consultando repo ${repo}:`, apiErr);
        }

        // Probar raw version.json si la API no respondió
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
              remoteData = rawData;
              remoteBuild = rawData.version_code ?? rawData.buildNumber ?? CURRENT_BUILD_NUMBER;
              remoteVersionStr = rawData.version_name ?? rawData.version ?? CURRENT_APP_VERSION;
              directApkUrl = rawData.download_url || `https://github.com/${repo}/releases/latest/download/Boveda-Calculadora.apk`;
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
          remoteData = rawData;
          remoteBuild = rawData.version_code ?? rawData.buildNumber ?? 0;
          remoteVersionStr = rawData.version_name ?? rawData.version ?? CURRENT_APP_VERSION;
          directApkUrl = rawData.download_url || '/';
        }
      }

      if (!remoteData) {
        if (isNativeEnv) {
          throw new Error('No se detectó ninguna Release en GitHub. Asegúrate de que el repositorio sea Público (Settings > Danger Zone > Change visibility) y que GitHub Actions haya finalizado la compilación.');
        } else {
          throw new Error('No se pudo obtener información de versión del servidor.');
        }
      }

      // Comparar versión semver
      const cleanRemote = remoteVersionStr.trim().replace(/^v/, '');
      const cleanInstalled = installedVersionName.trim().replace(/^v/, '');
      const versionDiff = this.compareVersions(cleanRemote, cleanInstalled);

      // Solo hay actualización remota si la versión del servidor es estrictamente mayor a la instalada.
      // Si la versión instalada y la del servidor son idénticas (ej. v1.0.0 y v1.0.0), el sistema ya está actualizado.
      const hasRemoteUpdate = versionDiff > 0;

      const hasUpdate = isNativeEnv ? hasRemoteUpdate : (hasRemoteUpdate || swHasUpdate);

      const effectiveDownloadUrl = directApkUrl || (remoteData as any).download_url ||
        `https://github.com/${this.getGitHubRepo()}/releases/latest/download/Boveda-Calculadora.apk`;

      const isLegacyStaticChangelog = Array.isArray(remoteData.changelog) &&
        remoteData.changelog.some((line: string) =>
          /nueva interfaz minimalista de registro e inicio de sesi[oó]n con verificaci[oó]n de correo mediante c[oó]digo de 6 d[ií]gitos/i.test(line)
        );

      const effectiveChangelog = hasRemoteUpdate && Array.isArray(remoteData.changelog) && remoteData.changelog.length > 0 && !isLegacyStaticChangelog
        ? remoteData.changelog
        : CURRENT_CHANGELOG;

      const result: UpdateCheckResult = {
        hasUpdate,
        currentVersion: installedVersionName,
        latestVersion: hasRemoteUpdate ? remoteVersionStr : installedVersionName,
        buildNumber: remoteBuild,
        repoName: this.getGitHubRepo(),
        releaseDate: hasRemoteUpdate ? (remoteData.releaseDate || CURRENT_RELEASE_DATE) : CURRENT_RELEASE_DATE,
        changelog: effectiveChangelog,
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

  public dismissUpdate(version: string): void {
    localStorage.setItem('vault_dismissed_update_version', version);
  }

  public clearDismissedUpdate(): void {
    localStorage.removeItem('vault_dismissed_update_version');
  }

  public getLastCheckTime(): number | null {
    const t = localStorage.getItem('vault_last_update_check');
    return t ? Number(t) : null;
  }

  public getLastCheckResult(): UpdateCheckResult | null {
    return this.lastCheckResult;
  }

  public getGitHubRepo(): string {
    return localStorage.getItem('vault_github_repo') || 'cuentaderecuperacion7525-hub/Mi-B-veda.-';
  }

  public getCandidateRepos(): string[] {
    const custom = localStorage.getItem('vault_github_repo');
    const candidates = [
      custom,
      'cuentaderecuperacion7525-hub/Mi-B-veda.-',
      'cuentaderecuperacion7525-hub/Mi-Boveda.-',
      'cuentaderecuperacion7525-hub/Mi-Boveda',
      'cuentaderecuperacion7525-hub/Mi-B-veda',
      'cuentadecuperacion7525-hub/Mi-B-veda.-'
    ].filter((r): r is string => Boolean(r && r.trim()));

    return Array.from(new Set(candidates));
  }

  public setGitHubRepo(repo: string): void {
    const cleaned = repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    if (cleaned) {
      localStorage.setItem('vault_github_repo', cleaned);
    } else {
      localStorage.removeItem('vault_github_repo');
    }
  }
}

export const updateService = new UpdateService();
