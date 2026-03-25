import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotificationStore, type Notification } from '../../../store/notificationStore';
import { useAuthStore } from '../../../store/authStore';
import { NotificationItem } from '../components/NotificationItem';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const NotificationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { token } = useAuthStore();
  const { notifications, setNotifications, markAsRead, markAllAsRead, setUnreadCount } = useNotificationStore();
  const navigate = useNavigate();

  // Cargar notificaciones al montar
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const data = response.data.data || [];
        setNotifications(data);
        
        // Recalcular no leídas por seguridad
        const unread = data.filter((n: Notification) => !n.is_read).length;
        setUnreadCount(unread);
        
      } catch (err) {
        console.error('[Notifications] Error fetching:', err);
        setError('No se pudieron cargar las notificaciones. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token, setNotifications, setUnreadCount]);

  const handleNotificationClick = async (notification: Notification) => {
    // 1. Marcar como leída visualmente de inmediato (UI optimista)
    if (!notification.is_read) {
      markAsRead(notification.id);
      
      // 2. Marcar en backend
      try {
        await axios.patch(`${API_URL}/notifications/${notification.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Error marcando notificación como leída:', err);
        // Si falla silenciosamente, no bloqueamos la navegación de igual forma.
      }
    }

    // 3. Navegar al recurso si tiene work_id asociado
    if (notification.work_id) {
      navigate(`/works/${notification.work_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // API call
      await axios.patch(`${API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Store update
      markAllAsRead();
    } catch (err) {
      console.error('Error marcando todas como leídas:', err);
    }
  };

  // ==========================================
  // ESTADO VACÍO (Empty State) UI
  // ==========================================
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-24 h-24 mb-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
           <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Todo al día</h3>
      <p className="text-gray-500 max-w-md">
        No tienes notificaciones pendientes. Aquí aparecerán mensajes, asignaciones y actualizaciones de tus trabajos.
      </p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Centro de Notificaciones</h1>
          <p className="text-sm text-gray-500 mt-1">Revisa las actualizaciones importantes de Notaría 178</p>
        </div>
        
        {notifications.some((n: Notification) => !n.is_read) && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Marcar todas como leídas
          </button>
        )}
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center border border-red-100">
          {error}
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(skeleton => (
            <div key={skeleton} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notification: Notification) => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onClick={handleNotificationClick} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
