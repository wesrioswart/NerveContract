import { useQuery } from "@tanstack/react-query";
import SummaryCard from "@/components/dashboard/summary-card";
import CETable from "@/components/compensation-events/ce-table";
import EWTable from "@/components/early-warnings/ew-table";
import ChatInterface from "@/components/ai-assistant/chat-interface";
import Timeline from "@/components/dashboard/timeline";

export default function Dashboard() {
  // For MVP, we'll assume project ID 1
  const projectId = 1;
  const userId = 1;

  // Fetch project data, CE counts, EW counts, etc.
  const { data: compensationEvents = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/compensation-events`],
  });

  const { data: earlyWarnings = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/early-warnings`],
  });

  const { data: nonConformanceReports = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/non-conformance-reports`],
  });

  const { data: paymentCertificates = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/payment-certificates`],
  });

  const { data: programmeMilestones = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/programme-milestones`],
  });

  // Calculate stats for summary cards
  const pendingCEs = compensationEvents.filter((ce: any) => 
    ce.status === "Notification" || ce.status === "Quotation Due"
  ).length;
  
  const closedEWsThisWeek = earlyWarnings.filter((ew: any) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return ew.status === "Mitigated" && new Date(ew.raisedAt) >= oneWeekAgo;
  }).length;
  
  const newNCRsThisWeek = nonConformanceReports.filter((ncr: any) => {
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
    <>
      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
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

      {/* AI Assistant Chat Interface */}
      <ChatInterface projectId={projectId} userId={userId} />
      
      {/* Contract Registers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CETable projectId={projectId} limit={3} showViewAll={true} />
        <EWTable projectId={projectId} limit={3} showViewAll={true} />
      </div>
      
      {/* Project Timeline */}
      <Timeline milestones={programmeMilestones} />
    </>
  );
}
