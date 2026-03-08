import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { GlobalSearch } from '../../../components/GlobalSearch';
import { GlobalFilters } from '../../../components/GlobalFilters';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { KpiCards } from '../../../components/KpiCards';
import { UsersTable } from '../components/UsersTable';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { useUsers } from '../hooks/useUsers';
import { useUserStats } from '../hooks/useUserStats';
import { useAuthStore } from '../../../store/authStore';
import { updateUser } from '../api/usersApi';
import { timeframeToDateRange } from '../../../utils/dateUtils';
import type { Proyectista } from '../types';

const ITEMS_PER_PAGE = 6;

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'Todos los roles' },
  { value: 'DRAFTER', label: 'Proyectista' },
  { value: 'DATA_ENTRY', label: 'Capturista' },
  { value: 'LOCAL_ADMIN', label: 'Admin Local' },
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'INACTIVE', label: 'Inactivos' },
];

export const ProyectistasPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchId, setBranchId] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [timeframe, setTimeframe] = useState('month');
  const [sort, setSort] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Proyectista | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Stats
  const {
    stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useUserStats(branchId || undefined);

  // Paginated user list
  const dateRange = timeframeToDateRange(timeframe);
  const {
    data: users,
    total,
    isLoading,
    error,
    refetch,
  } = useUsers({
    search: searchTerm || undefined,
    status: statusFilter || undefined,
    role: roleFilter || undefined,
    branch_id: branchId || undefined,
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    sort: sort,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  });

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handleBranchChange = useCallback((val: string) => {
    setBranchId(val);
    setCurrentPage(1);
  }, []);

  const handleTimeframeChange = useCallback((val: string) => {
    setTimeframe(val);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((val: string) => {
    setSort(val);
    setCurrentPage(1);
  }, []);

  const handleStatusTab = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const refreshAll = () => {
    refetch();
    refetchStats();
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    refreshAll();
  };

  const handleEditSuccess = () => {
    setEditingUser(null);
    refreshAll();
  };

  const handleEdit = (user: Proyectista) => {
    setEditingUser(user);
  };

  const currentUser = useAuthStore((s) => s.user);
  const [deactivatingUser, setDeactivatingUser] = useState<Proyectista | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleDeactivate = (user: Proyectista) => {
    setDeactivatingUser(user);
  };

  const confirmDeactivate = async () => {
    if (!deactivatingUser) return;
    setIsDeactivating(true);
    try {
      await updateUser(deactivatingUser.id, { status: 'INACTIVE' });
      setDeactivatingUser(null);
      refreshAll();
    } catch {
      setDeactivatingUser(null);
    } finally {
      setIsDeactivating(false);
    }
  };

  // Pagination logic
  const hasMore = total === ITEMS_PER_PAGE;
  const totalPages = hasMore ? currentPage + 1 : currentPage;
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-full pb-8">
      {/* Search and global filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
        <div className="flex-1 w-full max-w-[500px]">
          <GlobalSearch
            placeholder="Buscar proyectista..."
            onSearch={handleSearch}
          />
        </div>
        <div className="flex-shrink-0 sm:ml-auto">
          <GlobalFilters
            branchId={branchId}
            timeframe={timeframe}
            sort={sort}
            onLocationChange={handleBranchChange}
            onDateChange={handleTimeframeChange}
            onSortChange={handleSortChange}
          />
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-600">Proyectistas</h1>
      </div>

      {/* Tabs, filter, and add button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button
            onClick={() => handleStatusTab('')}
            className={`px-6 py-2.5 text-sm font-medium transition-colors ${
              statusFilter === '' || statusFilter === undefined
                ? 'bg-[#3d3d3d] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Todos los proyectistas
          </button>
          <button
            onClick={() => handleStatusTab('ACTIVE')}
            className={`px-6 py-2.5 text-sm font-medium transition-colors border-l border-gray-200 ${
              statusFilter === 'ACTIVE'
                ? 'bg-[#3d3d3d] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Proyectistas activos
          </button>
        </div>

        {/* Filter dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Filter size={16} />
            Filtrar
          </button>
          {showFilterMenu && (
            <div className="absolute top-full mt-2 left-0 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
              <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Por rol
              </p>
              {ROLE_FILTER_OPTIONS.map((opt) => (
                <button
                  key={`role-${opt.value}`}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                    roleFilter === opt.value
                      ? 'font-bold text-primary bg-primary/5'
                      : 'text-gray-700 font-medium'
                  }`}
                  onClick={() => {
                    setRoleFilter(opt.value);
                    setCurrentPage(1);
                    setShowFilterMenu(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <hr className="my-1 border-gray-100" />
              <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Por estado
              </p>
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={`status-${opt.value}`}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                    statusFilter === opt.value
                      ? 'font-bold text-primary bg-primary/5'
                      : 'text-gray-700 font-medium'
                  }`}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setCurrentPage(1);
                    setShowFilterMenu(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C07D30] text-white rounded-lg text-sm font-medium hover:bg-[#A86925] transition-colors"
          >
            <Plus size={16} />
            Agregar proyectista
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <KpiCards
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
        isLoading={isStatsLoading}
      />

      {/* Users table */}
      <UsersTable
        users={users}
        isLoading={isLoading}
        error={error}
        currentUserEmail={currentUser?.email}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
      />

      {/* Pagination */}
      {users.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!hasMore}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Create modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit modal */}
      <EditUserModal
        isOpen={editingUser !== null}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Confirm deactivate modal */}
      <ConfirmModal
        isOpen={deactivatingUser !== null}
        title="Cambiar estado del usuario"
        message={`¿Está seguro que desea cambiar el status del usuario ${deactivatingUser?.full_name ?? ''} a inactivo?`}
        confirmLabel="Sí, desactivar"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={isDeactivating}
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivatingUser(null)}
      />
    </div>
  );
};
