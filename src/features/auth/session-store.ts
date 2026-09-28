import { create } from 'zustand';

import type { User } from '@/api/schemas/user';

type SessionState = {
  readonly token: string | null;
  readonly user: User | null;
  signIn(token: string, user: User): void;
  signOut(): void;
};

/**
 * The signed-in session, held in memory only. DEMO ONLY: with the real Laravel
 * Sanctum API the token is persisted with expo-secure-store (Keychain /
 * Keystore), never AsyncStorage or localStorage.
 */
export const useSessionStore = create<SessionState>()((set) => ({
  token: null,
  user: null,
  signIn: (token, user) => set({ token, user }),
  signOut: () => set({ token: null, user: null }),
}));
