import {
  Wedding,
  Enquiry,
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

  // Enquiries & Digital Agreement
  getEnquiries: async (): Promise<Enquiry[]> => {
    return getItem('enquiries', INITIAL_ENQUIRIES);
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

  // Tasks
  getTasks: async (weddingId: string): Promise<WeddingTask[]> => {
    const list = getItem('tasks', INITIAL_TASKS);
    return list.filter(t => t.weddingId === weddingId);
  },

  updateTaskStage: async (taskId: string, stage: WeddingTask['stage']): Promise<WeddingTask> => {
    const list = getItem('tasks', INITIAL_TASKS);
    const updated = list.map(t => (t.id === taskId ? { ...t, stage } : t));
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
