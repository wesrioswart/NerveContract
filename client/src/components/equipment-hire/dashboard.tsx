import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/contexts/project-context";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Boxes, 
  Truck, 
  Wrench, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  MoveDiagonal, 
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { currentProject: selectedProject } = useProject();
  
  // Fetch equipment hire statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/equipment-hire/statistics", selectedProject?.id],
  });

  // Function to calculate weekly cost
  const calculateWeeklyCost = () => {
    if (!stats?.hires) return 0;
    
    return stats.hires
      .filter((hire: any) => hire.status === "active")
      .reduce((total: number, hire: any) => {
        const rate = hire.hireRate || 0;
        if (hire.rateFrequency === "daily") {
          return total + (rate * 7);
        }
        return total + rate;
      }, 0);
  };

  // Get upcoming returns (next 7 days)
  const getUpcomingReturns = () => {
    if (!stats?.hires) return [];
    
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);
    
    return stats.hires
      .filter((hire: any) => {
        const endDate = new Date(hire.expectedEndDate);
        return hire.status === "active" && endDate >= now && endDate <= sevenDaysLater;
      })
      .slice(0, 3); // Only show top 3
  };

  const upcomingReturns = getUpcomingReturns();
  const weeklyHireCost = calculateWeeklyCost();

  const renderStatCard = (
    title: string, 
    value: number | string, 
    description: string, 
    icon: React.ReactNode, 
    colorClass: string
  ) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`p-2 rounded-full ${colorClass}`}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderStatCard(
          "Total Equipment", 
          isLoading ? "..." : stats?.totalEquipment || 0, 
          "Items in inventory", 
          <Boxes className="h-4 w-4 text-blue-500" />, 
          "bg-blue-50"
        )}
        
        {renderStatCard(
          "On Hire", 
          isLoading ? "..." : stats?.onHire || 0, 
          "Active hire items", 
          <Truck className="h-4 w-4 text-amber-500" />, 
          "bg-amber-50"
        )}
        
        {renderStatCard(
          "Total Hires", 
          isLoading ? "..." : stats?.totalHires || 0, 
          "Since tracking began", 
          <MoveDiagonal className="h-4 w-4 text-indigo-500" />, 
          "bg-indigo-50"
        )}
        
        {renderStatCard(
          "Weekly Cost", 
          isLoading ? "..." : `£${weeklyHireCost.toFixed(2)}`, 
          "Current weekly spend", 
          <TrendingUp className="h-4 w-4 text-green-500" />, 
          "bg-green-50"
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items due for return */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Due Soon</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/equipment-hire/hires" className="flex items-center gap-1">
                  <span className="text-sm">View all</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <CardDescription>
              Equipment due for return in the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {isLoading ? (
                <div className="px-6 py-4 text-sm text-muted-foreground">Loading...</div>
              ) : upcomingReturns.length === 0 ? (
                <div className="px-6 py-4 text-sm text-muted-foreground">No equipment due for return this week</div>
              ) : (
                upcomingReturns.map((hire: any, index: number) => (
                  <div key={index} className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{hire.equipmentName}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {new Date(hire.expectedEndDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/equipment-hire/off-hire?id=${hire.id}`}>
                        Off-hire
                      </Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Issues and alerts */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Alerts</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/equipment-hire/off-hire" className="flex items-center gap-1">
                  <span className="text-sm">View all</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <CardDescription>
              Issues requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {isLoading ? (
                <div className="px-6 py-4 text-sm text-muted-foreground">Loading...</div>
              ) : (
                <>
                  {stats?.overdue > 0 && (
                    <div className="px-6 py-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium flex items-center">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                          Overdue Equipment
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {stats.overdue} item{stats.overdue !== 1 ? 's' : ''} past expected return date
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100">
                        View
                      </Button>
                    </div>
                  )}
                  
                  {stats?.pendingOffHire > 0 && (
                    <div className="px-6 py-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium flex items-center">
                          <Clock className="h-4 w-4 text-amber-500 mr-2" />
                          Pending Off-hire Requests
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {stats.pendingOffHire} request{stats.pendingOffHire !== 1 ? 's' : ''} awaiting processing
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100">
                        Process
                      </Button>
                    </div>
                  )}
                  
                  {stats?.underRepair > 0 && (
                    <div className="px-6 py-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium flex items-center">
                          <Wrench className="h-4 w-4 text-blue-500 mr-2" />
                          Equipment Under Repair
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {stats.underRepair} item{stats.underRepair !== 1 ? 's' : ''} currently being serviced
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Check Status
                      </Button>
                    </div>
                  )}

                  {/* If no alerts, show empty state */}
                  {(!stats?.overdue || stats.overdue === 0) && 
                   (!stats?.pendingOffHire || stats.pendingOffHire === 0) && 
                   (!stats?.underRepair || stats.underRepair === 0) && (
                    <div className="px-6 py-4 text-sm text-muted-foreground">
                      No immediate issues requiring attention
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}