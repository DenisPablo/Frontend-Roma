import { format, parseISO, addDays as addDaysFns, isToday, isYesterday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function shiftDateString(dateStr: string, days: number): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const shifted = addDaysFns(date, days);
    const year = shifted.getFullYear();
    const month = String(shifted.getMonth() + 1).padStart(2, '0');
    const day = String(shifted.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
}

export function formatDateHeading(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, "EEEE d 'de' MMMM", { locale: es });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return format(date, "d MMM", { locale: es });
  } catch {
    return dateStr;
  }
}

export function formatDurationSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h === 0) return `${m}m`;
  return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
}

export function calculateElapsedSeconds(startedAtIso: string): number {
  try {
    const start = parseISO(startedAtIso).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - start) / 1000));
  } catch {
    return 0;
  }
}

export function formatStopwatchTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatReminderOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) return 'Al inicio';
  const abs = Math.abs(offsetMinutes);
  if (abs >= 1440) {
    const days = Math.round(abs / 1440);
    return `${days}d antes`;
  }
  if (abs >= 60) {
    const hours = Math.round(abs / 60);
    return `${hours}h antes`;
  }
  return `${abs}m antes`;
}
