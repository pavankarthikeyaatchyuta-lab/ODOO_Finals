import React, { useState, useMemo, useEffect } from 'react';
import { Enquiry, Consultation, AgreementDetails } from '../types';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge } from '../components/common/StatusBadge';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { api } from '../services/api';
import {
  MessageSquareHeart,
  Lock,
  Unlock,
  ShieldCheck,
  Phone,
  Mail,
  Plus,
  Sparkles,
  Calendar,
  Clock,
  FileText,
  UploadCloud,
  CheckCircle2,
  Eye
} from 'lucide-react';

interface EnquiriesPageProps {
  enquiries: Enquiry[];
  onSignAgreement: (enquiryId: string) => void;
  onNavigateToTab: (tab: any) => void;
  onRefreshEnquiries?: () => void;
}

export const EnquiriesPage: React.FC<EnquiriesPageProps> = ({
  enquiries,
  onSignAgreement,
  onNavigateToTab,
  onRefreshEnquiries
}) => {
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry>(enquiries[1] || enquiries[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStageFilter, setActiveStageFilter] = useState('ALL');
  
  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);

  // Consultations & Agreement data for selected enquiry
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [agreementDetails, setAgreementDetails] = useState<AgreementDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Form State for New Enquiry
  const [newCouple, setNewCouple] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDate, setNewDate] = useState('2027-01-20');
  const [newGuests, setNewGuests] = useState('400');
  const [newBudget, setNewBudget] = useState('35000000');
  const [newTheme, setNewTheme] = useState('Royal Rajputana Heritage');
  const [newPackage, setNewPackage] = useState<'full_service' | 'day_of'>('full_service');
  const [newSource, setNewSource] = useState<'INSTAGRAM' | 'WHATSAPP' | 'PHONE' | 'REFERRAL'>('INSTAGRAM');
  const [newNotes, setNewNotes] = useState('');

  // Form State for Scheduling Consultation
  const [consultationDate, setConsultationDate] = useState('2026-11-15T15:00');
  const [consultationPlanner, setConsultationPlanner] = useState('Priya Mehra (Lead Luxury Director)');
  const [consultationNotes, setConsultationNotes] = useState('Initial destination alignment & venue feasibility walkthrough.');

  // Form State for Attaching Signed Agreement
  const [attachedFileName, setAttachedFileName] = useState('TRK-Signed-Agreement-Executed.pdf');
  const [signerFullName, setSignerFullName] = useState('');

  // Fetch consultations & agreement whenever selected enquiry changes
  useEffect(() => {
    if (!selectedEnquiry) return;
    setIsLoadingDetails(true);
    Promise.all([
      api.getConsultations(selectedEnquiry.id),
      api.getAgreementDetails(selectedEnquiry.id)
    ]).then(([conList, agr]) => {
      setConsultations(conList);
      setAgreementDetails(agr || null);
      setSignerFullName(selectedEnquiry.coupleName);
      setIsLoadingDetails(false);
    });
  }, [selectedEnquiry]);

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

  // Handler: Create New Enquiry
  const handleCreateNewEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouple || !newPhone) return;

    const created = await api.createEnquiry({
      coupleName: newCouple,
      phone: newPhone,
      email: newEmail || `${newCouple.toLowerCase().replace(/\s+/g, '.')}@wedding.in`,
      targetDate: newDate,
      guestCount: parseInt(newGuests) || 400,
      theme: newTheme,
      budgetMax: parseFloat(newBudget) || 35000000,
      packageType: newPackage,
      source: newSource,
      status: 'NEW',
      assignedPlanner: 'Priya Mehra',
      notes: newNotes || 'Captured via luxury intake consultation form.',
      agreementSigned: false
    });

    if (onRefreshEnquiries) {
      onRefreshEnquiries();
    } else {
      enquiries.unshift(created);
    }
    setSelectedEnquiry(created);
    setIsNewModalOpen(false);
    setNewCouple('');
    setNewPhone('');
    setNewEmail('');
    setNewNotes('');
  };

  // Handler: Schedule Consultation
  const handleScheduleConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry) return;

    const newCon = await api.scheduleConsultation(selectedEnquiry.id, {
      coupleName: selectedEnquiry.coupleName,
      preferredAt: consultationDate,
      plannerName: consultationPlanner,
      message: consultationNotes
    });

    setConsultations(prev => [newCon, ...prev]);
    setSelectedEnquiry(prev => ({
      ...prev,
      status: 'CONSULTATION_SCHEDULED',
      consultationDate: consultationDate.split('T')[0]
    }));
    setIsConsultationModalOpen(false);
  };

  // Handler: Attach Signed Agreement Document
  const handleAttachDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry) return;

    const result = await api.attachSignedAgreement(selectedEnquiry.id, {
      fileName: attachedFileName,
      fileSize: '2.8 MB',
      signerName: signerFullName || selectedEnquiry.coupleName
    });

    setAgreementDetails(result.agreement);
    setSelectedEnquiry(result.enquiry);
    onSignAgreement(selectedEnquiry.id);
    setIsAttachmentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-[#C5A059]" />
            <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
              Enquiry Intake, Consultation & Agreement Gating
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 1.1 & Scenario 1: Luxury client intake pipeline. Enforce signing verification before proprietary vendor RFQs and venue floor plans can be released.
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
                      label={enq.status.replace(/_/g, ' ')}
                      variant={isSigned ? 'success' : 'warning'}
                      size="sm"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{enq.theme}</p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>{enq.guestCount} Guests</span>
                    <CurrencyDisplay amount={enq.budgetMax} format="compact" className="text-[#1B3B6F] font-bold" />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] font-semibold">
                    <span className="text-slate-400 font-mono">Source: {enq.source}</span>
                    {isSigned ? (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-700">
                        <Lock className="w-3 h-3 text-rose-600" />
                        Gated
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
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                      Via {selectedEnquiry.source}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-[#0D1B2A] mt-1">
                    {selectedEnquiry.coupleName}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-[#C5A059]" /> {selectedEnquiry.phone}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-[#C5A059]" /> {selectedEnquiry.email}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase block">Maximum Budget</span>
                  <CurrencyDisplay amount={selectedEnquiry.budgetMax} format="crores" showDecimals className="text-xl text-[#1B3B6F]" />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Assigned: {selectedEnquiry.assignedPlanner}</span>
                </div>
              </div>

              {/* Requirement Fields */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Target Wedding Date:</span>
                  <span className="font-bold text-slate-800">{selectedEnquiry.targetDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Guest Count:</span>
                  <span className="font-bold text-slate-800">{selectedEnquiry.guestCount} Guests</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Design Theme:</span>
                  <span className="font-bold text-slate-800">{selectedEnquiry.theme}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Agreement Status:</span>
                  <span className={`font-bold ${selectedEnquiry.agreementSigned ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {selectedEnquiry.agreementSigned ? 'Verified & Signed' : 'Pending Signature'}
                  </span>
                </div>
              </div>

              {/* First Consultation Notes */}
              <div className="text-xs text-slate-600 bg-[#FBF9F5] p-3.5 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-800 block mb-1">Intake Brief & Preferences:</span>
                {selectedEnquiry.notes}
              </div>

              {/* Consultations History & Scheduling Section */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#C5A059]" />
                    <h4 className="font-serif font-bold text-sm text-[#0D1B2A]">
                      Consultations & Strategy Meetings ({consultations.length})
                    </h4>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Calendar className="w-3.5 h-3.5" />}
                    onClick={() => setIsConsultationModalOpen(true)}
                  >
                    Schedule Consultation
                  </Button>
                </div>

                {isLoadingDetails ? (
                  <div className="p-4 text-center text-xs text-slate-400">Loading consultations...</div>
                ) : consultations.length > 0 ? (
                  <div className="space-y-2">
                    {consultations.map(con => (
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
                          <p className="text-slate-500 text-[11px]">{con.message}</p>
                        </div>
                        <div className="text-right text-[11px] text-slate-500">
                          <span className="block font-medium text-slate-700">{con.plannerName || 'Lead Planner'}</span>
                          <span className="font-mono text-[10px]">{con.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No consultations scheduled yet. Click 'Schedule Consultation' to book a date.
                  </p>
                )}
              </div>

              {/* THE CORE GATING MECHANISM & AGREEMENT INTERFACE */}
              <div className={`p-5 rounded-2xl border transition-all ${
                selectedEnquiry.agreementSigned
                  ? 'bg-emerald-50/40 border-emerald-300'
                  : 'bg-rose-50/30 border-rose-300'
              }`}>
                <div className="space-y-4">
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
                            ? 'Digital Service Agreement: VERIFIED & EXECUTED'
                            : 'Digital Service Agreement: ACCESS GATED (PENDING SIGNATURE)'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600">
                        {selectedEnquiry.agreementSigned
                          ? 'Operational Gate Satisfied: The binding service agreement is confirmed. Proprietary vendor quotes, fee breakdowns, and architectural layouts are completely unlocked.'
                          : 'Operational Rule Enforced: In accordance with The Royal Knot policies, proprietary vendor shortlist pricing and 3D palace layouts are strictly gated until a mutual service agreement is executed.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setIsAgreementModalOpen(true)}
                      >
                        Preview Agreement
                      </Button>

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
                          leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                          onClick={() => setIsAttachmentModalOpen(true)}
                        >
                          Attach / Execute Agreement
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Agreement Audit & Attachment Proof (if signed) */}
                  {selectedEnquiry.agreementSigned && agreementDetails && (
                    <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-emerald-600 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0D1B2A]">
                              {agreementDetails.signedDocumentName || 'Executed-Agreement.pdf'}
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                              {agreementDetails.signedDocumentSize || '2.4 MB'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Authenticated by: {agreementDetails.clientSignerName || selectedEnquiry.coupleName} • {agreementDetails.clientSignerIp || 'Aadhaar e-Sign Verified'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Legally Enforceable
                        </span>
                      </div>
                    </div>
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

      {/* MODAL 1: Capture New Couple Enquiry */}
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
            <FormField label="Target Wedding Date" required>
              <Input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
              />
            </FormField>

            <FormField label="Guest Count (Minimum 400 for Full-Service)" required>
              <Input
                type="number"
                placeholder="400"
                value={newGuests}
                onChange={e => setNewGuests(e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Maximum Budget (INR)" required>
              <Input
                type="number"
                placeholder="35000000"
                value={newBudget}
                onChange={e => setNewBudget(e.target.value)}
              />
            </FormField>

            <FormField label="Enquiry Source">
              <Select
                value={newSource}
                onChange={e => setNewSource(e.target.value as any)}
                options={[
                  { value: 'INSTAGRAM', label: 'Instagram (Luxury Campaign)' },
                  { value: 'WHATSAPP', label: 'WhatsApp Direct Concierge' },
                  { value: 'PHONE', label: 'Phone / Palace Reception' },
                  { value: 'REFERRAL', label: 'Client / High-Net-Worth Referral' }
                ]}
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

          <FormField label="Consultation Brief & Special Requirements">
            <Input
              placeholder="e.g. Requires pure Jain culinary station, lake-facing Baraat arrival..."
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
            />
          </FormField>
        </form>
      </Modal>

      {/* MODAL 2: Schedule Consultation */}
      <Modal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        title="Schedule Planning Consultation"
        subtitle={`Book calendar slot for ${selectedEnquiry?.coupleName}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsConsultationModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleScheduleConsultation}>
              Confirm & Book Slot
            </Button>
          </>
        }
      >
        <form onSubmit={handleScheduleConsultation} className="space-y-3.5">
          <FormField label="Date and Preferred Time" required>
            <Input
              type="datetime-local"
              value={consultationDate}
              onChange={e => setConsultationDate(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Lead Director / Assigned Planner" required>
            <Select
              value={consultationPlanner}
              onChange={e => setConsultationPlanner(e.target.value)}
              options={[
                { value: 'Priya Mehra (Lead Luxury Director)', label: 'Priya Mehra (Lead Luxury Director)' },
                { value: 'Devendra Kaviraj (Senior Heritage Planner)', label: 'Devendra Kaviraj (Senior Heritage Planner)' },
                { value: 'Siddharth Jain (Vendor Operations Head)', label: 'Siddharth Jain (Vendor Operations Head)' }
              ]}
            />
          </FormField>

          <FormField label="Meeting Agenda & Venue Notes">
            <Input
              value={consultationNotes}
              onChange={e => setConsultationNotes(e.target.value)}
              placeholder="e.g. Review palace site inspection schedule and initial catering estimates."
            />
          </FormField>

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800">
            <strong>Conflict Prevention Rule:</strong> Overlapping consultations for the same lead planner are strictly prohibited by system scheduling logic.
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Agreement Preview */}
      <Modal
        isOpen={isAgreementModalOpen}
        onClose={() => setIsAgreementModalOpen(false)}
        title="The Royal Knot — Client Service Agreement Preview"
        subtitle={`Legal contract terms for ${selectedEnquiry?.coupleName}`}
        footer={
          <Button variant="secondary" size="sm" onClick={() => setIsAgreementModalOpen(false)}>
            Close Preview
          </Button>
        }
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="bg-[#F5F1E8] p-4 rounded-xl border border-[#C5A059]/40 space-y-2">
            <div className="flex justify-between items-center border-b border-[#C5A059]/30 pb-2">
              <span className="font-serif font-bold text-base text-[#0D1B2A]">The Royal Knot Luxury Planning Agreement</span>
              <span className="text-[11px] font-mono text-slate-500">Ref: TRK-AGR-2026</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><strong>Client:</strong> {selectedEnquiry?.coupleName}</div>
              <div><strong>Service Package:</strong> Full-Service Luxury Planning</div>
              <div><strong>Event Location:</strong> Jaipur / Udaipur Luxury Heritage Palaces</div>
              <div><strong>Total Planning Fee:</strong> ₹35,00,000 (INR 35 Lakhs)</div>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Milestone Payment Schedule</h5>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Milestone 1 (Deposit):</span>
                <span className="font-bold text-slate-800">₹10,00,000</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Upon Agreement Execution</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Milestone 2 (Advance):</span>
                <span className="font-bold text-slate-800">₹15,00,000</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">60 Days Prior to Event</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Milestone 3 (Final):</span>
                <span className="font-bold text-slate-800">₹10,00,000</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Post-Event Reconciliation</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <h5 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">Standard Operating Covenants</h5>
            <p>1. Proprietary shortlists, trade discounts, and vendor quotes are intellectual property of The Royal Knot and may only be released following mutual agreement execution.</p>
            <p>2. A minimum of 18 dedicated vendor categories will be audited, managed, and monitored via the Live Command Centre.</p>
            <p>3. Cancellations within 30 days are subject to standard forfeiture of preliminary advances.</p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-slate-500 text-[11px]">
            <span>Current Status: <strong className="text-slate-800">{selectedEnquiry?.agreementSigned ? 'Executed & Verified' : 'Awaiting Signature'}</strong></span>
            <span>Digital ID: TRK-DOC-2026-X77</span>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Attach / Execute Signed Agreement */}
      <Modal
        isOpen={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        title="Execute Agreement & Attach Signed Document"
        subtitle={`Verify executed service contract for ${selectedEnquiry?.coupleName}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAttachmentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleAttachDocument}>
              Verify & Unlock Vendor Quotes
            </Button>
          </>
        }
      >
        <form onSubmit={handleAttachDocument} className="space-y-4">
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
            <strong>Audit Compliance Requirement:</strong>
            <p>Agreements must never be marked as signed without explicit user confirmation and document attachment. Attaching the document unlocks vendor pricing across all portals.</p>
          </div>

          <FormField label="Signer Full Name (Client Authority)" required>
            <Input
              value={signerFullName}
              onChange={e => setSignerFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
            />
          </FormField>

          <FormField label="Signed Agreement Document (PDF Attachment)" required>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer">
              <UploadCloud className="w-8 h-8 text-[#C5A059] mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700">Click to upload or drag & drop executed PDF</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF up to 25 MB with digital signatures</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-700">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>{attachedFileName}</span>
              </div>
            </div>
          </FormField>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Verification Method:</span>
              <strong className="text-slate-800">OTP / Aadhaar Mobile e-Sign</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Audit IP Timestamp:</span>
              <strong className="font-mono text-slate-800">103.211.54.12 • {new Date().toLocaleDateString('en-IN')}</strong>
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
};
