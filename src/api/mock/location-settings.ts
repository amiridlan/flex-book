import type { Location } from '../schemas/location';
import { LOCATIONS } from './db/locations';
import { SPACES } from './db/spaces';

type BookingRules = Location['bookingRules'];

/**
 * Super admin location settings for one mock server: temporary closures and
 * per-location booking rules layered over the seed data. Every lookup that
 * decides whether a booking is allowed goes through here.
 */
export function createLocationSettings() {
  const closedLocations = new Map<string, string>(); // id -> reason
  const closedSpaces = new Map<string, string>();
  const rules = new Map<string, BookingRules>();

  return {
    /** The location as it stands now, with any edited booking rules. */
    location(id: string | undefined): Location | undefined {
      const base = LOCATIONS.find((l) => l.id === id);
      if (!base) return undefined;
      const edited = rules.get(base.id);
      return edited ? { ...base, bookingRules: edited } : base;
    },

    allLocations(): Location[] {
      return LOCATIONS.map((l) => this.location(l.id) ?? l);
    },

    isLocationClosed(id: string): boolean {
      return closedLocations.has(id);
    },

    isSpaceClosed(id: string): boolean {
      return closedSpaces.has(id);
    },

    /** Why a booking at this space can't happen right now, or null. */
    closure(locationId: string, spaceId: string): string | null {
      if (closedLocations.has(locationId)) return 'This location is temporarily closed.';
      if (closedSpaces.has(spaceId)) return 'This space is temporarily closed.';
      return null;
    },

    closedReason(locationId: string): string | null {
      return closedLocations.get(locationId) ?? null;
    },

    setLocationClosed(id: string, closed: boolean, reason: string) {
      if (closed) closedLocations.set(id, reason);
      else closedLocations.delete(id);
    },

    setSpaceClosed(id: string, closed: boolean, reason: string) {
      if (closed) closedSpaces.set(id, reason);
      else closedSpaces.delete(id);
    },

    setRules(id: string, next: BookingRules) {
      rules.set(id, next);
    },

    spacesOf(locationId: string) {
      return SPACES.filter((s) => s.locationId === locationId);
    },
  };
}

export type LocationSettings = ReturnType<typeof createLocationSettings>;
