import type { Location } from '@/api/schemas/location';
import { formatClock, formatInZone, todayIn, weekdayIndex } from '@/lib/time';

export type OpenStatus =
  { readonly open: true; readonly closes: string } | { readonly open: false };

/** Whether the location is open at `now`, judged in the location's own timezone. */
export function openStatus(location: Location, now: number): OpenStatus {
  const hours = location.openingHours[weekdayIndex(todayIn(location.timezone, now))] ?? null;
  if (!hours) return { open: false };
  const clock = formatInZone(now, location.timezone, 'HH:mm');
  return clock >= hours.opens && clock < hours.closes
    ? { open: true, closes: formatClock(hours.closes) }
    : { open: false };
}

export function hoursLabel(hours: Location['openingHours'][number]): string {
  return hours ? `${formatClock(hours.opens)} – ${formatClock(hours.closes)}` : 'Closed';
}
