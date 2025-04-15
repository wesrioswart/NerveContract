import { useQuery } from "@tanstack/react-query";
import SummaryCard from "@/components/dashboard/summary-card";
import CETable from "@/components/compensation-events/ce-table";
import EWTable from "@/components/early-warnings/ew-table";
import ChatInterface from "@/components/ai-assistant/chat-interface";
import Timeline from "@/components/dashboard/timeline";
import NewProjectModal from "@/components/projects/new-project-modal";
import { CompensationEvent, EarlyWarning, NonConformanceReport, PaymentCertificate, ProgrammeMilestone, Project } from "@shared/schema";
import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BuildingIcon, Loader2, PlusIcon } from "lucide-react";

export default function Dashboard() {
  const [projectId, setProjectId] = useState(1);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const userId = 1;

  // Fetch available projects
  const { 
    data: projects = [], 
    isLoading: projectsLoading 
  } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    refetchOnWindowFocus: false,
  });

  // Set default project if not already set
  useEffect(() => {
    if (projects.length > 0 && projectId === 1) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

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

  // Loading state
  const isLoading = projectsLoading || ceLoading || ewLoading || ncrLoading || pcLoading || milestoneLoading;

  // Project selection handler
  const handleProjectChange = (value: string) => {
    setProjectId(parseInt(value));
  };

  // Get current project name
  const currentProject = projects.find(p => p.id === projectId);

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
          <h1 className="text-2xl font-bold text-gray-900">Project Dashboard</h1>
          
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 mt-3 md:mt-0">
            <Button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Project
            </Button>
            
            <div className="w-full md:w-72">
              <Select 
                value={projectId?.toString()} 
                onValueChange={handleProjectChange}
                disabled={projectsLoading}
              >
                <SelectTrigger className="w-full bg-white">
                  <div className="flex items-center gap-2">
                    <BuildingIcon className="h-4 w-4 text-blue-600" />
                    {projectsLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>Loading projects...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Select project" />
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <p className="text-gray-500">
          {currentProject 
            ? `Overview of ${currentProject.name} contract activity` 
            : "Overview of your NEC4 contract activity"}
        </p>
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
