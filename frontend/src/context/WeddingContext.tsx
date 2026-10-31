import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Wedding, Enquiry } from '../types';
import { api } from '../services/api';

interface WeddingContextType {
  activeWedding: Wedding | null;
  activeWeddingId: string | null;
  weddingsList: Wedding[];
  selectedEnquiryId: string | null;
  selectedEnquiry: Enquiry | null;
  enquiriesList: Enquiry[];
  isLoading: boolean;
  selectWedding: (weddingId: string) => void;
  selectEnquiry: (enquiryId: string) => void;
  refreshWeddings: () => Promise<void>;
  refreshEnquiries: () => Promise<void>;
}

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

/**
 * WeddingProvider component
 *
 * Wedding context provider managing active wedding selection and cross-cutting wedding metadata.
 */
export const WeddingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [weddingsList, setWeddingsList] = useState<Wedding[]>([]);
  const [enquiriesList, setEnquiriesList] = useState<Enquiry[]>([]);
  const [activeWeddingId, setActiveWeddingId] = useState<string | null>(null);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshWeddings = useCallback(async () => {
    try {
      const list = await api.getWeddings();
      setWeddingsList(list);
      if (list.length > 0 && !activeWeddingId) {
        setActiveWeddingId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load weddings:', err);
    }
  }, [activeWeddingId]);

  const refreshEnquiries = useCallback(async () => {
    try {
      const list = await api.getEnquiries();
      setEnquiriesList(list);
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([api.getWeddings(), api.getEnquiries()])
      .then(([wList, eList]) => {
        setWeddingsList(wList);
        setEnquiriesList(eList);
        if (wList.length > 0) {
          const first = wList[0];
          setActiveWeddingId(first.id);

          // Find matching enquiry for this wedding by weddingId or coupleName
          const matchEnq = eList.find(e => e.weddingId === first.id || e.coupleName === first.coupleNames);
          if (matchEnq) {
            setSelectedEnquiryId(matchEnq.id);
          } else if (eList.length > 0) {
            setSelectedEnquiryId(eList[0].id);
          }
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selectWedding = useCallback((weddingId: string) => {
    setActiveWeddingId(weddingId);
    // Automatically synchronize selected enquiry
    const wed = weddingsList.find(w => w.id === weddingId);
    const matchEnq = enquiriesList.find(e => e.weddingId === weddingId || (wed && e.coupleName === wed.coupleNames));
    if (matchEnq) {
      setSelectedEnquiryId(matchEnq.id);
    }
  }, [enquiriesList, weddingsList]);

  const selectEnquiry = useCallback((enquiryId: string) => {
    setSelectedEnquiryId(enquiryId);
    // If the enquiry has an associated wedding, synchronize active wedding
    const enq = enquiriesList.find(e => e.id === enquiryId);
    if (enq) {
      const linkedWedding = weddingsList.find(w => (enq.weddingId && w.id === enq.weddingId) || w.coupleNames === enq.coupleName);
      if (linkedWedding) {
        setActiveWeddingId(linkedWedding.id);
      }
    }
  }, [enquiriesList, weddingsList]);

  const activeWedding = weddingsList.find(w => w.id === activeWeddingId) || null;
  const selectedEnquiry = enquiriesList.find(e => e.id === selectedEnquiryId) || null;

  return (
    <WeddingContext.Provider
      value={{
        activeWedding,
        activeWeddingId,
        weddingsList,
        selectedEnquiryId,
        selectedEnquiry,
        enquiriesList,
        isLoading,
        selectWedding,
        selectEnquiry,
        refreshWeddings,
        refreshEnquiries
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
};

/** Hook to access active wedding context and selection handler. */
export const useWedding = () => {
  const context = useContext(WeddingContext);
  if (!context) {
    throw new Error('useWedding must be used within a WeddingProvider');
  }
  return context;
};
