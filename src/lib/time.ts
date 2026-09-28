import { TZDate } from '@date-fns/tz';
import { addDays, format } from 'date-fns';

/** A calendar date in a location's timezone, `yyyy-MM-dd`. */
export type LocalDate = string;

export const DATE_FORMAT = 'dd/MM/yyyy';
export const TIME_FORMAT = 'h:mm a';

/** Formats a UTC instant as wall-clock time in `timeZone`. */
export function formatInZone(instant: string | number | Date, timeZone: string, pattern: string) {
  return format(new TZDate(new Date(instant).getTime(), timeZone), pattern);
}

/** UTC offset label for a zone at an instant, e.g. `GMT+10`, `GMT+5:30`. DST-aware. */
export function offsetLabel(timeZone: string, instant: string | number | Date = Date.now()) {
  const minutes = -new TZDate(new Date(instant).getTime(), timeZone).getTimezoneOffset();
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const rest = abs % 60;
  return `GMT${sign}${hours}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`;
}

/** The device's IANA zone, falling back to UTC when the platform cannot say. */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** True when both zones have the same UTC offset at that instant. */
export function sameOffset(a: string, b: string, instant: string | number | Date = Date.now()) {
  return offsetLabel(a, instant) === offsetLabel(b, instant);
}

/** Today's date in `timeZone` (not the device's), `yyyy-MM-dd`. */
export function todayIn(timeZone: string, now: number = Date.now()): LocalDate {
  return format(new TZDate(now, timeZone), 'yyyy-MM-dd');
}

/** `count` consecutive local dates starting today in `timeZone`. */
export function nextLocalDates(timeZone: string, count: number, now: number = Date.now()) {
  const start = new TZDate(now, timeZone);
  return Array.from({ length: count }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
}

function parts(date: LocalDate): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid local date: ${date}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * The UTC instant for a wall-clock time at a location, e.g. 09:00 on
 * 2026-10-05 in Australia/Sydney -> 2026-10-04T22:00:00.000Z (DST applied).
 */
export function zonedInstant(date: LocalDate, hhmm: string, timeZone: string): string {
  const [year, month, day] = parts(date);
  const [hour, minute] = hhmm.split(':').map(Number);
  const zoned = new TZDate(year, month - 1, day, hour ?? 0, minute ?? 0, timeZone);
  return new Date(zoned.getTime()).toISOString();
}

/** Monday = 0 … Sunday = 6, matching `openingHours` indexes. */
export function weekdayIndex(date: LocalDate): number {
  const [year, month, day] = parts(date);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/** `2026-09-29` -> `Tue 29/09` for date chips. */
export function shortDateLabel(date: LocalDate): string {
  const [year, month, day] = parts(date);
  return format(new Date(year, month - 1, day), 'EEE dd/MM');
}

/** `2026-09-29` -> `Tue, 29/09/2026`. */
export function longDateLabel(date: LocalDate): string {
  const [year, month, day] = parts(date);
  return format(new Date(year, month - 1, day), `EEE, ${DATE_FORMAT}`);
}

export const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/** `08:00` -> `8:00 AM` without involving any timezone. */
export function formatClock(hhmm: string): string {
  const [hour, minute] = hhmm.split(':').map(Number);
  return format(new Date(2000, 0, 1, hour ?? 0, minute ?? 0), TIME_FORMAT);
}
