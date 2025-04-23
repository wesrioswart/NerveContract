import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useProject } from "@/contexts/project-context";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  Search, 
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Package,
  MapPin,
  Phone,
  Send,
  QrCode
} from "lucide-react";
import { format, parseISO, addDays } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function OffHireRequests() {
  const { currentProject: selectedProject } = useProject();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [confirmationNotes, setConfirmationNotes] = useState("");
  const { toast } = useToast();

  // Get off-hire requests
  const { data: offHireRequests, isLoading } = useQuery({
    queryKey: ["/api/equipment/off-hire-requests", { projectId: selectedProject?.id }],
  });

  // Get equipment items for reference
  const { data: equipment } = useQuery({
    queryKey: ["/api/equipment/items"],
  });

  // Get hire records for reference
  const { data: hires } = useQuery({
    queryKey: ["/api/equipment/hires"],
  });

  // Filter requests based on search term and status
  const filteredRequests = offHireRequests 
    ? offHireRequests.filter((request: any) => {
        // Status filter
        if (statusFilter && request.status !== statusFilter) {
          return false;
        }
        
        // Search term
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const equipmentItem = equipment?.find((item: any) => {
            const hire = hires?.find((h: any) => h.id === request.hireId);
            return hire && hire.equipmentId === item.id;
          });
          
          return (
            request.reference?.toLowerCase().includes(searchLower) ||
            equipmentItem?.name?.toLowerCase().includes(searchLower) ||
            equipmentItem?.make?.toLowerCase().includes(searchLower) ||
            equipmentItem?.model?.toLowerCase().includes(searchLower) ||
            equipmentItem?.serialNumber?.toLowerCase().includes(searchLower)
          );
        }
        
        return true;
      })
    : [];

  // Mutation to update off-hire request status
  const { mutate: updateRequestStatus, isPending: isUpdating } = useMutation({
    mutationFn: async (data: { id: number; status: string; confirmedBy?: number; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/equipment/off-hire-requests/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Off-hire request has been updated successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/off-hire-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/dashboard"] });
      setIsViewDialogOpen(false);
      setSelectedRequest(null);
      setConfirmationNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // View request details
  const viewRequestDetails = (request: any) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  // Handle confirm request
  const handleConfirmRequest = () => {
    if (!selectedRequest) return;
    
    updateRequestStatus({
      id: selectedRequest.id,
      status: "confirmed",
      confirmedBy: 1, // Current user ID
      notes: confirmationNotes
    });
  };

  // Handle reject request
  const handleRejectRequest = () => {
    if (!selectedRequest) return;
    
    updateRequestStatus({
      id: selectedRequest.id,
      status: "rejected",
      confirmedBy: 1, // Current user ID
      notes: confirmationNotes
    });
  };

  // Get associated equipment and hire details
  const getAssociatedDetails = (requestId: number) => {
    if (!hires || !equipment) return null;
    
    const request = offHireRequests?.find((r: any) => r.id === requestId);
    if (!request) return null;
    
    const hire = hires.find((h: any) => h.id === request.hireId);
    if (!hire) return null;
    
    const equipmentItem = equipment.find((e: any) => e.id === hire.equipmentId);
    if (!equipmentItem) return null;
    
    return {
      hire,
      equipment: equipmentItem
    };
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    let colorClass = "";
    let icon = null;
    
    switch (status) {
      case "pending":
        colorClass = "bg-amber-100 text-amber-800 border-amber-200";
        icon = <Clock className="h-3 w-3 mr-1" />;
        break;
      case "confirmed":
        colorClass = "bg-green-100 text-green-800 border-green-200";
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
        break;
      case "rejected":
        colorClass = "bg-red-100 text-red-800 border-red-200";
        icon = <XCircle className="h-3 w-3 mr-1" />;
        break;
      case "sent":
        colorClass = "bg-blue-100 text-blue-800 border-blue-200";
        icon = <Send className="h-3 w-3 mr-1" />;
        break;
      default:
        colorClass = "bg-gray-100 text-gray-800 border-gray-200";
    }
    
    return (
      <Badge variant="outline" className={`${colorClass} font-medium flex items-center`}>
        {icon}
        {status}
      </Badge>
    );
  };

  // Calculate days left
  const getTimingInfo = (requestDate: string, requestedEndDate: string) => {
    const today = new Date();
    const endDate = parseISO(requestedEndDate);
    const requestDateObj = parseISO(requestDate);
    
    // Days since request made
    const daysSinceRequest = Math.floor((today.getTime() - requestDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    // Days until requested end date
    const daysUntilEnd = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      daysSinceRequest,
      daysUntilEnd,
      isPast: daysUntilEnd < 0,
      isUrgent: daysUntilEnd >= 0 && daysUntilEnd <= 2,
      isSoon: daysUntilEnd > 2 && daysUntilEnd <= 7
    };
  };

  // Format date with relative info
  const formatDateWithInfo = (date: string, includeRelative = true) => {
    const dateObj = parseISO(date);
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    const isToday = dateObj.toDateString() === today.toDateString();
    const isTomorrow = dateObj.toDateString() === tomorrow.toDateString();
    
    const formattedDate = format(dateObj, "dd MMM yyyy");
    
    if (!includeRelative) return formattedDate;
    
    if (isToday) return `${formattedDate} (Today)`;
    if (isTomorrow) return `${formattedDate} (Tomorrow)`;
    
    return formattedDate;
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Off-Hire Requests</h2>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm whitespace-nowrap">Status:</span>
              </div>
              
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Off-Hire Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No off-hire requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request: any) => {
                    const details = getAssociatedDetails(request.id);
                    const timingInfo = getTimingInfo(request.requestDate, request.requestedEndDate);
                    
                    return (
                      <TableRow key={request.id} className={
                        request.status === "pending" && timingInfo.isUrgent ? "bg-amber-50" : ""
                      }>
                        <TableCell>
                          <div className="font-medium">{request.reference}</div>
                          <div className="text-xs text-muted-foreground">
                            {request.requestDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Requested: {format(parseISO(request.requestDate), "dd MMM yyyy")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {details ? (
                            <div>
                              <div className="font-medium">{details.equipment.name}</div>
                              <div className="text-xs text-muted-foreground">{details.equipment.make} {details.equipment.model}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Equipment data not available</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatDateWithInfo(request.requestedEndDate)}
                          </div>
                          {request.status === "pending" && (
                            <div className={`text-xs ${
                              timingInfo.isPast ? "text-red-600" :
                              timingInfo.isUrgent ? "text-amber-600" :
                              timingInfo.isSoon ? "text-blue-600" : "text-muted-foreground"
                            }`}>
                              {timingInfo.isPast 
                                ? `${Math.abs(timingInfo.daysUntilEnd)} days overdue` 
                                : timingInfo.daysUntilEnd === 0 
                                ? "Due today" 
                                : `${timingInfo.daysUntilEnd} days remaining`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {renderStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">User #{request.requestedById}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => viewRequestDetails(request)}
                            className={request.status === "pending" ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100" : ""}
                          >
                            {request.status === "pending" ? "Process" : "View"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* View/Process Request Dialog */}
      {selectedRequest && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Off-Hire Request: {selectedRequest.reference}
                {renderStatusBadge(selectedRequest.status)}
              </DialogTitle>
              <DialogDescription>
                Requested on {formatDateWithInfo(selectedRequest.requestDate, false)}
              </DialogDescription>
            </DialogHeader>
            
            {(() => {
              const details = getAssociatedDetails(selectedRequest.id);
              if (!details) return <div>Associated equipment data not available</div>;
              
              return (
                <>
                  <div className="grid grid-cols-2 gap-4 py-2">
                    <div className="col-span-2 rounded-md bg-blue-50 p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium text-blue-900">Equipment Details</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-blue-800 text-xs">Name</Label>
                          <div className="text-sm font-medium">{details.equipment.name}</div>
                        </div>
                        <div>
                          <Label className="text-blue-800 text-xs">Model</Label>
                          <div className="text-sm">{details.equipment.make} {details.equipment.model}</div>
                        </div>
                        <div>
                          <Label className="text-blue-800 text-xs">Serial Number</Label>
                          <div className="text-sm font-mono">{details.equipment.serialNumber}</div>
                        </div>
                        <div>
                          <Label className="text-blue-800 text-xs">Hire Reference</Label>
                          <div className="text-sm">{details.hire.hireReference}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <Separator className="my-2" />
                      <h4 className="font-medium mb-2">Off-Hire Request Details</h4>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground text-xs">Requested End Date</Label>
                      <div className="font-medium">{formatDateWithInfo(selectedRequest.requestedEndDate)}</div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground text-xs">Requested By</Label>
                      <div className="font-medium">User #{selectedRequest.requestedById}</div>
                    </div>
                    
                    <div className="col-span-2 rounded-md bg-amber-50 p-4 border border-amber-100">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-amber-600" />
                        <h4 className="font-medium text-amber-900">Pickup Details</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <Label className="text-amber-800 text-xs">Pickup Address</Label>
                          <div className="text-sm">
                            {selectedRequest.pickupAddress || "Address not specified"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-amber-800 text-xs">Contact</Label>
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedRequest.pickupContact || "No contact specified"}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-muted-foreground text-xs">Notes</Label>
                      <div className="text-sm rounded-md border p-3 mt-1">
                        {selectedRequest.notes || "No additional notes provided."}
                      </div>
                    </div>
                    
                    {selectedRequest.status === "pending" && (
                      <div className="col-span-2 mt-2">
                        <Label htmlFor="confirmation-notes">Confirmation Notes</Label>
                        <Textarea
                          id="confirmation-notes"
                          placeholder="Add notes about this off-hire request..."
                          value={confirmationNotes}
                          onChange={(e) => setConfirmationNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {selectedRequest.status === "pending" ? (
                <>
                  <Button 
                    variant="outline" 
                    className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    onClick={handleRejectRequest}
                    disabled={isUpdating}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleConfirmRequest}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm Off-Hire
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}