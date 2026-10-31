import {
  Wedding,
  Enquiry,
  Consultation,
  AgreementDetails,
  VendorProfile,
  WeddingFunction,
  CatererQuote,
  WeddingTask,
  RunSheetItem,
  VendorArrival,
  TimelineDelay,
  Incident,
  ChangeOrder,
  VendorSettlement,
  SeasonMetrics
} from '../types';

import {
  INITIAL_WEDDINGS,
  INITIAL_ENQUIRIES,
  INITIAL_CONSULTATIONS,
  INITIAL_AGREEMENTS,
  INITIAL_VENDOR_PROFILES,
  INITIAL_FUNCTIONS,
  INITIAL_CATERER_QUOTES,
  INITIAL_TASKS,
  INITIAL_RUN_SHEET,
  INITIAL_VENDOR_ARRIVALS,
  INITIAL_DELAYS,
  INITIAL_INCIDENTS,
  INITIAL_CHANGE_ORDERS,
  INITIAL_SETTLEMENTS,
  INITIAL_SEASON_METRICS
} from './mockData';

// Storage keys for persistence across reloads in demo mode
const STORAGE_PREFIX = 'TRK_';
const getItem = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Storage error for ${key}:`, err);
  }
};

export const api = {
  // Weddings
  getWeddings: async (): Promise<Wedding[]> => {
    return getItem('weddings', INITIAL_WEDDINGS);
  },
  
  getWeddingById: async (id: string): Promise<Wedding | undefined> => {
    const list = getItem('weddings', INITIAL_WEDDINGS);
    return list.find(w => w.id === id);
  },

  // Enquiries & Intake
  getEnquiries: async (): Promise<Enquiry[]> => {
    return getItem('enquiries', INITIAL_ENQUIRIES);
  },

  createEnquiry: async (enquiry: Omit<Enquiry, 'id' | 'createdAt'>): Promise<Enquiry> => {
    const list = getItem('enquiries', INITIAL_ENQUIRIES);
    const newEnquiry: Enquiry = {
      ...enquiry,
      id: `enq-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newEnquiry, ...list];
    setItem('enquiries', updated);
    return newEnquiry;
  },

  updateEnquiryStatus: async (enquiryId: string, status: Enquiry['status']): Promise<Enquiry> => {
    const list = getItem('enquiries', INITIAL_ENQUIRIES);
    const updated = list.map(e => (e.id === enquiryId ? { ...e, status } : e));
    setItem('enquiries', updated);
    return updated.find(e => e.id === enquiryId)!;
  },

  // Consultations & Scheduling
  getConsultations: async (weddingIdOrEnquiryId?: string): Promise<Consultation[]> => {
    const list = getItem('consultations', INITIAL_CONSULTATIONS);
    if (!weddingIdOrEnquiryId) return list;
    return list.filter(c => c.weddingId === weddingIdOrEnquiryId || c.enquiryId === weddingIdOrEnquiryId);
  },

  scheduleConsultation: async (
    enquiryId: string,
    data: {
      weddingId?: string;
      coupleName: string;
      preferredAt: string;
      startAt?: string;
      endAt?: string;
      plannerName?: string;
      message?: string;
    }
  ): Promise<Consultation> => {
    const list = getItem('consultations', INITIAL_CONSULTATIONS);
    const newConsultation: Consultation = {
      id: `con-${Date.now().toString().slice(-4)}`,
      weddingId: data.weddingId || 'wed-001',
      enquiryId,
      coupleName: data.coupleName,
      state: 'CONFIRMED',
      preferredAt: data.preferredAt,
      startAt: data.startAt || data.preferredAt,
      endAt: data.endAt || data.preferredAt,
      plannerName: data.plannerName || 'Priya Mehra (Lead Director)',
      message: data.message || 'Consultation confirmed via The Royal Knot Concierge.',
      createdAt: new Date().toISOString()
    };
    const updated = [newConsultation, ...list];
    setItem('consultations', updated);

    // Sync enquiry status to CONSULTATION_SCHEDULED
    const enquiries = getItem('enquiries', INITIAL_ENQUIRIES);
    const updatedEnquiries = enquiries.map(e => {
      if (e.id === enquiryId) {
        return {
          ...e,
          status: 'CONSULTATION_SCHEDULED' as const,
          consultationDate: data.preferredAt.split('T')[0]
        };
      }
      return e;
    });
    setItem('enquiries', updatedEnquiries);

    return newConsultation;
  },

  updateConsultationState: async (id: string, state: Consultation['state']): Promise<Consultation> => {
    const list = getItem('consultations', INITIAL_CONSULTATIONS);
    const updated = list.map(c => (c.id === id ? { ...c, state } : c));
    setItem('consultations', updated);
    return updated.find(c => c.id === id)!;
  },

  // Digital Agreement & Document Verification
  getAgreementDetails: async (enquiryIdOrWeddingId: string): Promise<AgreementDetails | undefined> => {
    const list = getItem('agreements', INITIAL_AGREEMENTS);
    return list.find(a => a.enquiryId === enquiryIdOrWeddingId || a.weddingId === enquiryIdOrWeddingId);
  },

  signAgreement: async (enquiryId: string): Promise<Enquiry> => {
    const list = getItem('enquiries', INITIAL_ENQUIRIES);
    const updated = list.map(e => {
      if (e.id === enquiryId) {
        return {
          ...e,
          agreementSigned: true,
          status: 'AGREEMENT_SIGNED' as const
        };
      }
      return e;
    });
    setItem('enquiries', updated);
    return updated.find(e => e.id === enquiryId)!;
  },

  attachSignedAgreement: async (
    enquiryId: string,
    fileData: {
      fileName: string;
      fileSize?: string;
      signerName: string;
    }
  ): Promise<{ agreement: AgreementDetails; enquiry: Enquiry }> => {
    const agreements = getItem('agreements', INITIAL_AGREEMENTS);
    const today = new Date().toISOString().split('T')[0];
    
    let agreement = agreements.find(a => a.enquiryId === enquiryId);
    let updatedAgreements: AgreementDetails[];

    if (agreement) {
      updatedAgreements = agreements.map(a => {
        if (a.enquiryId === enquiryId) {
          return {
            ...a,
            status: 'VERIFIED' as const,
            signedDate: today,
            signedDocumentName: fileData.fileName,
            signedDocumentSize: fileData.fileSize || '2.4 MB',
            clientSignerName: fileData.signerName,
            clientSignerIp: '103.211.54.12 (Aadhaar e-Sign Verified)'
          };
        }
        return a;
      });
      agreement = updatedAgreements.find(a => a.enquiryId === enquiryId)!;
    } else {
      const newAgr: AgreementDetails = {
        id: `agr-${Date.now().toString().slice(-4)}`,
        enquiryId,
        weddingId: 'wed-001',
        coupleNames: fileData.signerName,
        signedDate: today,
        status: 'VERIFIED',
        packageType: 'full_service',
        totalFee: 3500000,
        milestone1Deposit: 1000000,
        milestone2Advance: 1500000,
        milestone3Final: 1000000,
        signedDocumentName: fileData.fileName,
        signedDocumentSize: fileData.fileSize || '2.4 MB',
        clientSignerName: fileData.signerName,
        clientSignerIp: '103.211.54.12 (Aadhaar e-Sign Verified)'
      };
      updatedAgreements = [newAgr, ...agreements];
      agreement = newAgr;
    }
    setItem('agreements', updatedAgreements);

    // Update Enquiry status to AGREEMENT_SIGNED
    const enquiries = getItem('enquiries', INITIAL_ENQUIRIES);
    const updatedEnquiries = enquiries.map(e => {
      if (e.id === enquiryId) {
        return {
          ...e,
          agreementSigned: true,
          status: 'AGREEMENT_SIGNED' as const
        };
      }
      return e;
    });
    setItem('enquiries', updatedEnquiries);

    return {
      agreement,
      enquiry: updatedEnquiries.find(e => e.id === enquiryId)!
    };
  },

  // Vendors & Profiles
  getVendorProfiles: async (): Promise<VendorProfile[]> => {
    return getItem('vendor_profiles', INITIAL_VENDOR_PROFILES);
  },

  getVendorProfileById: async (id: string): Promise<VendorProfile | undefined> => {
    const list = getItem('vendor_profiles', INITIAL_VENDOR_PROFILES);
    return list.find(v => v.id === id);
  },

  createVendorProfile: async (vendor: Omit<VendorProfile, 'id'>): Promise<VendorProfile> => {
    const list = getItem('vendor_profiles', INITIAL_VENDOR_PROFILES);
    const newVendor: VendorProfile = {
      ...vendor,
      id: `v-${Date.now().toString().slice(-4)}`
    };
    const updated = [newVendor, ...list];
    setItem('vendor_profiles', updated);
    return newVendor;
  },

  // 3-Caterer Quotes & Selection
  getCatererQuotes: async (weddingId: string): Promise<CatererQuote[]> => {
    const list = getItem('quotes', INITIAL_CATERER_QUOTES);
    return list.filter(q => q.weddingId === weddingId);
  },

  selectWinningCaterer: async (quoteId: string): Promise<CatererQuote[]> => {
    const list = getItem('quotes', INITIAL_CATERER_QUOTES);
    const target = list.find(q => q.id === quoteId);
    if (!target) return list;

    // Winner becomes SELECTED; competing caterers become REJECTED
    const updated = list.map(q => {
      if (q.weddingId === target.weddingId && q.category === target.category) {
        if (q.id === quoteId) {
          return { ...q, status: 'SELECTED' as const };
        } else {
          return { ...q, status: 'REJECTED' as const };
        }
      }
      return q;
    });
    setItem('quotes', updated);
    return updated;
  },

  // Wedding Sub-Functions
  getWeddingFunctions: async (weddingId: string): Promise<WeddingFunction[]> => {
    const list = getItem('functions', INITIAL_FUNCTIONS);
    return list.filter(f => f.weddingId === weddingId);
  },

  // Automated Planning Tasks
  getTasks: async (weddingId: string): Promise<WeddingTask[]> => {
    const list = getItem('tasks', INITIAL_TASKS);
    return list.filter(t => t.weddingId === weddingId);
  },

  createTask: async (task: Omit<WeddingTask, 'id'>): Promise<WeddingTask> => {
    const list = getItem('tasks', INITIAL_TASKS);
    const newTask: WeddingTask = {
      ...task,
      id: `task-${Date.now().toString().slice(-4)}`
    };
    const updated = [newTask, ...list];
    setItem('tasks', updated);
    return newTask;
  },

  updateTask: async (taskId: string, updates: Partial<WeddingTask>): Promise<WeddingTask> => {
    const list = getItem('tasks', INITIAL_TASKS);
    const updated = list.map(t => (t.id === taskId ? { ...t, ...updates } : t));
    setItem('tasks', updated);
    return updated.find(t => t.id === taskId)!;
  },

  updateTaskStage: async (
    taskId: string,
    stage: WeddingTask['stage'],
    blockedReason?: string
  ): Promise<WeddingTask> => {
    const list = getItem('tasks', INITIAL_TASKS);
    const updated = list.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          stage,
          blockedReason: stage === 'BLOCKED' ? (blockedReason || t.blockedReason || 'Blocked by operational dependency') : undefined
        };
      }
      return t;
    });
    setItem('tasks', updated);
    return updated.find(t => t.id === taskId)!;
  },

  // Run Sheet
  getRunSheet: async (weddingId: string): Promise<RunSheetItem[]> => {
    const list = getItem('run_sheet', INITIAL_RUN_SHEET);
    return list.filter(r => r.weddingId === weddingId);
  },

  // Vendor Arrivals
  getVendorArrivals: async (weddingId: string): Promise<VendorArrival[]> => {
    const list = getItem('arrivals', INITIAL_VENDOR_ARRIVALS);
    return list.filter(a => a.weddingId === weddingId);
  },

  checkinVendor: async (arrivalId: string): Promise<VendorArrival> => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const list = getItem('arrivals', INITIAL_VENDOR_ARRIVALS);
    const updated = list.map(a => {
      if (a.id === arrivalId) {
        return {
          ...a,
          actualArrivalTime: timeStr,
          status: 'CHECKED_IN' as const,
          isLate: false
        };
      }
      return a;
    });
    setItem('arrivals', updated);
    return updated.find(a => a.id === arrivalId)!;
  },

  // Closed-Loop Delays
  getDelays: async (weddingId: string): Promise<TimelineDelay[]> => {
    const list = getItem('delays', INITIAL_DELAYS);
    return list.filter(d => d.weddingId === weddingId);
  },

  acknowledgeDelayInstruction: async (delayId: string, vendorId: string): Promise<TimelineDelay> => {
    const list = getItem('delays', INITIAL_DELAYS);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updated = list.map(d => {
      if (d.id === delayId) {
        return {
          ...d,
          affectedVendors: d.affectedVendors.map(v => {
            if (v.vendorId === vendorId) {
              return {
                ...v,
                status: 'ACKNOWLEDGED' as const,
                acknowledgedAt: timeStr,
                responseNote: 'Confirmed & adjusted deployment.'
              };
            }
            return v;
          })
        };
      }
      return d;
    });
    setItem('delays', updated);
    return updated.find(d => d.id === delayId)!;
  },

  // Incidents
  getIncidents: async (weddingId: string): Promise<Incident[]> => {
    const list = getItem('incidents', INITIAL_INCIDENTS);
    return list.filter(i => i.weddingId === weddingId);
  },

  resolveIncident: async (incidentId: string, note: string): Promise<Incident> => {
    const list = getItem('incidents', INITIAL_INCIDENTS);
    const updated = list.map(i => {
      if (i.id === incidentId) {
        return {
          ...i,
          status: 'RESOLVED' as const,
          resolvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          resolutionNote: note
        };
      }
      return i;
    });
    setItem('incidents', updated);
    return updated.find(i => i.id === incidentId)!;
  },

  // Change Orders
  getChangeOrders: async (weddingId: string): Promise<ChangeOrder[]> => {
    const list = getItem('change_orders', INITIAL_CHANGE_ORDERS);
    return list.filter(c => c.weddingId === weddingId);
  },

  approveChangeOrder: async (changeOrderId: string): Promise<ChangeOrder> => {
    const list = getItem('change_orders', INITIAL_CHANGE_ORDERS);
    const updated = list.map(c => {
      if (c.id === changeOrderId) {
        return {
          ...c,
          status: 'APPROVED' as const,
          clientApproved: true
        };
      }
      return c;
    });
    setItem('change_orders', updated);
    return updated.find(c => c.id === changeOrderId)!;
  },

  // Settlements & Reconciliation
  getSettlements: async (weddingId: string): Promise<VendorSettlement[]> => {
    const list = getItem('settlements', INITIAL_SETTLEMENTS);
    return list.filter(s => s.weddingId === weddingId);
  },

  settleVendorFinalBill: async (settlementId: string): Promise<VendorSettlement> => {
    const list = getItem('settlements', INITIAL_SETTLEMENTS);
    const target = list.find(s => s.id === settlementId);
    if (!target) throw new Error('Settlement record not found');

    // Anti-duplicate protection: cannot pay twice if already paid
    if (target.status === 'PAID') {
      const updated = list.map(s => s.id === settlementId ? { ...s, duplicatePaymentBlocked: true } : s);
      setItem('settlements', updated);
      throw new Error('DUPLICATE_PAYMENT_BLOCKED: This vendor invoice has already been fully settled!');
    }

    const updated = list.map(s => {
      if (s.id === settlementId) {
        return {
          ...s,
          status: 'PAID' as const,
          balanceDue: 0,
          paymentHistory: [
            ...s.paymentHistory,
            {
              transactionId: `TXN-FIN-${Date.now()}`,
              amount: s.balanceDue,
              type: 'FINAL' as const,
              date: new Date().toISOString().split('T')[0],
              reference: 'Final Settlement Disbursed / Direct Bank Transfer'
            }
          ]
        };
      }
      return s;
    });
    setItem('settlements', updated);
    return updated.find(s => s.id === settlementId)!;
  },

  // Season Metrics
  getSeasonMetrics: async (): Promise<SeasonMetrics> => {
    return getItem('season_metrics', INITIAL_SEASON_METRICS);
  },

  resetDemoData: () => {
    localStorage.clear();
    window.location.reload();
  }
};
