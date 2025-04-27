import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProject } from '@/contexts/project-context';
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
  ClipboardList
} from 'lucide-react';
import { AnimationWrapper } from '@/components/ui/animation-wrapper';
import { BadgeWithColors } from '@/components/ui/badge-with-colors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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

export default function RfiManagementPage() {
  const { currentProject } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const { data: rfis = [], isLoading, error } = useQuery({
    queryKey: ['/api/rfis', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return [];
      const response = await fetch(`/api/projects/${currentProject.id}/rfis`);
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
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New RFI
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New RFI</DialogTitle>
                    <DialogDescription>
                      Add a new Request for Information to the current project.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Form content would go here */}
                  <p className="text-sm text-gray-500">RFI form will be implemented in a future update.</p>
                  
                  <DialogFooter>
                    <Button variant="outline" className="mr-2">Cancel</Button>
                    <Button>Create RFI</Button>
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
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
                          <CardTitle className="text-sm">{rfi.title}</CardTitle>
                          <CardDescription className="text-xs">{rfi.reference}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="flex items-center justify-between text-xs">
                            <span>Due: {new Date(rfi.plannedResponseDate).toLocaleDateString()}</span>
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
                          <CardTitle className="text-sm">{rfi.title}</CardTitle>
                          <CardDescription className="text-xs">{rfi.reference}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="flex items-center justify-between text-xs">
                            <span>Responded: {rfi.responseDate ? new Date(rfi.responseDate).toLocaleDateString() : 'N/A'}</span>
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
                          <CardTitle className="text-sm">{rfi.title}</CardTitle>
                          <CardDescription className="text-xs">{rfi.reference}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <div className="flex items-center justify-between text-xs">
                            <span>Closed: {rfi.closedDate ? new Date(rfi.closedDate).toLocaleDateString() : 'N/A'}</span>
                            {getCEStatusBadge(rfi.ceStatus)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}