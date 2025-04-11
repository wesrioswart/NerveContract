import { useQuery } from "@tanstack/react-query";
import SummaryCard from "@/components/dashboard/summary-card";
import CETable from "@/components/compensation-events/ce-table";
import EWTable from "@/components/early-warnings/ew-table";
import ChatInterface from "@/components/ai-assistant/chat-interface";
import Timeline from "@/components/dashboard/timeline";
import { CompensationEvent, EarlyWarning, NonConformanceReport, PaymentCertificate, ProgrammeMilestone } from "@shared/schema";

export default function Dashboard() {
  // For MVP, we'll assume project ID 1
  const projectId = 1;
  const userId = 1;

  // Fetch project data, CE counts, EW counts, etc.
  const { data: compensationEvents = [] } = useQuery<CompensationEvent[]>({
    queryKey: [`/api/projects/${projectId}/compensation-events`],
  });

  const { data: earlyWarnings = [] } = useQuery<EarlyWarning[]>({
    queryKey: [`/api/projects/${projectId}/early-warnings`],
  });

  const { data: nonConformanceReports = [] } = useQuery<NonConformanceReport[]>({
    queryKey: [`/api/projects/${projectId}/non-conformance-reports`],
  });

  const { data: paymentCertificates = [] } = useQuery<PaymentCertificate[]>({
    queryKey: [`/api/projects/${projectId}/payment-certificates`],
  });

  const { data: programmeMilestones = [] } = useQuery<ProgrammeMilestone[]>({
    queryKey: [`/api/projects/${projectId}/programme-milestones`],
  });

  // Calculate stats for summary cards
  const pendingCEs = compensationEvents.filter((ce) => 
    ce.status === "Notification" || ce.status === "Quotation Due"
  ).length;
  
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

  return (
    <div className="space-y-8">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Project Dashboard</h1>
        <p className="text-gray-500">Overview of your NEC4 contract activity</p>
      </div>
      
      {/* Dashboard Summary Cards */}
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

      {/* Contract Registers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Recent Compensation Events</h2>
          <CETable projectId={projectId} limit={3} showViewAll={true} />
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Active Early Warnings</h2>
          <EWTable projectId={projectId} limit={3} showViewAll={true} />
        </div>
      </div>
      
      {/* Project Timeline */}
      <Timeline milestones={programmeMilestones as any} />
      
      {/* AI Assistant Chat Interface */}
      <div className="bg-white p-5 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">NEC4 Contract Assistant</h2>
        <p className="text-gray-500 mb-4">Ask questions about your contract or get help with clause interpretations</p>
        <ChatInterface projectId={projectId} userId={userId} />
      </div>
    </div>
  );
}
