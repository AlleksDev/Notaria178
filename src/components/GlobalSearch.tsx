import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '../features/home/hooks/useDebounce';

interface GlobalSearchProps {
  placeholder?: string;
  /** Debounced callback — used in uncontrolled mode (HomePage, Proyectistas). */
  onSearch?: (val: string) => void;
  /** Controlled value — when provided the component becomes controlled. */
  value?: string;
  /** Instant callback — used in controlled mode (Trabajos). */
  onChange?: (val: string) => void;
  /** Extra classes for the wrapper div (e.g. width overrides). */
  className?: string;
}

export const GlobalSearch = ({
  placeholder = 'Buscar',
  onSearch,
  value,
  onChange,
  className,
}: GlobalSearchProps) => {
  // Determine if component is controlled from outside
  const isControlled = value !== undefined;

  // Internal state only used in uncontrolled mode
  const [internalValue, setInternalValue] = useState('');
  const debouncedValue = useDebounce(internalValue, 500);

  useEffect(() => {
    if (!isControlled) {
      onSearch?.(debouncedValue);
    }
  }, [debouncedValue, onSearch, isControlled]);

  // Always use a defined string to avoid controlled/uncontrolled React warning
  const inputValue = isControlled ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isControlled) {
      onChange?.(val);
    } else {
      setInternalValue(val);
    }
  };

  return (
    <div className={`relative w-full ${className ?? ''}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-12 pr-4 py-3 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all hover:border-gray-300"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
      />
    </div>
  );
};
