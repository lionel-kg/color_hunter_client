import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/api';

interface AuthState {
  user: User | null;
  access: string | null;
  refresh: string | null;
  setSession: (s: { user: User; access: string; refresh: string }) => void;
  setAccess: (access: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access: null,
      refresh: null,
      setSession: ({ user, access, refresh }) => set({ user, access, refresh }),
      setAccess: (access) => set({ access }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, access: null, refresh: null }),
    }),
    { name: 'color-hunt-auth' },
  ),
);
