import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { GlobalSearch } from '../../../components/GlobalSearch';
import { GlobalFilters } from '../../../components/GlobalFilters';
import { WorkCard } from '../../../components/WorkCard';
import { CreateWorkModal } from '../components/CreateWorkModal';
import { useWorks } from '../hooks/useWorks';
import { useWorkStats } from '../hooks/useWorkStats';
import { getWorkDetail } from '../api/worksApi';
import { timeframeToDateRange } from '../../../utils/dateUtils';
import type { WorkStatus, WorkDetail } from '../types';

const ITEMS_PER_PAGE = 8;

type StatusTab = '' | 'APPROVED';

type SearchMode = 'folio' | 'cliente' | 'proyectista';

const SEARCH_MODE_CONFIG: Record<
  SearchMode,
  { label: string; placeholder: string }
> = {
  folio: { label: 'Folio', placeholder: 'Buscar por folio...' },
  cliente: { label: 'Cliente', placeholder: 'Buscar por cliente...' },
  proyectista: {
    label: 'Proyectista',
    placeholder: 'Buscar por proyectista...',
  },
};

const STATUS_BADGES: {
  key: WorkStatus | 'ALL';
  label: string;
  field: string;
}[] = [
  { key: 'ALL', label: 'Todos', field: 'total' },
  { key: 'APPROVED', label: 'Aprobados', field: 'approved' },
  { key: 'READY_FOR_REVIEW', label: 'Listo para revisión', field: 'ready_for_review' },
  { key: 'IN_PROGRESS', label: 'En proceso', field: 'in_progress' },
  { key: 'PENDING', label: 'Pendiente', field: 'pending' },
  { key: 'REJECTED', label: 'Rechazados', field: 'rejected' },
];

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ALL: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  APPROVED: { bg: 'bg-badge-approved-bg', text: 'text-badge-approved-text', border: 'border-green-200' },
  READY_FOR_REVIEW: { bg: 'bg-badge-review-bg', text: 'text-badge-review-text', border: 'border-blue-200' },
  IN_PROGRESS: { bg: 'bg-badge-process-bg', text: 'text-badge-process-text', border: 'border-gray-200' },
  PENDING: { bg: 'bg-badge-pending-bg', text: 'text-badge-pending-text', border: 'border-yellow-200' },
  REJECTED: { bg: 'bg-badge-rejected-bg', text: 'text-badge-rejected-text', border: 'border-red-200' },
};



export const TrabajosPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('folio');
  const [statusTab, setStatusTab] = useState<StatusTab>('');
  const [statusBadge, setStatusBadge] = useState<WorkStatus | 'ALL'>('ALL');
  const [branchId, setBranchId] = useState('');
  const [timeframe, setTimeframe] = useState('all');
  const [sort, setSort] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Compute the effective status filter from tab + badge
  const effectiveStatus = (() => {
    if (statusTab === 'APPROVED') return 'APPROVED';
    if (statusBadge !== 'ALL') return statusBadge;
    return undefined;
  })();

  // Only send `search` to API when mode is folio (API only supports folio search)
  const apiSearch = searchMode === 'folio' && debouncedSearch ? debouncedSearch : undefined;

  const dateRange = timeframeToDateRange(timeframe);

  const {
    data: works,
    total,
    isLoading,
    error,
    refetch,
  } = useWorks({
    search: apiSearch,
    status: effectiveStatus,
    branch_id: branchId || undefined,
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    sort: sort,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  });

  const {
    stats,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useWorkStats(branchId || undefined);

  // Detail cache for enriching cards
  const [detailCache, setDetailCache] = useState<Record<string, WorkDetail>>({});
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

  // Fetch details for visible works
  useEffect(() => {
    if (!works.length) return;

    const missing = works.filter(
      (w) => !detailCache[w.id] && !loadingDetails.has(w.id)
    );
    if (!missing.length) return;

    const ids = missing.map((w) => w.id);
    setLoadingDetails((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });

    Promise.allSettled(ids.map((id) => getWorkDetail(id))).then((results) => {
      const newDetails: Record<string, WorkDetail> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          newDetails[ids[i]] = r.value;
        }
      });
      setDetailCache((prev) => ({ ...prev, ...newDetails }));
      setLoadingDetails((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works]);

  // Client-side filtering for non-folio search modes
  const filteredWorks = (() => {
    if (!debouncedSearch || searchMode === 'folio') return works;
    const term = debouncedSearch.toLowerCase();
    return works.filter((w) => {
      const detail = detailCache[w.id];
      if (!detail) return true; // still loading detail, keep visible
      if (searchMode === 'cliente') {
        // no client name in detail yet, keep all
        return true;
      }
      if (searchMode === 'proyectista') {
        const drafter = w.main_drafter_id
          ? detail.collaborators?.find((c) => c.user_id === w.main_drafter_id)
          : undefined;
        if (drafter) return drafter.full_name.toLowerCase().includes(term);
        return detail.collaborators?.some((c) =>
          c.full_name.toLowerCase().includes(term)
        );
      }
      return true;
    });
  })();

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

  const handleStatusTab = (tab: StatusTab) => {
    setStatusTab(tab);
    if (tab === 'APPROVED') setStatusBadge('ALL');
    setCurrentPage(1);
  };

  const handleBadgeClick = (key: WorkStatus | 'ALL') => {
    if (statusTab === 'APPROVED') return;
    setStatusBadge(key);
    setCurrentPage(1);
  };

  const handleCreateSuccess = useCallback(() => {
    setShowCreateModal(false);
    refetch();
    refetchStats();
  }, [refetch, refetchStats]);

  const handleSearchModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setSearchTerm('');
    setFilterOpen(false);
    setCurrentPage(1);
  };

  // Pagination
  const hasMore = total === ITEMS_PER_PAGE;
  const totalPages = hasMore ? currentPage + 1 : currentPage;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-6 w-full max-w-full pb-8">
      {/* Smart search bar + global filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
        <div className="flex-1 w-full max-w-[500px]">
          <GlobalSearch
            placeholder={SEARCH_MODE_CONFIG[searchMode].placeholder}
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
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
        <h1 className="text-2xl font-bold text-gray-600">Trabajos</h1>
      </div>

      {/* Tabs, filter dropdown, and add button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button
            onClick={() => handleStatusTab('')}
            className={`px-6 py-2.5 text-sm font-medium transition-colors ${
              statusTab === ''
                ? 'bg-[#3d3d3d] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Todos los trabajos
          </button>
          <button
            onClick={() => handleStatusTab('APPROVED')}
            className={`px-6 py-2.5 text-sm font-medium transition-colors border-l border-gray-200 ${
              statusTab === 'APPROVED'
                ? 'bg-[#3d3d3d] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Trabajos aprobados
          </button>
        </div>

        {/* Filter dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Filter size={16} />
            Buscar por: {SEARCH_MODE_CONFIG[searchMode].label}
            <ChevronDown size={14} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>

          {filterOpen && (
            <div className="absolute top-full mt-2 left-0 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
              {(Object.keys(SEARCH_MODE_CONFIG) as SearchMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleSearchModeChange(mode)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                    searchMode === mode
                      ? 'font-bold text-primary bg-primary/5'
                      : 'text-gray-700 font-medium'
                  }`}
                >
                  {SEARCH_MODE_CONFIG[mode].label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} />
            Agregar trabajo
          </button>
        </div>
      </div>

      {/* Status badges / KPI cards */}
      <div className="flex flex-wrap gap-3">
        {STATUS_BADGES.map((badge) => {
          const colors = BADGE_COLORS[badge.key];
          const count = isStatsLoading
            ? '...'
            : stats[badge.field as keyof typeof stats];
          const isActive =
            statusTab !== 'APPROVED' && statusBadge === badge.key;

          return (
            <button
              key={badge.key}
              onClick={() => handleBadgeClick(badge.key)}
              disabled={statusTab === 'APPROVED'}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                isActive
                  ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-offset-1 ring-current/20`
                  : statusTab === 'APPROVED'
                    ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                    : `bg-white text-gray-600 border-gray-200 hover:${colors.bg} hover:${colors.text}`
              }`}
            >
              {badge.label}
              <span className="font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Works grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-12 text-center">
          <p className="text-red-600 font-medium">
            Error al cargar los trabajos
          </p>
          <p className="text-red-400 text-sm mt-1">{error.message}</p>
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg font-medium">
            No se encontraron trabajos
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Intenta ajustar los filtros de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredWorks.map((work) => {
            const detail = detailCache[work.id];
            const isDetailLoading = loadingDetails.has(work.id) && !detail;

            return (
              <WorkCard
                key={work.id}
                folio={work.folio}
                status={work.status}
                createdAt={work.created_at}
                mainDrafterId={work.main_drafter_id}
                mainDrafterName={detail?.main_drafter_name}
                clientName={detail?.client_name}
                acts={detail?.acts}
                collaborators={detail?.collaborators}
                isLoadingDetail={isDetailLoading}
                onClick={() => navigate(`/works/${work.id}`)}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filteredWorks.length > 0 && (
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

      {/* Create Work Modal */}
      <CreateWorkModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};
