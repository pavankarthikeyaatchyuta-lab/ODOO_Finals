import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { NavItemKey } from './components/layout/Sidebar';
import { api } from './services/api';

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
import { SettingsPage } from './pages/SettingsPage';

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
} from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('overview');
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
  const [metrics, setMetrics] = useState<SeasonMetrics | null>(null);

  // Initial Data Load
  useEffect(() => {
    async function loadData() {
      const wList = await api.getWeddings();
      setWeddings(wList);
      if (wList.length > 0) {
        const defaultWed = wList[0];
        setCurrentWedding(defaultWed);
        loadWeddingContext(defaultWed.id);
      }

      const enq = await api.getEnquiries();
      setEnquiries(enq);

      const m = await api.getSeasonMetrics();
      setMetrics(m);
    }
    loadData();
  }, []);

  const loadWeddingContext = async (weddingId: string) => {
    const [q, t, r, a, d, i, c, s] = await Promise.all([
      api.getCatererQuotes(weddingId),
      api.getTasks(weddingId),
      api.getRunSheet(weddingId),
      api.getVendorArrivals(weddingId),
      api.getDelays(weddingId),
      api.getIncidents(weddingId),
      api.getChangeOrders(weddingId),
      api.getSettlements(weddingId)
    ]);

    setQuotes(q);
    setTasks(t);
    setRunSheet(r);
    setArrivals(a);
    setDelays(d);
    setIncidents(i);
    setChangeOrders(c);
    setSettlements(s);
  };

  const handleSelectWedding = (wedding: Wedding) => {
    setCurrentWedding(wedding);
    loadWeddingContext(wedding.id);
  };

  // Scenario 1: Digital Agreement Signing
  const handleSignAgreement = async (enquiryId: string) => {
    await api.signAgreement(enquiryId);
    const updated = await api.getEnquiries();
    setEnquiries(updated);

    // Also update active wedding agreement status if matches
    if (currentWedding) {
      const updatedWeddings = weddings.map(w =>
        w.id === currentWedding.id ? { ...w, agreementSigned: true } : w
      );
      setWeddings(updatedWeddings);
      setCurrentWedding({ ...currentWedding, agreementSigned: true });
    }
  };

  // Scenario 2: 3-Caterer Selection
  const handleSelectWinningCaterer = async (quoteId: string) => {
    const updated = await api.selectWinningCaterer(quoteId);
    setQuotes(updated);
  };

  // Scenario 3: Task Stage Update
  const handleUpdateTaskStage = async (taskId: string, stage: WeddingTask['stage'], blockedReason?: string) => {
    const updated = await api.updateTaskStage(taskId, stage, blockedReason);
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
  };

  const handleCreateTask = async (taskData: Omit<WeddingTask, 'id'>) => {
    const created = await api.createTask(taskData);
    setTasks(prev => [created, ...prev]);
  };

  // Scenario 4: Vendor Arrival Check-In
  const handleCheckinVendor = async (arrivalId: string) => {
    const updated = await api.checkinVendor(arrivalId);
    setArrivals(prev => prev.map(a => a.id === arrivalId ? updated : a));
  };

  // Key Differentiator: Closed-Loop Vendor Acknowledgement
  const handleAcknowledgeDelay = async (delayId: string, vendorId: string) => {
    const updated = await api.acknowledgeDelayInstruction(delayId, vendorId);
    setDelays(prev => prev.map(d => d.id === delayId ? updated : d));
  };

  // Scenario 4: Incident Resolution
  const handleResolveIncident = async (incidentId: string, note: string) => {
    const updated = await api.resolveIncident(incidentId, note);
    setIncidents(prev => prev.map(i => i.id === incidentId ? updated : i));
  };

  // Scenario 5: Change Order Approval
  const handleApproveChangeOrder = async (orderId: string) => {
    const updated = await api.approveChangeOrder(orderId);
    setChangeOrders(prev => prev.map(c => c.id === orderId ? updated : c));
  };

  // Scenario 5: Vendor Settlement with Anti-Duplicate Protection
  const handleDisbursePayment = async (settlementId: string) => {
    try {
      const updated = await api.settleVendorFinalBill(settlementId);
      setSettlements(prev => prev.map(s => s.id === settlementId ? updated : s));
    } catch (err: any) {
      alert(err.message || 'Payment blocked by duplicate-safeguard rule.');
    }
  };

  if (!currentWedding || !metrics) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FDFBF7] text-[#0D1B2A]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-serif font-bold text-lg">Initializing The Royal Knot Platform...</p>
        </div>
      </div>
    );
  }

  const activeLateCount = arrivals.filter(a => a.isLate && a.status === 'LATE').length;
  const openIncidentsCount = incidents.filter(i => i.status !== 'RESOLVED').length;

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      currentWedding={currentWedding}
      weddingsList={weddings}
      onSelectWedding={handleSelectWedding}
      onResetDemoData={api.resetDemoData}
      activeLateCount={activeLateCount}
      openIncidentsCount={openIncidentsCount}
    >
      {currentTab === 'overview' && (
        <OverviewPage
          metrics={metrics}
          weddings={weddings}
          onSelectWedding={handleSelectWedding}
          onNavigateToTab={setCurrentTab}
        />
      )}

      {currentTab === 'enquiries' && (
        <EnquiriesPage
          enquiries={enquiries}
          onSignAgreement={handleSignAgreement}
          onNavigateToTab={setCurrentTab}
          onRefreshEnquiries={async () => {
            const enq = await api.getEnquiries();
            setEnquiries(enq);
          }}
        />
      )}

      {currentTab === 'clients' && (
        <ClientsPage
          weddings={weddings}
          onNavigateToTab={setCurrentTab}
          onSelectWedding={handleSelectWedding}
        />
      )}

      {currentTab === 'weddings' && (
        <WeddingsPage
          weddings={weddings}
          currentWedding={currentWedding}
          onSelectWedding={handleSelectWedding}
          onNavigateToTab={setCurrentTab}
        />
      )}

      {currentTab === 'vendors' && (
        <VendorsPage />
      )}

      {currentTab === 'quotations' && (
        <QuotationsPage
          quotes={quotes}
          currentWedding={currentWedding}
          onSelectWinner={handleSelectWinningCaterer}
          onNavigateToTab={setCurrentTab}
        />
      )}

      {currentTab === 'tasks' && (
        <PlanningTasksPage
          tasks={tasks}
          currentWedding={currentWedding}
          onUpdateStage={handleUpdateTaskStage}
          onCreateTask={handleCreateTask}
        />
      )}

      {currentTab === 'command-centre' && (
        <CommandCentrePage
          runSheet={runSheet}
          arrivals={arrivals}
          delays={delays}
          incidents={incidents}
          onCheckinVendor={handleCheckinVendor}
          onAcknowledgeInstruction={handleAcknowledgeDelay}
          onResolveIncident={handleResolveIncident}
        />
      )}

      {currentTab === 'finance' && (
        <FinancePage
          currentWedding={currentWedding}
          changeOrders={changeOrders}
          settlements={settlements}
          onDisbursePayment={handleDisbursePayment}
          onApproveChangeOrder={handleApproveChangeOrder}
        />
      )}

      {currentTab === 'reports' && (
        <ReportsPage metrics={metrics} />
      )}

      {currentTab === 'settings' && (
        <SettingsPage />
      )}
    </AppLayout>
  );
}

export default App;
