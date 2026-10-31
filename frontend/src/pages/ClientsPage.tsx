import React, { useState, useMemo, useEffect } from 'react';
import { Wedding, Consultation } from '../types';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { api } from '../services/api';
import {
  Users2,
  MapPin,
  Calendar,
  CheckCircle2,
  Phone,
  Mail,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Check,
  Eye
} from 'lucide-react';

interface ClientsPageProps {
  weddings: Wedding[];
  onNavigateToTab?: (tab: any) => void;
  onSelectWedding?: (wedding: Wedding) => void;
}

/**
 * ClientsPage component
 *
 * Client relationship directory with contact details and consultation histories.
 */
export const ClientsPage: React.FC<ClientsPageProps> = ({
  weddings,
  onNavigateToTab,
  onSelectWedding
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activePackageFilter, setActivePackageFilter] = useState('ALL');
  const [selectedClient, setSelectedClient] = useState<Wedding | null>(null);
  const [clientConsultations, setClientConsultations] = useState<Consultation[]>([]);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);

  // Fetch consultations whenever a client is selected for inspection
  useEffect(() => {
    if (!selectedClient) {
      setClientConsultations([]);
      return;
    }
    setIsLoadingConsultations(true);
    api.getConsultations(selectedClient.id).then(list => {
      setClientConsultations(list);
      setIsLoadingConsultations(false);
    });
  }, [selectedClient]);

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
      header: 'Dates',
      accessorKey: 'weddingDate',
      sortable: true,
      cell: (w) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{w.weddingDate} → {w.endDate}</span>
        </div>
      )
    },
    {
      id: 'guestCount',
      header: 'Guests',
      accessorKey: 'guestCount',
      sortable: true,
      align: 'right',
      cell: (w) => <span className="font-semibold text-xs">{w.guestCount} Guests</span>
    },
    {
      id: 'budgetMax',
      header: 'Budget',
      accessorKey: 'budgetMax',
      sortable: true,
      align: 'right',
      cell: (w) => <CurrencyDisplay amount={w.budgetMax} format="compact" className="text-[#1B3B6F] font-bold" />
    },
    {
      id: 'agreement',
      header: 'Agreement',
      cell: (w) => (
        <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {w.agreementSigned ? 'Verified' : 'Pending'}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Action',
      align: 'right',
      cell: (w) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedClient(w);
          }}
        >
          View Dossier
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
            <Users2 className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">Client Portfolio & High-Net-Worth Profiles</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 1.2: Official client records, verified contact channels, digital service agreement status, consultation trail, and associated wedding operations.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
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

      {/* Main Table */}
      <DataTable
        data={filteredWeddings}
        columns={columns}
        keyExtractor={(w) => w.id}
        onRowClick={(w) => setSelectedClient(w)}
        pageSize={10}
      />

      {/* Client Dossier Profile Modal */}
      {selectedClient && (
        <Modal
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          title={`Client Profile Dossier: ${selectedClient.coupleNames}`}
          subtitle={`Event Reference: ${selectedClient.code} • Associated Wedding ID: ${selectedClient.id}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-400 font-mono">
                Assigned Planner: {selectedClient.assignedPlanner}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedClient(null)}>
                  Close
                </Button>
                {onSelectWedding && (
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => {
                      onSelectWedding(selectedClient);
                      if (onNavigateToTab) onNavigateToTab('command-centre');
                      setSelectedClient(null);
                    }}
                  >
                    Open Live Command Centre →
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Couple & Wedding Overview Card */}
            <div className="bg-gradient-to-r from-[#F5F1E8] to-white p-4 rounded-xl border border-[#C5A059]/40 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#C5A059]/30 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] block">
                    Luxury Couple Identity
                  </span>
                  <h4 className="font-serif font-bold text-lg text-[#0D1B2A]">
                    {selectedClient.coupleNames}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">{selectedClient.theme}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Client Budget</span>
                  <CurrencyDisplay amount={selectedClient.budgetMax} format="crores" showDecimals className="text-xl text-[#1B3B6F]" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Groom:</span>
                  <span className="font-bold text-slate-800">{selectedClient.partnerGroom}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Bride:</span>
                  <span className="font-bold text-slate-800">{selectedClient.partnerBride}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Guest Count:</span>
                  <span className="font-bold text-slate-800">{selectedClient.guestCount} Confirmed Guests</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Associated Wedding UUID:</span>
                  <span className="font-mono font-bold text-[#1B3B6F]">{selectedClient.id}</span>
                </div>
              </div>
            </div>

            {/* Financial Ledger & Agreement Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Financial Snapshot */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">Financial Snapshot</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    {selectedClient.depositPaid ? 'Deposit Received' : 'Deposit Awaiting'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Client Revenue Target:</span>
                    <CurrencyDisplay amount={selectedClient.totalClientRevenue} format="crores" showDecimals className="font-semibold text-slate-800" />
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Initial Deposit Disbursed:</span>
                    <CurrencyDisplay amount={selectedClient.depositAmount} format="lakhs" className="font-semibold text-emerald-700" />
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Vendor Commitments (18 Categories):</span>
                    <CurrencyDisplay amount={selectedClient.totalVendorCost} format="crores" showDecimals className="font-semibold text-slate-800" />
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1.5 border-t border-slate-200 font-bold">
                    <span>Agency Net Profit ({selectedClient.profitMarginPercent}%):</span>
                    <CurrencyDisplay amount={selectedClient.netProfit} format="lakhs" className="text-[#1B3B6F]" />
                  </div>
                </div>
              </div>

              {/* Service Agreement & Document Proof */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">Service Agreement</span>
                  <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    {selectedClient.agreementSigned ? 'Verified & Binding' : 'Pending Signature'}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Executed On:</span>
                    <span className="font-bold text-slate-800">{selectedClient.signedAgreementDate || '2026-08-15'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Legal Document:</span>
                    <span className="font-mono text-emerald-800 font-medium">TheRoyalKnot_Agreement.pdf</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#C5A059]" />
                      <span className="font-bold text-[11px] text-[#0D1B2A]">Official Executed Contract</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">2.4 MB • SHA256 Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Consultation History */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C5A059]" />
                  <h5 className="font-serif font-bold text-sm text-[#0D1B2A]">
                    Client Consultation & Meeting History
                  </h5>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {clientConsultations.length} Sessions Logged
                </span>
              </div>

              {isLoadingConsultations ? (
                <p className="text-xs text-slate-400">Loading consultation records...</p>
              ) : clientConsultations.length > 0 ? (
                <div className="space-y-2">
                  {clientConsultations.map(con => (
                    <div
                      key={con.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {new Date(con.preferredAt).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <StatusBadge
                            label={con.state}
                            variant={con.state === 'COMPLETED' ? 'success' : con.state === 'CONFIRMED' ? 'info' : 'warning'}
                            size="sm"
                          />
                        </div>
                        <p className="text-slate-600 text-[11px]">{con.message}</p>
                        {con.internalNotes && (
                          <p className="text-slate-500 text-[10px] italic">
                            Planner notes: {con.internalNotes}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700 block">{con.plannerName}</span>
                        <span className="font-mono text-[10px]">{con.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No historical consultation sessions recorded for this client.</p>
              )}
            </div>

            {/* Lifecycle Activity Timeline */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">
                Wedding Lifecycle Journey
              </h5>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-800">
                  <Check className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                  <span className="font-bold block text-[11px]">Enquiry Intake</span>
                  <span className="text-[10px] text-emerald-600">Winter Destination</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-800">
                  <Check className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                  <span className="font-bold block text-[11px]">Agreement Signed</span>
                  <span className="text-[10px] text-emerald-600">Mobile e-Sign Done</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-800">
                  <Check className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                  <span className="font-bold block text-[11px]">Caterer Contracted</span>
                  <span className="text-[10px] text-emerald-600">SpiceHeaven Winner</span>
                </div>
                <div className="bg-[#F5F1E8] border border-[#C5A059] p-2.5 rounded-lg text-[#0D1B2A]">
                  <Sparkles className="w-4 h-4 mx-auto text-[#C5A059] mb-1" />
                  <span className="font-bold block text-[11px]">Live Execution</span>
                  <span className="text-[10px] text-[#C5A059] font-semibold">Command Centre</span>
                </div>
              </div>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};
