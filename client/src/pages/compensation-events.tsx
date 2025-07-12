import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CETable from "@/components/compensation-events/ce-table";
import NewCEModal from "@/components/compensation-events/new-ce-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { Plus, Search, Filter, Download, Calendar, X } from "lucide-react";
import { format } from "date-fns";

export default function CompensationEvents() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [valueFilter, setValueFilter] = useState("all");
  const [clauseFilter, setClauseFilter] = useState("all");
  
  // For MVP, we'll assume project ID 1
  const projectId = 1;
  
  const { data: compensationEvents = [] } = useQuery<any[]>({
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

  // Export functionality
  const handleExport = () => {
    const headers = ['Reference', 'Title', 'Status', 'Estimated Value', 'Actual Value', 'Raised Date', 'Deadline', 'Clause Reference'];
    const csvData = compensationEvents.map((ce: any) => [
      ce.reference || '',
      ce.title || '',
      ce.status || '',
      ce.estimatedValue || 0,
      ce.actualValue || 0,
      ce.raisedAt ? format(new Date(ce.raisedAt), 'yyyy-MM-dd') : '',
      ce.responseDeadline ? format(new Date(ce.responseDeadline), 'yyyy-MM-dd') : '',
      ce.clauseReference || ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compensation-events-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Compensation Events</h1>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-cyan-700 hover:bg-cyan-800 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
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
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
            <Input
              placeholder="Search by reference or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8"
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
          
          <Dialog open={showMoreFilters} onOpenChange={setShowMoreFilters}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Advanced Filters</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date-filter" className="text-right">
                    Date Range
                  </Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                      <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                      <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="value-filter" className="text-right">
                    Value Range
                  </Label>
                  <Select value={valueFilter} onValueChange={setValueFilter}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select value range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Values</SelectItem>
                      <SelectItem value="under-10k">Under £10,000</SelectItem>
                      <SelectItem value="10k-50k">£10,000 - £50,000</SelectItem>
                      <SelectItem value="50k-100k">£50,000 - £100,000</SelectItem>
                      <SelectItem value="over-100k">Over £100,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="clause-filter" className="text-right">
                    NEC4 Clause
                  </Label>
                  <Select value={clauseFilter} onValueChange={setClauseFilter}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select clause type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clauses</SelectItem>
                      <SelectItem value="60.1(1)">60.1(1) - Instruction</SelectItem>
                      <SelectItem value="60.1(2)">60.1(2) - Ground Conditions</SelectItem>
                      <SelectItem value="60.1(12)">60.1(12) - Physical Conditions</SelectItem>
                      <SelectItem value="60.1(19)">60.1(19) - Prevention Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setDateFilter("all");
                  setValueFilter("all");
                  setClauseFilter("all");
                }}>
                  Clear All
                </Button>
                <Button onClick={() => setShowMoreFilters(false)}>
                  Apply Filters
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="w-full md:w-auto" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
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
