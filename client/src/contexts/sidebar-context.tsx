import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface ActivityCounts {
  compensationEvents: number;
  earlyWarnings: number;
  rfis: number;
  ncrs: number;
  pendingSuppliers: number;
  equipmentHire: number;
}

interface CollapsibleSections {
  templates: boolean;
  contractManagement: boolean;
  programme: boolean;
  financial: boolean;
  resources: boolean;
  utility: boolean;
}

interface SidebarContextType {
  activityCounts: ActivityCounts;
  collapsedSections: CollapsibleSections;
  toggleSection: (section: keyof CollapsibleSections) => void;
  refreshActivityCounts: () => Promise<void>;
  projectId: number | null;
  setProjectId: (id: number | null) => void;
}

const defaultActivityCounts: ActivityCounts = {
  compensationEvents: 0,
  earlyWarnings: 0,
  rfis: 0,
  ncrs: 0,
  pendingSuppliers: 0,
  equipmentHire: 0
};

const defaultCollapsedSections: CollapsibleSections = {
  templates: false,
  contractManagement: false,
  programme: false,
  financial: false,
  resources: false,
  utility: false
};

export const SidebarContext = createContext<SidebarContextType>({
  activityCounts: defaultActivityCounts,
  collapsedSections: defaultCollapsedSections,
  toggleSection: () => {},
  refreshActivityCounts: async () => {},
  projectId: null,
  setProjectId: () => {}
});

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activityCounts, setActivityCounts] = useState<ActivityCounts>(defaultActivityCounts);
  const [collapsedSections, setCollapsedSections] = useState<CollapsibleSections>(() => {
    // Try to load from localStorage if available
    const saved = localStorage.getItem('sidebarCollapsedSections');
    return saved ? JSON.parse(saved) : defaultCollapsedSections;
  });
  const [projectId, setProjectId] = useState<number | null>(null);

  const toggleSection = (section: keyof CollapsibleSections) => {
    const newState = {
      ...collapsedSections,
      [section]: !collapsedSections[section]
    };
    setCollapsedSections(newState);
    // Save to localStorage
    localStorage.setItem('sidebarCollapsedSections', JSON.stringify(newState));
  };

  const refreshActivityCounts = async () => {
    if (!projectId) return;

    try {
      // Fetch pending compensation events
      const ceResponse = await apiRequest('GET', `/api/projects/${projectId}/compensation-events`);
      const ceData = await ceResponse.json();
      const pendingCEs = ceData.filter((ce: any) => 
        ce.status === 'pending' || ce.status === 'under_review'
      ).length;

      // Fetch early warnings with high impact
      const ewResponse = await apiRequest('GET', `/api/projects/${projectId}/early-warnings`);
      const ewData = await ewResponse.json();
      const urgentEWs = ewData.filter((ew: any) => 
        ew.impact === 'high' && ew.status !== 'resolved'
      ).length;

      // Fetch overdue RFIs
      const rfiResponse = await apiRequest('GET', `/api/projects/${projectId}/rfis`);
      const rfiData = await rfiResponse.json();
      const overdueRfis = rfiData.filter((rfi: any) => {
        const today = new Date();
        const responseDate = new Date(rfi.plannedResponseDate);
        return !rfi.actualResponseDate && responseDate < today;
      }).length;

      // Fetch unresolved NCRs
      const ncrResponse = await apiRequest('GET', `/api/projects/${projectId}/non-conformance-reports`);
      const ncrData = await ncrResponse.json();
      const unresolvedNcrs = ncrData.filter((ncr: any) => 
        ncr.status !== 'resolved' && ncr.status !== 'closed'
      ).length;

      // If we had supplier and equipment endpoints, we would fetch them here
      // For now using placeholder values
      const pendingSuppliers = 0;
      const equipmentHire = 0;

      setActivityCounts({
        compensationEvents: pendingCEs,
        earlyWarnings: urgentEWs,
        rfis: overdueRfis,
        ncrs: unresolvedNcrs,
        pendingSuppliers,
        equipmentHire
      });
    } catch (error) {
      console.error('Error fetching activity counts:', error);
    }
  };

  // Refresh activity counts when projectId changes
  useEffect(() => {
    if (projectId) {
      refreshActivityCounts();
      
      // Set up interval to refresh counts every 5 minutes
      const intervalId = setInterval(refreshActivityCounts, 5 * 60 * 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [projectId]);

  return (
    <SidebarContext.Provider 
      value={{ 
        activityCounts, 
        collapsedSections, 
        toggleSection, 
        refreshActivityCounts,
        projectId,
        setProjectId
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);