import { create } from 'zustand';

type StaffLocationState = {
  /** The location the front desk is working at, shared by Today, Scan and Walk-in. */
  readonly locationId: string | null;
  setLocationId(id: string): void;
};

export const useStaffLocationStore = create<StaffLocationState>()((set) => ({
  locationId: null,
  setLocationId: (locationId) => set({ locationId }),
}));
