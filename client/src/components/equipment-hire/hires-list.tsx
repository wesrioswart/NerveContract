import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useProjectContext } from "@/contexts/project-context";
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
import { 
  Loader2, 
  Search, 
  Filter,
  Plus,
  Calendar,
  Clock,
  Truck,
  Package,
  Building,
  CircleDollarSign,
  MapPin,
  ArrowRight,
  UserCircle2
} from "lucide-react";
import { format, parseISO, isBefore, differenceInDays, addDays } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function HiresList() {
  const { selectedProject } = useProjectContext();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHire, setSelectedHire] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  // Get active hires
  const { data: hires, isLoading: isLoadingHires } = useQuery({
    queryKey: ["/api/equipment-hire/hires", { projectId: selectedProject?.id }],
  });

  // Get equipment items for reference
  const { data: equipment, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ["/api/equipment-hire/equipment"],
  });

  // Get suppliers for reference
  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const isLoading = isLoadingHires || isLoadingEquipment;

  // Filter hires based on search term and status
  const filteredHires = hires 
    ? hires.filter((hire: any) => {
        // Status filter
        if (statusFilter && hire.status !== statusFilter) {
          return false;
        }
        
        // Search term
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const equipmentItem = equipment?.find((item: any) => item.id === hire.equipmentId);
          const supplier = suppliers?.find((s: any) => s.id === hire.supplierId);
          
          return (
            hire.hireReference?.toLowerCase().includes(searchLower) ||
            equipmentItem?.name?.toLowerCase().includes(searchLower) ||
            equipmentItem?.make?.toLowerCase().includes(searchLower) ||
            equipmentItem?.model?.toLowerCase().includes(searchLower) ||
            equipmentItem?.serialNumber?.toLowerCase().includes(searchLower) ||
            supplier?.name?.toLowerCase().includes(searchLower)
          );
        }
        
        return true;
      })
    : [];

  // Mutation to initiate off-hire request
  const { mutate: initiateOffHire, isPending: isInitiatingOffHire } = useMutation({
    mutationFn: async (data: { hireId: number; requestedEndDate: string }) => {
      const res = await apiRequest("POST", "/api/equipment-hire/off-hire-requests", {
        ...data,
        reference: `OFF-${new Date().toISOString().substring(0, 10)}-${Math.floor(Math.random() * 1000)}`,
        pickupAddress: "Site location",
        pickupContact: "Site manager",
        requestedById: 1, // Current user ID
        status: "pending"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Off-hire request has been initiated successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-hire/hires"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-hire/off-hire-requests"] });
      setIsViewDialogOpen(false);
      setSelectedHire(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate off-hire. Please try again.",
        variant: "destructive",
      });
    },
  });

  // View hire details
  const viewHireDetails = (hire: any) => {
    setSelectedHire(hire);
    setIsViewDialogOpen(true);
  };

  // Handle off-hire request
  const handleOffHireRequest = () => {
    if (!selectedHire) return;
    
    initiateOffHire({
      hireId: selectedHire.id,
      requestedEndDate: new Date().toISOString().split('T')[0] // Today
    });
  };

  // Get associated equipment details
  const getEquipmentDetails = (equipmentId: number) => {
    if (!equipment) return null;
    return equipment.find((item: any) => item.id === equipmentId);
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    let colorClass = "";
    
    switch (status) {
      case "active":
        colorClass = "bg-green-100 text-green-800 border-green-200";
        break;
      case "pending-collection":
        colorClass = "bg-amber-100 text-amber-800 border-amber-200";
        break;
      case "off-hire-requested":
        colorClass = "bg-blue-100 text-blue-800 border-blue-200";
        break;
      case "completed":
        colorClass = "bg-gray-100 text-gray-800 border-gray-200";
        break;
      case "cancelled":
        colorClass = "bg-red-100 text-red-800 border-red-200";
        break;
      default:
        colorClass = "bg-gray-100 text-gray-800 border-gray-200";
    }
    
    return (
      <Badge variant="outline" className={`${colorClass} font-medium`}>
        {status.replace(/-/g, ' ')}
      </Badge>
    );
  };

  // Get hire duration and status info
  const getHireInfo = (hire: any) => {
    const today = new Date();
    const startDate = parseISO(hire.startDate);
    const endDate = parseISO(hire.expectedEndDate);
    const duration = differenceInDays(endDate, startDate);
    const daysRemaining = differenceInDays(endDate, today);
    const elapsed = differenceInDays(today, startDate);
    
    const isPast = isBefore(endDate, today);
    const isEndingSoon = daysRemaining >= 0 && daysRemaining <= 7;
    
    return {
      duration,
      daysRemaining,
      elapsed,
      isPast,
      isEndingSoon,
      progress: Math.min(100, Math.round((elapsed / duration) * 100))
    };
  };

  // Format currency
  const formatCurrency = (amount: number, frequency: string) => {
    return `£${amount.toFixed(2)}/${frequency === 'weekly' ? 'week' : 'day'}`;
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Equipment Hires</h2>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Hire
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hires..."
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
              
              <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending-collection">Pending Collection</SelectItem>
                  <SelectItem value="off-hire-requested">Off-hire Requested</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
            <CardTitle>Active Hires</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHires.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No active hires found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHires.map((hire: any) => {
                    const equipmentDetails = getEquipmentDetails(hire.equipmentId);
                    const hireInfo = getHireInfo(hire);
                    const supplier = suppliers?.find((s: any) => s.id === hire.supplierId);
                    
                    return (
                      <TableRow key={hire.id} className={
                        hireInfo.isPast ? "bg-red-50" : 
                        hireInfo.isEndingSoon ? "bg-amber-50" : ""
                      }>
                        <TableCell>
                          <div className="font-medium">{hire.hireReference}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {supplier && (
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {supplier.name}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {equipmentDetails ? (
                            <div>
                              <div className="font-medium">{equipmentDetails.name}</div>
                              <div className="text-xs text-muted-foreground">{equipmentDetails.make} {equipmentDetails.model}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unknown equipment</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {format(parseISO(hire.startDate), "dd MMM")} - {format(parseISO(hire.expectedEndDate), "dd MMM yyyy")}
                          </div>
                          <div className={`text-xs ${
                            hireInfo.isPast ? "text-red-600" :
                            hireInfo.isEndingSoon ? "text-amber-600" : "text-blue-600"
                          }`}>
                            {hireInfo.isPast 
                              ? `${Math.abs(hireInfo.daysRemaining)} days overdue` 
                              : hireInfo.daysRemaining === 0 
                              ? "Due today" 
                              : `${hireInfo.daysRemaining} days remaining`}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className={`rounded-full h-1.5 ${
                                hireInfo.isPast ? "bg-red-500" :
                                hireInfo.isEndingSoon ? "bg-amber-500" : "bg-blue-500"
                              }`} 
                              style={{ width: `${hireInfo.progress}%` }}
                            ></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderStatusBadge(hire.status)}
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {formatCurrency(hire.hireRate, hire.rateFrequency)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => viewHireDetails(hire)}
                          >
                            View
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

      {/* View Hire Dialog */}
      {selectedHire && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Hire Reference: {selectedHire.hireReference}
                {renderStatusBadge(selectedHire.status)}
              </DialogTitle>
              <DialogDescription>
                {format(parseISO(selectedHire.startDate), "dd MMM yyyy")} - {format(parseISO(selectedHire.expectedEndDate), "dd MMM yyyy")}
              </DialogDescription>
            </DialogHeader>
            
            {(() => {
              const equipmentDetails = getEquipmentDetails(selectedHire.equipmentId);
              const supplier = suppliers?.find((s: any) => s.id === selectedHire.supplierId);
              const hireInfo = getHireInfo(selectedHire);
              
              if (!equipmentDetails) return <div>Equipment details not available</div>;
              
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
                          <div className="text-sm font-medium">{equipmentDetails.name}</div>
                        </div>
                        <div>
                          <Label className="text-blue-800 text-xs">Model</Label>
                          <div className="text-sm">{equipmentDetails.make} {equipmentDetails.model}</div>
                        </div>
                        <div>
                          <Label className="text-blue-800 text-xs">Serial Number</Label>
                          <div className="text-sm font-mono">{equipmentDetails.serialNumber}</div>
                        </div>
                        <div>
                          <Label className="text-blue-800 text-xs">Status</Label>
                          <div className="text-sm">{equipmentDetails.status}</div>
                        </div>
                      </div>
                    </div>
                    
                    {supplier && (
                      <div className="col-span-2 rounded-md bg-green-50 p-4 border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4 text-green-600" />
                          <h4 className="font-medium text-green-900">Supplier Details</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-green-800 text-xs">Name</Label>
                            <div className="text-sm font-medium">{supplier.name}</div>
                          </div>
                          <div>
                            <Label className="text-green-800 text-xs">Reference</Label>
                            <div className="text-sm">{selectedHire.supplierRef || "N/A"}</div>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-green-800 text-xs">Contact</Label>
                            <div className="text-sm">{supplier.contactEmail || "No contact details"}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="col-span-2">
                      <Separator className="my-2" />
                      <h4 className="font-medium mb-2">Hire Details</h4>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground text-xs">Start Date</Label>
                      <div className="font-medium">{format(parseISO(selectedHire.startDate), "dd MMM yyyy")}</div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground text-xs">Expected End Date</Label>
                      <div className="font-medium">{format(parseISO(selectedHire.expectedEndDate), "dd MMM yyyy")}</div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground text-xs">Duration</Label>
                      <div className="font-medium">{hireInfo.duration} days</div>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground text-xs">Rate</Label>
                      <div className="font-medium">{formatCurrency(selectedHire.hireRate, selectedHire.rateFrequency)}</div>
                    </div>
                    
                    <div className="col-span-2 rounded-md bg-amber-50 p-4 border border-amber-100">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-amber-600" />
                        <h4 className="font-medium text-amber-900">Delivery Details</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <Label className="text-amber-800 text-xs">Delivery Address</Label>
                          <div className="text-sm">
                            {selectedHire.deliveryAddress || "Address not specified"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-amber-800 text-xs">Requested By</Label>
                          <div className="text-sm flex items-center gap-1">
                            <UserCircle2 className="h-3 w-3" />
                            User #{selectedHire.requestedById}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-muted-foreground text-xs">Notes</Label>
                      <div className="text-sm rounded-md border p-3 mt-1">
                        {selectedHire.notes || "No additional notes provided."}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              
              {selectedHire.status === "active" && (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleOffHireRequest}
                  disabled={isInitiatingOffHire}
                >
                  {isInitiatingOffHire ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4 mr-2" />
                      Request Off-Hire
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}