// src/store/notificationStore.ts
import { create } from 'zustand';

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
  // Estado
  notifications: Notification[];
  unreadCount: number;

  // Acciones
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;

  // Actualizar una notificacion especifica
  updateNotification: (notificationId: string, updates: Partial<Notification>) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => set({ notifications }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

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
}));
