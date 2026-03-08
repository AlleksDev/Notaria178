import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CategoryAccordionProps {
  category: string;
  actsCount: number;
  children: React.ReactNode;
}

export const CategoryAccordion: React.FC<CategoryAccordionProps> = ({
  category,
  actsCount,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white border border-gray-100 rounded-xl mb-4 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center px-6 py-4 hover:bg-gray-50 transition-colors focus:outline-none"
      >
        <div className="text-gray-400 mr-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>
        
        <h3 className="text-gray-800 font-bold text-sm sm:text-base mr-3">
          {category}
        </h3>
        
        <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full font-medium">
          {actsCount} {actsCount === 1 ? 'acto' : 'actos'}
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100">
          <div className="flex flex-col divide-y divide-gray-100">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};
