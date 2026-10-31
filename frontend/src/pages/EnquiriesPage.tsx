import React, { useState, useMemo } from 'react';
import { Enquiry } from '../types';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import {
  MessageSquareHeart,
  Lock,
  Unlock,
  ShieldCheck,
  Phone,
  Mail,
  Plus,
  Sparkles
} from 'lucide-react';

interface EnquiriesPageProps {
  enquiries: Enquiry[];
  onSignAgreement: (enquiryId: string) => void;
  onNavigateToTab: (tab: any) => void;
  onCreateEnquiry?: (newEnquiry: Partial<Enquiry>) => void;
}

export const EnquiriesPage: React.FC<EnquiriesPageProps> = ({
  enquiries,
  onSignAgreement,
  onNavigateToTab
}) => {
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry>(enquiries[1] || enquiries[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStageFilter, setActiveStageFilter] = useState('ALL');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form State for New Enquiry Modal
  const [newCouple, setNewCouple] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGuests, setNewGuests] = useState('400');
  const [newBudget, setNewBudget] = useState('35000000');
  const [newTheme, setNewTheme] = useState('Royal Rajputana Heritage');
  const [newPackage, setNewPackage] = useState<'full_service' | 'day_of'>('full_service');

  const stageFilters = [
    { key: 'ALL', label: 'All Enquiries' },
    { key: 'NEW', label: 'New' },
    { key: 'CONSULTATION_SCHEDULED', label: 'Consultation' },
    { key: 'AGREEMENT_SIGNED', label: 'Signed' },
    { key: 'CONFIRMED', label: 'Confirmed' }
  ];

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(enq => {
      const matchesSearch =
        enq.coupleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enq.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enq.phone.includes(searchQuery);

      const matchesFilter =
        activeStageFilter === 'ALL' || enq.status === activeStageFilter;

      return matchesSearch && matchesFilter;
    });
  }, [enquiries, searchQuery, activeStageFilter]);

  const handleCreateNewEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouple || !newPhone) return;

    const created: Enquiry = {
      id: `enq-${Date.now().toString().slice(-3)}`,
      coupleName: newCouple,
      phone: newPhone,
      email: newEmail || `${newCouple.toLowerCase().replace(/\s+/g, '.')}@wedding.in`,
      targetDate: '2027-01-18',
      guestCount: parseInt(newGuests) || 400,
      theme: newTheme,
      budgetMax: parseFloat(newBudget) || 35000000,
      packageType: newPackage,
      source: 'PHONE',
      status: 'NEW',
      assignedPlanner: 'Priya Mehra',
      notes: 'Captured via First Consultation intake form.',
      agreementSigned: false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    enquiries.unshift(created);
    setSelectedEnquiry(created);
    setIsNewModalOpen(false);
    setNewCouple('');
    setNewPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Enquiry Capture & Digital Agreement Gating
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scenario 1: Couple captures winter destination wedding details (date, 400 guests, theme, budget). Service agreement must be signed before vendor lists or floor plans are shared.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsNewModalOpen(true)}
          >
            New Wedding Enquiry
          </Button>
        </div>
      </div>

      {/* Real-time Search and Filter Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search couples, themes, phone numbers..."
        filters={stageFilters}
        activeFilter={activeStageFilter}
        onFilterChange={setActiveStageFilter}
        filterLabel="Pipeline Stage"
      />

      {/* Grid: Enquiry List (Left) + Detail & Agreement Gate (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Enquiries Pipeline List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-serif font-bold text-sm text-[#0D1B2A]">
              Filtered Enquiries ({filteredEnquiries.length})
            </h3>
            <span className="text-[11px] text-slate-400">Jaipur & Udaipur</span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredEnquiries.map(enq => {
              const isSelected = selectedEnquiry?.id === enq.id;
              const isSigned = enq.agreementSigned;

              return (
                <div
                  key={enq.id}
                  onClick={() => setSelectedEnquiry(enq)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#C5A059] bg-[#F5F1E8]/40 ring-1 ring-[#C5A059]/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-[#0D1B2A]">{enq.coupleName}</h4>
                    <StatusBadge
                      label={enq.status.replace('_', ' ')}
                      variant={isSigned ? 'success' : 'warning'}
                      size="sm"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1">{enq.theme}</p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>{enq.guestCount} Guests</span>
                    <CurrencyDisplay amount={enq.budgetMax} format="compact" className="text-[#1B3B6F]" />
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold">
                    {isSigned ? (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        Agreement Signed (Unlocked)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-700">
                        <Lock className="w-3 h-3 text-rose-600" />
                        Vendors Gated (Unsigned)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredEnquiries.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                No matching enquiries found.
              </div>
            )}
          </div>
        </div>

        {/* Selected Enquiry Detailed Dossier & Agreement Gate */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEnquiry ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 font-bold">{selectedEnquiry.id}</span>
                    <StatusBadge label={selectedEnquiry.packageType.replace('_', ' ')} variant="info" size="sm" />
                  </div>
                  <h3 className="font-serif font-bold text-xl text-[#0D1B2A] mt-1">
                    {selectedEnquiry.coupleName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedEnquiry.phone}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedEnquiry.email}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase block">Maximum Budget</span>
                  <CurrencyDisplay amount={selectedEnquiry.budgetMax} format="crores" showDecimals className="text-xl text-[#1B3B6F]" />
                </div>
              </div>

              {/* Requirement Fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Target Date:</span>
                  <span className="font-bold text-slate-800">{selectedEnquiry.targetDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Guest Count:</span>
                  <span className="font-bold text-slate-800">{selectedEnquiry.guestCount} Guests</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Design Theme:</span>
                  <span className="font-bold text-slate-800">{selectedEnquiry.theme}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Planner:</span>
                  <span className="font-bold text-[#1B3B6F]">{selectedEnquiry.assignedPlanner}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="text-xs text-slate-600 bg-[#FBF9F5] p-3.5 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-800 block mb-1">First Consultation Brief:</span>
                {selectedEnquiry.notes}
              </div>

              {/* THE CORE GATING MECHANISM */}
              <div className={`p-5 rounded-2xl border transition-all ${
                selectedEnquiry.agreementSigned
                  ? 'bg-emerald-50/40 border-emerald-300'
                  : 'bg-rose-50/30 border-rose-300'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {selectedEnquiry.agreementSigned ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Lock className="w-5 h-5 text-rose-600" />
                      )}
                      <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">
                        {selectedEnquiry.agreementSigned
                          ? 'Digital Service Agreement: SIGNED & VERIFIED'
                          : 'Digital Service Agreement: PENDING SIGNATURE (ACCESS GATED)'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600">
                      {selectedEnquiry.agreementSigned
                        ? 'The digital service agreement has been authenticated via mobile e-signature. Vendor shortlists, pricing RFQs, and floor plan layouts are unlocked.'
                        : 'Rule Enforced: Proprietary vendor databases and custom venue floor plans remain strictly locked until the client digitally signs the agreement.'}
                    </p>
                  </div>

                  {selectedEnquiry.agreementSigned ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onNavigateToTab('quotations')}
                    >
                      View Unlocked Quotes →
                    </Button>
                  ) : (
                    <Button
                      variant="gold"
                      size="sm"
                      leftIcon={<Sparkles className="w-4 h-4" />}
                      onClick={() => onSignAgreement(selectedEnquiry.id)}
                    >
                      Simulate Mobile E-Signature
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select an enquiry to review details.
            </div>
          )}
        </div>

      </div>

      {/* New Enquiry Intake Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Capture New Couple Enquiry"
        subtitle="Record first consultation requirements for winter luxury destination wedding"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleCreateNewEnquiry}>
              Save & Create Enquiry
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateNewEnquiry} className="space-y-3.5">
          <FormField label="Couple Names" required>
            <Input
              placeholder="e.g. Siddharth Malhotra & Kiara Advani"
              value={newCouple}
              onChange={e => setNewCouple(e.target.value)}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact Phone" required>
              <Input
                placeholder="+91 98290 00000"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Contact Email">
              <Input
                type="email"
                placeholder="couple@weddings.in"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Guest Count" required>
              <Input
                type="number"
                placeholder="400"
                value={newGuests}
                onChange={e => setNewGuests(e.target.value)}
              />
            </FormField>

            <FormField label="Maximum Budget (INR)" required>
              <Input
                type="number"
                placeholder="35000000"
                value={newBudget}
                onChange={e => setNewBudget(e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Preferred Theme">
              <Select
                value={newTheme}
                onChange={e => setNewTheme(e.target.value)}
                options={[
                  { value: 'Royal Rajputana Heritage', label: 'Royal Rajputana Heritage' },
                  { value: 'Floating Island Palace Elegance', label: 'Floating Palace Elegance' },
                  { value: 'Vintage Marwar Royal Durbar', label: 'Vintage Marwar Durbar' },
                  { value: 'Contemporary Twilight Palace Chic', label: 'Twilight Palace Chic' }
                ]}
              />
            </FormField>

            <FormField label="Package Selected">
              <Select
                value={newPackage}
                onChange={e => setNewPackage(e.target.value as any)}
                options={[
                  { value: 'full_service', label: 'Full-Service Wedding' },
                  { value: 'day_of', label: 'Partial / Day-Of Coordination' }
                ]}
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
};
