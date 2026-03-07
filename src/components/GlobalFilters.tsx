import { Calendar, Globe, ChevronDown, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { getBranches } from '../features/branches/api/branchesApi';
import type { Branch } from '../features/branches/types';

interface GlobalFiltersProps {
  timeframe?: string;
  branchId?: string;
  sort?: string;
  onDateChange?: (val: string) => void;
  onLocationChange?: (val: string) => void;
  onSortChange?: (val: string) => void;
}

const TIMEFRAME_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: '3months', label: 'Últimos 3 meses' },
  { value: 'all', label: 'Histórico' },
];

const STATIC_LOCATION_OPTION = { value: '', label: 'Vista global' };

const SORT_OPTIONS = [
  { value: 'desc', label: 'Más recientes' },
  { value: 'asc', label: 'Más antiguos' },
];

export const GlobalFilters = ({ 
  timeframe = 'month', 
  branchId = '',
  sort = 'desc',
  onDateChange,
  onLocationChange,
  onSortChange
}: GlobalFiltersProps) => {

  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  const locationOptions = [
    STATIC_LOCATION_OPTION,
    ...branches.map((b) => ({ value: b.id, label: b.name })),
  ];

  const timeframeRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeframeRef.current && !timeframeRef.current.contains(event.target as Node)) {
        setIsTimeframeOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoadingBranches(true);
        const res = await getBranches();
        setBranches(res.data || []);
      } catch (err) {
        console.error('Error fetching branches in GlobalFilters:', err);
      } finally {
        setIsLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  const formatTimeframe = (tf: string) => {
    return TIMEFRAME_OPTIONS.find(o => o.value === tf)?.label || 'Este mes';
  };

  const formatLocation = (loc: string) => {
    return locationOptions.find(o => o.value === (loc || ''))?.label || 'Vista global';
  };
  const formatSort = (s: string) => {
    return SORT_OPTIONS.find(o => o.value === s)?.label || 'Más recientes';
  };
  
  return (
    <div className="flex items-center gap-3">
      {/* Date Filter Dropdown */}
      <div className="relative" ref={timeframeRef}>
        <button 
          onClick={() => {
            setIsTimeframeOpen(!isTimeframeOpen);
            setIsLocationOpen(false);
            setIsSortOpen(false);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-primary/30 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors focus:outline-none"
        >
          <Calendar className="w-4 h-4" />
          <span>{formatTimeframe(timeframe)}</span>
          <ChevronDown className={`w-4 h-4 ml-1 opacity-70 transition-transform duration-200 ${isTimeframeOpen ? 'rotate-180' : ''}`} />
        </button>

        {isTimeframeOpen && (
          <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
            {TIMEFRAME_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${timeframe === option.value ? 'font-bold text-primary bg-primary/5' : 'text-gray-700 font-medium'}`}
                onClick={() => {
                  onDateChange?.(option.value);
                  setIsTimeframeOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Location Filter Dropdown */}
      <div className="relative" ref={locationRef}>
        <button 
          onClick={() => {
            setIsLocationOpen(!isLocationOpen);
            setIsTimeframeOpen(false);
            setIsSortOpen(false);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-primary/30 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors focus:outline-none"
        >
          <Globe className="w-4 h-4" />
          <span>{formatLocation(branchId)}</span>
          <ChevronDown className={`w-4 h-4 ml-1 opacity-70 transition-transform duration-200 ${isLocationOpen ? 'rotate-180' : ''}`} />
        </button>

        {isLocationOpen && (
          <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
            {isLoadingBranches ? (
              <div className="flex items-center justify-center p-3 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              locationOptions.map((option) => (
                <button
                  key={option.value}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${(branchId || '') === option.value ? 'font-bold text-primary bg-primary/5' : 'text-gray-700 font-medium'}`}
                  onClick={() => {
                    onLocationChange?.(option.value);
                    setIsLocationOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="relative" ref={sortRef}>
        <button 
          onClick={() => {
            setIsSortOpen(!isSortOpen);
            setIsTimeframeOpen(false);
            setIsLocationOpen(false);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-primary/30 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors focus:outline-none"
        >
          <Calendar className="w-4 h-4 opacity-0 hidden" /> {/* For alignment/sizing match, could use ArrowUpDown instead */}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
          <span>{formatSort(sort)}</span>
          <ChevronDown className={`w-4 h-4 ml-1 opacity-70 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
        </button>

        {isSortOpen && (
          <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${sort === option.value ? 'font-bold text-primary bg-primary/5' : 'text-gray-700 font-medium'}`}
                onClick={() => {
                  onSortChange?.(option.value);
                  setIsSortOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
