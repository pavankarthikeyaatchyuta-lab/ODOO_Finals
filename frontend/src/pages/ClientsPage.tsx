import React, { useState, useMemo } from 'react';
import { Wedding } from '../types';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { Users2, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

interface ClientsPageProps {
  weddings: Wedding[];
}

export const ClientsPage: React.FC<ClientsPageProps> = ({ weddings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activePackageFilter, setActivePackageFilter] = useState('ALL');

  const filteredWeddings = useMemo(() => {
    return weddings.filter(w => {
      const matchesSearch =
        w.coupleNames.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activePackageFilter === 'ALL' || w.packageType === activePackageFilter;

      return matchesSearch && matchesFilter;
    });
  }, [weddings, searchQuery, activePackageFilter]);

  const columns: ColumnDef<Wedding>[] = [
    {
      id: 'code',
      header: 'Event Code',
      accessorKey: 'code',
      sortable: true,
      className: 'font-mono text-slate-500 font-bold'
    },
    {
      id: 'couple',
      header: 'Couple & Client Names',
      accessorKey: 'coupleNames',
      sortable: true,
      cell: (w) => (
        <div>
          <span className="font-bold text-[#0D1B2A] text-sm block">{w.coupleNames}</span>
          <span className="text-[11px] text-slate-500">{w.theme}</span>
        </div>
      )
    },
    {
      id: 'location',
      header: 'Venue Hub',
      accessorKey: 'location',
      cell: (w) => (
        <div className="flex items-center gap-1.5 text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
          <span className="truncate max-w-[200px]">{w.location}</span>
        </div>
      )
    },
    {
      id: 'weddingDate',
      header: 'Date',
      accessorKey: 'weddingDate',
      sortable: true,
      cell: (w) => (
        <div className="flex items-center gap-1.5 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{w.weddingDate}</span>
        </div>
      )
    },
    {
      id: 'guestCount',
      header: 'Guests',
      accessorKey: 'guestCount',
      sortable: true,
      align: 'right',
      cell: (w) => <span className="font-semibold">{w.guestCount} Guests</span>
    },
    {
      id: 'budgetMax',
      header: 'Budget',
      accessorKey: 'budgetMax',
      sortable: true,
      align: 'right',
      cell: (w) => <CurrencyDisplay amount={w.budgetMax} format="compact" className="text-[#1B3B6F]" />
    },
    {
      id: 'agreement',
      header: 'Agreement',
      cell: (w) => (
        <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Signed
        </span>
      )
    },
    {
      id: 'status',
      header: 'Lifecycle State',
      cell: (w) => <StatusBadge label={w.status} variant="info" size="sm" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">Client Portfolio & Contracts</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official client records, verified contact channels, digital service agreement status, and authorized family decision-makers.
          </p>
        </div>
      </div>

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search couples, event codes, venues..."
        filters={[
          { key: 'ALL', label: 'All Packages' },
          { key: 'full_service', label: 'Full-Service' },
          { key: 'day_of', label: 'Partial / Day-Of' }
        ]}
        activeFilter={activePackageFilter}
        onFilterChange={setActivePackageFilter}
        filterLabel="Package"
      />

      <DataTable
        data={filteredWeddings}
        columns={columns}
        keyExtractor={(w) => w.id}
        pageSize={10}
      />
    </div>
  );
};
