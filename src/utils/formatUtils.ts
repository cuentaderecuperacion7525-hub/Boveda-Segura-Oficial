/**
 * Utilidades compartidas de formato de tamaño de archivos para Bóveda Segura.
 * Unificado según los requerimientos globales a la unidad "MB".
 */

export const formatSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 0.01) return '< 0.01 MB';
  if (mb < 1) return `${mb.toFixed(2)} MB`;
  return `${mb.toFixed(1)} MB`;
};

export const formatFileSize = formatSize;
