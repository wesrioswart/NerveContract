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
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Truck 
} from "lucide-react";
import { format, parseISO, differenceInDays, isAfter, isBefore } from "date-fns";

export default function HiresList() {
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Get list of projects for filter
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Get equipment items for new hire dialog
  const { data: equipment, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ["/api/equipment-hire/equipment", { status: "available" }],
  });

  // Get equipment hires
  const { data: hires, isLoading: isLoadingHires } = useQuery({
    queryKey: ["/api/equipment-hire/hires", { 
      projectId: projectFilter,
      status: statusFilter
    }],
  });

  const isLoading = isLoadingHires || isLoadingProjects || isLoadingEquipment;

  // Filter hires based on search term
  const filteredHires = hires 
    ? hires.filter((hire: any) => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          hire.hireReference?.toLowerCase().includes(searchLower) ||
          hire.notes?.toLowerCase().includes(searchLower)
        );
      })
    : [];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Equipment Hires</h2>
        
        <Button onClick={() => setIsAddDialogOpen(true)}>
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
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="on-hire">On Hire</SelectItem>
                  <SelectItem value="extended">Extended</SelectItem>
                  <SelectItem value="off-hire-requested">Off-hire Requested</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
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
            <CardTitle>Equipment Hire Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Expected End</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHires.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No hire records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHires.map((hire: any) => {
                    const startDate = parseISO(hire.startDate);
                    const expectedEndDate = parseISO(hire.expectedEndDate);
                    const today = new Date();
                    const isOverdue = hire.status === "on-hire" && isBefore(expectedEndDate, today);
                    const isDueSoon = hire.status === "on-hire" && 
                      differenceInDays(expectedEndDate, today) <= 7 && 
                      differenceInDays(expectedEndDate, today) >= 0;
                    const duration = differenceInDays(expectedEndDate, startDate);
                    
                    return (
                      <TableRow key={hire.id}>
                        <TableCell className="font-medium">{hire.hireReference}</TableCell>
                        <TableCell>
                          {projects?.find((p: any) => p.id === hire.projectId)?.name || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              hire.status === "on-hire" 
                                ? "bg-blue-100 text-blue-800" 
                                : hire.status === "scheduled"
                                  ? "bg-amber-100 text-amber-800"
                                  : hire.status === "returned"
                                    ? "bg-green-100 text-green-800"
                                    : hire.status === "off-hire-requested"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-slate-100 text-slate-800"
                            }`}>
                              {hire.status.replace(/-/g, " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{format(startDate, "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {format(expectedEndDate, "dd MMM yyyy")}
                            {isOverdue && (
                              <AlertTriangle className="h-4 w-4 ml-1 text-destructive" />
                            )}
                            {isDueSoon && !isOverdue && (
                              <Clock className="h-4 w-4 ml-1 text-amber-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          £{hire.hireRate.toFixed(2)}/{hire.rateFrequency}
                        </TableCell>
                        <TableCell>{duration} days</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {hire.status === "on-hire" && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                              >
                                Off-hire
                              </Button>
                            )}
                            <Button variant="outline" size="sm">View</Button>
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

      {/* Add New Hire Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create New Equipment Hire</DialogTitle>
            <DialogDescription>
              Enter the details for the new equipment hire
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="equipment" className="text-right">
                Equipment
              </Label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipment?.map((item: any) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} - {item.make} {item.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">
                Project
              </Label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input 
                id="startDate" 
                type="date" 
                className="col-span-3" 
                defaultValue={new Date().toISOString().split('T')[0]} 
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expectedEndDate" className="text-right">
                Expected End Date
              </Label>
              <Input 
                id="expectedEndDate" 
                type="date" 
                className="col-span-3" 
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hireRate" className="text-right">
                Hire Rate
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input 
                  id="hireRate" 
                  type="number" 
                  placeholder="0.00" 
                  className="flex-grow" 
                />
                <Select defaultValue="daily">
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deliveryAddress" className="text-right">
                Delivery Address
              </Label>
              <Input id="deliveryAddress" placeholder="Delivery address" className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input id="notes" placeholder="Additional notes" className="col-span-3" />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Create Hire</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}