import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProgrammeMilestone } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import MSProjectUpload from "@/components/programme/ms-project-upload";
import ProgrammeTable from "@/components/programme/programme-table";

export default function Programme() {
  const [activeTab, setActiveTab] = useState("milestones");
  
  // For MVP, we'll assume project ID 1
  const projectId = 1;
  
  const { data: programmeMilestones = [], isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/programme-milestones`],
  });

  // Calculate statistics
  const completedMilestones = programmeMilestones.filter(
    (milestone: ProgrammeMilestone) => milestone.status === "Completed"
  ).length;
  
  const inProgressMilestones = programmeMilestones.filter(
    (milestone: ProgrammeMilestone) => milestone.status === "In Progress"
  ).length;
  
  const delayedMilestones = programmeMilestones.filter(
    (milestone: ProgrammeMilestone) => milestone.delayDays && milestone.delayDays > 0
  ).length;
  
  const totalDelay = programmeMilestones.reduce(
    (total: number, milestone: ProgrammeMilestone) => total + (milestone.delayDays || 0),
    0
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Programme Management</h1>
        <Button
          className="bg-primary hover:bg-blue-800"
        >
          <span className="material-icons mr-2">download</span>
          Download Programme
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Completed Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{completedMilestones}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{inProgressMilestones}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Delayed Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{delayedMilestones}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Delay (Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{totalDelay}</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs 
        defaultValue="milestones" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full mb-6"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="import">Import/Update</TabsTrigger>
        </TabsList>
        
        <TabsContent value="milestones" className="space-y-4">
          <ProgrammeTable milestones={programmeMilestones} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="gantt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Gantt Chart</CardTitle>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <span className="material-icons text-6xl mb-4">today</span>
                <p>Gantt chart visualization will be available in the next release</p>
                <p className="text-sm mt-2">
                  This feature will provide a detailed timeline view of all project activities
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          <MSProjectUpload projectId={projectId} />
        </TabsContent>
      </Tabs>
    </>
  );
}
