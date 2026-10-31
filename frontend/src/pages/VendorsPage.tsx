import React, { useState, useMemo, useEffect } from 'react';
import { Store, Star, Phone, Mail, MapPin, Award, AlertTriangle, Plus, Eye, CheckCircle2, History } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { VendorProfile } from '../types';
import { api } from '../services/api';

/**
 * VendorsPage component
 *
 * Curated luxury vendor directory across catering, decor, photography, and sound.
 */
export const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Modals
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Vendor Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Catering & Beverages');
  const [newLocation, setNewLocation] = useState('Jaipur');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSpecialties, setNewSpecialties] = useState('');
  const [newPriceRange, setNewPriceRange] = useState('₹1,500 – ₹2,500 / Plate');

  useEffect(() => {
    async function loadVendors() {
      setIsLoading(true);
      const list = await api.getVendorProfiles();
      setVendors(list);
      setIsLoading(false);
    }
    loadVendors();
  }, []);

  const categories = [
    { key: 'ALL', label: 'All Categories' },
    { key: 'Catering & Beverages', label: 'Catering & Beverages' },
    { key: 'Floral & Mandap Styling', label: 'Floral & Mandap' },
    { key: 'DJ & Sound Acoustics', label: 'Sound & Acoustics' },
    { key: 'Photography & Cinematography', label: 'Photography' },
    { key: 'Traditional Folk & Baraat', label: 'Traditional Folk' }
  ];

  const filtered = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.phone.includes(searchQuery);

      const matchesCat = selectedCategory === 'ALL' || v.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [vendors, searchQuery, selectedCategory]);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newContactPerson || !newPhone) return;

    const created = await api.createVendorProfile({
      name: newName,
      category: newCategory,
      location: newLocation,
      rating: 5.0,
      punctuality: '100%',
      status: 'AVAILABLE',
      contactPerson: newContactPerson,
      phone: newPhone,
      email: newEmail || `${newContactPerson.toLowerCase().replace(/\s+/g, '.')}@vendor.in`,
      specialties: newSpecialties.split(',').map(s => s.trim()).filter(Boolean),
      priceRange: newPriceRange,
      incidentCount: 0,
      pastWeddings: []
    });

    setVendors(prev => [created, ...prev]);
    setSelectedVendor(created);
    setIsAddModalOpen(false);

    // Reset Form
    setNewName('');
    setNewContactPerson('');
    setNewPhone('');
    setNewEmail('');
    setNewSpecialties('');
  };

  const columns: ColumnDef<VendorProfile>[] = [
    {
      id: 'name',
      header: 'Vendor Name & Hub',
      accessorKey: 'name',
      sortable: true,
      cell: (v) => (
        <div>
          <span className="font-serif font-bold text-sm text-[#0D1B2A] block">{v.name}</span>
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-[#C5A059]" /> {v.location}
          </span>
        </div>
      )
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (v) => (
        <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-1 rounded-md uppercase tracking-wider">
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
        <div className="flex items-center gap-1 font-bold text-slate-800 text-xs">
          <Star className="w-3.5 h-3.5 fill-[#C5A059] text-[#C5A059]" />
          <span>{v.rating.toFixed(1)} / 5.0</span>
        </div>
      )
    },
    {
      id: 'punctuality',
      header: 'On-Time Rate',
      accessorKey: 'punctuality',
      sortable: true,
      cell: (v) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">{v.punctuality}</span>
      )
    },
    {
      id: 'incidents',
      header: 'Historical Incidents',
      accessorKey: 'incidentCount',
      sortable: true,
      align: 'center',
      cell: (v) => (
        v.incidentCount === 0 ? (
          <span className="text-emerald-700 font-bold text-xs">0 (Zero)</span>
        ) : (
          <span className="text-rose-700 font-bold text-xs flex items-center justify-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            {v.incidentCount} logged
          </span>
        )
      )
    },
    {
      id: 'contact',
      header: 'Verified POC Contact',
      cell: (v) => (
        <div className="text-xs text-slate-600 space-y-0.5">
          <div className="font-medium text-slate-800">{v.contactPerson}</div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{v.phone}</span>
          </div>
        </div>
      )
    },
    {
      id: 'status',
      header: 'Status',
      cell: (v) => (
        <StatusBadge
          label={v.status}
          variant={v.status === 'ACTIVE_LATE' ? 'danger' : v.status === 'STANDBY' ? 'warning' : 'success'}
          size="sm"
        />
      )
    },
    {
      id: 'action',
      header: 'Scorecard',
      align: 'right',
      cell: (v) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedVendor(v);
          }}
        >
          View Profile
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Vendor Directory & Reliability Scorecards
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 1.2: The Royal Knot coordinates approximately 18 vendor categories per wedding (caterers, decorators, drummers, sound, pyrotechnics) with verified on-time performance and incident logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add New Vendor
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search vendor names, categories, POC contacts, phones..."
        filters={categories}
        activeFilter={selectedCategory}
        onFilterChange={setSelectedCategory}
        filterLabel="Category"
      />

      {/* Main Vendor Data Table */}
      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(v) => v.id}
        onRowClick={(v) => setSelectedVendor(v)}
        pageSize={10}
      />

      {/* MODAL 1: Vendor Profile & Performance Scorecard */}
      {selectedVendor && (
        <Modal
          isOpen={!!selectedVendor}
          onClose={() => setSelectedVendor(null)}
          title={`Vendor Profile: ${selectedVendor.name}`}
          subtitle={`Category: ${selectedVendor.category} • Location: ${selectedVendor.location}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-400 font-mono">Vendor ID: {selectedVendor.id}</span>
              <Button variant="secondary" size="sm" onClick={() => setSelectedVendor(null)}>
                Close Scorecard
              </Button>
            </div>
          }
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Header & Reliability Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#F5F1E8] p-3 rounded-xl border border-[#C5A059]/40 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Overall Rating</span>
                <div className="flex items-center justify-center gap-1 mt-1 text-[#0D1B2A] font-bold text-lg">
                  <Star className="w-4 h-4 fill-[#C5A059] text-[#C5A059]" />
                  <span>{selectedVendor.rating.toFixed(1)} / 5.0</span>
                </div>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">On-Time Rate</span>
                <span className="font-mono font-bold text-emerald-800 text-lg block mt-1">
                  {selectedVendor.punctuality}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Past Weddings</span>
                <span className="font-bold text-slate-800 text-lg block mt-1">
                  {selectedVendor.pastWeddings?.length || 0} Events
                </span>
              </div>

              <div className={`p-3 rounded-xl border text-center ${
                selectedVendor.incidentCount === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Incident Record</span>
                <span className="font-bold text-lg block mt-1">
                  {selectedVendor.incidentCount} {selectedVendor.incidentCount === 1 ? 'Incident' : 'Incidents'}
                </span>
              </div>
            </div>

            {/* Contact & Commercial Terms */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">
                  Contact Channels & Pricing Model
                </span>
                <span className="text-[11px] font-mono text-[#C5A059] font-bold bg-[#C5A059]/10 px-2 py-0.5 rounded">
                  {selectedVendor.priceRange}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Primary Representative:</span>
                  <span className="font-bold text-slate-800">{selectedVendor.contactPerson}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Direct Phone:</span>
                  <span className="font-mono font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-[#C5A059]" /> {selectedVendor.phone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address:</span>
                  <span className="font-mono text-slate-800 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-[#C5A059]" /> {selectedVendor.email}
                  </span>
                </div>
              </div>

              {/* Specialties */}
              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Specialties & Signature Offerings:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedVendor.specialties?.map((spec, idx) => (
                    <span
                      key={idx}
                      className="bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-md text-[11px]"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Past Wedding Associations & Reviews */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#C5A059]" />
                <h5 className="font-serif font-bold text-sm text-[#0D1B2A]">
                  Past Wedding Associations & Performance Reviews
                </h5>
              </div>

              {selectedVendor.pastWeddings && selectedVendor.pastWeddings.length > 0 ? (
                <div className="space-y-2">
                  {selectedVendor.pastWeddings.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{item.weddingCode}</span>
                          <span className="text-slate-500 font-semibold">• {item.coupleNames}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            Season {item.seasonYear}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-[#C5A059]">
                          <Star className="w-3.5 h-3.5 fill-[#C5A059]" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-[11px] italic bg-[#FBF9F5] p-2 rounded-lg border border-slate-100 mt-1">
                        "{item.performanceReview}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  New vendor in directory. No past wedding association history on record yet.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: Add New Vendor to Directory */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Vendor to Directory"
        subtitle="Onboard a verified luxury service partner for Jaipur & Udaipur weddings"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleCreateVendor}>
              Save & Register Vendor
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateVendor} className="space-y-3.5">
          <FormField label="Vendor Business Name" required>
            <Input
              placeholder="e.g. Royal Marwar Catering Services"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category" required>
              <Select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                options={[
                  { value: 'Catering & Beverages', label: 'Catering & Beverages' },
                  { value: 'Floral & Mandap Styling', label: 'Floral & Mandap Styling' },
                  { value: 'DJ & Sound Acoustics', label: 'DJ & Sound Acoustics' },
                  { value: 'Photography & Cinematography', label: 'Photography & Cinematography' },
                  { value: 'Traditional Folk & Baraat', label: 'Traditional Folk & Baraat' },
                  { value: 'Guest Transport & Fleet', label: 'Guest Transport & Fleet' }
                ]}
              />
            </FormField>

            <FormField label="Location Hub" required>
              <Select
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                options={[
                  { value: 'Jaipur', label: 'Jaipur' },
                  { value: 'Udaipur', label: 'Udaipur' },
                  { value: 'Jaipur & Udaipur Hubs', label: 'Jaipur & Udaipur Hubs' },
                  { value: 'Pan-India / International', label: 'Pan-India' }
                ]}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Verified POC Contact Person" required>
              <Input
                placeholder="e.g. Vikramaditya Rathore"
                value={newContactPerson}
                onChange={e => setNewContactPerson(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Contact Phone" required>
              <Input
                placeholder="+91 98290 00000"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact Email">
              <Input
                type="email"
                placeholder="contact@royalvendor.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
            </FormField>

            <FormField label="Standard Price Range">
              <Input
                placeholder="₹1,800 – ₹2,500 / Plate"
                value={newPriceRange}
                onChange={e => setNewPriceRange(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Specialties (comma-separated)">
            <Input
              placeholder="e.g. Ker Sangri, Live Charcoal Daal Baati, Silver Butler Service"
              value={newSpecialties}
              onChange={e => setNewSpecialties(e.target.value)}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
};
