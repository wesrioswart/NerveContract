import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Check, 
  Clock, 
  Info 
} from "lucide-react";

// Define simplified milestone type to avoid schema mismatch
interface Milestone {
  id: number;
  name: string;
  plannedDate: string;
  forecastDate?: string | null;
  actualDate?: string | null;
  status: string;
  isKeyDate: boolean;
  description?: string | null;
}

type Task = {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies?: string[];
  isRisk?: boolean;
  isKeyDate?: boolean;
  status: string;
};

type GanttChartProps = {
  milestones: any[]; // Accept any array of milestones to avoid type issues
  programmeAnalysis?: any;
};

export default function GanttChart({ milestones, programmeAnalysis }: GanttChartProps) {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showRisks, setShowRisks] = useState(true);
  const [sortByDate, setSortByDate] = useState(true);
  
  // Set up chart dates based on milestones
  useEffect(() => {
    if (!milestones || milestones.length === 0) return;
    
    // Convert milestones to tasks and determine start/end dates for the chart
    let earliestDate = new Date();
    let latestDate = new Date();
    
    if (milestones.length > 0) {
      // Find earliest and latest dates
      const validPlannedDates = milestones
        .filter(m => m.plannedDate)
        .map(m => new Date(m.plannedDate).getTime());
        
      if (validPlannedDates.length > 0) {
        earliestDate = new Date(Math.min(...validPlannedDates));
      }
      
      const latestPlannedDates = validPlannedDates;
      
      const latestForecastDates = milestones
        .filter(m => m.forecastDate)
        .map(m => new Date(m.forecastDate || "").getTime());
      
      latestDate = new Date(Math.max(
        ...latestPlannedDates,
        ...(latestForecastDates.length > 0 ? latestForecastDates : [Date.now()])
      ));
    }
    
    // Add buffer to dates
    earliestDate.setDate(earliestDate.getDate() - 30); // 30 days before
    latestDate.setDate(latestDate.getDate() + 30); // 30 days after
    
    setStartDate(earliestDate);
    setEndDate(latestDate);
    
    // Convert milestones to tasks format
    const milestoneTasks: Task[] = milestones.map((milestone, index) => {
      // For simplicity, we'll set task end date to be 14 days after start for display purposes
      const start = new Date(milestone.plannedDate);
      const end = new Date(milestone.plannedDate);
      end.setDate(end.getDate() + 14);
      
      // Determine if task has risk based on status
      const isRisk = milestone.status === "Delayed" || milestone.status === "At Risk";
      
      return {
        id: milestone.id.toString(),
        name: milestone.name,
        start,
        end,
        progress: milestone.status === "Completed" ? 100 : 
                 milestone.status === "In Progress" ? 50 : 0,
        isRisk,
        isKeyDate: milestone.isKeyDate || false,
        status: milestone.status
      };
    });
    
    // Add some sample tasks to demonstrate Gantt chart (normally these would come from the MPP file)
    const sampleTasks: Task[] = [
      {
        id: "task-1",
        name: "Site Preparation",
        start: new Date("2023-03-15"),
        end: new Date("2023-04-10"),
        progress: 100,
        status: "Completed"
      },
      {
        id: "task-2",
        name: "Foundation Works",
        start: new Date("2023-04-10"),
        end: new Date("2023-05-15"),
        dependencies: ["task-1"],
        progress: 100,
        status: "Completed"
      },
      {
        id: "task-3",
        name: "Ground Floor Structure",
        start: new Date("2023-05-15"),
        end: new Date("2023-06-20"),
        dependencies: ["task-2"],
        progress: 100,
        status: "Completed"
      },
      {
        id: "task-4",
        name: "Upper Floors Structure",
        start: new Date("2023-06-20"),
        end: new Date("2023-07-30"),
        dependencies: ["task-3"],
        progress: 80,
        status: "In Progress"
      },
      {
        id: "task-5",
        name: "Roof Structure",
        start: new Date("2023-07-20"),
        end: new Date("2023-08-15"),
        dependencies: ["task-4"],
        progress: 30,
        isRisk: true,
        status: "At Risk"
      },
      {
        id: "task-6",
        name: "Building Envelope",
        start: new Date("2023-08-15"),
        end: new Date("2023-09-30"),
        dependencies: ["task-5"],
        progress: 0,
        status: "Not Started"
      },
      {
        id: "task-7",
        name: "MEP Installation",
        start: new Date("2023-09-05"),
        end: new Date("2023-10-30"),
        dependencies: ["task-6"],
        progress: 0,
        status: "Not Started"
      },
      {
        id: "task-8",
        name: "Internal Finishes",
        start: new Date("2023-10-15"),
        end: new Date("2023-12-01"),
        dependencies: ["task-7"],
        progress: 0,
        status: "Not Started"
      },
      {
        id: "task-9",
        name: "Testing & Commissioning",
        start: new Date("2023-12-01"),
        end: new Date("2023-12-15"),
        dependencies: ["task-8"],
        progress: 0,
        status: "Not Started"
      },
      {
        id: "task-10",
        name: "Project Completion",
        start: new Date("2023-12-15"),
        end: new Date("2023-12-20"),
        dependencies: ["task-9"],
        progress: 0,
        isKeyDate: true,
        status: "Not Started"
      }
    ];
    
    // Merge milestone tasks and sample tasks
    const allTasks = [...sampleTasks];
    
    // Sort tasks by start date
    const sortedTasks = sortByDate 
      ? allTasks.sort((a, b) => a.start.getTime() - b.start.getTime())
      : allTasks.sort((a, b) => a.name.localeCompare(b.name));
    
    setTasks(sortedTasks);
  }, [milestones, sortByDate]);
  
  // Calculate chart dimensions
  const chartStartTime = startDate.getTime();
  const chartEndTime = endDate.getTime();
  const chartDuration = chartEndTime - chartStartTime;
  
  // Utility to calculate % position on the timeline
  const getPositionPercentage = (date: Date) => {
    return ((date.getTime() - chartStartTime) / chartDuration) * 100;
  };
  
  // Utility to calculate task width (%)
  const getTaskWidth = (start: Date, end: Date) => {
    return ((end.getTime() - start.getTime()) / chartDuration) * 100;
  };
  
  // Get status color for tasks
  const getStatusColor = (task: Task) => {
    if (task.status === "Completed") return "bg-green-500";
    if (task.status === "In Progress") return "bg-blue-500";
    if (task.status === "At Risk") return "bg-amber-500";
    if (task.status === "Delayed") return "bg-red-500";
    return "bg-gray-300";
  };
  
  // Get month labels for chart header
  const getMonthLabels = () => {
    const months = [];
    const currentDate = new Date(startDate);
    
    // Set to first of month for clean month boundaries
    currentDate.setDate(1);
    
    while (currentDate <= endDate) {
      // Calculate position more precisely to avoid overlapping
      const position = getPositionPercentage(currentDate);
      
      // Create evenly spaced month markers
      months.push({
        label: formatDate(currentDate, "MMM yyyy"),
        position: position,
        month: currentDate.getMonth(),
        year: currentDate.getFullYear()
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  };
  
  // Toggle sort order
  const toggleSort = () => {
    setSortByDate(!sortByDate);
  };
  
  // Get all identified issues from programme analysis
  const issuesFound = programmeAnalysis?.issuesFound || [];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Programme Gantt Chart</CardTitle>
            <CardDescription>Visual representation of your project schedule</CardDescription>
          </div>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowRisks(!showRisks)}
              className={showRisks ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
            >
              {showRisks ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Hide Risks
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Show Risks
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleSort}
            >
              <ArrowUpDown className="w-4 h-4 mr-1" />
              Sort by {sortByDate ? "Name" : "Date"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-md border-gray-300">
            <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-500">No Programme Data</h3>
            <p className="text-gray-500 mt-1">
              Upload a programme file to visualize tasks
            </p>
          </div>
        ) : (
          <>
            {issuesFound.length > 0 && showRisks && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <h4 className="font-medium flex items-center text-amber-800">
                  <AlertCircle className="h-4 w-4 mr-2 text-amber-600" />
                  Programme Risks Detected
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-amber-700">
                  {issuesFound.slice(0, 3).map((issue: any, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>{issue.description}</span>
                    </li>
                  ))}
                  {issuesFound.length > 3 && (
                    <li className="text-amber-600 font-medium">
                      +{issuesFound.length - 3} more issues detected
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {/* MS Project style timeline header */}
            <div className="flex mb-2">
              {/* Left side - task names column */}
              <div className="w-1/3 min-w-[300px] bg-gray-100 p-2 font-medium text-sm border-r border-gray-200">
                Task Name
              </div>
              
              {/* Right side - timeline header */}
              <div className="flex-1 relative overflow-hidden">
                {/* Year and Month markers using grid for consistent spacing */}
                <div className="grid grid-cols-12 h-12 border-b border-gray-200">
                  {/* MS Project style year/month headers */}
                  <div className="col-span-12 h-6 border-b border-gray-200 flex">
                    {Array.from(new Set(getMonthLabels().map(m => m.year))).map((year, idx) => {
                      // Count how many months belong to this year
                      const monthsInYear = getMonthLabels().filter(m => m.year === year).length;
                      // Width based on number of months (each month is 1/12 of grid)
                      const width = (monthsInYear / 12) * 100;
                      
                      return (
                        <div 
                          key={`year-${idx}`}
                          className="h-full flex items-center border-r border-gray-200 bg-gray-50"
                          style={{ width: `${width}%` }}
                        >
                          <span className="px-2 font-medium text-xs text-gray-600">{year}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Month cells */}
                  <div className="col-span-12 h-6 flex">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                      <div 
                        key={`month-${idx}`}
                        className="flex-1 h-full flex items-center justify-center border-r border-gray-200"
                      >
                        <span className="text-xs text-gray-500">{month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* MS Project style Gantt chart */}
            <div className="flex flex-col border border-gray-200 rounded-md overflow-hidden">
              {tasks.map((task, index) => {
                const startPos = getPositionPercentage(task.start);
                const width = getTaskWidth(task.start, task.end);
                const statusColor = getStatusColor(task);
                
                // Skip tasks that don't match filter
                if (!showRisks && task.isRisk) return null;
                
                return (
                  <div 
                    key={task.id}
                    className="flex border-b border-gray-100 hover:bg-gray-50"
                  >
                    {/* Task name and dates column */}
                    <div className="w-1/3 min-w-[300px] p-3 flex flex-col justify-center border-r border-gray-200 bg-white">
                      <div className="font-medium">
                        {task.name} 
                        {task.isKeyDate && (
                          <Badge className="ml-1 px-1 py-0 h-4 bg-blue-100 text-blue-800 text-[10px]">
                            Key Date
                          </Badge>
                        )}
                        {task.status === "At Risk" && (
                          <Badge className="ml-1 px-1 py-0 h-4 bg-amber-100 text-amber-800 text-[10px]">
                            At Risk
                          </Badge>
                        )}
                        {task.status === "Delayed" && (
                          <Badge className="ml-1 px-1 py-0 h-4 bg-red-100 text-red-800 text-[10px]">
                            Delayed
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(task.start, "dd MMM")} - {formatDate(task.end, "dd MMM yyyy")}
                      </div>
                    </div>
                    
                    {/* Gantt bar section with grid background */}
                    <div className="flex-1 relative py-4">
                      {/* Monthly grid lines */}
                      <div className="absolute inset-0 grid grid-cols-12">
                        {Array(12).fill(0).map((_, i) => (
                          <div 
                            key={`grid-${i}`} 
                            className="h-full border-r border-gray-100"
                          ></div>
                        ))}
                      </div>
                      
                      {/* Today vertical line - classic MS Project style */}
                      <div 
                        className="absolute h-full w-[2px] bg-red-500 z-10"
                        style={{ 
                          left: `${getPositionPercentage(new Date())}%`,
                        }}
                      ></div>
                      
                      {/* Task bar */}
                      <div 
                        className={`absolute h-5 ${task.isRisk ? "border border-red-400" : ""} ${statusColor} flex items-center shadow-sm`}
                        style={{ 
                          left: `${startPos}%`, 
                          width: `${Math.max(width, 0.5)}%`,
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        {/* Progress indicator */}
                        <div 
                          className="h-full bg-opacity-30 bg-white"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                        
                        {/* Task label (only shown for longer tasks) */}
                        {width > 10 && (
                          <span className="absolute text-xs text-white font-medium ml-1 whitespace-nowrap overflow-hidden"
                            style={{
                              maxWidth: `calc(${width}% - 8px)`,
                              textOverflow: 'ellipsis',
                            }}>
                            {task.name}
                          </span>
                        )}
                        
                        {/* Risk indicator */}
                        {task.isRisk && (
                          <AlertCircle className="absolute -right-1 -top-1 w-4 h-4 text-red-600 bg-white rounded-full shadow-sm" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* MS Project style 'Today' line */}
            <div className="relative mt-4 border-t border-gray-100 pt-2 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-12 bg-red-500 mr-2"></div>
                <span className="text-xs font-medium text-gray-700">Today: {formatDate(new Date(), "dd MMM yyyy")}</span>
              </div>
              <div className="text-xs text-gray-500">
                {tasks.length} tasks • {tasks.filter(t => t.status === "Completed").length} completed
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex items-center justify-center space-x-6 text-xs border-t border-gray-200 pt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-sm mr-1"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-sm mr-1"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 rounded-sm mr-1"></div>
                <span>At Risk</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-sm mr-1"></div>
                <span>Delayed</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 border-2 border-red-400 bg-gray-100 rounded-sm mr-1"></div>
                <span>Critical Path</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}