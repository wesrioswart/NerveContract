import { formatDate } from "@/lib/utils";
import { ProgrammeMilestone } from "@shared/schema";

type TimelineProps = {
  milestones: ProgrammeMilestone[];
};

export default function Timeline({ milestones }: TimelineProps) {
  // Sort milestones by planned date
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime()
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-medium">Project Timeline</h3>
        <button className="text-gray-500 hover:text-primary flex items-center">
          <span className="material-icons text-sm mr-1">tune</span>
          <span className="text-sm">Filter</span>
        </button>
      </div>
      
      <div className="relative overflow-hidden" style={{ height: "120px" }}>
        {/* Timeline track */}
        <div className="absolute w-full h-1 bg-gray-200 top-1/2"></div>
        
        {/* Timeline milestones */}
        <div className="relative h-full">
          {sortedMilestones.map((milestone, index) => {
            const position = `${Math.min(5 + (index * 20), 85)}%`;
            const isCompleted = milestone.status === "Completed";
            const isInProgress = milestone.status === "In Progress";
            
            return (
              <div 
                key={milestone.id} 
                className="absolute top-0 flex flex-col items-center w-32"
                style={{ left: position }}
              >
                <div className="mb-2 text-center">
                  <p className="text-xs font-semibold text-gray-500">{milestone.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(milestone.plannedDate, "MMM d, yyyy")}</p>
                </div>
                
                {isInProgress ? (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white absolute top-1/2 transform -translate-y-1/2">
                    <span className="material-icons text-sm">engineering</span>
                  </div>
                ) : (
                  <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-green-600' : 'bg-gray-300'} absolute top-1/2 transform -translate-y-1/2`}></div>
                )}
                
                <div className="mt-10 text-center">
                  <p className="text-xs font-medium">
                    {isCompleted 
                      ? "Completed" 
                      : isInProgress 
                        ? "In Progress" 
                        : milestone.delayReason 
                          ? `${milestone.delayReason} -${milestone.delayDays}w` 
                          : "Not Started"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <a href="/programme" className="text-sm text-primary hover:text-blue-800 flex items-center justify-center">
          View detailed programme
          <span className="material-icons text-sm ml-1">arrow_forward</span>
        </a>
      </div>
    </div>
  );
}
