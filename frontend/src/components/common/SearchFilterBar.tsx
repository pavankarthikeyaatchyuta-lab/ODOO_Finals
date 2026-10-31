/**
 * =============================================================================
 * File: SearchFilterBar.tsx
 * Module: Shared Luxury UI Component
 * =============================================================================
 * Reusable, accessible presentation component (SearchFilterBar) adhering to The Royal Knot design tokens and palette standards.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from './Input';

/**
 * Filter pill configuration option.
 */
export interface FilterOption {
  /** Unique key identifying the filter */
  key: string;
  /** Human-readable label displayed inside the pill */
  label: string;
}

/**
 * Props for the SearchFilterBar component.
 */
export interface SearchFilterBarProps {
  /** Current search input string value */
  searchQuery: string;
  /** Callback fired whenever the search input text changes */
  onSearchChange: (query: string) => void;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Optional array of filter category pills */
  filters?: FilterOption[];
  /** Key of currently active filter category */
  activeFilter?: string;
  /** Callback fired when a filter pill is clicked */
  onFilterChange?: (filterKey: string) => void;
  /** Header label for filter group */
  filterLabel?: string;
  /** Optional trailing action slot (e.g. export button, add button) */
  extraActions?: React.ReactNode;
}

/**
 * SearchFilterBar component
 *
 * Interactive search and category filter bar with instant query clearing,
 * active filter toggles, and customizable right-aligned action buttons.
 *
 * @param props - Search query, filter options, and event handlers
 */
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
      {/* Left Search Input with Search Icon and One-Click Clear Action */}
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
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null
          }
        />
      </div>

      {/* Middle Filter Category Buttons */}
      {filters && filters.length > 0 && onFilterChange && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1 font-medium">
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
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-[#1B3B6F] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Right Custom Actions Slot (e.g., Export, Create, Modal Triggers) */}
      {extraActions && (
        <div className="flex items-center gap-2">
          {extraActions}
        </div>
      )}
    </div>
  );
};
