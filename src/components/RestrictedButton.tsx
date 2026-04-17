// src/components/RestrictedButton.tsx
import { useState, useRef, useEffect, type ReactNode, type ButtonHTMLAttributes } from 'react';

interface RestrictedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  restricted?: boolean;
  tooltipText?: string;
  children: ReactNode;
}

export const RestrictedButton = ({
  restricted = false,
  tooltipText = 'Solo administradores pueden realizar esta acción',
  children,
  className = '',
  ...rest
}: RestrictedButtonProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!restricted) {
    return (
      <button className={className} {...rest}>
        {children}
      </button>
    );
  }

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShowTooltip(true), 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowTooltip(false);
  };

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        className={`${className} opacity-50 !cursor-not-allowed`}
        disabled
        {...rest}
      >
        {children}
      </button>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs font-medium text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
};
