import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useProject } from '@/contexts/project-context';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Filter, 
  Plus,
  Search,
  Calendar,
  SlidersHorizontal,
  ArrowUpDown,
  HelpCircle,
  ClipboardList,
  Eye,
  ExternalLink,
  Mail,
  Pencil,
  Save,
  Info
} from 'lucide-react';
import { AnimationWrapper } from '@/components/ui/animation-wrapper';
import { BadgeWithColors } from '@/components/ui/badge-with-colors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper function to format dates
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString();
};

// Helper to calculate days between two dates (positive if overdue, negative if due in future)
const calculateDaysDiff = (date1: string, date2: string) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Format date in a more readable format (DD/MM/YYYY)
const formatDateDDMMYYYY = (dateStr: string | null) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

export default function RfiManagementPage() {
  const { currentProject } = useProject();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedRfi, setSelectedRfi] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  
  const showRfiDetails = (rfi: any) => {
    setSelectedRfi(rfi);
    setShowDetailsDialog(true);
  };
  
  const showRfiEdit = (rfi: any) => {
    setSelectedRfi(rfi);
    setShowEditDialog(true);
  };

  const handleCreateRfiDemo = () => {
    toast({
      title: "Demo Feature",
      description: "The RFI form will be implemented in a future update.",
      duration: 3000,
    });
    setShowDemoDialog(false);
  };
  
  // Mutation to update an RFI
  const updateRfiMutation = useMutation({
    mutationFn: async (rfiData: any) => {
      if (!currentProject) throw new Error('No project selected');
      
      const response = await fetch(`/api/rfis/${rfiData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rfiData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update RFI');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the RFIs query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/rfis', currentProject?.id] });
      setShowEditDialog(false);
      setShowDetailsDialog(true); // Show the details dialog with updated information
    },
  });
  
  const { data: rfis = [], isLoading, error } = useQuery({
    queryKey: ['/api/rfis', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return [];
      const response = await fetch(`/api/projects/${currentProject.id}/rfis`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch RFIs');
      }
      return response.json();
    },
    enabled: !!currentProject,
  });
  
  const { data: periods = [] } = useQuery({
    queryKey: ['/api/project-periods', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return [];
      const response = await fetch(`/api/projects/${currentProject.id}/project-periods`);
      if (!response.ok) {
        throw new Error('Failed to fetch project periods');
      }
      return response.json();
    },
    enabled: !!currentProject,
  });
  
  // Metrics calculations
  const metrics = {
    total: rfis.length,
    onTime: rfis.filter((rfi: any) => rfi.status === 'Responded' && new Date(rfi.responseDate) <= new Date(rfi.plannedResponseDate)).length,
    dueSoon: rfis.filter((rfi: any) => 
      rfi.status === 'Open' && 
      new Date(rfi.plannedResponseDate) > new Date() && 
      new Date(rfi.plannedResponseDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length,
    overdue: rfis.filter((rfi: any) => 
      rfi.status === 'Open' && 
      new Date(rfi.plannedResponseDate) < new Date()
    ).length,
    raised: rfis.filter((rfi: any) => rfi.ceStatus === 'Raise a CE' || rfi.ceStatus === 'NCE Raised').length,
  };
  
  // Filter and sort logic
  const filteredRfis = rfis
    .filter((rfi: any) => {
      // Text search
      const matchesSearch = searchQuery === '' || 
        rfi.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rfi.reference.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'open' && rfi.status === 'Open') ||
        (statusFilter === 'responded' && rfi.status === 'Responded') ||
        (statusFilter === 'closed' && rfi.status === 'Closed') ||
        (statusFilter === 'overdue' && rfi.status === 'Open' && new Date(rfi.plannedResponseDate) < new Date()) ||
        (statusFilter === 'dueSoon' && rfi.status === 'Open' && 
          new Date(rfi.plannedResponseDate) > new Date() && 
          new Date(rfi.plannedResponseDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        );
      
      // Period filter
      const matchesPeriod = periodFilter === 'all' || rfi.periodId === parseInt(periodFilter);
      
      return matchesSearch && matchesStatus && matchesPeriod;
    })
    .sort((a: any, b: any) => {
      // Sort logic
      let comparison = 0;
      
      switch (sortBy) {
        case 'reference':
          comparison = a.reference.localeCompare(b.reference);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'response':
          comparison = new Date(a.plannedResponseDate).getTime() - new Date(b.plannedResponseDate).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  
  // Status badge color mapping
  const getStatusBadge = (status: string, plannedResponseDate: string) => {
    if (status === 'Open') {
      const isOverdue = new Date(plannedResponseDate) < new Date();
      const isDueSoon = !isOverdue && 
        new Date(plannedResponseDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      if (isOverdue) {
        return <BadgeWithColors variant="destructive">Overdue</BadgeWithColors>;
      } else if (isDueSoon) {
        return <BadgeWithColors variant="warning">Due Soon</BadgeWithColors>;
      } else {
        return <BadgeWithColors variant="outline">Open</BadgeWithColors>;
      }
    } else if (status === 'Responded') {
      return <BadgeWithColors variant="success">Responded</BadgeWithColors>;
    } else {
      return <BadgeWithColors variant="secondary">Closed</BadgeWithColors>;
    }
  };
  
  // CE Status Badge mapping
  const getCEStatusBadge = (ceStatus: string) => {
    switch (ceStatus) {
      case 'Not a CE':
        return <BadgeWithColors variant="outline">Not a CE</BadgeWithColors>;
      case 'PMI Issued':
        return <BadgeWithColors variant="warning">PMI Issued</BadgeWithColors>;
      case 'NCE Raised':
        return <BadgeWithColors variant="info">NCE Raised</BadgeWithColors>;
      case 'Raise a CE':
        return <BadgeWithColors variant="outline" className="bg-purple-100 text-purple-800">Raise a CE</BadgeWithColors>;
      case 'Under Review':
        return <BadgeWithColors variant="secondary">Under Review</BadgeWithColors>;
      case 'Closed':
        return <BadgeWithColors variant="secondary">Closed</BadgeWithColors>;
      default:
        return null;
    }
  };
  
  const toggleSortOrder = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Loading RFIs
          </h3>
          <p className="mt-2">There was a problem loading the RFI data. Please try again.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <AnimationWrapper as="h1" type="slideIn" className="text-3xl font-bold mb-2 flex items-center gap-2">
        <MessageSquare className="h-7 w-7" />
        RFI Management
      </AnimationWrapper>
      
      <AnimationWrapper type="fadeIn" delay={0.1}>
        <p className="text-gray-500 mb-6">
          Track and manage Requests for Information with deadline tracking and CE integration
        </p>
      </AnimationWrapper>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <AnimationWrapper type="fadeIn" delay={0.2}>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-xl flex justify-between items-center">
                {metrics.total}
                <FileText className="h-5 w-5 text-gray-400" />
              </CardTitle>
              <CardDescription>Total RFIs</CardDescription>
            </CardHeader>
          </Card>
        </AnimationWrapper>
        
        <AnimationWrapper type="fadeIn" delay={0.3}>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-xl flex justify-between items-center">
                {metrics.onTime}
                <CheckCircle className="h-5 w-5 text-green-500" />
              </CardTitle>
              <CardDescription>On Time Responses</CardDescription>
            </CardHeader>
          </Card>
        </AnimationWrapper>
        
        <AnimationWrapper type="fadeIn" delay={0.4}>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-xl flex justify-between items-center">
                {metrics.dueSoon}
                <Clock className="h-5 w-5 text-amber-500" />
              </CardTitle>
              <CardDescription>Due Within 7 Days</CardDescription>
            </CardHeader>
          </Card>
        </AnimationWrapper>
        
        <AnimationWrapper type="fadeIn" delay={0.5}>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-xl flex justify-between items-center">
                {metrics.overdue}
                <AlertCircle className="h-5 w-5 text-red-500" />
              </CardTitle>
              <CardDescription>Overdue</CardDescription>
            </CardHeader>
          </Card>
        </AnimationWrapper>
        
        <AnimationWrapper type="fadeIn" delay={0.6}>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-xl flex justify-between items-center">
                {metrics.raised}
                <ClipboardList className="h-5 w-5 text-blue-500" />
              </CardTitle>
              <CardDescription>CE Related</CardDescription>
            </CardHeader>
          </Card>
        </AnimationWrapper>
      </div>
      
      <div className="bg-white rounded-lg border shadow-sm mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search by title or reference"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="dueSoon">Due Soon</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {periods.map((period: any) => (
                    <SelectItem key={period.id} value={period.id.toString()}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Demo Dialog using shadcn/ui Dialog component */}
              <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New RFI
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New RFI</DialogTitle>
                    <DialogDescription>
                      Add a new Request for Information to the current project.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 my-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                      <p className="text-sm text-amber-800">
                        The RFI form will be implemented in a future update. This button is for demonstration purposes only.
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDemoDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateRfiDemo}>Create RFI</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="list" className="w-full">
          <div className="px-4 pt-2">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Kanban View
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="download" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Download
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="list" className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <th 
                      className="px-4 py-3 text-left cursor-pointer" 
                      onClick={() => toggleSortOrder('reference')}
                    >
                      <div className="flex items-center gap-1">
                        Reference
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left cursor-pointer" 
                      onClick={() => toggleSortOrder('title')}
                    >
                      <div className="flex items-center gap-1">
                        Title
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left cursor-pointer" 
                      onClick={() => toggleSortOrder('created')}
                    >
                      <div className="flex items-center gap-1">
                        Created
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left cursor-pointer" 
                      onClick={() => toggleSortOrder('response')}
                    >
                      <div className="flex items-center gap-1">
                        Response Date
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left cursor-pointer" 
                      onClick={() => toggleSortOrder('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">CE Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRfis.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <HelpCircle className="h-8 w-8 text-gray-300" />
                          <p>No RFIs found matching your filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRfis.map((rfi: any) => (
                      <tr key={rfi.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{rfi.reference}</td>
                        <td className="px-4 py-3">{rfi.title}</td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(rfi.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(rfi.plannedResponseDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(rfi.status, rfi.plannedResponseDate)}
                        </td>
                        <td className="px-4 py-3">
                          {getCEStatusBadge(rfi.ceStatus)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    onClick={() => showRfiDetails(rfi)}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Details</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="kanban" className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="font-medium mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Open
                  </span>
                  <BadgeWithColors variant="outline">{rfis.filter((rfi: any) => rfi.status === 'Open').length}</BadgeWithColors>
                </h3>
                
                <div className="space-y-2">
                  {rfis
                    .filter((rfi: any) => rfi.status === 'Open')
                    .map((rfi: any) => (
                      <Card key={rfi.id} className="shadow-sm">
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>{rfi.title}</span>
                            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => showRfiDetails(rfi)}>
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">View</span>
                            </Button>
                          </CardTitle>
                          <CardDescription className="text-xs">{rfi.reference}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex flex-col">
                              <span>Due: {formatDate(rfi.plannedResponseDate)}</span>
                              <span>Reply period: {rfi.contractualReplyPeriod || 5} days</span>
                            </div>
                            {getCEStatusBadge(rfi.ceStatus)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="font-medium mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Responded
                  </span>
                  <BadgeWithColors variant="outline">{rfis.filter((rfi: any) => rfi.status === 'Responded').length}</BadgeWithColors>
                </h3>
                
                <div className="space-y-2">
                  {rfis
                    .filter((rfi: any) => rfi.status === 'Responded')
                    .map((rfi: any) => (
                      <Card key={rfi.id} className="shadow-sm">
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>{rfi.title}</span>
                            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => showRfiDetails(rfi)}>
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">View</span>
                            </Button>
                          </CardTitle>
                          <CardDescription className="text-xs">{rfi.reference}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex flex-col">
                              <span>Responded: {formatDate(rfi.responseDate)}</span>
                              <span>Days to respond: {rfi.responseDate ? calculateDaysDiff(rfi.createdAt, rfi.responseDate) : 'N/A'}</span>
                            </div>
                            {getCEStatusBadge(rfi.ceStatus)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="font-medium mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    Closed
                  </span>
                  <BadgeWithColors variant="outline">{rfis.filter((rfi: any) => rfi.status === 'Closed').length}</BadgeWithColors>
                </h3>
                
                <div className="space-y-2">
                  {rfis
                    .filter((rfi: any) => rfi.status === 'Closed')
                    .map((rfi: any) => (
                      <Card key={rfi.id} className="shadow-sm">
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>{rfi.title}</span>
                            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => showRfiDetails(rfi)}>
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              <span className="text-xs">View</span>
                            </Button>
                          </CardTitle>
                          <CardDescription className="text-xs">{rfi.reference}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex flex-col">
                              <span>Closed on: {formatDate(rfi.closedDate)}</span>
                              <span>Total days: {calculateDaysDiff(rfi.createdAt, rfi.closedDate || new Date().toISOString())}</span>
                            </div>
                            {getCEStatusBadge(rfi.ceStatus)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="p-4">
            <div className="rounded-lg border bg-white overflow-hidden">
              {currentProject ? (
                <iframe 
                  src={`/api/projects/${currentProject.id}/rfis/preview`} 
                  className="w-full h-[70vh] border-0"
                  title="RFI Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-[70vh] text-gray-500">
                  <p>Select a project to view RFI preview</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>This preview shows how the RFI data will appear when exported for client-facing reports.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="download" className="p-4">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-lg font-medium mb-4">Export Options</h3>
              
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-medium mb-2">Excel Export</h4>
                  <p className="text-sm text-gray-500 mb-3">
                    Export RFI data to Microsoft Excel format for further analysis and reporting.
                  </p>
                  <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Download Excel
                  </Button>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">PDF Export</h4>
                  <p className="text-sm text-gray-500 mb-3">
                    Generate a formatted PDF report of RFIs to share with stakeholders.
                  </p>
                  <Button 
                    className="gap-2"
                    onClick={() => {
                      if (currentProject) {
                        window.open(`/api/projects/${currentProject.id}/rfis/pdf`, '_blank');
                      }
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Export Options</h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="includeDetails" className="rounded border-gray-300" />
                      <label htmlFor="includeDetails" className="text-sm">Include detailed descriptions</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="includeCE" className="rounded border-gray-300" />
                      <label htmlFor="includeCE" className="text-sm">Include Compensation Event data</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="filterCurrent" className="rounded border-gray-300" checked />
                      <label htmlFor="filterCurrent" className="text-sm">Apply current filters to export</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* RFI Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {selectedRfi && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">
                  {selectedRfi.reference} - {selectedRfi.title}
                </DialogTitle>
                <DialogDescription>
                  Created on {formatDateDDMMYYYY(selectedRfi.createdAt)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-2">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedRfi.status, selectedRfi.plannedResponseDate)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">CE Status</Label>
                    <div className="mt-1">{getCEStatusBadge(selectedRfi.ceStatus)}</div>
                  </div>
                </div>
                
                <div className="space-y-4 mb-4">
                  <div>
                    <Label className="text-xs text-gray-500">Description</Label>
                    <div className="mt-1 text-sm border rounded-md p-3 bg-gray-50">
                      {selectedRfi.description || 'No description provided'}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-500">Response</Label>
                    <div className="mt-1 text-sm border rounded-md p-3 bg-gray-50">
                      {selectedRfi.response || 'No response yet'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-xs text-gray-500">Created By</Label>
                    <div className="mt-1 text-sm">{selectedRfi.createdBy || 'Unknown'}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Assigned To</Label>
                    <div className="mt-1 text-sm">{selectedRfi.assignedTo || 'Unassigned'}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-xs text-gray-500">Response Required By</Label>
                    <div className="mt-1 text-sm">{formatDateDDMMYYYY(selectedRfi.plannedResponseDate)}</div>
                  </div>
                  {selectedRfi.responseDate && (
                    <div>
                      <Label className="text-xs text-gray-500">Response Date</Label>
                      <div className="mt-1 text-sm">{formatDateDDMMYYYY(selectedRfi.responseDate)}</div>
                    </div>
                  )}
                </div>
                
                {selectedRfi.period && (
                  <div className="mb-4">
                    <Label className="text-xs text-gray-500">Period</Label>
                    <div className="mt-1 text-sm">{selectedRfi.period.name}</div>
                  </div>
                )}
                
                {selectedRfi.ceStatus !== 'Not a CE' && (
                  <div className="mb-4 border-t pt-4">
                    <h4 className="font-medium text-sm mb-2">Compensation Event Details</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-xs text-gray-500">CE Reference</Label>
                        <div className="mt-1 text-sm">{selectedRfi.ceReference || 'Not created yet'}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">CE Status</Label>
                        <div className="mt-1">{getCEStatusBadge(selectedRfi.ceStatus)}</div>
                      </div>
                    </div>
                    
                    {selectedRfi.ceDescription && (
                      <div>
                        <Label className="text-xs text-gray-500">CE Description</Label>
                        <div className="mt-1 text-sm border rounded-md p-3 bg-gray-50">
                          {selectedRfi.ceDescription}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={() => showRfiEdit(selectedRfi)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                
                <Button size="sm" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* RFI Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {selectedRfi && (
            <>
              <DialogHeader>
                <DialogTitle>Edit RFI</DialogTitle>
                <DialogDescription>
                  {selectedRfi.reference} - {selectedRfi.title}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-2">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input 
                      id="edit-title" 
                      className="mt-1" 
                      value={selectedRfi.title} 
                      onChange={(e) => setSelectedRfi({...selectedRfi, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      className="mt-1 min-h-24"
                      value={selectedRfi.description || ''}
                      onChange={(e) => setSelectedRfi({...selectedRfi, description: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-response">Response</Label>
                    <Textarea
                      id="edit-response"
                      className="mt-1 min-h-24"
                      value={selectedRfi.response || ''}
                      onChange={(e) => setSelectedRfi({...selectedRfi, response: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-status">Status</Label>
                      <Select
                        value={selectedRfi.status}
                        onValueChange={(value) => setSelectedRfi({...selectedRfi, status: value})}
                      >
                        <SelectTrigger id="edit-status" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Responded">Responded</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-ce-status">CE Status</Label>
                      <Select
                        value={selectedRfi.ceStatus}
                        onValueChange={(value) => setSelectedRfi({...selectedRfi, ceStatus: value})}
                      >
                        <SelectTrigger id="edit-ce-status" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not a CE">Not a CE</SelectItem>
                          <SelectItem value="Raise a CE">Raise a CE</SelectItem>
                          <SelectItem value="PMI Issued">PMI Issued</SelectItem>
                          <SelectItem value="NCE Raised">NCE Raised</SelectItem>
                          <SelectItem value="Under Review">Under Review</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {selectedRfi.ceStatus !== 'Not a CE' && (
                    <div>
                      <Label htmlFor="edit-ce-reference">CE Reference</Label>
                      <Input
                        id="edit-ce-reference"
                        className="mt-1"
                        value={selectedRfi.ceReference || ''}
                        onChange={(e) => setSelectedRfi({...selectedRfi, ceReference: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                <Button 
                  disabled={updateRfiMutation.isPending}
                  onClick={() => updateRfiMutation.mutate(selectedRfi)}
                >
                  {updateRfiMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⌛</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}