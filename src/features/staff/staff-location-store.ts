import { create } from 'zustand';

type StaffLocationState = {
  /** The location the front desk is working at, shared by Today, Scan and Walk-in. */
  readonly locationId: string | null;
  /** Admins only: Today shows every location at once instead of one desk. */
  readonly overview: boolean;
  setLocationId(id: string): void;
  showOverview(): void;
};

export const useStaffLocationStore = create<StaffLocationState>()((set) => ({
  locationId: null,
  overview: false,
  setLocationId: (locationId) => set({ locationId, overview: false }),
  showOverview: () => set({ overview: true }),
}));
