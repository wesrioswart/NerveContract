import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProject } from "@/contexts/project-context";
import Dashboard from "@/components/equipment-hire/dashboard";
import EquipmentList from "@/components/equipment-hire/equipment-list";
import HiresList from "@/components/equipment-hire/hires-list";
import OffHireRequests from "@/components/equipment-hire/off-hire-requests";
import MobileScanInterface from "@/components/equipment-hire/mobile-scan-interface";
import { 
  Truck, 
  PackageCheck, 
  QrCode, 
  Boxes, 
  ArrowDownUp, 
  MoveRight,
  Laptop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function EquipmentHire() {
  const { currentProject: selectedProject } = useProject();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showMobileInterface, setShowMobileInterface] = useState(false);

  // Toggle mobile scanning interface
  const toggleMobileInterface = () => {
    setShowMobileInterface(!showMobileInterface);
  };

  if (showMobileInterface) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Equipment Mobile Scanner</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleMobileInterface}
            className="gap-2"
          >
            <Laptop className="h-4 w-4" />
            <span>Exit Mobile Mode</span>
          </Button>
        </div>
        <Separator className="my-2" />
        <MobileScanInterface />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Equipment Hire Management</h1>
          <p className="text-muted-foreground">
            {selectedProject 
              ? `Project: ${selectedProject.name}`
              : "All Projects"}
          </p>
        </div>
        <Button 
          variant="default" 
          onClick={toggleMobileInterface}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          <QrCode className="h-4 w-4" />
          <span>Mobile Scanning Interface</span>
          <MoveRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger 
            value="dashboard" 
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 py-2 px-4 rounded-none"
          >
            <Boxes className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="equipment" 
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 py-2 px-4 rounded-none"
          >
            <PackageCheck className="h-4 w-4 mr-2" />
            Equipment Items
          </TabsTrigger>
          <TabsTrigger 
            value="hires" 
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 py-2 px-4 rounded-none"
          >
            <ArrowDownUp className="h-4 w-4 mr-2" />
            Active Hires
          </TabsTrigger>
          <TabsTrigger 
            value="off-hire" 
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none data-[state=active]:rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 py-2 px-4 rounded-none"
          >
            <Truck className="h-4 w-4 mr-2" />
            Off-hire Requests
          </TabsTrigger>
        </TabsList>

        <div className="p-1">
          <TabsContent value="dashboard" className="mt-4">
            <Dashboard />
          </TabsContent>
          
          <TabsContent value="equipment" className="mt-4">
            <EquipmentList />
          </TabsContent>
          
          <TabsContent value="hires" className="mt-4">
            <HiresList />
          </TabsContent>
          
          <TabsContent value="off-hire" className="mt-4">
            <OffHireRequests />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}