/**
 * Servicio de Intrusos (Simplificado - Fotos deshabilitadas)
 */

export interface IntruderCaptureRecord {
  id: string;
  photoDataUrl: string;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  streak: number;
  riskLevel: 'CRÍTICO' | 'ALTO' | 'MEDIO';
}

export interface IntruderAlertInfo {
  hasAlert: boolean;
  streak: number;
  time: string;
  photo: string | null;
}

export function getIntruderThreshold(): number {
  return 1;
}

export function setIntruderThreshold(_threshold: number): void {}

export async function captureSilentIntruderPhoto(_streak = 1): Promise<string | null> {
  return null;
}

export function getIntruderHistory(): IntruderCaptureRecord[] {
  return [];
}

export function saveIntruderAlert(_photoDataUrl: string, _streak: number, _timeStr: string) {}

export function deleteIntruderRecord(_id: string) {}

export function clearIntruderAlert() {
  localStorage.removeItem('nullvault_has_unviewed_intruder');
  localStorage.removeItem('nullvault_failed_streak');
  localStorage.removeItem('nullvault_alert_streak_count');
  localStorage.removeItem('nullvault_intruder_photo');
  localStorage.removeItem('nullvault_last_failed_time');
  localStorage.removeItem('nullvault_intruder_captures_history');
}
