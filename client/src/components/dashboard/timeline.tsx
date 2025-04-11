import { formatDate } from "@/lib/utils";
import { ProgrammeMilestone } from "@shared/schema";
import { Settings, HardHat, ArrowRight, Check, AlertCircle, Clock } from 'lucide-react';
import { Link } from "wouter";

type TimelineProps = {
  milestones: ProgrammeMilestone[];
};

export default function Timeline({ milestones }: TimelineProps) {
  // Filter out invalid milestones
  const validMilestones = milestones.filter(m => m && m.plannedDate);
  
  // Sort milestones by planned date
  const sortedMilestones = [...validMilestones].sort(
    (a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime()
  );
  
  // Take max 5 milestones for display
  const displayMilestones = sortedMilestones.slice(0, 5);
  
  // Helper function to get milestone status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case "Completed":
        return <Check className="h-4 w-4 text-white" />;
      case "In Progress":
        return <HardHat className="h-4 w-4 text-white" />;
      case "At Risk":
        return <AlertCircle className="h-4 w-4 text-white" />;
      case "Delayed":
        return <Clock className="h-4 w-4 text-white" />;
      default:
        return null;
    }
  };
  
  // Helper function to get milestone status class
  const getStatusClass = (status: string) => {
    switch(status) {
      case "Completed":
        return "bg-green-500";
      case "In Progress":
        return "bg-blue-500";
      case "At Risk":
        return "bg-amber-500";
      case "Delayed":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  // Helper function to get delay text
  const getDelayText = (milestone: ProgrammeMilestone) => {
    if (milestone.status === "Delayed" && milestone.delayDays) {
      return `CE Delay -${milestone.delayDays}w`;
    } else if (milestone.status === "At Risk" && milestone.delayDays) {
      return `EW Risk -${milestone.delayDays}w`;
    }
    return milestone.status;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Project Timeline</h3>
        <button className="text-gray-500 hover:text-primary flex items-center">
          <Settings className="w-4 h-4 mr-1" />
          <span className="text-sm">Filter</span>
        </button>
      </div>
      
      <div className="relative mb-10" style={{ height: "120px" }}>
        {/* Timeline track */}
        <div className="absolute w-full h-2 bg-gray-200 top-[60px]"></div>
        
        {/* Timeline milestone markers */}
        <div className="relative h-full">
          {displayMilestones.map((milestone, index) => {
            // Calculate position evenly across available width
            const position = index === 0 ? 0 : 
                            index === displayMilestones.length - 1 ? 100 : 
                            Math.round((index / (displayMilestones.length - 1)) * 100);
            
            // Determine status and styles
            const statusClass = getStatusClass(milestone.status);
            const isCompleted = milestone.status === "Completed";
            
            return (
              <div 
                key={milestone.id} 
                className="absolute flex flex-col items-center"
                style={{ left: `${position}%`, width: "120px", marginLeft: "-60px" }}
              >
                {/* Milestone name and date */}
                <div className="mb-2 text-center px-1">
                  <p className="text-sm font-semibold text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
                    {milestone.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(milestone.plannedDate, "MMM d, yyyy")}
                  </p>
                </div>
                
                {/* Status marker */}
                <div className={`w-8 h-8 rounded-full ${statusClass} flex items-center justify-center text-white`}>
                  {getStatusIcon(milestone.status)}
                </div>
                
                {/* Status text */}
                <div className="mt-4 text-center px-1">
                  <p className={`text-sm font-medium ${milestone.status === "Delayed" ? "text-red-600" : milestone.status === "At Risk" ? "text-amber-600" : ""}`}>
                    {getDelayText(milestone)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Connect line between points (optional) */}
      <div className="flex items-center justify-center mt-4">
        <Link href="/programme-management" className="text-sm text-primary hover:text-primary-dark flex items-center font-medium">
          View detailed programme
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
}
