import { useQuery } from "@tanstack/react-query";
import SummaryCard from "@/components/dashboard/summary-card";
import CETable from "@/components/compensation-events/ce-table";
import EWTable from "@/components/early-warnings/ew-table";
import ChatInterface from "@/components/ai-assistant/chat-interface";
import Timeline from "@/components/dashboard/timeline";
import NewProjectModal from "@/components/projects/new-project-modal";
import AgentAlerts from "@/components/dashboard/agent-alerts";
import { CompensationEvent, EarlyWarning, NonConformanceReport, PaymentCertificate, ProgrammeMilestone, Project } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlusIcon } from "lucide-react";
import { useProject } from "@/contexts/project-context";

export default function Dashboard() {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const userId = 1;
  
  // Use global project context
  const { projectId, currentProject, projects, isLoading: projectsLoading } = useProject();

  // Fetch project data
  const { data: compensationEvents = [], isLoading: ceLoading } = useQuery<CompensationEvent[]>({
    queryKey: [`/api/projects/${projectId}/compensation-events`],
    enabled: projectId > 0,
  });

  const { data: earlyWarnings = [], isLoading: ewLoading } = useQuery<EarlyWarning[]>({
    queryKey: [`/api/projects/${projectId}/early-warnings`],
    enabled: projectId > 0,
  });

  const { data: nonConformanceReports = [], isLoading: ncrLoading } = useQuery<NonConformanceReport[]>({
    queryKey: [`/api/projects/${projectId}/non-conformance-reports`],
    enabled: projectId > 0,
  });

  const { data: paymentCertificates = [], isLoading: pcLoading } = useQuery<PaymentCertificate[]>({
    queryKey: [`/api/projects/${projectId}/payment-certificates`],
    enabled: projectId > 0,
  });

  const { data: programmeMilestones = [], isLoading: milestoneLoading } = useQuery<ProgrammeMilestone[]>({
    queryKey: [`/api/projects/${projectId}/programme-milestones`],
    enabled: projectId > 0,
  });

  // Fetch agent alerts
  const { data: agentAlerts = [], isLoading: alertsLoading } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/agent-alerts`],
    enabled: projectId > 0,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate stats for summary cards
  const pendingCEs = compensationEvents.filter((ce) => 
    ce.status === "Notification" || ce.status === "Quotation Due"
  ).length;

  // Programme alerts for critical path slippage
  const programmeAlerts = [
    {
      id: 1,
      type: 'critical',
      title: 'Programme Alert: Critical path slippage detected',
      message: 'Activity "Foundation Works - Phase 2" showing 3-week delay due to CE-040 archaeological findings impact. Review required.',
      ceReference: 'CE-040',
      affectedActivity: 'Foundation Works - Phase 2',
      slippage: '3 weeks',
      timestamp: new Date('2024-12-10T10:30:00'),
      requiresAction: true
    }
  ];

  // Check for CE-040 specifically (archaeological findings)
  const ce040 = compensationEvents.find(ce => ce.reference === 'CE-040');
  const hasProgrammeImpact = ce040?.status === 'Accepted' || ce040?.status === 'Implemented';
  
  const closedEWsThisWeek = earlyWarnings.filter((ew) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return ew.status === "Mitigated" && new Date(ew.raisedAt) >= oneWeekAgo;
  }).length;
  
  const newNCRsThisWeek = nonConformanceReports.filter((ncr) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(ncr.raisedAt) >= oneWeekAgo;
  }).length;
  
  // Get next payment certificate
  const nextPayment = paymentCertificates[0];
  
  // Days until next payment is due
  const daysUntilPayment = nextPayment ? 
    Math.ceil((new Date(nextPayment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  // Loading state
  const isLoading = projectsLoading || ceLoading || ewLoading || ncrLoading || pcLoading || milestoneLoading || alertsLoading;

  // Loading view
  const loadingView = (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
      <p>Loading project data...</p>
    </div>
  );

  // Dashboard content view
  const dashboardContent = (
    <>
      {/* Programme Alerts Section */}
      {hasProgrammeImpact && programmeAlerts.length > 0 && (
        <div className="mb-6">
          {programmeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-red-800">{alert.title}</h3>
                    <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                    <div className="mt-2 text-xs text-red-600">
                      <span className="font-medium">CE Reference:</span> {alert.ceReference} | 
                      <span className="font-medium"> Affected Activity:</span> {alert.affectedActivity} | 
                      <span className="font-medium"> Slippage:</span> {alert.slippage}
                    </div>
                  </div>
                </div>
                <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                  View Programme
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Compensation Events"
          value={compensationEvents.length}
          icon="fact_check"
          color="primary"
          status={`${pendingCEs} pending response`}
          statusIcon="schedule"
        />

        <SummaryCard
          title="Early Warnings"
          value={earlyWarnings.length}
          icon="warning"
          color="warning"
          status={`${closedEWsThisWeek} closed this week`}
          statusIcon="trending_down"
        />

        <SummaryCard
          title="Non-Conformances"
          value={nonConformanceReports.length}
          icon="report_problem"
          color="error"
          status={`${newNCRsThisWeek} new this week`}
          statusIcon="arrow_upward"
        />

        <SummaryCard
          title="Next Payment"
          value={nextPayment?.amount || 0}
          icon="receipt"
          color="secondary"
          status={`Due in ${daysUntilPayment} days`}
          statusIcon="calendar_today"
        />
      </div>

      {/* Agent Alerts Section */}
      <AgentAlerts alerts={agentAlerts} projectId={projectId} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Recent Compensation Events</h2>
          <CETable projectId={projectId} limit={3} showViewAll={true} />
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Active Early Warnings</h2>
          <EWTable
            projectId={projectId} 
            earlyWarnings={earlyWarnings}
            isLoading={ewLoading}
            limit={3} 
            showViewAll={true} 
          />
        </div>
      </div>
      
      <Timeline milestones={programmeMilestones as any} />
      
      <div className="bg-white p-5 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">NEC4 Contract Assistant</h2>
        <p className="text-gray-500 mb-4">Ask questions about your contract or get help with clause interpretations</p>
        <ChatInterface projectId={projectId} userId={userId} />
      </div>
    </>
  );

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentProject ? currentProject.name : "Project Dashboard"}
            </h1>
            {currentProject && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">{currentProject.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {currentProject.siteAddress && (
                    <span>{currentProject.siteAddress}</span>
                  )}
                  {currentProject.postcode && (
                    <span>{currentProject.postcode}</span>
                  )}
                  {currentProject.contractType && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {currentProject.contractType}
                    </span>
                  )}
                  {currentProject.contractValue && (
                    <span className="font-medium">
                      Contract Value: £{Number(currentProject.contractValue).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <Button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="bg-blue-600 text-white hover:bg-blue-700 mt-4 md:mt-0"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>
      
      {/* New Project Modal */}
      <NewProjectModal 
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
      />
      
      {isLoading ? loadingView : dashboardContent}
    </div>
  );
}
