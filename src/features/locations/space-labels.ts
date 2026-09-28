import type { RateUnit, Space, SpaceType } from '@/api/schemas/location';
import { formatMoney } from '@/lib/money';

export const SPACE_TYPE_LABELS: Readonly<Record<SpaceType, string>> = {
  hot_desk: 'Hot desk',
  meeting_room: 'Meeting room',
  private_office: 'Private office',
  event_space: 'Event space',
};

const UNIT_LABELS: Readonly<Record<RateUnit, string>> = {
  hour: 'hour',
  day: 'day',
  month: 'month',
};

/** `RM 60.00 / hour` */
export function priceLabel(space: Space): string {
  return `${formatMoney(space.rate.price)} / ${UNIT_LABELS[space.rate.unit]}`;
}

export function capacityLabel(space: Space): string {
  return space.capacity === 1 ? '1 person' : `Up to ${space.capacity} people`;
}
