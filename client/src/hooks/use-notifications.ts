import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface NotificationCounts {
  rfis: number;
  compensationEvents: number;
  earlyWarnings: number;
  nonConformanceReports: number;
  equipmentHires: number;
}

interface NewItem {
  id: number;
  title: string;
  reference?: string;
  type: string;
  createdAt: string;
  isNew: boolean;
}

export function useNotifications(projectId: number) {
  const [lastViewedTimes, setLastViewedTimes] = useState<Record<string, string>>({});

  // Load last viewed times from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`notifications-${projectId}`);
    if (stored) {
      setLastViewedTimes(JSON.parse(stored));
    }
  }, [projectId]);

  // Save last viewed times to localStorage
  const updateLastViewed = (type: string) => {
    const now = new Date().toISOString();
    const updated = { ...lastViewedTimes, [type]: now };
    setLastViewedTimes(updated);
    localStorage.setItem(`notifications-${projectId}`, JSON.stringify(updated));
  };

  // Query to get notification counts
  const { data: counts } = useQuery({
    queryKey: [`/api/projects/${projectId}/notifications/counts`],
    enabled: !!projectId,
  });

  // Query to get new items details
  const { data: newItems } = useQuery({
    queryKey: [`/api/projects/${projectId}/notifications/new-items`],
    enabled: !!projectId,
  });

  return {
    counts: counts as NotificationCounts,
    newItems: newItems as NewItem[],
    lastViewedTimes,
    updateLastViewed,
  };
}