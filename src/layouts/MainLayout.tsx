import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useFCMListener } from '../hooks/useFCMListener';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const MainLayout = () => {
  const { setNotifications, ensureOwner } = useNotificationStore();
  const { token: jwtToken, user } = useAuthStore();

  useFCMListener();

  // Single effect: ensure owner + sync notifications from server.
  // Depends on user?.id so it re-runs on every account switch.
  useEffect(() => {
    if (!jwtToken || !user?.id) return;

    // Wipe stale data if a different user logged in
    ensureOwner(user.id);

    const syncNotifications = async () => {
      try {
        const response = await axios.get(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });

        const notifications = response.data.data || [];
        // Replace (not merge) so we always reflect the server truth
        setNotifications(notifications);
      } catch (err) {
        console.error('[MainLayout] Error sincronizando notificaciones:', err);
      }
    };

    syncNotifications();

    const interval = setInterval(syncNotifications, 60000);

    return () => clearInterval(interval);
  }, [jwtToken, user?.id, setNotifications, ensureOwner]);

  return (
    <div className="flex h-screen overflow-hidden bg-dashboard-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
