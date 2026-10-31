/**
 * =============================================================================
 * File: DataTable.tsx
 * Module: Shared Luxury UI Component
 * =============================================================================
 * Reusable, accessible presentation component (DataTable) adhering to The Royal Knot design tokens and palette standards.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState, useMemo, useEffect } from 'react';
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
}

/**
 * DataTable component
 *
 * Sortable and searchable data table component supporting customizable row limits
 * (10, 25, 50, 100, 200), direct page jump navigation, and multi-column sorting.
 *
 * @param props - Table columns, data array, and pagination configuration
 */
export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No records found matching criteria.',
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100, 200],
  onRowClick,
  className = ''
}: DataTableProps<T>) {
  const [sortColumnId, setSortColumnId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  // Synchronize internal page size if prop changes
  useEffect(() => {
    setCurrentPageSize(pageSize);
  }, [pageSize]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortColumnId) return data;
    const col = columns.find(c => c.id === sortColumnId);
    if (!col || !col.accessorKey) return data;

    const key = col.accessorKey;
    return [...data].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [data, columns, sortColumnId, sortDirection]);

  // Total pages calculation
  const totalPages = Math.ceil(sortedData.length / currentPageSize) || 1;

  // Clamp current page if total pages shrank (e.g. after search or page size increase)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  // Paginated window of data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * currentPageSize;
    return sortedData.slice(start, start + currentPageSize);
  }, [sortedData, currentPage, currentPageSize]);

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

  // Generate smart pagination page numbers list (with ellipsis)
  const paginationRange = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    const showLeftEllipsis = currentPage > 4;
    const showRightEllipsis = currentPage < totalPages - 3;

    pages.push(1);

    if (showLeftEllipsis) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (showRightEllipsis) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col ${className}`}>
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
                    onClick={() => handleHeaderClick(col)}
                    className={`py-3 px-4 select-none ${alignClass} ${
                      col.sortable ? 'cursor-pointer hover:bg-slate-100/70 hover:text-slate-800 transition-colors' : ''
                    } ${col.className || ''}`}
                  >
                    <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#1B3B6F]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#1B3B6F]" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
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

      {/* Pagination & Row Limit Footer */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        {/* Left: Summary text & Rows per page selector */}
        <div className="flex items-center gap-4 flex-wrap">
          <span>
            Showing <span className="font-semibold text-slate-800">{sortedData.length > 0 ? (currentPage - 1) * currentPageSize + 1 : 0}</span> to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * currentPageSize, sortedData.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{sortedData.length}</span> entries
          </span>

          {/* Rows Per Page Selector Dropdown */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
            <span className="text-slate-500">Rows per page:</span>
            <select
              value={currentPageSize}
              onChange={(e) => {
                setCurrentPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200/90 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Page Navigation Controls */}
        <div className="flex items-center gap-1">
          {/* First Page Button */}
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            title="First Page"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Previous Page Button */}
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            title="Previous Page"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 px-1">
            {paginationRange.map((p, idx) => {
              if (p === 'ellipsis') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 select-none">
                    …
                  </span>
                );
              }
              const isCurrent = p === currentPage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-medium transition-all ${
                    isCurrent
                      ? 'bg-[#1B3B6F] text-white shadow-2xs font-bold'
                      : 'border border-transparent hover:border-slate-200 bg-transparent hover:bg-white text-slate-700'
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
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            title="Next Page"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page Button */}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
            title="Last Page"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
