import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CETable from "@/components/compensation-events/ce-table";
import NewCEModal from "@/components/compensation-events/new-ce-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function CompensationEvents() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // For MVP, we'll assume project ID 1
  const projectId = 1;
  
  const { data: compensationEvents = [] } = useQuery({
    queryKey: [`/api/projects/${projectId}/compensation-events`],
  });
  
  // Calculate total CE values
  const totalValue = compensationEvents.reduce((total: number, ce: any) => {
    return total + (ce.actualValue || ce.estimatedValue || 0);
  }, 0);
  
  const implementedValue = compensationEvents
    .filter((ce: any) => ce.status === "Implemented" || ce.status === "Accepted")
    .reduce((total: number, ce: any) => {
      return total + (ce.actualValue || ce.estimatedValue || 0);
    }, 0);
  
  const pendingValue = compensationEvents
    .filter((ce: any) => ce.status !== "Implemented" && ce.status !== "Accepted")
    .reduce((total: number, ce: any) => {
      return total + (ce.estimatedValue || 0);
    }, 0);
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Compensation Events</h1>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-cyan-700 hover:bg-cyan-800 text-white"
        >
          <span className="material-icons mr-2">add</span>
          New Compensation Event
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total CE Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Implemented Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(implementedValue)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Pending Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(pendingValue)}</p>
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
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="quotation">Quotation Due</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" className="w-full md:w-auto">
            <span className="material-icons mr-2">filter_list</span>
            More Filters
          </Button>
          
          <Button variant="outline" className="w-full md:w-auto">
            <span className="material-icons mr-2">download</span>
            Export
          </Button>
        </div>
      </div>
      
      <CETable projectId={projectId} />
      
      {showModal && (
        <NewCEModal 
          projectId={projectId} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}
