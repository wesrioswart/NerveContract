import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import EWTable from "@/components/early-warnings/ew-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EarlyWarnings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // For MVP, we'll assume project ID 1
  const projectId = 1;
  
  const { data: earlyWarnings = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/early-warnings`],
  });
  
  // Calculate statistics
  const openCount = earlyWarnings.filter((ew: any) => ew.status === "Open").length;
  const mitigatedCount = earlyWarnings.filter((ew: any) => ew.status === "Mitigated").length;
  const meetingsScheduled = earlyWarnings.filter((ew: any) => ew.meetingDate && new Date(ew.meetingDate) > new Date()).length;
  
  const handleNewEarlyWarning = () => {
    // In a complete implementation, this would show a form to create a new EW
    alert("This would open the early warning form");
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Early Warnings</h1>
        <Button
          onClick={handleNewEarlyWarning}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <span className="material-icons mr-2">add</span>
          New Early Warning
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Open Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{openCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Mitigated Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{mitigatedCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Meetings Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{meetingsScheduled}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by reference or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<span className="material-icons text-gray-400">search</span>}
            />
          </div>
          
          <div className="w-full md:w-48">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="mitigated">Mitigated</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" className="w-full md:w-auto">
            <span className="material-icons mr-2">calendar_today</span>
            Filter by Date
          </Button>
          
          <Button variant="outline" className="w-full md:w-auto">
            <span className="material-icons mr-2">download</span>
            Export
          </Button>
        </div>
      </div>
      
      <EWTable projectId={projectId} />
    </>
  );
}
