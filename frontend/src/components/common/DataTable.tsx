import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No records found matching criteria.',
  pageSize = 10,
  onRowClick,
  className = ''
}: DataTableProps<T>) {
  const [sortColumnId, setSortColumnId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

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

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleHeaderClick = (col: ColumnDef<T>) => {
    if (!col.sortable) return;
    if (sortColumnId === col.id) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumnId(col.id);
      setSortDirection('asc');
    }
  };

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

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{sortedData.length}</span> entries
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
