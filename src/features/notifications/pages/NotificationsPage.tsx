import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Filter, CheckCheck } from 'lucide-react';
import { useNotificationStore, type Notification } from '../../../store/notificationStore';
import { useAuthStore } from '../../../store/authStore';
import { NotificationItem } from '../components/NotificationItem';
import { GlobalSearch } from '../../../components/GlobalSearch';
import { GlobalFilters } from '../../../components/GlobalFilters';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const NotificationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'read' | 'unread'>('');
  const [typeFilter, setTypeFilter] = useState('');
  const [timeframe, setTimeframe] = useState('month');
  const [sort, setSort] = useState('desc');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const { token } = useAuthStore();
  const { notifications, mergeNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const navigate = useNavigate();

  // Cerrar menú de filtros al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        mergeNotifications(data);

      } catch (err) {
        console.error('[Notifications] Error fetching:', err);
        setError('No se pudieron cargar las notificaciones. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token, mergeNotifications]);

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

  // Handlers para filtros
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleTimeframeChange = useCallback((val: string) => {
    setTimeframe(val);
  }, []);

  const handleSortChange = useCallback((val: string) => {
    setSort(val);
  }, []);

  const handleStatusTab = (status: '' | 'read' | 'unread') => {
    setStatusFilter(status);
  };

  // Filtrar notificaciones
  const filteredNotifications = notifications.filter((notification: Notification) => {
    // Filtro por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesTitle = notification.title?.toLowerCase().includes(search);
      const matchesMessage = notification.message?.toLowerCase().includes(search);
      const matchesBody = notification.body?.toLowerCase().includes(search);
      if (!matchesTitle && !matchesMessage && !matchesBody) return false;
    }

    // Filtro por estado
    if (statusFilter === 'read' && !notification.is_read) return false;
    if (statusFilter === 'unread' && notification.is_read) return false;

    // Filtro por tipo
    if (typeFilter && notification.type !== typeFilter) return false;

    return true;
  });

  // Ordenar notificaciones
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sort === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Calcular estadísticas
  const stats = {
    total: notifications.length,
    unread: notifications.filter((n: Notification) => !n.is_read).length,
    read: notifications.filter((n: Notification) => n.is_read).length,
  };

  // ==========================================
  // ESTADO VACÍO (Empty State) UI
  // ==========================================
  const renderEmptyState = () => {
    // Si hay filtros activos pero no hay resultados
    if (searchTerm || statusFilter || typeFilter) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 mb-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <Filter size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No se encontraron notificaciones</h3>
          <p className="text-gray-500 max-w-md mb-4">
            No hay notificaciones que coincidan con los filtros aplicados.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setTypeFilter('');
            }}
            className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      );
    }

    // Estado vacío por defecto (sin notificaciones)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Todo al día</h3>
        <p className="text-gray-500 max-w-md">
          No tienes notificaciones pendientes. Aquí aparecerán mensajes, asignaciones y actualizaciones de tus trabajos.
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full pb-8">
      {/* Search and global filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
        <div className="flex-1 w-full max-w-[500px]">
          <GlobalSearch
            placeholder="Buscar en notificaciones..."
            onSearch={handleSearch}
          />
        </div>
        <div className="flex-shrink-0 sm:ml-auto">
          <GlobalFilters
            branchId=""
            timeframe={timeframe}
            sort={sort}
            onLocationChange={() => {}}
            onDateChange={handleTimeframeChange}
            onSortChange={handleSortChange}
            hideBranchFilter={true}
            hideAttendanceButton={true}
          />
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-600">Centro de Notificaciones</h1>
          {stats.unread > 0 && !loading && (
            <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
              {stats.unread} {stats.unread === 1 ? 'nueva' : 'nuevas'}
            </span>
          )}
        </div>
      </div>

      {/* Tabs and filter button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button
            onClick={() => handleStatusTab('')}
            className={`px-6 py-2.5 text-sm font-medium transition-colors ${
              statusFilter === ''
                ? 'bg-[#3d3d3d] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Todas las notificaciones
          </button>
          <button
            onClick={() => handleStatusTab('unread')}
            className={`px-6 py-2.5 text-sm font-medium transition-colors border-l border-gray-200 ${
              statusFilter === 'unread'
                ? 'bg-[#3d3d3d] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            No leídas {stats.unread > 0 && <span className="ml-1.5 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">{stats.unread}</span>}
          </button>
          <button
            onClick={() => handleStatusTab('read')}
            className={`px-6 py-2.5 text-sm font-medium transition-colors border-l border-gray-200 ${
              statusFilter === 'read'
                ? 'bg-[#3d3d3d] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Leídas
          </button>
        </div>

        {/* Filter dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Filter size={16} />
            Filtrar por tipo
          </button>
          {showFilterMenu && (
            <div className="absolute top-full mt-2 left-0 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
              <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Tipo de notificación
              </p>
              <button
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  typeFilter === ''
                    ? 'font-bold text-primary bg-primary/5'
                    : 'text-gray-700 font-medium'
                }`}
                onClick={() => {
                  setTypeFilter('');
                  setShowFilterMenu(false);
                }}
              >
                Todas
              </button>
              <button
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  typeFilter === 'NEW_COMMENT'
                    ? 'font-bold text-primary bg-primary/5'
                    : 'text-gray-700 font-medium'
                }`}
                onClick={() => {
                  setTypeFilter('NEW_COMMENT');
                  setShowFilterMenu(false);
                }}
              >
                Nuevos comentarios
              </button>
              <button
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  typeFilter === 'STATUS_CHANGE'
                    ? 'font-bold text-primary bg-primary/5'
                    : 'text-gray-700 font-medium'
                }`}
                onClick={() => {
                  setTypeFilter('STATUS_CHANGE');
                  setShowFilterMenu(false);
                }}
              >
                Cambios de estado
              </button>
              <button
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  typeFilter === 'ASSIGNMENT'
                    ? 'font-bold text-primary bg-primary/5'
                    : 'text-gray-700 font-medium'
                }`}
                onClick={() => {
                  setTypeFilter('ASSIGNMENT');
                  setShowFilterMenu(false);
                }}
              >
                Asignaciones
              </button>
            </div>
          )}
        </div>

        {/* Botón marcar todas como leídas */}
        {stats.unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <CheckCheck size={16} />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center">
          <p className="font-medium">{error}</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(skeleton => (
            <div key={skeleton} className="flex gap-4 p-4 rounded-xl border border-gray-200 bg-white animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2.5 py-1">
                <div className="h-4 bg-gray-200 rounded w-2/5" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
              </div>
              <div className="w-2.5 h-2.5 bg-gray-200 rounded-full mt-1.5" />
            </div>
          ))}
        </div>
      ) : sortedNotifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="flex flex-col gap-3">
          {sortedNotifications.map((notification: Notification) => (
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
