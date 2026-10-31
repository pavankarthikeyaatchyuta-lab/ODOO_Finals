import React, { useState } from 'react';
import { Sidebar, NavItemKey } from './Sidebar';
import { TopHeader } from './TopHeader';
import { Wedding } from '../../types';

export interface AppLayoutProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  currentWedding: Wedding;
  weddingsList: Wedding[];
  onSelectWedding: (wedding: Wedding) => void;
  onResetDemoData: () => void;
  activeLateCount?: number;
  openIncidentsCount?: number;
  isBackendConnected?: boolean;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  currentWedding,
  weddingsList,
  onSelectWedding,
  onResetDemoData,
  activeLateCount = 0,
  openIncidentsCount = 0,
  isBackendConnected = false,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FDFBF7] text-[#0D1B2A] overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        activeLateCount={activeLateCount}
        openIncidentsCount={openIncidentsCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopHeader
          currentWedding={currentWedding}
          weddingsList={weddingsList}
          onSelectWedding={onSelectWedding}
          onResetDemoData={onResetDemoData}
          activeLateCount={activeLateCount}
          isBackendConnected={isBackendConnected}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
