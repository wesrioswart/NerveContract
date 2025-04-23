import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertTriangle, Clock, Check, Truck, Calendar } from "lucide-react";
import EquipmentHireDashboard from "@/components/equipment-hire/dashboard";
import EquipmentList from "@/components/equipment-hire/equipment-list";
import HiresList from "@/components/equipment-hire/hires-list";
import OffHireRequests from "@/components/equipment-hire/off-hire-requests";
import MobileScanInterface from "@/components/equipment-hire/mobile-scan-interface";

export default function EquipmentHirePage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/equipment-hire/dashboard-stats"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Summary stats shown at the top of all tabs
  const renderStats = () => {
    if (isLoadingStats) {
      return (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted/50">
              <CardContent className="p-4">
                <div className="h-4 w-16 bg-muted rounded mb-2"></div>
                <div className="h-8 w-12 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!dashboardStats) return null;

    const stats = [
      {
        title: "Total Equipment",
        value: dashboardStats.totalEquipment,
        icon: <Truck className="h-4 w-4 text-muted-foreground" />,
      },
      {
        title: "On Hire",
        value: dashboardStats.onHire,
        icon: <Truck className="h-4 w-4 text-blue-500" />,
      },
      {
        title: "Current Hires",
        value: dashboardStats.totalHires,
        icon: <Calendar className="h-4 w-4 text-green-500" />,
      },
      {
        title: "Due Soon",
        value: dashboardStats.dueSoon,
        icon: <Clock className="h-4 w-4 text-amber-500" />,
      },
      {
        title: "Overdue",
        value: dashboardStats.overdue,
        icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
      },
      {
        title: "Pending Off-hire",
        value: dashboardStats.pendingOffHire,
        icon: <Check className="h-4 w-4 text-green-500" />,
      },
    ];

    return (
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                {stat.icon}
                <span className="text-xs text-muted-foreground font-medium">{stat.title}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Equipment Hire Management</h1>
      </div>

      {renderStats()}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="hires">Hires</TabsTrigger>
          <TabsTrigger value="off-hire">Off-hire</TabsTrigger>
          <TabsTrigger value="scan">Mobile Scan</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <EquipmentHireDashboard />
        </TabsContent>

        <TabsContent value="equipment">
          <EquipmentList />
        </TabsContent>

        <TabsContent value="hires">
          <HiresList />
        </TabsContent>

        <TabsContent value="off-hire">
          <OffHireRequests />
        </TabsContent>

        <TabsContent value="scan">
          <MobileScanInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
}