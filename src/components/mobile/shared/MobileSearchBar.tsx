import { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChip {
  key: string;
  label: string;
  count?: number;
}

interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filters?: FilterChip[];
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  showFilterButton?: boolean;
  onFilterButtonClick?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export default function MobileSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  filters,
  activeFilter,
  onFilterChange,
  showFilterButton = false,
  onFilterButtonClick,
  autoFocus = false,
  className,
}: MobileSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
            isFocused ? 'text-primary' : 'text-muted-foreground'
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-11 pr-10 py-3.5 rounded-2xl bg-card border text-sm transition-all duration-200 shadow-mobile-sm',
            'focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:outline-none',
            'placeholder:text-muted-foreground/60',
            showFilterButton && 'pr-20'
          )}
        />

        {/* Clear button */}
        {value && (
          <button
            onClick={() => onChange('')}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center tap-scale',
              showFilterButton ? 'right-12' : 'right-3'
            )}
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Filter button */}
        {showFilterButton && (
          <button
            onClick={onFilterButtonClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-muted flex items-center justify-center tap-scale"
          >
            <Filter className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      {filters && filters.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {filters.map((filter, index) => (
            <button
              key={filter.key}
              onClick={() => onFilterChange?.(filter.key)}
              className={cn(
                'relative flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 tap-scale animate-slide-up-fade',
                activeFilter === filter.key
                  ? 'gradient-gold text-white shadow-mobile-md'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="flex items-center gap-1.5">
                {filter.label}
                {filter.count !== undefined && filter.count > 0 && (
                  <span
                    className={cn(
                      'min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center',
                      activeFilter === filter.key
                        ? 'bg-white/20 text-white'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {filter.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface MobileFilterDropdownProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

export function MobileFilterDropdown({ label, value, options, onChange }: MobileFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border text-sm font-medium tap-scale"
      >
        <span className="text-muted-foreground">{label}:</span>
        <span>{selectedOption?.label || 'All'}</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-scale-in">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-3 text-sm text-left transition-colors',
                  value === option.value ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
