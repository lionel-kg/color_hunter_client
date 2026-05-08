import { create } from 'zustand';
import { api } from '../api/client';
import type { DirectMessage, Friendship, Notification } from '../types/api';

interface UnreadEntry {
  senderId: string;
  pseudo: string;
  count: number;
  lastText: string;
}

interface NotificationsState {
  // Amis
  pendingRequests: Friendship[];
  // Messages directs
  unreadMessages: UnreadEntry[];
  // Notifs système
  notifications: Notification[];
  unreadCount: number;

  load: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (n: Notification) => void;

  // Amis
  add: (f: Friendship) => void;
  remove: (id: string) => void;
  // DM
  addUnread: (msg: DirectMessage) => void;
  clearUnread: (senderId: string) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  pendingRequests: [],
  unreadMessages: [],
  notifications: [],
  unreadCount: 0,

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

  loadNotifications: async () => {
    try {
      const { data } = await api.get<{ notifications: Notification[]; unreadCount: number }>(
        '/notifications',
      );
      set({ notifications: data.notifications, unreadCount: data.unreadCount });
    } catch {
      // ignore
    }
  },

  markAllRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set(s => ({
        notifications: s.notifications.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
        unreadCount: 0,
      }));
    } catch {
      // ignore
    }
  },

  markRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set(s => ({
        notifications: s.notifications.map(n =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch {
      // ignore
    }
  },

  deleteNotification: async (id) => {
    try {
      const notif = get().notifications.find(n => n.id === id);
      await api.delete(`/notifications/${id}`);
      set(s => ({
        notifications: s.notifications.filter(n => n.id !== id),
        unreadCount: notif && !notif.readAt ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
      }));
    } catch {
      // ignore
    }
  },

  addNotification: (n) =>
    set(s => ({
      notifications: [n, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    })),

  add: (f) => set(s => ({ pendingRequests: [f, ...s.pendingRequests] })),
  remove: (id) => set(s => ({ pendingRequests: s.pendingRequests.filter(f => f.id !== id) })),

  addUnread: (msg) =>
    set(s => {
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

  clearUnread: (senderId) =>
    set(s => ({
      unreadMessages: s.unreadMessages.filter(e => e.senderId !== senderId),
    })),
}));
