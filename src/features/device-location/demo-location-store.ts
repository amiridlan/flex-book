import { create } from 'zustand';

import type { DemoPlace } from './demo-places';

type DemoLocationState = {
  /** When set, replaces the real GPS fix. DEMO ONLY. */
  readonly override: DemoPlace | null;
  setOverride(place: DemoPlace | null): void;
};

export const useDemoLocationStore = create<DemoLocationState>()((set) => ({
  override: null,
  setOverride: (override) => set({ override }),
}));
