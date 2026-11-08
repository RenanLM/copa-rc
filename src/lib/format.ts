import type { GapToLeader } from '@/domain';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** 14 482 → "14.482"; 286 331 → "4:46.331". */
export function formatLapTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const secondsText = seconds.toFixed(3).padStart(minutes > 0 ? 6 : 1, '0');
  return minutes > 0 ? `${minutes}:${secondsText}` : secondsText;
}

/** Cronômetro de corrida: 286 331 → "4:46.3"; 5 400 → "0:05.4". */
export function formatClock(ms: number): string {
  const tenths = Math.floor(Math.max(0, ms) / 100);
  const minutes = Math.floor(tenths / 600);
  const seconds = Math.floor((tenths % 600) / 10);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths % 10}`;
}

export function formatGap(gap: GapToLeader): string {
  switch (gap.kind) {
    case 'leader':
      return 'Vencedor';
    case 'time':
      return `+${(gap.ms / 1000).toFixed(3)} s`;
    case 'laps':
      return `+${gap.laps} ${gap.laps === 1 ? 'volta' : 'voltas'}`;
    case 'dnf':
      return 'Abandonou';
  }
}

export const formatOrdinal = (n: number) => `${n}º`;

export function formatPoints(n: number): string {
  return `${n} ${n === 1 ? 'pt' : 'pts'}`;
}

function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** "2026-10-25" → "25 out". */
export function formatShortDate(iso: string): string {
  const d = parseIsoDate(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "2026-10-25" → "dom, 25 out 2026". */
export function formatLongDate(iso: string): string {
  const d = parseIsoDate(iso);
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Dias inteiros de `from` até `to` (negativo se `to` já passou). */
export function daysBetween(fromIso: string, toIso: string): number {
  const ms = parseIsoDate(toIso).getTime() - parseIsoDate(fromIso).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatCountdown(days: number): string {
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  if (days > 1) return `Em ${days} dias`;
  return 'Já ocorreu';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * "2026-09-27T14:32" → "27 set · 14:32". Sem horário, só a data; sem valor, null.
 * Lê os números do texto, então não depende do fuso do dispositivo.
 */
export function formatPostDate(publishedAt: string | undefined): string | null {
  if (!publishedAt) return null;
  const [date, time] = publishedAt.split('T');
  if (!date) return null;
  const day = formatShortDate(date);
  return time ? `${day} · ${time.slice(0, 5)}` : day;
}
