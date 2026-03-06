import { Calendar, Globe, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface GlobalFiltersProps {
  timeframe?: string;
  branchId?: string;
  onDateChange?: (val: string) => void;
  onLocationChange?: (val: string) => void;
}

const TIMEFRAME_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: '3months', label: 'Últimos 3 meses' },
  { value: 'all', label: 'Histórico' },
];

const LOCATION_OPTIONS = [
  { value: '', label: 'Vista global' },
  { value: '1', label: 'Sucursal 1' },
];

export const GlobalFilters = ({ 
  timeframe = 'month', 
  branchId = '',
  onDateChange,
  onLocationChange
}: GlobalFiltersProps) => {

  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  const timeframeRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeframeRef.current && !timeframeRef.current.contains(event.target as Node)) {
        setIsTimeframeOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimeframe = (tf: string) => {
    return TIMEFRAME_OPTIONS.find(o => o.value === tf)?.label || 'Este mes';
  };

  const formatLocation = (loc: string) => {
    return LOCATION_OPTIONS.find(o => o.value === (loc || ''))?.label || 'Vista global';
  };
  
  return (
    <div className="flex items-center gap-3">
      {/* Date Filter Dropdown */}
      <div className="relative" ref={timeframeRef}>
        <button 
          onClick={() => {
            setIsTimeframeOpen(!isTimeframeOpen);
            setIsLocationOpen(false); // Close the other if open
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
            setIsTimeframeOpen(false); // Close the other if open
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-primary/30 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors focus:outline-none"
        >
          <Globe className="w-4 h-4" />
          <span>{formatLocation(branchId)}</span>
          <ChevronDown className={`w-4 h-4 ml-1 opacity-70 transition-transform duration-200 ${isLocationOpen ? 'rotate-180' : ''}`} />
        </button>

        {isLocationOpen && (
          <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
            {LOCATION_OPTIONS.map((option) => (
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
