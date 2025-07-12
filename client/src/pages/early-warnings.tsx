import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import EWTable from "@/components/early-warnings/ew-table";
import EWForm from "@/components/early-warnings/ew-form";
import EWDetails from "@/components/early-warnings/ew-details";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertTriangle, AlertCircle, Calendar, CheckCircle2, FileText, Download, Plus, Search } from "lucide-react";
import { EarlyWarning } from "@shared/schema";
import { format } from "date-fns";

export default function EarlyWarnings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [selectedEW, setSelectedEW] = useState<number | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  
  // For MVP, we'll assume project ID 1 and user ID 1
  const projectId = 1;
  const userId = 1;
  
  const { data: earlyWarnings = [] } = useQuery<EarlyWarning[]>({
    queryKey: [`/api/projects/${projectId}/early-warnings`],
  });
  
  // Calculate statistics
  const openCount = earlyWarnings.filter((ew) => ew.status === "Open").length;
  const mitigatedCount = earlyWarnings.filter((ew) => ew.status === "Mitigated").length;
  const meetingsScheduled = earlyWarnings.filter((ew) => ew.meetingDate && new Date(ew.meetingDate) > new Date()).length;
  
  // Filtered early warnings based on search term and status filter
  const filteredEarlyWarnings = earlyWarnings.filter((ew) => {
    // Status filter
    if (
      statusFilter !== "all" && 
      ew.status.toLowerCase() !== statusFilter.toLowerCase()
    ) {
      return false;
    }
    
    // Search term filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        ew.reference.toLowerCase().includes(searchTermLower) ||
        ew.description.toLowerCase().includes(searchTermLower)
      );
    }
    
    return true;
  });
  
  const handleNewEarlyWarning = () => {
    setCreateFormOpen(true);
  };
  
  const handleFormClose = () => {
    setCreateFormOpen(false);
  };
  
  const handleFormSuccess = () => {
    setCreateFormOpen(false);
  };
  
  const handleViewDetails = (ewId: number) => {
    setSelectedEW(ewId);
  };
  
  const handleCloseDetails = () => {
    setSelectedEW(null);
  };

  // Export functionality
  const handleExport = () => {
    const headers = ['Reference', 'Description', 'Status', 'Risk Level', 'Identified Date', 'Meeting Date', 'Mitigation Plan'];
    const csvData = earlyWarnings.map((ew: EarlyWarning) => [
      ew.reference || '',
      ew.description || '',
      ew.status || '',
      ew.riskLevel || '',
      ew.identifiedDate ? format(new Date(ew.identifiedDate), 'yyyy-MM-dd') : '',
      ew.meetingDate ? format(new Date(ew.meetingDate), 'yyyy-MM-dd') : '',
      ew.mitigationPlan || ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `early-warnings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Early Warnings</h1>
        <Button
          onClick={handleNewEarlyWarning}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Early Warning
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
              Open Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{openCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
              Mitigated Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{mitigatedCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-600" />
              Meetings Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{meetingsScheduled}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by reference or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
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
          
          <Dialog open={showDateFilter} onOpenChange={setShowDateFilter}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Calendar className="w-4 h-4 mr-2" />
                Filter by Date
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Date Filter</DialogTitle>
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
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDateFilter("all")}>
                  Clear
                </Button>
                <Button onClick={() => setShowDateFilter(false)}>
                  Apply Filter
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="w-full md:w-auto" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
          <h2 className="font-medium">NEC4 Contract Clause 15.1</h2>
        </div>
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded text-sm text-amber-800">
          <p>
            "The Contractor and the Project Manager give an early warning by notifying 
            the other as soon as either becomes aware of any matter which could increase the total
            of the Prices, delay Completion, delay meeting a Key Date, or impair the performance 
            of the works in use."
          </p>
        </div>
      </div>
      
      <EWTable 
        projectId={projectId} 
        earlyWarnings={filteredEarlyWarnings}
        onViewDetails={handleViewDetails}
        onNewEarlyWarning={handleNewEarlyWarning}
      />
      
      {/* Create Form Sheet */}
      <Sheet open={createFormOpen} onOpenChange={setCreateFormOpen}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 overflow-y-auto">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Create Early Warning</SheetTitle>
          </SheetHeader>
          <div className="p-6">
            <EWForm 
              projectId={projectId} 
              userId={userId} 
              onSuccess={handleFormSuccess} 
              onCancel={handleFormClose} 
            />
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Details Sheet */}
      <Sheet open={selectedEW !== null} onOpenChange={(open) => !open && setSelectedEW(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 overflow-y-auto">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Early Warning Details</SheetTitle>
          </SheetHeader>
          <div className="p-6">
            {selectedEW && (
              <EWDetails 
                ewId={selectedEW} 
                onClose={handleCloseDetails} 
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
