/**
 * Información de versión y registro de cambios (Changelog) de la aplicación.
 */

export interface VersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  changelog: string[];
  mandatory?: boolean;
}

export const APP_VERSION = '1.0.15';
export const CURRENT_APP_VERSION = APP_VERSION;
export const CURRENT_BUILD_NUMBER = 2015;
export const CURRENT_RELEASE_DATE = '11 de noviembre de 2026';

export const CURRENT_CHANGELOG: string[] = [
  'Actualización v1.0.15: Invalidación activa de caché en caliente para desplegar siempre el cuadro nativo de confirmación ("Permitir / Cancelar") de Google.',
  'Cifrado militar local AES-256 para fotos, videos, audios, documentos y aplicaciones.',
  'Visor de documentos PDF local integrado con renderizado por canvas.',
  'Reproductor de audio integrado con modo segundo plano y controles avanzados.',
  'Carpeta protegida con PIN extra independiente.'
];

export const APP_VERSION_METADATA: VersionInfo = {
  version: CURRENT_APP_VERSION,
  buildNumber: CURRENT_BUILD_NUMBER,
  releaseDate: CURRENT_RELEASE_DATE,
  changelog: CURRENT_CHANGELOG,
  mandatory: false
};

export default APP_VERSION;

