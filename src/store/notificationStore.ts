// src/store/notificationStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  user_id: string;
  work_id?: string;
  type: 'NEW_COMMENT' | 'ASSIGNMENT' | 'STATUS_CHANGE' | 'SYSTEM';
  title?: string;
  body?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  setNotifications: (notifications: Notification[]) => void;
  mergeNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  updateNotification: (notificationId: string, updates: Partial<Notification>) => void;
  getUnreadCountForWork: (workId: string) => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      setNotifications: (notifications) => {
        const unread = notifications.filter(n => !n.is_read).length;
        set({ notifications, unreadCount: unread });
      },

      mergeNotifications: (serverNotifications) => {
        set((state) => {
          const notificationMap = new Map<string, Notification>();

          serverNotifications.forEach(n => {
            notificationMap.set(n.id, n);
          });

          state.notifications.forEach(n => {
            if (!notificationMap.has(n.id)) {
              notificationMap.set(n.id, n);
            }
          });

          const merged = Array.from(notificationMap.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          const unread = merged.filter(n => !n.is_read).length;

          return {
            notifications: merged,
            unreadCount: unread,
          };
        });
      },

      addNotification: (notification) =>
        set((state) => {
          const exists = state.notifications.some(n => n.id === notification.id);
          if (exists) {
            return state;
          }

          return {
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          };
        }),

      markAsRead: (notificationId) =>
        set((state) => {
          const notification = state.notifications.find(n => n.id === notificationId);
          if (!notification || notification.is_read) {
            return state;
          }

          return {
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, is_read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        }),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
          unreadCount: 0,
        })),

      setUnreadCount: (count) => set({ unreadCount: count }),

      incrementUnreadCount: () =>
        set((state) => ({ unreadCount: state.unreadCount + 1 })),

      resetUnreadCount: () => set({ unreadCount: 0 }),

      updateNotification: (notificationId, updates) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, ...updates } : n
          ),
        })),

      getUnreadCountForWork: (workId: string) => {
        const state = get();
        return state.notifications.filter(
          n => n.work_id === workId && !n.is_read && n.type === 'NEW_COMMENT'
        ).length;
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 100),
        unreadCount: state.unreadCount,
      }),
    }
  )
);
