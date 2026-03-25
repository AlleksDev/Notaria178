import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useFCMListener } from '../hooks/useFCMListener';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const MainLayout = () => {
  const { setUnreadCount } = useNotificationStore();
  const { token: jwtToken } = useAuthStore();

  // Listener global de FCM: recibe push en primer plano, reproduce sonido, incrementa contador
  useFCMListener();

  // Cargar el contador inicial de no leidas al montar el layout
  useEffect(() => {
    if (!jwtToken) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get(`${API_URL}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        setUnreadCount(response.data.unread_count);
      } catch (err) {
        console.warn('[Notifications] Error obteniendo contador de no leidas:', err);
      }
    };

    fetchUnreadCount();
  }, [jwtToken, setUnreadCount]);

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
