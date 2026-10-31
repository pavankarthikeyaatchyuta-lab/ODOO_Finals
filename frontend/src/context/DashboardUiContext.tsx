import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useWedding } from './WeddingContext';

export interface DashboardUiState {
  tableFilters: Record<string, Record<string, any>>;
  pagination: Record<string, number>;
  formDrafts: Record<string, any>;
  scrollPositions: Record<string, number>;
}

interface DashboardUiContextValue {
  getFilter: <T = any>(moduleKey: string, filterKey: string, defaultValue: T) => T;
  setFilter: (moduleKey: string, filterKey: string, value: any) => void;
  getPagination: (moduleKey: string, defaultPage?: number) => number;
  setPagination: (moduleKey: string, page: number) => void;
  getDraft: <T = any>(formKey: string, defaultDraft: T) => T;
  setDraft: (formKey: string, draft: any) => void;
  clearDraft: (formKey: string) => void;
  getScroll: (routeKey: string) => number;
  setScroll: (routeKey: string, yOffset: number) => void;
  resetModuleState: (moduleKey: string) => void;
  clearAllUiState: () => void;
}

const DashboardUiContext = createContext<DashboardUiContextValue | null>(null);

/**
 * DashboardUiProvider component
 *
 * UI state context provider maintaining view filters, pagination, and search terms.
 */
export const DashboardUiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { activeWeddingId } = useWedding();

  const [tableFilters, setTableFilters] = useState<Record<string, Record<string, any>>>({});
  const [pagination, setPaginationState] = useState<Record<string, number>>({});
  const [formDrafts, setFormDrafts] = useState<Record<string, any>>({});
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({});

  // Scope prefix: guarantees isolation per authenticated user and active wedding
  const scopePrefix = useMemo(
    () => `${user?.id || 'anon'}::${activeWeddingId || 'global'}::`,
    [user?.id, activeWeddingId]
  );

  // Clear all cached transient UI state on logout
  useEffect(() => {
    if (!user) {
      setTableFilters({});
      setPaginationState({});
      setFormDrafts({});
      setScrollPositions({});
    }
  }, [user]);

  const clearAllUiState = useCallback(() => {
    setTableFilters({});
    setPaginationState({});
    setFormDrafts({});
    setScrollPositions({});
  }, []);

  const getScopedKey = useCallback((key: string) => `${scopePrefix}${key}`, [scopePrefix]);

  const getFilter = useCallback(
    <T,>(moduleKey: string, filterKey: string, defaultValue: T): T => {
      const scopedKey = getScopedKey(moduleKey);
      const moduleFilters = tableFilters[scopedKey];
      if (!moduleFilters || moduleFilters[filterKey] === undefined) {
        return defaultValue;
      }
      return moduleFilters[filterKey] as T;
    },
    [tableFilters, getScopedKey]
  );

  const setFilter = useCallback(
    (moduleKey: string, filterKey: string, value: any) => {
      const scopedKey = getScopedKey(moduleKey);
      setTableFilters(prev => ({
        ...prev,
        [scopedKey]: {
          ...(prev[scopedKey] || {}),
          [filterKey]: value
        }
      }));
    },
    [getScopedKey]
  );

  const getPagination = useCallback(
    (moduleKey: string, defaultPage = 1): number => {
      const scopedKey = getScopedKey(moduleKey);
      return pagination[scopedKey] ?? defaultPage;
    },
    [pagination, getScopedKey]
  );

  const setPagination = useCallback(
    (moduleKey: string, page: number) => {
      const scopedKey = getScopedKey(moduleKey);
      setPaginationState(prev => ({
        ...prev,
        [scopedKey]: page
      }));
    },
    [getScopedKey]
  );

  const getDraft = useCallback(
    <T,>(formKey: string, defaultDraft: T): T => {
      const scopedKey = getScopedKey(formKey);
      return formDrafts[scopedKey] !== undefined ? (formDrafts[scopedKey] as T) : defaultDraft;
    },
    [formDrafts, getScopedKey]
  );

  const setDraft = useCallback(
    (formKey: string, draft: any) => {
      const scopedKey = getScopedKey(formKey);
      setFormDrafts(prev => ({
        ...prev,
        [scopedKey]: draft
      }));
    },
    [getScopedKey]
  );

  const clearDraft = useCallback(
    (formKey: string) => {
      const scopedKey = getScopedKey(formKey);
      setFormDrafts(prev => {
        const next = { ...prev };
        delete next[scopedKey];
        return next;
      });
    },
    [getScopedKey]
  );

  const getScroll = useCallback(
    (routeKey: string): number => {
      const scopedKey = getScopedKey(routeKey);
      return scrollPositions[scopedKey] ?? 0;
    },
    [scrollPositions, getScopedKey]
  );

  const setScroll = useCallback(
    (routeKey: string, yOffset: number) => {
      const scopedKey = getScopedKey(routeKey);
      setScrollPositions(prev => ({
        ...prev,
        [scopedKey]: yOffset
      }));
    },
    [getScopedKey]
  );

  const resetModuleState = useCallback(
    (moduleKey: string) => {
      const scopedKey = getScopedKey(moduleKey);
      setTableFilters(prev => {
        const next = { ...prev };
        delete next[scopedKey];
        return next;
      });
      setPaginationState(prev => {
        const next = { ...prev };
        delete next[scopedKey];
        return next;
      });
    },
    [getScopedKey]
  );

  const contextValue = useMemo<DashboardUiContextValue>(
    () => ({
      getFilter,
      setFilter,
      getPagination,
      setPagination,
      getDraft,
      setDraft,
      clearDraft,
      getScroll,
      setScroll,
      resetModuleState,
      clearAllUiState
    }),
    [
      getFilter,
      setFilter,
      getPagination,
      setPagination,
      getDraft,
      setDraft,
      clearDraft,
      getScroll,
      setScroll,
      resetModuleState,
      clearAllUiState
    ]
  );

  return (
    <DashboardUiContext.Provider value={contextValue}>
      {children}
    </DashboardUiContext.Provider>
  );
};

export const useDashboardUiState = (): DashboardUiContextValue => {
  const context = useContext(DashboardUiContext);
  if (!context) {
    throw new Error('useDashboardUiState must be used within a DashboardUiProvider');
  }
  return context;
};
