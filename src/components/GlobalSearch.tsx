import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '../features/home/hooks/useDebounce';

interface GlobalSearchProps {
  placeholder?: string;
  onSearch?: (val: string) => void;
}

export const GlobalSearch = ({ placeholder = 'Buscar', onSearch }: GlobalSearchProps) => {
  const [inputValue, setInputValue] = useState('');
  const debouncedValue = useDebounce(inputValue, 500);

  useEffect(() => {
    onSearch?.(debouncedValue);
  }, [debouncedValue, onSearch]);

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-12 pr-4 py-3 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all hover:border-gray-300"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
    </div>
  );
};
