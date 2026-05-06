import { create } from 'zustand';
import { api } from '../api/client';
import type { DirectMessage, Friendship } from '../types/api';

interface UnreadEntry {
  senderId: string;
  pseudo: string;
  count: number;
  lastText: string;
}

interface NotificationsState {
  pendingRequests: Friendship[];
  unreadMessages: UnreadEntry[];
  load: () => Promise<void>;
  add: (f: Friendship) => void;
  remove: (id: string) => void;
  addUnread: (msg: DirectMessage) => void;
  clearUnread: (senderId: string) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  pendingRequests: [],
  unreadMessages: [],

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

  addUnread: (msg) => set(s => {
    const existing = s.unreadMessages.find(e => e.senderId === msg.senderId);
    if (existing) {
      return {
        unreadMessages: s.unreadMessages.map(e =>
          e.senderId === msg.senderId
            ? { ...e, count: e.count + 1, lastText: msg.text }
            : e,
        ),
      };
    }
    return {
      unreadMessages: [
        { senderId: msg.senderId, pseudo: msg.sender?.pseudo ?? '…', count: 1, lastText: msg.text },
        ...s.unreadMessages,
      ],
    };
  }),

  clearUnread: (senderId) => set(s => ({
    unreadMessages: s.unreadMessages.filter(e => e.senderId !== senderId),
  })),
}));
