import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  Search, 
  Filter,
  Plus,
  Settings,
  Eye,
  Calendar,
  Tag,
  Truck,
  CircleDollarSign,
  QrCode,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function EquipmentList() {
  const { currentProject: selectedProject } = useProject();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [ownedStatusFilter, setOwnedStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  // Get equipment categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["/api/equipment-hire/categories"],
  });

  // Get equipment items
  const { data: equipment, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ["/api/equipment-hire/equipment", { 
      categoryId: categoryFilter,
      status: statusFilter,
      ownedStatus: ownedStatusFilter
    }],
  });

  const isLoading = isLoadingEquipment || isLoadingCategories;

  // Filter equipment based on search term
  const filteredEquipment = equipment 
    ? equipment.filter((item: any) => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          item.name?.toLowerCase().includes(searchLower) ||
          item.make?.toLowerCase().includes(searchLower) ||
          item.model?.toLowerCase().includes(searchLower) ||
          item.serialNumber?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
        );
      })
    : [];

  // Function to view equipment details
  const viewEquipmentDetails = (equipment: any) => {
    setSelectedEquipment(equipment);
    setIsViewDialogOpen(true);
  };

  // Function to print QR code
  const printQrCode = (equipment: any) => {
    // In a real implementation, this would generate a QR code and print it
    toast({
      title: "QR Code Generated",
      description: `QR code for item ${equipment.serialNumber} is ready to print.`,
    });
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    let colorClass = "";
    
    switch (status) {
      case "available":
        colorClass = "bg-green-100 text-green-800";
        break;
      case "on-hire":
        colorClass = "bg-blue-100 text-blue-800";
        break;
      case "under-repair":
        colorClass = "bg-amber-100 text-amber-800";
        break;
      case "off-hired":
        colorClass = "bg-purple-100 text-purple-800";
        break;
      case "disposed":
        colorClass = "bg-gray-100 text-gray-800";
        break;
      default:
        colorClass = "bg-gray-100 text-gray-800";
    }
    
    return (
      <Badge variant="outline" className={`${colorClass} font-medium`}>
        {status.replace('-', ' ')}
      </Badge>
    );
  };

  // Render ownership badge
  const renderOwnershipBadge = (ownedStatus: string) => {
    let colorClass = "";
    
    switch (ownedStatus) {
      case "owned":
        colorClass = "bg-blue-100 text-blue-800 border-blue-200";
        break;
      case "hired":
        colorClass = "bg-purple-100 text-purple-800 border-purple-200";
        break;
      case "leased":
        colorClass = "bg-indigo-100 text-indigo-800 border-indigo-200";
        break;
      default:
        colorClass = "bg-gray-100 text-gray-800 border-gray-200";
    }
    
    return (
      <Badge variant="outline" className={`${colorClass} font-medium`}>
        {ownedStatus}
      </Badge>
    );
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Equipment Inventory</h2>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment..."
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
              
              <Select value={categoryFilter || ""} onValueChange={(value) => setCategoryFilter(value || null)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
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
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="on-hire">On Hire</SelectItem>
                  <SelectItem value="under-repair">Under Repair</SelectItem>
                  <SelectItem value="off-hired">Off-hired</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={ownedStatusFilter || ""} onValueChange={(value) => setOwnedStatusFilter(value || null)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Ownership" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Ownership</SelectItem>
                  <SelectItem value="owned">Owned</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="leased">Leased</SelectItem>
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
            <CardTitle>Equipment Inventory</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No equipment found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEquipment.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.make} {item.model}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {categories?.find((cat: any) => cat.id === item.categoryId)?.name || "—"}
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(item.status)}
                      </TableCell>
                      <TableCell>
                        {renderOwnershipBadge(item.ownedStatus)}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{item.serialNumber}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline"
                                  size="icon"
                                  onClick={() => printQrCode(item)}
                                >
                                  <QrCode className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Print QR Code</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewEquipmentDetails(item)}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* View Equipment Dialog */}
      {selectedEquipment && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedEquipment.name}</DialogTitle>
              <DialogDescription>
                {selectedEquipment.make} {selectedEquipment.model}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-2">
              <div>
                <Label className="text-muted-foreground text-sm">Category</Label>
                <div className="font-medium">
                  {categories?.find((cat: any) => cat.id === selectedEquipment.categoryId)?.name || "—"}
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm">Serial Number</Label>
                <div className="font-mono text-sm">{selectedEquipment.serialNumber}</div>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm">Status</Label>
                <div>{renderStatusBadge(selectedEquipment.status)}</div>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm">Ownership</Label>
                <div>{renderOwnershipBadge(selectedEquipment.ownedStatus)}</div>
              </div>
            </div>
            
            <div className="py-2">
              <Label className="text-muted-foreground text-sm">Description</Label>
              <p className="mt-1 text-sm">{selectedEquipment.description || "No description available."}</p>
            </div>
            
            {selectedEquipment.ownedStatus === "hired" && selectedEquipment.supplierRef && (
              <div className="py-2 space-y-4">
                <div className="rounded-md border p-4 bg-amber-50">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-amber-600" />
                    <h4 className="font-medium text-amber-900">Supplier Details</h4>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-amber-800 text-xs">Reference</Label>
                      <div className="text-sm">{selectedEquipment.supplierRef}</div>
                    </div>
                    {selectedEquipment.purchaseDate && (
                      <div>
                        <Label className="text-amber-800 text-xs">Purchase Date</Label>
                        <div className="text-sm">{format(parseISO(selectedEquipment.purchaseDate), "dd MMM yyyy")}</div>
                      </div>
                    )}
                    {selectedEquipment.purchasePrice && (
                      <div>
                        <Label className="text-amber-800 text-xs">Purchase Price</Label>
                        <div className="text-sm">£{selectedEquipment.purchasePrice.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="py-2">
              <div className="flex items-center gap-2 my-2">
                <QrCode className="h-4 w-4 text-primary" />
                <Label>Equipment QR Code</Label>
              </div>
              <div className="flex justify-center bg-gray-50 p-4 rounded border">
                <div className="w-32 h-32 bg-white p-4 rounded shadow-sm flex items-center justify-center">
                  <QrCode className="h-full w-full" />
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground mt-2">
                Code: {selectedEquipment.id}
              </div>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              
              {selectedEquipment.status === "available" && (
                <Button>
                  <Tag className="h-4 w-4 mr-2" />
                  Create Hire
                </Button>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => printQrCode(selectedEquipment)}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Print QR
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Print equipment QR code</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}