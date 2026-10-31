import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from './Input';

export interface FilterOption {
  key: string;
  label: string;
}

export interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (filterKey: string) => void;
  filterLabel?: string;
  extraActions?: React.ReactNode;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters,
  activeFilter,
  onFilterChange,
  filterLabel = 'Filter',
  extraActions
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
      {/* Left Search Input */}
      <div className="flex-1 min-w-[240px] max-w-md">
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          leftIcon={<Search className="w-3.5 h-3.5" />}
          rightIcon={
            searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null
          }
        />
      </div>

      {/* Right Filters & Custom Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {filters && filters.length > 0 && onFilterChange && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              {filterLabel}:
            </span>
            {filters.map(f => {
              const isActive = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onFilterChange(f.key)}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#1B3B6F] text-white shadow-2xs font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        {extraActions && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            {extraActions}
          </div>
        )}
      </div>
    </div>
  );
};
