import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";

export default function EquipmentHireDashboard() {
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const { toast } = useToast();

  // Get list of projects for filter
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Get equipment hires
  const { data: hires, isLoading: isLoadingHires } = useQuery({
    queryKey: ["/api/equipment-hire/hires", { projectId: projectFilter }],
  });

  // Get equipment off-hire requests
  const { data: offHireRequests, isLoading: isLoadingOffHire } = useQuery({
    queryKey: ["/api/equipment-hire/off-hire-requests", { projectId: projectFilter }],
  });

  const isLoading = isLoadingHires || isLoadingOffHire || isLoadingProjects;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter active hires that are overdue or due soon
  const today = new Date();
  const dueHires = (hires || []).filter((hire: any) => {
    if (hire.status !== "on-hire") return false;
    
    const endDate = parseISO(hire.expectedEndDate);
    const isOverdueOrDueSoon = isBefore(endDate, addDays(today, 7));
    
    return isOverdueOrDueSoon;
  });

  // Sort by date - overdue first, then by expected end date
  dueHires.sort((a: any, b: any) => {
    const aDate = parseISO(a.expectedEndDate);
    const bDate = parseISO(b.expectedEndDate);
    
    const aIsOverdue = isBefore(aDate, today);
    const bIsOverdue = isBefore(bDate, today);
    
    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;
    
    return aDate.getTime() - bDate.getTime();
  });

  // Filter pending off-hire requests
  const pendingOffHire = (offHireRequests || []).filter((request: any) => 
    request.status === "pending"
  );

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Equipment Hire Dashboard</h2>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground mr-2">Filter by project:</span>
          <Select value={projectFilter || ""} onValueChange={(value) => setProjectFilter(value || null)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Projects</SelectItem>
              {projects?.map((project: any) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Equipment due for return */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-amber-500" />
              Equipment Due for Return
            </CardTitle>
            <CardDescription>
              Equipment items that are due for return soon or overdue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dueHires.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">No equipment due for return soon</p>
            ) : (
              <div className="space-y-4">
                {dueHires.slice(0, 5).map((hire: any) => {
                  const endDate = parseISO(hire.expectedEndDate);
                  const isOverdue = isBefore(endDate, today);
                  
                  return (
                    <div key={hire.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <div className="font-medium">{hire.hireReference}</div>
                        <div className="text-sm text-muted-foreground">
                          Due: {format(endDate, "dd MMM yyyy")}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {isOverdue ? (
                          <span className="flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Overdue
                          </span>
                        ) : (
                          <span className="flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Due Soon
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          {dueHires.length > 5 && (
            <CardFooter>
              <Button variant="ghost" size="sm" className="ml-auto">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Pending Off-hire Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-blue-500" />
              Pending Off-hire Requests
            </CardTitle>
            <CardDescription>
              Equipment that has been requested to be returned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingOffHire.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">No pending off-hire requests</p>
            ) : (
              <div className="space-y-4">
                {pendingOffHire.slice(0, 5).map((request: any) => {
                  const requestDate = parseISO(request.requestDate);
                  const requestedEndDate = parseISO(request.requestedEndDate);
                  
                  return (
                    <div key={request.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <div className="font-medium">{request.reference}</div>
                        <div className="text-sm text-muted-foreground">
                          Requested: {format(requestDate, "dd MMM yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Pickup: {format(requestedEndDate, "dd MMM yyyy")}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Process</Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          {pendingOffHire.length > 5 && (
            <CardFooter>
              <Button variant="ghost" size="sm" className="ml-auto">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}