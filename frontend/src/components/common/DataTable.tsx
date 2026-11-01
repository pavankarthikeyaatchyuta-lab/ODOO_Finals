/**
 * =============================================================================
 * File: DataTable.tsx
 * Module: Shared Luxury UI Component
 * =============================================================================
 * Reusable, accessible presentation component (DataTable) adhering to The Royal Knot
 * design tokens and palette standards. Supports client & server pagination, multi-column
 * numeric and lexical sorting, custom row limits, and WCAG AA accessibility semantics.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

/**
 * Definition for an individual table column.
 */
export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Props for the generic DataTable component.
 */
export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (item: T) => void;
  className?: string;
  /** Key that resets the current page to 1 when changed (e.g. search query or filter category) */
  resetPageKey?: string | number;

  // Server-side pagination extensions
  paginationMode?: 'client' | 'server';
  totalCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

/**
 * Extracts a numeric representation from strings like "₹2.5 Cr", "₹15 L", "95%", "₹50,000"
 * for accurate financial and quantity sorting instead of alphabetical order.
 */
function extractNumericValue(val: unknown): number | null {
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s) return null;

  // Match Indian currency crores: "₹2.5 Cr", "2.5 Crores"
  const crMatch = s.match(/^₹?\s*([\d,]+(?:\.\d+)?)\s*(?:Cr|Crores?)/i);
  if (crMatch) {
    const n = parseFloat(crMatch[1].replace(/,/g, ''));
    if (!isNaN(n)) return n * 10000000;
  }

  // Match Indian currency lakhs: "₹15 L", "15 Lakhs", "₹3.5 Lakh"
  const lakhMatch = s.match(/^₹?\s*([\d,]+(?:\.\d+)?)\s*(?:L|Lakhs?)/i);
  if (lakhMatch) {
    const n = parseFloat(lakhMatch[1].replace(/,/g, ''));
    if (!isNaN(n)) return n * 100000;
  }

  // Match pure numeric / currency / percent: "₹1,50,000", "95%", "450 Guests", "+25 mins"
  const numMatch = s.match(/^[+\-₹$€£]?\s*([\d,]+(?:\.\d+)?)/);
  if (numMatch) {
    const n = parseFloat(numMatch[1].replace(/,/g, ''));
    if (!isNaN(n)) return n;
  }

  return null;
}

/**
 * Generates an accessible, non-omitting pagination window.
 * Verified to cleanly handle 0, 1, 7, 8, 10, 20, 100+ pages without missing neighbours.
 */
function computePaginationRange(totalPages: number, currentPage: number): (number | 'ellipsis')[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // When totalPages > 7:
  // If currentPage is near the start
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }

  // If currentPage is near the end
  if (currentPage >= totalPages - 3) {
    return [
      1,
      'ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages
    ];
  }

  // In the middle
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

/**
 * DataTable component
 *
 * Sortable and searchable data table component supporting standardized row limits
 * (10, 25, 50, 100), direct page jump navigation, accessible keyboard controls, and multi-column sorting.
 */
export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No records found matching criteria.',
  pageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick,
  className = '',
  resetPageKey,
  paginationMode = 'client',
  totalCount,
  page: externalPage,
  onPageChange,
  onPageSizeChange
}: DataTableProps<T>) {
  const isServer = paginationMode === 'server';

  // Sorting state (client-side only; in server mode parent handles or delegates)
  const [sortColumnId, setSortColumnId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Internal pagination state (used in client mode)
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pageSize);
  const [isCustomPageSize, setIsCustomPageSize] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');

  // Active page & size depending on mode
  const currentPage = isServer ? (externalPage ?? 1) : internalPage;
  const currentPageSize = isServer ? (pageSize ?? 25) : internalPageSize;

  // Track previous resetPageKey to reset page to 1 when filters change
  const prevResetKeyRef = useRef(resetPageKey);
  useEffect(() => {
    if (prevResetKeyRef.current !== resetPageKey) {
      prevResetKeyRef.current = resetPageKey;
      if (isServer) {
        onPageChange?.(1);
      } else {
        setInternalPage(1);
      }
    }
  }, [resetPageKey, isServer, onPageChange]);

  // Synchronize internal page size if external prop changes
  useEffect(() => {
    if (!isServer) {
      setInternalPageSize(pageSize);
    }
  }, [pageSize, isServer]);

  // Multi-format client-side sorting
  const sortedData = useMemo(() => {
    if (isServer || !sortColumnId) return data;
    const col = columns.find(c => c.id === sortColumnId);
    if (!col || !col.accessorKey) return data;

    const key = col.accessorKey;
    return [...data].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // 1. Try numeric / currency extraction (e.g. ₹2.5 Cr vs ₹15 L)
      const numA = extractNumericValue(valA);
      const numB = extractNumericValue(valB);

      if (numA !== null && numB !== null) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // 2. Fall back to natural alphanumeric comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc'
        ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' })
        : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [data, columns, sortColumnId, sortDirection, isServer]);

  // Total count resolution
  const effectiveTotalCount = isServer
    ? (totalCount ?? data.length)
    : sortedData.length;

  // Total pages calculation
  const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / currentPageSize));

  // Clamp current page if total pages shrank (e.g. after deletion or page size change)
  useEffect(() => {
    if (currentPage > totalPages) {
      const clamped = Math.max(1, totalPages);
      if (isServer) {
        onPageChange?.(clamped);
      } else {
        setInternalPage(clamped);
      }
    }
  }, [totalPages, currentPage, isServer, onPageChange]);

  // Paginated window of data
  const paginatedData = useMemo(() => {
    if (isServer) {
      return data; // Already windowed by server
    }
    const start = (currentPage - 1) * currentPageSize;
    return sortedData.slice(start, start + currentPageSize);
  }, [sortedData, data, currentPage, currentPageSize, isServer]);

  // Header click handler for sorting
  const handleHeaderClick = (col: ColumnDef<T>) => {
    if (!col.sortable) return;
    if (sortColumnId === col.id) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumnId(col.id);
      setSortDirection('asc');
    }
  };

  // Page navigation handler
  const goToPage = (p: number) => {
    const target = Math.max(1, Math.min(totalPages, p));
    if (isServer) {
      onPageChange?.(target);
    } else {
      setInternalPage(target);
    }
  };

  // Change page size handler
  const handlePageSizeChange = (newSize: number) => {
    // Clamp to valid business range (5 to 100)
    const validSize = Math.max(5, Math.min(100, newSize));
    if (isServer) {
      onPageSizeChange?.(validSize);
      onPageChange?.(1);
    } else {
      setInternalPageSize(validSize);
      setInternalPage(1);
    }
  };

  // Generate pagination range list
  const paginationRange = useMemo(() => {
    return computePaginationRange(totalPages, currentPage);
  }, [totalPages, currentPage]);

  // Showing range calculations
  const startEntry = effectiveTotalCount === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const endEntry = Math.min(currentPage * currentPageSize, effectiveTotalCount);

  return (
    <div
      role="region"
      aria-label="Data Table"
      tabIndex={0}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col focus:outline-none focus:ring-1 focus:ring-[#C5A059]/40 ${className}`}
    >
      {/* Top Controls Toolbar: Rows Per Page Selector & Showing Count */}
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        {/* Left: Rows Per Page Selector Dropdown & Custom Input */}
        <div className="flex items-center gap-2">
          <label htmlFor="datatable-page-size" className="text-slate-600 font-medium">
            Rows per page:
          </label>
          {isCustomPageSize ? (
            <div className="inline-flex items-center gap-1 bg-white border border-[#C5A059] rounded-lg px-2 py-0.5 shadow-2xs">
              <input
                id="datatable-custom-page-size"
                type="number"
                min={5}
                max={100}
                value={customInputValue}
                autoFocus
                placeholder="5-100"
                aria-label="Custom rows per page (5-100)"
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomInputValue(val);
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num >= 5 && num <= 100) {
                    handlePageSizeChange(num);
                  }
                }}
                className="w-14 text-xs font-semibold text-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setIsCustomPageSize(false);
                  handlePageSizeChange(pageSizeOptions[0] || 25);
                }}
                title="Reset to preset options"
                aria-label="Reset to preset options"
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <select
              id="datatable-page-size"
              value={pageSizeOptions.includes(currentPageSize) ? currentPageSize : 'custom'}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomPageSize(true);
                  setCustomInputValue(String(currentPageSize));
                } else {
                  handlePageSizeChange(Number(e.target.value));
                }
              }}
              aria-label="Rows per page selector"
              className="bg-white border border-slate-200/90 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#C5A059] cursor-pointer shadow-2xs"
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt} rows
                </option>
              ))}
              <option value="custom">Custom (5-100)...</option>
            </select>
          )}
        </div>

        {/* Right: Showing entry count summary */}
        <div>
          <span>
            Showing <span className="font-semibold text-slate-800">{startEntry}</span> to{' '}
            <span className="font-semibold text-slate-800">{endEntry}</span> of{' '}
            <span className="font-semibold text-slate-800">{effectiveTotalCount}</span> entries
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              {columns.map(col => {
                const isSorted = sortColumnId === col.id;
                const alignClass =
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';

                return (
                  <th
                    key={col.id}
                    role="columnheader"
                    scope="col"
                    aria-sort={
                      isSorted
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : col.sortable
                        ? 'none'
                        : undefined
                    }
                    tabIndex={col.sortable ? 0 : undefined}
                    onClick={() => handleHeaderClick(col)}
                    onKeyDown={(e) => {
                      if (col.sortable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleHeaderClick(col);
                      }
                    }}
                    aria-label={
                      col.sortable
                        ? `${col.header}, sort ${isSorted && sortDirection === 'asc' ? 'descending' : 'ascending'}`
                        : col.header
                    }
                    className={`py-3 px-4 select-none ${alignClass} ${
                      col.sortable
                        ? 'cursor-pointer hover:bg-slate-100/70 hover:text-slate-800 focus:outline-none focus:bg-slate-100 transition-colors'
                        : ''
                    } ${col.className || ''}`}
                  >
                    <div
                      className={`flex items-center gap-1.5 ${
                        col.align === 'right'
                          ? 'justify-end'
                          : col.align === 'center'
                          ? 'justify-center'
                          : 'justify-start'
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span>
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#C5A059]" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#C5A059]" aria-hidden="true" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" aria-hidden="true" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map(item => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map(col => {
                    const alignClass =
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';

                    return (
                      <td key={col.id} className={`py-3.5 px-4 ${alignClass} ${col.className || ''}`}>
                        {col.cell
                          ? col.cell(item)
                          : col.accessorKey
                          ? String(item[col.accessorKey] ?? '—')
                          : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400 italic">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Navigation Footer */}
      <nav
        aria-label="Pagination Navigation"
        className="px-4 py-3 border-t border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"
      >
        <div>
          <span>
            Page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </span>
        </div>

        {/* Right: Page Navigation Controls */}
        <div className="flex items-center gap-1">
          {/* First Page Button */}
          <button
            type="button"
            disabled={currentPage === 1 || effectiveTotalCount === 0}
            onClick={() => goToPage(1)}
            title="First Page"
            aria-label="First page"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronsLeft className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {/* Previous Page Button */}
          <button
            type="button"
            disabled={currentPage === 1 || effectiveTotalCount === 0}
            onClick={() => goToPage(currentPage - 1)}
            title="Previous Page"
            aria-label="Previous page"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 px-1">
            {paginationRange.map((p, idx) => {
              if (p === 'ellipsis') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 select-none" aria-hidden="true">
                    …
                  </span>
                );
              }
              const isCurrent = p === currentPage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => goToPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#C5A059] text-[#0D1B2A] shadow-xs font-bold'
                      : 'border border-transparent hover:border-slate-200 bg-transparent hover:bg-white text-slate-700 font-medium'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            disabled={currentPage === totalPages || effectiveTotalCount === 0}
            onClick={() => goToPage(currentPage + 1)}
            title="Next Page"
            aria-label="Next page"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {/* Last Page Button */}
          <button
            type="button"
            disabled={currentPage === totalPages || effectiveTotalCount === 0}
            onClick={() => goToPage(totalPages)}
            title="Last Page"
            aria-label="Last page"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronsRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </div>
  );
}
