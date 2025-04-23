import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle, 
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Search, 
  Filter,
  Calendar,
  Clock,
  Truck,
  ArrowUpRight,
  CheckCircle2,
  Timer,
  Send,
  QrCode,
  Download,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function OffHireRequests() {
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  // Get list of projects for filter
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Get off-hire requests
  const { data: offHireRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/equipment-hire/off-hire-requests", { 
      projectId: projectFilter,
      status: statusFilter
    }],
  });

  const isLoading = isLoadingRequests || isLoadingProjects;

  // Filter requests based on search term
  const filteredRequests = offHireRequests 
    ? offHireRequests.filter((request: any) => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          request.reference?.toLowerCase().includes(searchLower) ||
          request.notes?.toLowerCase().includes(searchLower) ||
          request.hireReference?.toLowerCase().includes(searchLower)
        );
      })
    : [];

  // Function to view request details
  const viewRequestDetails = (request: any) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  // Function to print QR code
  const printQrCode = (request: any) => {
    // In a real implementation, this would generate a QR code and print it
    toast({
      title: "QR Code Generated",
      description: `QR code for request ${request.reference} is ready to print.`,
    });
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Off-hire Requests</h2>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search off-hire requests..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm whitespace-nowrap">Filters:</span>
              </div>
              
              <Select value={projectFilter || ""} onValueChange={(value) => setProjectFilter(value || null)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Projects</SelectItem>
                  {projects?.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
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
            <CardTitle>Off-hire Request Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Hire Ref</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Pickup Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No off-hire requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request: any) => {
                    const requestDate = parseISO(request.requestDate);
                    const endDate = parseISO(request.requestedEndDate);
                    
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.reference}</TableCell>
                        <TableCell>{request.hireReference}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === "pending" 
                                ? "bg-amber-100 text-amber-800" 
                                : request.status === "sent"
                                  ? "bg-blue-100 text-blue-800"
                                  : request.status === "confirmed"
                                    ? "bg-green-100 text-green-800"
                                    : request.status === "completed"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-slate-100 text-slate-800"
                            }`}>
                              {request.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{format(requestDate, "dd MMM yyyy")}</TableCell>
                        <TableCell>{format(endDate, "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          {projects?.find((p: any) => p.id === request.projectId)?.name || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline"
                                    size="icon"
                                    onClick={() => printQrCode(request)}
                                  >
                                    <QrCode className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Generate QR Code</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            {request.status === "pending" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Send to Supplier</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => viewRequestDetails(request)}
                            >
                              View
                            </Button>
                          </div>
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

      {/* View Off-hire Request Dialog */}
      {selectedRequest && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Off-hire Request Details</DialogTitle>
              <DialogDescription>
                Reference: {selectedRequest.reference}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Request Date</h3>
                  <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                    {format(parseISO(selectedRequest.requestDate), "dd MMM yyyy")}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Pickup Date</h3>
                  <p className="flex items-center">
                    <Truck className="h-4 w-4 mr-1 text-muted-foreground" />
                    {format(parseISO(selectedRequest.requestedEndDate), "dd MMM yyyy")}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                <div className="flex items-center space-x-2">
                  {selectedRequest.status === "pending" && <Timer className="h-4 w-4 text-amber-500" />}
                  {selectedRequest.status === "sent" && <Send className="h-4 w-4 text-blue-500" />}
                  {selectedRequest.status === "confirmed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  <span className="capitalize">{selectedRequest.status}</span>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Pickup Address</h3>
                <p>{selectedRequest.pickupAddress}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Pickup Contact</h3>
                <p>{selectedRequest.pickupContact}</p>
              </div>
              
              {selectedRequest.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">QR Code</h3>
                <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-md justify-center">
                  <QrCode className="h-32 w-32" />
                </div>
                <p className="text-xs text-center mt-2 text-muted-foreground">
                  Code: {selectedRequest.qrCode}
                </p>
              </div>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              <Button 
                variant="outline"
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                onClick={() => printQrCode(selectedRequest)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
              {selectedRequest.status === "pending" && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2" />
                  Send to Supplier
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}