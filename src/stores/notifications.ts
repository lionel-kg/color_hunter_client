import { create } from 'zustand';
import { api } from '../api/client';
import type { Friendship } from '../types/api';

interface NotificationsState {
  pendingRequests: Friendship[];
  load: () => Promise<void>;
  add: (f: Friendship) => void;
  remove: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  pendingRequests: [],

  load: async () => {
    try {
      const { data } = await api.get<Friendship[]>('/users/friends');
      const myId = (await api.get<{ id: string }>('/users/me')).data.id;
      const pending = data.filter(f => f.status === 'PENDING' && f.receiverId === myId);
      set({ pendingRequests: pending });
    } catch {
      // ignore
    }
  },

  add: (f) => set(s => ({ pendingRequests: [f, ...s.pendingRequests] })),

  remove: (id) => set(s => ({ pendingRequests: s.pendingRequests.filter(f => f.id !== id) })),
}));
