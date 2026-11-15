/**
 * Información de versión instalada de la aplicación.
 * Las novedades se obtienen dinámicamente desde version.json publicado en GitHub Releases.
 */

export interface VersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  changelog: string[];
  mandatory?: boolean;
}

export const APP_VERSION = '1.0.31';
export const CURRENT_APP_VERSION = APP_VERSION;
export const CURRENT_BUILD_NUMBER = 2031;
export const CURRENT_RELEASE_DATE = '';

export const CURRENT_CHANGELOG: string[] = [];

export const APP_VERSION_METADATA: VersionInfo = {
  version: CURRENT_APP_VERSION,
  buildNumber: CURRENT_BUILD_NUMBER,
  releaseDate: CURRENT_RELEASE_DATE,
  changelog: CURRENT_CHANGELOG,
  mandatory: false,
};

export default APP_VERSION;
