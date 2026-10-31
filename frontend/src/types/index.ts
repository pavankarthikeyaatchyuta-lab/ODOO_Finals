// ==========================================
// THE ROYAL KNOT - TYPE DEFINITIONS
// Standalone Wedding Operations & Financial System
// ==========================================

export type PackageType = 'full_service' | 'day_of';

export type WeddingStatus = 
  | 'ENQUIRY'
  | 'PROPOSAL_SENT'
  | 'AGREEMENT_SIGNED'
  | 'CONFIRMED'
  | 'IN_PLANNING'
  | 'EXECUTION'
  | 'RECONCILED'
  | 'CLOSED';

export type QuoteStatus = 'DRAFT' | 'SUBMITTED' | 'SELECTED' | 'REJECTED';

export type TaskStage = 'TO_PLAN' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type ArrivalStatus = 'EXPECTED' | 'CHECKED_IN' | 'LATE';

export type AckStatus = 'SENT' | 'ACKNOWLEDGED' | 'PROBLEM';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export type ChangeOrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type SettlementStatus = 'PENDING' | 'RECONCILED' | 'PAID';

// --- Wedding Master Record ---
export interface Wedding {
  id: string;
  code: string; // e.g. "WED-2026-001"
  coupleNames: string;
  partnerBride: string;
  partnerGroom: string;
  weddingDate: string; // "2026-12-22"
  endDate: string;
  location: string; // "City Palace & Jagmandir, Udaipur"
  guestCount: number; // 400
  budgetMax: number; // in INR
  packageType: PackageType;
  status: WeddingStatus;
  theme: string; // "Royal Heritage Rajputana"
  assignedPlanner: string;
  agreementSigned: boolean;
  signedAgreementDate?: string;
  signedAgreementPdfUrl?: string;
  depositPaid: boolean;
  depositAmount: number;
  totalClientRevenue: number;
  totalVendorCost: number;
  totalLaborCost: number;
  netProfit: number;
  profitMarginPercent: number;
}

// --- Enquiry Record ---
export interface Enquiry {
  id: string;
  coupleName: string;
  phone: string;
  email: string;
  targetDate: string;
  guestCount: number;
  theme: string;
  budgetMax: number;
  packageType: PackageType;
  source: 'INSTAGRAM' | 'WHATSAPP' | 'PHONE' | 'REFERRAL';
  status: 'NEW' | 'CONTACTED' | 'CONSULTATION_SCHEDULED' | 'PROPOSAL_SENT' | 'AGREEMENT_SIGNED' | 'CONFIRMED';
  consultationDate?: string;
  assignedPlanner: string;
  notes: string;
  agreementSigned: boolean;
  createdAt: string;
}

// --- Vendor & Quotation Records ---
export interface CatererQuote {
  id: string;
  weddingId: string;
  vendorId: string;
  vendorName: string;
  category: 'CATERING' | 'DECOR' | 'DJ_SOUND' | 'PHOTOGRAPHY' | 'HOSPITALITY';
  pricePerPlate: number;
  guestCount: number;
  foodBaseCost: number;
  extraHourRate: number;
  additionalCharges: number;
  taxAmount: number; // 18% GST
  totalAmount: number;
  status: QuoteStatus;
  menuSpecialties: string[];
  liveCountersCount: number;
  inclusions: string[];
  exclusions: string[];
  submittedDate: string;
}

// --- Automated Planning Tasks ---
export interface WeddingTask {
  id: string;
  weddingId: string;
  title: string;
  category: 'VENUE' | 'DESIGN' | 'VENDORS' | 'MEHENDI' | 'SANGEET' | 'PHERAS' | 'RECEPTION' | 'CLEANUP';
  owner: string;
  dueDate: string;
  stage: TaskStage;
  isKeyMilestone: boolean;
  packageScope: 'ALL' | 'FULL_SERVICE_ONLY';
}

// --- Live Command Centre: Run Sheet Timeline ---
export interface RunSheetItem {
  id: string;
  weddingId: string;
  functionName: string; // "Varmala Ceremony"
  activityName: string; // "Groom Baraat Arrival & Toran"
  plannedStartTime: string; // "17:00"
  plannedEndTime: string; // "17:45"
  actualStartTime?: string;
  actualEndTime?: string;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  location: string;
  responsiblePerson: string;
  linkedVendorIds: string[];
  vendorNames: string[];
}

// --- Vendor Arrival Check-in Cockpit ---
export interface VendorArrival {
  id: string;
  weddingId: string;
  vendorName: string;
  category: string;
  contactPerson: string;
  phone: string;
  expectedArrivalTime: string; // "16:00"
  actualArrivalTime?: string; // "16:45"
  status: ArrivalStatus;
  isLate: boolean;
  notes?: string;
}

// --- Closed-Loop Delay Coordination (Core Differentiator) ---
export interface AffectedVendorInstruction {
  vendorId: string;
  vendorName: string;
  category: string;
  phone: string;
  instruction: string; // e.g. "Hold holding ambient music until 19:40"
  status: AckStatus; // SENT -> ACKNOWLEDGED -> PROBLEM
  notifiedAt: string;
  acknowledgedAt?: string;
  responseNote?: string;
}

export interface TimelineDelay {
  id: string;
  weddingId: string;
  activityId: string;
  activityName: string; // "Varmala Garland Exchange"
  originalPlannedTime: string; // "19:15"
  revisedTime: string; // "19:40"
  delayMinutes: number; // 25
  reason: string; // "Bride procession delayed in transit"
  approvedByPlanner: string;
  createdAt: string;
  affectedVendors: AffectedVendorInstruction[];
}

// --- Live Incident Management ---
export interface Incident {
  id: string;
  weddingId: string;
  title: string; // "DJ arrived 45m late / sound check pending"
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedTo: string;
  category: 'EQUIPMENT' | 'VENDOR_DELAY' | 'LOGISTICS' | 'GUEST_EMERGENCY';
  description: string;
  reportedAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

// --- Change Orders & Additional Costs ---
export interface ChangeOrder {
  id: string;
  weddingId: string;
  code: string; // "CO-001"
  description: string; // "60 Extra Banquet Guests @ Royal Dinner"
  vendorId: string;
  vendorName: string;
  category: string;
  quantity: number; // 60
  unitPrice: number; // 2500
  totalAmount: number; // 150000
  clientApproved: boolean;
  authorizedBy: string; // "Mr. Vikram Singh (Father of Bride)"
  status: ChangeOrderStatus;
  billingStatus: 'PENDING_INVOICE' | 'BILLED_TO_CLIENT';
  createdAt: string;
}

// --- Vendor Financial Settlement & Anti-Duplicate Shield ---
export interface VendorSettlement {
  id: string;
  weddingId: string;
  vendorId: string;
  vendorName: string;
  category: string;
  agreedContractAmount: number; // Baseline quote
  approvedExtras: number; // Change orders
  totalPayableAmount: number; // Agreed + Extras
  advancesPaid: number; // Disbursed advances
  finalBillAmountSubmitted: number;
  balanceDue: number; // totalPayableAmount - advancesPaid
  status: SettlementStatus;
  hasDiscrepancy: boolean;
  discrepancyNote?: string;
  duplicatePaymentBlocked: boolean;
  paymentHistory: Array<{
    transactionId: string;
    amount: number;
    type: 'ADVANCE' | 'FINAL';
    date: string;
    reference: string;
  }>;
}

// --- Founder Executive Dashboard & Season Metrics ---
export interface SeasonMetrics {
  seasonYear: number;
  totalWeddingsPlanned: number; // 25
  completedWeddings: number;
  inProgressWeddings: number;
  totalSeasonRevenue: number; // In Crores/Lakhs
  totalVendorExpenditure: number;
  totalPlannerLaborCost: number;
  totalNetProfit: number;
  averageMarginPercent: number;
  vendorReliabilityAverage: number; // Out of 5.0
  activeLateVendorsCount: number;
  openIncidentsCount: number;
  upcomingReceivables30Days: number;
  upcomingVendorDues30Days: number;
  weddingWiseProfits: Array<{
    weddingId: string;
    name: string;
    revenue: number;
    cost: number;
    labor: number;
    profit: number;
    margin: number;
    status: WeddingStatus;
  }>;
}
