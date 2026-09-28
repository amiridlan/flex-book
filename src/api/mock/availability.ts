import type { Availability, Slot } from '../schemas/availability';
import type { Location, Space } from '../schemas/location';
import { weekdayIndex, zonedInstant } from '@/lib/time';

/** Small deterministic hash so "busy" slots look random but stay stable between reloads. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Generates a day's slots in the location's own timezone, the way the backend
 * would from bookings + opening hours. Meeting rooms get hourly slots; hot desks
 * get one all-day slot with seats remaining; private offices are not bookable.
 */
export function buildAvailability(
  location: Location,
  space: Space,
  date: string,
  now: number,
): Availability {
  const base = { spaceId: space.id, date, timezone: location.timezone };
  const hours = location.openingHours[weekdayIndex(date)] ?? null;

  if (space.type === 'private_office')
    return { ...base, bookable: false, open: hours !== null, slots: [] };
  if (!hours) return { ...base, bookable: true, open: false, slots: [] };

  const opens = zonedInstant(date, hours.opens, location.timezone);
  const closes = zonedInstant(date, hours.closes, location.timezone);

  if (space.rate.unit === 'day') {
    // 4–12 open desks, stable per space and day.
    const remaining = 4 + (hash(`${space.id}:${date}`) % 9);
    const slot: Slot = {
      startsAt: opens,
      endsAt: closes,
      available: remaining > 0 && Date.parse(closes) > now,
      remaining,
    };
    return { ...base, bookable: true, open: true, slots: [slot] };
  }

  const slots: Slot[] = [];
  for (let start = Date.parse(opens); start + 3_600_000 <= Date.parse(closes); start += 3_600_000) {
    const startsAt = new Date(start).toISOString();
    const busy = hash(`${space.id}:${startsAt}`) % 4 === 0;
    slots.push({
      startsAt,
      endsAt: new Date(start + 3_600_000).toISOString(),
      available: !busy && start > now,
      remaining: null,
    });
  }
  return { ...base, bookable: true, open: true, slots };
}
