/**
 * =============================================================================
 * File: api.ts
 * Module: Service & Data Architecture Layer
 * =============================================================================
 * Data fetching, caching, API communication, and offline-first state persistence layer for api.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

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
  SeasonMetrics,
  ClientPaymentSummary,
  ClientPaymentMilestone,
  ClientPaymentTransaction
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
  INITIAL_SEASON_METRICS,
  INITIAL_CLIENT_PAYMENT_SUMMARIES
} from './mockData';

// Storage keys for persistence across reloads in demo mode
const STORAGE_PREFIX = 'TRK_';

const API_BASE = (typeof window !== 'undefined' && (window as any).__API_BASE__) ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000/api/v1';

let cachedBackendStatus: boolean | null = null;
let lastHealthCheck = 0;

/**
 * Retrieves the active JWT bearer token from localStorage.
 */
export const getAuthToken = (): string => {
  return localStorage.getItem('TRK_AUTH_TOKEN') || '';
};

/**
 * Pings the backend REST API healthcheck endpoint with a 15-second throttle cache.
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  const now = Date.now();
  if (cachedBackendStatus !== null && now - lastHealthCheck < 15000) {
    return cachedBackendStatus;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    cachedBackendStatus = res.ok;
    lastHealthCheck = now;
    return res.ok;
  } catch {
    cachedBackendStatus = false;
    lastHealthCheck = now;
    return false;
  }
};

/**
 * Helper to retrieve and parse JSON data from localStorage with fallback defaults.
 */
const getItem = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Helper to safely serialize and save state data to localStorage.
 */
const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Storage error for ${key}:`, err);
  }
};

export const api = {
  checkBackendHealth,
  /** Returns active base API endpoint URL. */
  getApiBase: () => API_BASE,
  /** Authenticates user credentials against the backend API and stores JWT token. */
  login: async (email: string, password: string): Promise<{ accessToken: string; user: any }> => {
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || (res.status === 401 ? 'Invalid email or password' : res.status === 429 ? 'Too many attempts. Rate limit exceeded.' : 'Authentication failed'));
      }
      return await res.json();
    }
    throw new Error('BACKEND_OFFLINE');
  },
  /** Revokes the current session and clears token from localStorage. */
  logout: async (): Promise<void> => {
    const token = getAuthToken();
    if (!token) return;
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }).catch(() => {});
    }
  },
  // User Governance & Invitations
  getUsers: async (): Promise<any[]> => {
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/users`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.data) return json.data;
        }
      } catch {}
    }
    return getItem<any[]>('managed_users', [
      {
        id: 'usr-founder-001',
        email: 'founder@theroyalknot.com',
        displayName: 'Devendra Kaviraj',
        role: 'FOUNDER',
        active: true,
        assignedWeddingIds: ['wed-001', 'wed-002', 'wed-003', 'wed-004', 'wed-005']
      },
      {
        id: 'usr-planner-002',
        email: 'planner@theroyalknot.com',
        displayName: 'Priya Mehra',
        role: 'PLANNER',
        active: true,
        assignedWeddingIds: ['wed-001', 'wed-002']
      },
      {
        id: 'usr-coord-003',
        email: 'coordinator@theroyalknot.com',
        displayName: 'Siddharth Jain',
        role: 'COORDINATOR',
        active: true,
        assignedWeddingIds: ['wed-001']
      },
      {
        id: 'usr-fin-004',
        email: 'finance@theroyalknot.com',
        displayName: 'Rameshwar Vyas',
        role: 'FINANCE',
        active: true,
        assignedWeddingIds: ['wed-001', 'wed-002']
      },
      {
        id: 'usr-vendor-005',
        email: 'catering@spiceheaven.com',
        displayName: 'Chef Vikramaditya',
        vendorCategory: 'Catering & Hospitality',
        role: 'VENDOR',
        active: true,
        assignedWeddingIds: ['wed-001']
      },
      {
        id: 'usr-client-006',
        email: 'rahul.singh@royalwedding.com',
        displayName: 'Rahul Sharma & Ananya Singh',
        role: 'CLIENT',
        active: true,
        clientId: 'cli-001',
        assignedWeddingIds: ['wed-001']
      },
      {
        id: 'usr-family-007',
        email: 'vikram.singh@royalwedding.com',
        displayName: 'Mr. Vikram Singh (Father of Bride)',
        role: 'FAMILY',
        active: true,
        isFamilyMember: true,
        clientId: 'cli-001',
        assignedWeddingIds: ['wed-001']
      }
    ]);
  },
  inviteUser: async (input: {
    email: string;
    displayName: string;
    role: string;
    clientId?: string;
    weddingId?: string;
    vendorCategory?: string;
  }): Promise<any> => {
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/invitations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            email: input.email.trim().toLowerCase(),
            displayName: input.displayName.trim(),
            role: input.role,
            ...(input.clientId ? { clientId: input.clientId } : {}),
            ...(input.weddingId ? { weddingId: input.weddingId } : {})
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Invitation request rejected by backend.');
        }
        const created = await res.json();
        const currentList = getItem<any[]>('managed_users', []);
        setItem('managed_users', [created, ...currentList.filter(u => u.email !== created.email)]);
        return created;
      } catch (err: any) {
        if (err.message !== 'BACKEND_OFFLINE' && !err.message.includes('fetch')) {
          throw err;
        }
      }
    }

    const currentList = await api.getUsers();
    const existing = currentList.find(u => u.email.toLowerCase() === input.email.trim().toLowerCase());
    if (existing) {
      throw new Error(`An account with email ${input.email} already exists in the system.`);
    }

    const newUser = {
      id: `usr-inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: input.email.trim().toLowerCase(),
      displayName: input.displayName.trim(),
      role: input.role,
      active: true,
      clientId: input.clientId,
      vendorCategory: input.vendorCategory,
      assignedWeddingIds: input.weddingId ? [input.weddingId] : ['wed-001'],
      invitationToken: `trk-invite-${Date.now().toString(36)}`,
      invitedAt: new Date().toISOString()
    };

    setItem('managed_users', [newUser, ...currentList]);
    return newUser;
  },
  updateUserStatus: async (id: string, active: boolean): Promise<any> => {
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/users/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ active })
        });
        if (res.ok) {
          const updated = await res.json();
          const currentList = getItem<any[]>('managed_users', []);
          setItem('managed_users', currentList.map(u => u.id === id ? { ...u, active } : u));
          return updated;
        }
      } catch {}
    }

    const currentList = await api.getUsers();
    const updatedList = currentList.map(u => u.id === id ? { ...u, active } : u);
    setItem('managed_users', updatedList);
    return updatedList.find(u => u.id === id);
  },
  // Weddings
  /** Retrieves all destination weddings with offline persistence fallback. */
  getWeddings: async (): Promise<Wedding[]> => {
    return getItem('weddings', INITIAL_WEDDINGS);
  },
  
  /** Fetches a single destination wedding by ID. */
  getWeddingById: async (id: string): Promise<Wedding | undefined> => {
    const list = getItem<Wedding[]>('weddings', INITIAL_WEDDINGS);
    return list.find((w: Wedding) => w.id === id);
  },

  // Enquiries & Intake
  /** Retrieves bridal enquiries and qualification leads. */
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

  /** Updates consultation status (CONFIRMED, COMPLETED, CANCELLED). */
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
  /** Fetches all certified luxury wedding vendor profiles. */
  getVendorProfiles: async (): Promise<VendorProfile[]> => {
    return getItem('vendor_profiles', INITIAL_VENDOR_PROFILES);
  },

  /** Fetches specific vendor profile by vendor ID. */
  getVendorProfileById: async (id: string): Promise<VendorProfile | undefined> => {
    const list = getItem<VendorProfile[]>('vendor_profiles', INITIAL_VENDOR_PROFILES);
    return list.find((v: VendorProfile) => v.id === id);
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
  /** Retrieves catering quotes for the 3-way RFQ evaluation matrix. */
  getCatererQuotes: async (weddingId: string): Promise<CatererQuote[]> => {
    const list = getItem('quotes', INITIAL_CATERER_QUOTES);
    return list.filter(q => q.weddingId === weddingId);
  },

  /** Selects the winning caterer quote and closes competing proposals. */
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
  /** Retrieves ceremonial functions (Mehendi, Sangeet, Varmala, Reception). */
  getWeddingFunctions: async (weddingId: string): Promise<WeddingFunction[]> => {
    const list = getItem('functions', INITIAL_FUNCTIONS);
    return list.filter(f => f.weddingId === weddingId);
  },

  // Automated Planning Tasks
  /** Fetches all planning tasks for a wedding. */
  getTasks: async (weddingId: string): Promise<WeddingTask[]> => {
    const list = getItem('tasks', INITIAL_TASKS);
    return list.filter(t => t.weddingId === weddingId);
  },

  /** Creates a new wedding task. */
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
  /** Retrieves minute-by-minute execution run sheet. */
  getRunSheet: async (weddingId: string): Promise<RunSheetItem[]> => {
    const list = getItem('run_sheet', INITIAL_RUN_SHEET);
    return list.filter(r => r.weddingId === weddingId);
  },

  updateRunSheetItem: async (itemId: string, updates: Partial<RunSheetItem>): Promise<RunSheetItem> => {
    const list = getItem('run_sheet', INITIAL_RUN_SHEET);
    const updated = list.map(r => (r.id === itemId ? { ...r, ...updates } : r));
    setItem('run_sheet', updated);
    return updated.find(r => r.id === itemId)!;
  },

  // Vendor Arrivals
  /** Retrieves vendor arrival docking log. */
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

  // Closed-Loop Delays & Schedule Changes
  /** Retrieves active schedule delays and acknowledgements. */
  getDelays: async (weddingId: string): Promise<TimelineDelay[]> => {
    const list = getItem('delays', INITIAL_DELAYS);
    return list.filter(d => d.weddingId === weddingId);
  },

  proposeScheduleChange: async (
    data: Omit<TimelineDelay, 'id' | 'createdAt' | 'changeTimestamp' | 'state'>
  ): Promise<TimelineDelay> => {
    const list = getItem('delays', INITIAL_DELAYS);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newDelay: TimelineDelay = {
      ...data,
      id: `delay-${Date.now().toString().slice(-4)}`,
      createdAt: now.toISOString().replace('T', ' ').slice(0, 16),
      changeTimestamp: now.toISOString().replace('T', ' ').slice(0, 19),
      state: 'PROPOSED',
      affectedVendors: data.affectedVendors.map(v => ({
        ...v,
        status: 'SENT' as const,
        notifiedAt: timeStr
      }))
    };
    const updated = [newDelay, ...list];
    setItem('delays', updated);
    return newDelay;
  },

  approveScheduleChange: async (delayId: string, approverName: string): Promise<TimelineDelay> => {
    const list = getItem('delays', INITIAL_DELAYS);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated = list.map(d => {
      if (d.id === delayId) {
        return {
          ...d,
          state: 'APPROVED' as const,
          approver: approverName,
          approvedAt: now
        };
      }
      return d;
    });
    setItem('delays', updated);
    return updated.find(d => d.id === delayId)!;
  },

  /** Publishes an approved schedule shift to all vendors. */
  publishScheduleChange: async (delayId: string): Promise<TimelineDelay> => {
    const list = getItem('delays', INITIAL_DELAYS);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const nowFull = now.toISOString().replace('T', ' ').slice(0, 19);
    const updated = list.map(d => {
      if (d.id === delayId) {
        return {
          ...d,
          state: 'PUBLISHED' as const,
          publishedAt: nowFull,
          changeTimestamp: nowFull,
          affectedVendors: d.affectedVendors.map(v => ({
            ...v,
            status: 'SENT' as const,
            notifiedAt: timeStr
          }))
        };
      }
      return d;
    });
    setItem('delays', updated);

    // Also update run sheet item actual time if matching
    const targetDelay = updated.find(d => d.id === delayId);
    if (targetDelay) {
      const runSheetList = getItem('run_sheet', INITIAL_RUN_SHEET);
      const updatedRunSheet = runSheetList.map(r => {
        if (r.id === targetDelay.activityId) {
          return {
            ...r,
            actualStartTime: targetDelay.revisedTime,
            status: 'DELAYED' as const
          };
        }
        return r;
      });
      setItem('run_sheet', updatedRunSheet);
    }

    return updated.find(d => d.id === delayId)!;
  },

  acknowledgeDelayInstruction: async (
    delayId: string,
    vendorId: string,
    responseNote?: string
  ): Promise<TimelineDelay> => {
    const list = getItem('delays', INITIAL_DELAYS);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const updated = list.map(d => {
      if (d.id === delayId) {
        return {
          ...d,
          affectedVendors: d.affectedVendors.map((v: any) => {
            if (v.vendorId === vendorId) {
              return {
                ...v,
                status: 'ACKNOWLEDGED' as const,
                acknowledgedAt: timeStr,
                responseNote: responseNote || 'Confirmed & adjusted deployment.'
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

  reportDelayProblem: async (
    delayId: string,
    vendorId: string,
    problemNote: string
  ): Promise<TimelineDelay> => {
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
                status: 'PROBLEM' as const,
                acknowledgedAt: timeStr,
                responseNote: `CONFLICT REPORTED: ${problemNote}`
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
  /** Retrieves wedding-day operational incident logs. */
  getIncidents: async (weddingId: string): Promise<Incident[]> => {
    const list = getItem('incidents', INITIAL_INCIDENTS);
    return list.filter(i => i.weddingId === weddingId);
  },

  createIncident: async (incident: Omit<Incident, 'id' | 'reportedAt'>): Promise<Incident> => {
    const list = getItem('incidents', INITIAL_INCIDENTS);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newIncident: Incident = {
      ...incident,
      id: `inc-${Date.now().toString().slice(-4)}`,
      reportedAt: timeStr
    };
    const updated = [newIncident, ...list];
    setItem('incidents', updated);
    return newIncident;
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

  // Client Payment Interface & Milestones
  /** Retrieves client milestone payment summary and receivables. */
  getClientPaymentSummary: async (weddingId: string): Promise<ClientPaymentSummary> => {
    const allSummaries = getItem('client_payments', INITIAL_CLIENT_PAYMENT_SUMMARIES);
    if (allSummaries[weddingId]) {
      return allSummaries[weddingId];
    }
    // Fallback default structure for other weddings
    return {
      weddingId,
      totalContractValue: 35000000,
      totalExtrasBilled: 0,
      totalGrossDue: 35000000,
      totalAmountPaid: 20000000,
      remainingBalanceDue: 15000000,
      overallStatus: 'PARTIALLY_PAID',
      milestones: [
        {
          id: `cpm-${weddingId}-01`,
          weddingId,
          type: 'BOOKING_DEPOSIT',
          title: 'Stage 1: Booking Deposit (20%)',
          description: 'Reservation retainer',
          dueDate: '2026-08-10',
          amountDue: 5000000,
          amountPaid: 5000000,
          status: 'PAID',
          invoiceNumber: 'INV-BK-001',
          paidAt: '2026-08-08',
          transactions: []
        },
        {
          id: `cpm-${weddingId}-02`,
          weddingId,
          type: 'ADVANCE_PAYMENT',
          title: 'Stage 2: Operations Advance (40%)',
          description: 'Vendor lock-in disbursement',
          dueDate: '2026-11-20',
          amountDue: 15000000,
          amountPaid: 15000000,
          status: 'PAID',
          invoiceNumber: 'INV-ADV-001',
          paidAt: '2026-11-19',
          transactions: []
        },
        {
          id: `cpm-${weddingId}-03`,
          weddingId,
          type: 'FINAL_SETTLEMENT',
          title: 'Stage 3: Final Reconciled Settlement',
          description: 'Post-event final settlement',
          dueDate: '2026-12-30',
          amountDue: 15000000,
          amountPaid: 0,
          status: 'PENDING',
          invoiceNumber: 'INV-FIN-001',
          transactions: []
        }
      ]
    };
  },

  /** Records a verified client milestone payment transaction. */
  recordClientPayment: async (
    weddingId: string,
    milestoneId: string,
    data: {
      amount: number;
      method: 'RTGS' | 'NEFT' | 'IMPS' | 'CHEQUE' | 'BANK_TRANSFER';
      reference: string;
      notes?: string;
    }
  ): Promise<ClientPaymentSummary> => {
    const allSummaries = getItem('client_payments', INITIAL_CLIENT_PAYMENT_SUMMARIES);
    const summary = allSummaries[weddingId] || (await api.getClientPaymentSummary(weddingId));

    const updatedMilestones = summary.milestones.map(m => {
      if (m.id === milestoneId) {
        const newPaid = m.amountPaid + data.amount;
        const newStatus: ClientPaymentMilestone['status'] =
          newPaid >= m.amountDue ? 'PAID' : newPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING';

        const txn: ClientPaymentTransaction = {
          id: `ctxn-${Date.now().toString().slice(-4)}`,
          weddingId,
          milestoneId,
          amount: data.amount,
          date: new Date().toISOString().split('T')[0],
          method: data.method,
          reference: data.reference,
          receiptNumber: `RCP-${Date.now().toString().slice(-4)}`,
          receivedBy: 'Finance Controller Desk',
          notes: data.notes
        };

        return {
          ...m,
          amountPaid: newPaid,
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date().toISOString().split('T')[0] : m.paidAt,
          transactions: [txn, ...m.transactions]
        };
      }
      return m;
    });

    const totalPaid = updatedMilestones.reduce((acc, m) => acc + m.amountPaid, 0);
    const balanceDue = Math.max(0, summary.totalGrossDue - totalPaid);
    const overallStatus = balanceDue === 0 ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING';

    const updatedSummary: ClientPaymentSummary = {
      ...summary,
      totalAmountPaid: totalPaid,
      remainingBalanceDue: balanceDue,
      overallStatus,
      milestones: updatedMilestones
    };

    allSummaries[weddingId] = updatedSummary;
    setItem('client_payments', allSummaries);
    return updatedSummary;
  },

  // Change Orders & Additional Expenses
  /** Retrieves change orders for a wedding. */
  getChangeOrders: async (weddingId: string): Promise<ChangeOrder[]> => {
    const list = getItem('change_orders', INITIAL_CHANGE_ORDERS);
    return list.filter(c => c.weddingId === weddingId);
  },

  createChangeOrder: async (
    order: Omit<ChangeOrder, 'id' | 'code' | 'createdAt' | 'status' | 'billingStatus' | 'clientApproved'>
  ): Promise<ChangeOrder> => {
    const list = getItem('change_orders', INITIAL_CHANGE_ORDERS);
    const newOrder: ChangeOrder = {
      ...order,
      id: `co-${Date.now().toString().slice(-4)}`,
      code: `CO-2026-${String(list.length + 1).padStart(3, '0')}`,
      status: 'PENDING',
      clientApproved: false,
      billingStatus: 'PENDING_INVOICE',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    const updated = [newOrder, ...list];
    setItem('change_orders', updated);
    return newOrder;
  },

  approveChangeOrder: async (changeOrderId: string): Promise<ChangeOrder> => {
    const list = getItem('change_orders', INITIAL_CHANGE_ORDERS);
    const target = list.find(c => c.id === changeOrderId);
    if (!target) throw new Error('Change order not found');

    const updatedOrder: ChangeOrder = {
      ...target,
      status: 'APPROVED',
      clientApproved: true,
      billingStatus: 'BILLED_TO_CLIENT'
    };

    const updatedList = list.map(c => (c.id === changeOrderId ? updatedOrder : c));
    setItem('change_orders', updatedList);

    // 1. Authoritative Cascade: Update Vendor Settlements
    const settlements = getItem('settlements', INITIAL_SETTLEMENTS);
    const updatedSettlements = settlements.map(s => {
      if (s.weddingId === target.weddingId && s.vendorId === target.vendorId) {
        const approvedExtras = s.approvedExtras + target.totalAmount;
        const totalPayable = s.agreedContractAmount + approvedExtras;
        const balanceDue = totalPayable - s.advancesPaid;
        return {
          ...s,
          approvedExtras,
          totalPayableAmount: totalPayable,
          finalBillAmountSubmitted: totalPayable,
          balanceDue,
          status: balanceDue === 0 ? ('PAID' as const) : ('RECONCILED' as const)
        };
      }
      return s;
    });
    setItem('settlements', updatedSettlements);

    // 2. Authoritative Cascade: Update Client Payment Summary
    const allSummaries = getItem('client_payments', INITIAL_CLIENT_PAYMENT_SUMMARIES);
    if (allSummaries[target.weddingId]) {
      const summary = allSummaries[target.weddingId];
      const newExtrasBilled = summary.totalExtrasBilled + target.totalAmount;
      const newGrossDue = summary.totalContractValue + newExtrasBilled;
      const newBalanceDue = newGrossDue - summary.totalAmountPaid;

      const newMilestones = summary.milestones.map(m => {
        if (m.type === 'FINAL_SETTLEMENT') {
          return {
            ...m,
            amountDue: m.amountDue + target.totalAmount
          };
        }
        return m;
      });

      allSummaries[target.weddingId] = {
        ...summary,
        totalExtrasBilled: newExtrasBilled,
        totalGrossDue: newGrossDue,
        remainingBalanceDue: newBalanceDue,
        milestones: newMilestones
      };
      setItem('client_payments', allSummaries);
    }

    return updatedOrder;
  },

  // Settlements & Reconciliation
  /** Retrieves post-event vendor settlement reconciliation records. */
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

  // Season Metrics & Founder Analytics
  getSeasonMetrics: async (filters?: { year?: number; weddingId?: string }): Promise<SeasonMetrics> => {
    const metrics: SeasonMetrics = getItem('season_metrics', INITIAL_SEASON_METRICS);
    if (!filters?.weddingId || filters.weddingId === 'ALL') {
      return metrics;
    }
    // Filter specifically for selected wedding
    const match = metrics.weddingWiseProfits.find((w: any) => w.weddingId === filters.weddingId);
    if (!match) return metrics;

    return {
      ...metrics,
      totalWeddingsPlanned: 1,
      completedWeddings: match.status === 'CLOSED' ? 1 : 0,
      inProgressWeddings: match.status !== 'CLOSED' ? 1 : 0,
      totalSeasonRevenue: match.revenue,
      totalVendorExpenditure: match.cost,
      totalPlannerLaborCost: match.labor,
      totalNetProfit: match.profit,
      averageMarginPercent: match.margin,
      totalPlanningHours: match.planningHours,
      weddingWiseProfits: [match]
    };
  },

  resetDemoData: () => {
    localStorage.clear();
    window.location.reload();
  }
};
