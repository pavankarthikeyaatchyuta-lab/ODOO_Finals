/**
 * =============================================================================
 * File: App.tsx
 * Module: Top-Level Application Router & Shell
 * =============================================================================
 * Main application root component orchestrating multi-portal view routing, authentication sub-views, and global context providers.
 *
 * The Royal Knot - Ultra-Luxury Wedding Operations & Stakeholder Management
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WeddingProvider, useWedding } from './context/WeddingContext';
import { DashboardUiProvider } from './context/DashboardUiContext';
import { AppLayout } from './components/layout/AppLayout';
import { NavItemKey } from './components/layout/Sidebar';
import { api } from './services/api';

// Public Showcase & Landing Page
import { LandingPage } from './pages/LandingPage';
import { PageLoadingScreen } from './components/common/PageLoadingScreen';

// Authentication Pages
import { LoginPage } from './pages/auth/LoginPage';
import { InvitationAcceptPage } from './pages/auth/InvitationAcceptPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Agency Workspace Pages
import { OverviewPage } from './pages/OverviewPage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { ClientsPage } from './pages/ClientsPage';
import { WeddingsPage } from './pages/WeddingsPage';
import { VendorsPage } from './pages/VendorsPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { PlanningTasksPage } from './pages/PlanningTasksPage';
import { CommandCentrePage } from './pages/CommandCentrePage';
import { FinancePage } from './pages/FinancePage';
import { ReportsPage } from './pages/ReportsPage';
import { TeamAccountsPage } from './pages/TeamAccountsPage';
import { SettingsPage } from './pages/SettingsPage';

// Vendor Portal
import { VendorPortalLayout, VendorTabKey } from './components/vendor/VendorPortalLayout';
import { VendorOverviewPage } from './pages/vendor/VendorOverviewPage';
import { VendorScheduleAckPage } from './pages/vendor/VendorScheduleAckPage';
import { VendorInvoicesPage } from './pages/vendor/VendorInvoicesPage';

// Client / Couple Portal
import { ClientPortalLayout, ClientTabKey } from './components/client/ClientPortalLayout';
import { ClientOverviewPage } from './pages/client/ClientOverviewPage';
import { ClientSchedulePage } from './pages/client/ClientSchedulePage';
import { ClientDocumentsPage } from './pages/client/ClientDocumentsPage';
import { ClientPaymentsPage } from './pages/client/ClientPaymentsPage';

import {
  ClientPaymentSummary,
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
} from './types';

/**
 * MainApplicationRouter component
 *
 * Central orchestrator for portal views (Agency, Client Portal, Vendor Portal),
 * authentication sub-views, and top-level wedding state synchronization.
 */
function MainApplicationRouter() {
  const { user, isAuthenticated, activePortal } = useAuth();
  const weddingCtx = useWedding();

  // Navigation tab states
  const [currentAgencyTab, setCurrentAgencyTab] = useState<NavItemKey>(() => {
    try {
      const t = new URLSearchParams(window.location.search).get('tab') as NavItemKey | null;
      if (t) return t;
      return 'overview';
    } catch {
      return 'overview';
    }
  });
  const [currentVendorTab, setCurrentVendorTab] = useState<VendorTabKey>('overview');
  const [currentClientTab, setCurrentClientTab] = useState<ClientTabKey>('overview');
  const [authView, setAuthView] = useState<'landing' | 'login' | 'invite' | 'forgot' | 'reset'>(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('view');
      if (v === 'login' || v === 'invite' || v === 'forgot' || v === 'reset') return v;
      return 'landing';
    } catch {
      return 'landing';
    }
  });
  const [showPublicLanding, setShowPublicLanding] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('TRK_SHOW_LANDING') === 'true';
    } catch {
      return false;
    }
  });

  /**
   * Switches between the authenticated workspace and public landing page showcase.
   * Persists the preference in sessionStorage.
   *
   * @param show - Whether to display the public landing showcase
   */
  const handleSetShowPublicLanding = (show: boolean) => {
    setShowPublicLanding(show);
    try {
      if (show) {
        sessionStorage.setItem('TRK_SHOW_LANDING', 'true');
      } else {
        sessionStorage.removeItem('TRK_SHOW_LANDING');
      }
    } catch {}
  };

  // Operational state
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [currentWedding, setCurrentWedding] = useState<Wedding | null>(null);

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [quotes, setQuotes] = useState<CatererQuote[]>([]);
  const [tasks, setTasks] = useState<WeddingTask[]>([]);
  const [runSheet, setRunSheet] = useState<RunSheetItem[]>([]);
  const [arrivals, setArrivals] = useState<VendorArrival[]>([]);
  const [delays, setDelays] = useState<TimelineDelay[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [settlements, setSettlements] = useState<VendorSettlement[]>([]);
  const [clientPaymentSummary, setClientPaymentSummary] = useState<ClientPaymentSummary | null>(null);
  const [metrics, setMetrics] = useState<SeasonMetrics | null>(null);

  // Auto-switch initial tab if role has restricted access
  useEffect(() => {
    if (user?.role === 'COORDINATOR' && currentAgencyTab === 'overview') {
      setCurrentAgencyTab('command-centre');
    }
  }, [user?.role, currentAgencyTab]);

  // Synchronize with WeddingContext
  useEffect(() => {
    if (weddingCtx.activeWedding) {
      setCurrentWedding(weddingCtx.activeWedding);
      loadWeddingContext(weddingCtx.activeWedding.id);
    }
  }, [weddingCtx.activeWeddingId]);

  // Initial Data Load
  useEffect(() => {
    async function loadData() {
      const wList = await api.getWeddings();
      setWeddings(wList);
      if (wList.length > 0 && !currentWedding) {
        const defaultWed = wList[0];
        setCurrentWedding(defaultWed);
        loadWeddingContext(defaultWed.id);
      }

      const enq = await api.getEnquiries();
      setEnquiries(enq);

      const m = await api.getSeasonMetrics();
      setMetrics(m);

      const healthy = await api.checkBackendHealth();
      setIsBackendConnected(healthy);
    }
    loadData();
  }, []);

  /**
   * Fetches full operational and financial datasets for a selected wedding
   * including quotations, tasks, run sheets, arrivals, delays, incidents, and settlements.
   *
   * @param weddingId - Target wedding unique identifier
   */
  const loadWeddingContext = async (weddingId: string) => {
    const [q, t, r, a, d, i, c, s, cps] = await Promise.all([
      api.getCatererQuotes(weddingId),
      api.getTasks(weddingId),
      api.getRunSheet(weddingId),
      api.getVendorArrivals(weddingId),
      api.getDelays(weddingId),
      api.getIncidents(weddingId),
      api.getChangeOrders(weddingId),
      api.getSettlements(weddingId),
      api.getClientPaymentSummary(weddingId)
    ]);

    setQuotes(q);
    setTasks(t);
    setRunSheet(r);
    setArrivals(a);
    setDelays(d);
    setIncidents(i);
    setChangeOrders(c);
    setSettlements(s);
    setClientPaymentSummary(cps);
  };

  /**
   * Handles wedding selection by updating local state and notifying WeddingContext.
   *
   * @param wedding - Selected wedding record
   */
  const handleSelectWedding = (wedding: Wedding) => {
    setCurrentWedding(wedding);
    weddingCtx.selectWedding(wedding.id);
    loadWeddingContext(wedding.id);
  };

  /**
   * Executes digital contract signing for an enquiry and syncs local wedding state.
   *
   * @param enquiryId - Enquiry / contract record identifier
   */
  const handleSignAgreement = async (enquiryId: string) => {
    await api.signAgreement(enquiryId);
    const updated = await api.getEnquiries();
    setEnquiries(updated);
    weddingCtx.refreshEnquiries();

    if (currentWedding) {
      const updatedWeddings = weddings.map(w =>
        w.id === currentWedding.id ? { ...w, agreementSigned: true } : w
      );
      setWeddings(updatedWeddings);
      setCurrentWedding({ ...currentWedding, agreementSigned: true });
      weddingCtx.refreshWeddings();
    }
  };

  /**
   * Selects the winning caterer proposal from a 3-way RFQ comparison,
   * binding it to the wedding ledger and rejecting alternate quotes.
   *
   * @param quoteId - Winning quotation identifier
   */
  const handleSelectWinningCaterer = async (quoteId: string) => {
    const updated = await api.selectWinningCaterer(quoteId);
    setQuotes(updated);
  };

  /**
   * Updates the workflow progress stage of a planning task with optional blocked reason.
   *
   * @param taskId - Task identifier
   * @param stage - New workflow stage
   * @param blockedReason - Optional justification when task is blocked
   */
  const handleUpdateTaskStage = async (taskId: string, stage: WeddingTask['stage'], blockedReason?: string) => {
    const updated = await api.updateTaskStage(taskId, stage, blockedReason);
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
  };

  /**
   * Appends a newly created task to the planning board.
   *
   * @param taskData - Task attributes excluding auto-generated ID
   */
  const handleCreateTask = async (taskData: Omit<WeddingTask, 'id'>) => {
    const created = await api.createTask(taskData);
    setTasks(prev => [created, ...prev]);
  };

  /**
   * Checks in a vendor at the venue dock, recording timestamp and punctuality status.
   *
   * @param arrivalId - Vendor arrival log identifier
   */
  const handleCheckinVendor = async (arrivalId: string) => {
    const updated = await api.checkinVendor(arrivalId);
    setArrivals(prev => prev.map(a => a.id === arrivalId ? updated : a));
  };

  /**
   * Acknowledges a timeline delay on behalf of a vendor.
   *
   * @param delayId - Delay log identifier
   * @param vendorId - Target vendor identifier
   * @param note - Optional acknowledgment notes
   */
  const handleAcknowledgeDelay = async (delayId: string, vendorId: string, note?: string) => {
    const updated = await api.acknowledgeDelayInstruction(delayId, vendorId, note);
    setDelays(prev => prev.map(d => d.id === delayId ? updated : d));
  };

  /**
   * Flags an operational conflict or problem regarding a proposed schedule shift.
   *
   * @param delayId - Delay log identifier
   * @param vendorId - Reporting vendor identifier
   * @param note - Description of the schedule conflict
   */
  const handleReportDelayProblem = async (delayId: string, vendorId: string, note: string) => {
    const updated = await api.reportDelayProblem(delayId, vendorId, note);
    setDelays(prev => prev.map(d => d.id === delayId ? updated : d));
  };

  /**
   * Submits a newly proposed timeline change with dependent activity shift calculations.
   *
   * @param data - Proposal payload containing revised start/end times and reason
   */
  const handleProposeScheduleChange = async (data: any) => {
    const created = await api.proposeScheduleChange(data);
    setDelays(prev => [created, ...prev]);
    return created;
  };

  /**
   * Approves a pending schedule change proposal.
   *
   * @param delayId - Delay/change log identifier
   * @param approver - Authorizing planner or founder name
   */
  const handleApproveScheduleChange = async (delayId: string, approver: string) => {
    const updated = await api.approveScheduleChange(delayId, approver);
    setDelays(prev => prev.map(d => d.id === delayId ? updated : d));
    return updated;
  };

  /**
   * Publishes an approved schedule change, incrementing schedule version and syncing run-sheet.
   *
   * @param delayId - Delay/change identifier
   */
  const handlePublishScheduleChange = async (delayId: string) => {
    const updated = await api.publishScheduleChange(delayId);
    setDelays(prev => prev.map(d => d.id === delayId ? updated : d));
    if (currentWedding) {
      const refreshedRunSheet = await api.getRunSheet(currentWedding.id);
      setRunSheet(refreshedRunSheet);
    }
    return updated;
  };

  /**
   * Creates a new live wedding-day incident log.
   *
   * @param incidentData - Incident attributes (title, severity, affected vendor)
   */
  const handleCreateIncident = async (incidentData: any) => {
    const created = await api.createIncident(incidentData);
    setIncidents(prev => [created, ...prev]);
    return created;
  };

  /**
   * Updates an individual activity within the minute-by-minute execution run sheet.
   *
   * @param itemId - Run sheet line item identifier
   * @param updates - Partial attributes to apply
   */
  const handleUpdateRunSheetItem = async (itemId: string, updates: Partial<RunSheetItem>) => {
    const updated = await api.updateRunSheetItem(itemId, updates);
    setRunSheet(prev => prev.map(r => r.id === itemId ? updated : r));
    return updated;
  };

  /**
   * Resolves an open wedding-day incident with documented resolution actions.
   *
   * @param incidentId - Incident identifier
   * @param note - Resolution notes and corrective measures
   */
  const handleResolveIncident = async (incidentId: string, note: string) => {
    const updated = await api.resolveIncident(incidentId, note);
    setIncidents(prev => prev.map(i => i.id === incidentId ? updated : i));
  };

  /**
   * Registers a new on-the-day change order.
   *
   * @param orderData - Change order payload (category, items, unit price, quantity)
   */
  const handleCreateChangeOrder = async (orderData: any) => {
    const created = await api.createChangeOrder(orderData);
    setChangeOrders(prev => [created, ...prev]);
  };

  /**
   * Authorizes a change order and refreshes vendor settlements and client payment balances.
   *
   * @param orderId - Change order identifier
   */
  const handleApproveChangeOrder = async (orderId: string) => {
    const updated = await api.approveChangeOrder(orderId);
    setChangeOrders(prev => prev.map(c => c.id === orderId ? updated : c));
    if (currentWedding) {
      const [refreshedSettlements, refreshedCps] = await Promise.all([
        api.getSettlements(currentWedding.id),
        api.getClientPaymentSummary(currentWedding.id)
      ]);
      setSettlements(refreshedSettlements);
      setClientPaymentSummary(refreshedCps);
    }
  };

  /**
   * Records a client milestone payment and updates live client receivables.
   *
   * @param milestoneId - Milestone identifier
   * @param paymentData - Payment transaction details
   */
  const handleRecordClientPayment = async (milestoneId: string, paymentData: any) => {
    if (!currentWedding) return;
    const updated = await api.recordClientPayment(currentWedding.id, milestoneId, paymentData);
    setClientPaymentSummary(updated);
  };

  /**
   * Disburses vendor final bill payout with anti-duplicate guard protection.
   *
   * @param settlementId - Vendor settlement identifier
   */
  const handleDisbursePayment = async (settlementId: string) => {
    try {
      const updated = await api.settleVendorFinalBill(settlementId);
      setSettlements(prev => prev.map(s => s.id === settlementId ? updated : s));
    } catch (err: any) {
      alert(err.message || 'Payment blocked by duplicate-safeguard rule.');
    }
  };

  // Preview Mode for Authenticated Users wanting to view Public Showcase
  if (showPublicLanding) {
    return (
      <div>
        <div className="bg-[#0D1B2A] text-white px-4 py-2 border-b border-[#C5A059]/40 flex items-center justify-between text-xs sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Signed in as <strong>{user?.displayName}</strong> ({user?.role}) · Previewing Public Showcase
            </span>
          </div>
          <button
            onClick={() => handleSetShowPublicLanding(false)}
            className="px-3 py-1 rounded-lg bg-[#C5A059] text-[#0D1B2A] font-bold text-xs hover:bg-[#d8b46e] transition-colors"
          >
            &larr; Return to Workspace
          </button>
        </div>
        <LandingPage
          onEnterPortal={() => handleSetShowPublicLanding(false)}
          onNavigateToLogin={() => handleSetShowPublicLanding(false)}
        />
      </div>
    );
  }

  // 1. Unauthenticated Views: Landing Page & Auth Suite
  if (!isAuthenticated) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onEnterPortal={() => {}}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
    if (authView === 'invite') {
      return (
        <InvitationAcceptPage
          token="trk-invite-exec-2026"
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
    if (authView === 'forgot') {
      return (
        <ForgotPasswordPage
          onNavigateToLogin={() => setAuthView('login')}
          onNavigateToReset={() => setAuthView('reset')}
        />
      );
    }
    if (authView === 'reset') {
      return (
        <ResetPasswordPage
          token="trk-pwd-token-9812"
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginPage
        onNavigateToForgotPassword={() => setAuthView('forgot')}
        onNavigateToInvite={() => setAuthView('invite')}
        onBackToLanding={() => setAuthView('landing')}
      />
    );
  }

  // 2. Vendor Partner Portal View (Strictly gated for Vendor roles)
  if (user?.role === 'VENDOR' || (activePortal === 'VENDOR' && user?.role !== 'CLIENT' && user?.role !== 'FAMILY')) {
    return (
      <VendorPortalLayout
        currentTab={currentVendorTab}
        onSelectTab={setCurrentVendorTab}
        pendingAckCount={1}
      >
        {currentVendorTab === 'overview' && (
          <VendorOverviewPage
            onNavigateTab={setCurrentVendorTab}
            pendingAckCount={1}
          />
        )}
        {currentVendorTab === 'schedule' && (
          <VendorScheduleAckPage />
        )}
        {currentVendorTab === 'invoices' && (
          <VendorInvoicesPage />
        )}
        {currentVendorTab === 'issue' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
              Urgent Operational Issue Report
            </h3>
            <p className="text-xs text-slate-500">
              Submit immediate equipment, power, or kitchen constraints directly to Command Centre.
            </p>
            <textarea
              rows={4}
              placeholder="e.g. Banquet stove generator required at Service Dock B..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#C5A059]"
            />
            <button
              onClick={() => {
                alert('Incident dispatched directly to Lead Coordinator Priya Mehra!');
                setCurrentVendorTab('overview');
              }}
              className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
            >
              Dispatch High-Priority Alert
            </button>
          </div>
        )}
      </VendorPortalLayout>
    );
  }

  // 3. Client / Couple & Family Portal View (Strictly gated for Client & Family roles)
  if (user?.role === 'CLIENT' || user?.role === 'FAMILY' || activePortal === 'CLIENT') {
    return (
      <ClientPortalLayout
        currentTab={currentClientTab}
        onSelectTab={setCurrentClientTab}
      >
        {currentClientTab === 'overview' && (
          <ClientOverviewPage onNavigateTab={setCurrentClientTab} />
        )}
        {currentClientTab === 'schedule' && (
          <ClientSchedulePage />
        )}
        {currentClientTab === 'documents' && (
          <ClientDocumentsPage />
        )}
        {currentClientTab === 'payments' && (
          <ClientPaymentsPage />
        )}
      </ClientPortalLayout>
    );
  }

  // 4. Default: Agency Workspace (Founder, Planner, Coordinator, Finance)
  if (!currentWedding || !metrics) {
    return (
      <PageLoadingScreen
        message="Initializing The Royal Knot Platform..."
        submessage="Synchronizing luxury wedding operations and high-security palace protocol"
      />
    );
  }

  const activeLateCount = arrivals.filter(a => a.isLate && a.status === 'LATE').length;
  const openIncidentsCount = incidents.filter(i => i.status !== 'RESOLVED').length;

  return (
    <AppLayout
      currentTab={currentAgencyTab}
      onSelectTab={setCurrentAgencyTab}
      currentWedding={currentWedding}
      weddingsList={weddings}
      onSelectWedding={handleSelectWedding}
      onResetDemoData={api.resetDemoData}
      onViewShowcase={() => handleSetShowPublicLanding(true)}
      activeLateCount={activeLateCount}
      openIncidentsCount={openIncidentsCount}
      isBackendConnected={isBackendConnected}
    >
      {currentAgencyTab === 'overview' && (
        <OverviewPage
          metrics={metrics}
          weddings={weddings}
          onSelectWedding={handleSelectWedding}
          onNavigateToTab={setCurrentAgencyTab}
        />
      )}

      {currentAgencyTab === 'enquiries' && (
        <EnquiriesPage
          enquiries={enquiries}
          onSignAgreement={handleSignAgreement}
          onNavigateToTab={setCurrentAgencyTab}
          onRefreshEnquiries={async () => {
            const enq = await api.getEnquiries();
            setEnquiries(enq);
          }}
        />
      )}

      {currentAgencyTab === 'clients' && (
        <ClientsPage
          weddings={weddings}
          onNavigateToTab={setCurrentAgencyTab}
          onSelectWedding={handleSelectWedding}
        />
      )}

      {currentAgencyTab === 'weddings' && (
        <WeddingsPage
          weddings={weddings}
          currentWedding={currentWedding}
          onSelectWedding={handleSelectWedding}
          onNavigateToTab={setCurrentAgencyTab}
        />
      )}

      {currentAgencyTab === 'vendors' && (
        <VendorsPage />
      )}

      {currentAgencyTab === 'quotations' && (
        <QuotationsPage
          quotes={quotes}
          currentWedding={currentWedding}
          onSelectWinner={handleSelectWinningCaterer}
          onNavigateToTab={setCurrentAgencyTab}
        />
      )}

      {currentAgencyTab === 'tasks' && (
        <PlanningTasksPage
          tasks={tasks}
          currentWedding={currentWedding}
          onUpdateStage={handleUpdateTaskStage}
          onCreateTask={handleCreateTask}
        />
      )}

      {currentAgencyTab === 'command-centre' && (
        <CommandCentrePage
          runSheet={runSheet}
          arrivals={arrivals}
          delays={delays}
          incidents={incidents}
          onCheckinVendor={handleCheckinVendor}
          onAcknowledgeInstruction={handleAcknowledgeDelay}
          onReportDelayProblem={handleReportDelayProblem}
          onResolveIncident={handleResolveIncident}
          onProposeScheduleChange={handleProposeScheduleChange}
          onApproveScheduleChange={handleApproveScheduleChange}
          onPublishScheduleChange={handlePublishScheduleChange}
          onCreateIncident={handleCreateIncident}
          onUpdateRunSheetItem={handleUpdateRunSheetItem}
        />
      )}

      {currentAgencyTab === 'finance' && (
        <FinancePage
          currentWedding={currentWedding}
          weddingsList={weddings}
          onSelectWedding={handleSelectWedding}
          changeOrders={changeOrders}
          settlements={settlements}
          clientPaymentSummary={clientPaymentSummary || undefined}
          onDisbursePayment={handleDisbursePayment}
          onApproveChangeOrder={handleApproveChangeOrder}
          onCreateChangeOrder={handleCreateChangeOrder}
          onRecordClientPayment={handleRecordClientPayment}
        />
      )}

      {currentAgencyTab === 'reports' && (
        <ReportsPage metrics={metrics} weddingsList={weddings} />
      )}

      {currentAgencyTab === 'accounts' && (
        <TeamAccountsPage
          weddings={weddings}
          onNavigateToTab={setCurrentAgencyTab}
        />
      )}

      {currentAgencyTab === 'settings' && (
        <SettingsPage onNavigateToTab={setCurrentAgencyTab} />
      )}
    </AppLayout>
  );
}

/**
 * Root App component
 *
 * Top-level application shell wrapping the system in AuthProvider,
 * WeddingProvider, and DashboardUiProvider contexts.
 */
export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WeddingProvider>
          <DashboardUiProvider>
            <MainApplicationRouter />
          </DashboardUiProvider>
        </WeddingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
