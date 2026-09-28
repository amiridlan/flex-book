/**
 * What the member's check-in QR encodes: a deep link with the booking id and
 * an opaque one-off token. The token proves the scan came from the member's
 * own booking screen; the server checks it and the staff member's scope.
 */
export type CheckInPayload = { readonly bookingId: string; readonly token: string };

const PREFIX = 'flexbook://check-in/';

export function buildCheckInPayload({ bookingId, token }: CheckInPayload): string {
  return `${PREFIX}${encodeURIComponent(bookingId)}?token=${encodeURIComponent(token)}`;
}

/** Parses a scanned QR. Returns null for anything that is not our check-in link. */
export function parseCheckInPayload(text: string): CheckInPayload | null {
  if (!text.startsWith(PREFIX)) return null;
  const [path, query = ''] = text.slice(PREFIX.length).split('?');
  const token = new URLSearchParams(query).get('token');
  if (!path || !token) return null;
  try {
    return { bookingId: decodeURIComponent(path), token };
  } catch {
    return null;
  }
}

/** Booking codes as printed on screen, e.g. `FXB-7QLM`. Accepts lower case and missing dash. */
export function normaliseBookingCode(input: string): string | null {
  const compact = input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  const match = /^FXB([A-Z2-9]{4})$/.exec(compact);
  return match ? `FXB-${match[1]}` : null;
}
