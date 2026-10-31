import React, { useState, useMemo } from 'react';
import { Store, Star, Phone } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { DataTable, ColumnDef } from '../components/common/DataTable';

interface VendorItem {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  punctuality: string;
  status: string;
  contact: string;
}

export const VendorsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const vendorList: VendorItem[] = [
    { id: 'v-01', name: 'SpiceHeaven Royal Caterers', category: 'CATERING', location: 'Jaipur & Udaipur', rating: 4.9, punctuality: '98%', status: 'CONTRACTED', contact: 'Chef Raghvendra Singh (+91 98290 55443)' },
    { id: 'v-02', name: 'Mewar Gourmet Kitchen', category: 'CATERING', location: 'Udaipur', rating: 4.6, punctuality: '92%', status: 'STANDBY', contact: 'Kailash Meena (+91 98291 22334)' },
    { id: 'v-03', name: 'Jaipur Floral Arts & Decor', category: 'DECOR', location: 'Jaipur', rating: 4.8, punctuality: '95%', status: 'CONTRACTED', contact: 'Harsh Vardhan (+91 94140 12345)' },
    { id: 'v-04', name: 'DJ Shadow & Sound Rig', category: 'SOUND', location: 'Mumbai & Udaipur', rating: 4.5, punctuality: '88%', status: 'ACTIVE_LATE', contact: 'Sunny K (+91 98200 99881)' },
    { id: 'v-05', name: 'Stories by Joseph Radhik', category: 'PHOTOGRAPHY', location: 'Pan-India', rating: 5.0, punctuality: '100%', status: 'CONTRACTED', contact: 'Mohit Rao (+91 98199 00112)' },
    { id: 'v-06', name: 'Royal Nagada Drummers & Shehnai', category: 'FOLK_MUSIC', location: 'Udaipur', rating: 4.9, punctuality: '96%', status: 'CONTRACTED', contact: 'Ustad Banne Khan (+91 94141 88990)' }
  ];

  const categories = [
    { key: 'ALL', label: 'All Categories' },
    { key: 'CATERING', label: 'Catering' },
    { key: 'DECOR', label: 'Decor' },
    { key: 'SOUND', label: 'Sound & DJ' },
    { key: 'PHOTOGRAPHY', label: 'Photography' },
    { key: 'FOLK_MUSIC', label: 'Folk Music' }
  ];

  const filtered = useMemo(() => {
    return vendorList.filter(v => {
      const matchesSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.contact.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'ALL' || v.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [vendorList, searchQuery, selectedCategory]);

  const columns: ColumnDef<VendorItem>[] = [
    {
      id: 'name',
      header: 'Vendor Name & Hub',
      accessorKey: 'name',
      sortable: true,
      cell: (v) => (
        <div>
          <span className="font-serif font-bold text-sm text-[#0D1B2A] block">{v.name}</span>
          <span className="text-[11px] text-slate-500">{v.location}</span>
        </div>
      )
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (v) => (
        <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-md uppercase">
          {v.category}
        </span>
      )
    },
    {
      id: 'rating',
      header: 'Reliability Rating',
      accessorKey: 'rating',
      sortable: true,
      cell: (v) => (
        <div className="flex items-center gap-1 font-bold text-slate-800">
          <Star className="w-3.5 h-3.5 fill-[#C5A059] text-[#C5A059]" />
          <span>{v.rating} / 5.0</span>
        </div>
      )
    },
    {
      id: 'punctuality',
      header: 'On-Time Rate',
      accessorKey: 'punctuality',
      sortable: true,
      cell: (v) => (
        <span className="font-mono font-bold text-emerald-700">{v.punctuality}</span>
      )
    },
    {
      id: 'contact',
      header: 'Verified POC Contact',
      cell: (v) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{v.contact}</span>
        </div>
      )
    },
    {
      id: 'status',
      header: 'Status',
      cell: (v) => (
        <StatusBadge
          label={v.status}
          variant={v.status === 'ACTIVE_LATE' ? 'danger' : 'success'}
          size="sm"
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Vendor Directory & Reliability Scorecards
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 1.2: The Royal Knot maintains ~18 different vendor categories (caterers, decorators, drummers, sound, pyrotechnics) with verified on-time ratings.
          </p>
        </div>
      </div>

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search vendor names, categories, POC contacts..."
        filters={categories}
        activeFilter={selectedCategory}
        onFilterChange={setSelectedCategory}
        filterLabel="Category"
      />

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(v) => v.id}
        pageSize={10}
      />
    </div>
  );
};
