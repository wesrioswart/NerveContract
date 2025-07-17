import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import StakeholderNotificationSystem from '@/components/stakeholder-notifications/stakeholder-notification-system';

export default function StakeholderNotifications() {
  const [, setLocation] = useLocation();
  const [approvalData, setApprovalData] = useState<any>(null);

  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const approvalRef = urlParams.get('approval');
    const documentType = urlParams.get('documentType') || 'Programme Revision';
    
    if (approvalRef) {
      // Mock approval data based on the approval reference
      const mockApprovalData = {
        approvalReference: approvalRef,
        documentType,
        impact: {
          delayDays: approvalRef.includes('WEATHER') ? 2 : 1,
          cost: approvalRef.includes('WEATHER') ? 12500 : 8200,
          affectsCriticalPath: approvalRef.includes('WEATHER'),
        },
        description: approvalRef.includes('WEATHER') 
          ? 'Weather delay affecting Phase 2 Foundation work'
          : 'Material delivery delay impacting steel frame installation'
      };
      setApprovalData(mockApprovalData);
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Stakeholder Notifications</h1>
        <p className="text-gray-600">
          Automated notification system for programme changes and approvals
        </p>
      </div>

      <StakeholderNotificationSystem
        approvalReference={approvalData?.approvalReference}
        documentType={approvalData?.documentType}
        programmeChanges={approvalData}
      />
    </div>
  );
}