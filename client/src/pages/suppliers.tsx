import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Star, Calendar, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import { formatCurrency } from "@/lib/utils";

export default function Suppliers() {
  const [supplierSearchQuery, setSupplierSearchQuery] = useState<string>("");
  const [performanceSearchQuery, setPerformanceSearchQuery] = useState<string>("");
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState("approved-suppliers");
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      return res.json();
    }
  });

  // Fetch supplier performance records
  const { data: performanceRecords = [] } = useQuery({
    queryKey: ["/api/supplier-performance"],
    queryFn: async () => {
      const res = await fetch("/api/supplier-performance");
      if (!res.ok) throw new Error("Failed to fetch performance records");
      return res.json();
    }
  });

  // Fetch supplier invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ["/api/supplier-invoices"],
    queryFn: async () => {
      const res = await fetch("/api/supplier-invoices");
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    }
  });

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter((supplier: any) => 
    supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
    (supplier.accountNumber && supplier.accountNumber.toLowerCase().includes(supplierSearchQuery.toLowerCase())) ||
    (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(supplierSearchQuery.toLowerCase()))
  );

  // Filter performance records based on search query
  const filteredPerformanceRecords = performanceRecords.filter((record: any) =>
    record.supplierName.toLowerCase().includes(performanceSearchQuery.toLowerCase()) ||
    record.projectName.toLowerCase().includes(performanceSearchQuery.toLowerCase()) ||
    record.category.toLowerCase().includes(performanceSearchQuery.toLowerCase()) ||
    record.comments.toLowerCase().includes(performanceSearchQuery.toLowerCase())
  );

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter((invoice: any) =>
    invoice.supplierName.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
    invoice.purchaseOrderReference.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
    invoice.status.toLowerCase().includes(invoiceSearchQuery.toLowerCase())
  );

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  // Status color mapping for invoices
  const invoiceStatusColors = {
    paid: "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800",
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800",
    overdue: "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800"
  };

  // Rating stars component
  const RatingStars = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${
              index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Accounts"
        subtitle="Manage supplier relationships, track performance, and process invoices"
      />

      <Tabs defaultValue="approved-suppliers" value={selectedTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="approved-suppliers">Approved Suppliers</TabsTrigger>
          <TabsTrigger value="add-new-supplier">Add New Supplier</TabsTrigger>
          <TabsTrigger value="performance-log">Performance Log</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        {/* Approved Suppliers Tab */}
        <TabsContent value="approved-suppliers" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search suppliers..."
                className="pl-8"
                value={supplierSearchQuery}
                onChange={e => setSupplierSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setSelectedTab("add-new-supplier")} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Supplier
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Contact Details</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead className="text-right">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supplier: any) => (
                    <TableRow key={supplier.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {supplier.address}
                        </div>
                      </TableCell>
                      <TableCell>{supplier.contactPerson || '—'}</TableCell>
                      <TableCell>
                        <div>{supplier.email || '—'}</div>
                        <div className="text-sm text-muted-foreground">
                          {supplier.phone || '—'}
                        </div>
                      </TableCell>
                      <TableCell>{supplier.accountNumber || '—'}</TableCell>
                      <TableCell className="text-right">
                        {supplier.isGpsmacs ? (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800">
                            GPSMACS
                          </Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No suppliers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Add New Supplier Tab */}
        <TabsContent value="add-new-supplier" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New Supplier Registration</CardTitle>
              <CardDescription>Add a new supplier to the approved suppliers list</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Supplier Name</label>
                      <Input placeholder="e.g. Thurrock Engineering" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contact Person</label>
                      <Input placeholder="e.g. John Smith" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input placeholder="e.g. contact@supplier.com" type="email" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <Input placeholder="e.g. +44 20 7123 4567" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Address</label>
                      <Input placeholder="e.g. 123 Business Street, London" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Account Number</label>
                      <Input placeholder="e.g. SUP-2023-001" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Supplier Type</label>
                      <select className="w-full p-2 rounded-md border">
                        <option value="standard">Standard</option>
                        <option value="gpsmacs">GPSMACS</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes</label>
                      <textarea
                        className="w-full p-2 rounded-md border min-h-[100px]"
                        placeholder="Additional information about this supplier..."
                      ></textarea>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setSelectedTab("approved-suppliers")}>
                    Cancel
                  </Button>
                  <Button>Add Supplier</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Log Tab */}
        <TabsContent value="performance-log" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search performance records..."
                className="pl-8"
                value={performanceSearchQuery}
                onChange={e => setPerformanceSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <select className="p-2 rounded-md border text-sm">
                <option value="all">All Categories</option>
                <option value="quality">Quality</option>
                <option value="delivery">Delivery</option>
                <option value="service">Service</option>
                <option value="price">Price</option>
              </select>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Performance Record
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Reviewer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPerformanceRecords.length > 0 ? (
                  filteredPerformanceRecords.map((record: any) => (
                    <TableRow key={record.id} className="hover:bg-muted/50">
                      <TableCell>
                        {new Date(record.performanceDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{record.supplierName}</TableCell>
                      <TableCell>{record.projectName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {record.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <RatingStars rating={record.rating} />
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="link" className="p-0 h-auto">
                              {record.comments}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Performance Comments</DialogTitle>
                              <DialogDescription>
                                {record.supplierName} - {new Date(record.performanceDate).toLocaleDateString()}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <div className="font-medium mb-1">Rating</div>
                                <RatingStars rating={record.rating} />
                              </div>
                              <div>
                                <div className="font-medium mb-1">Comments</div>
                                <p>{record.comments}</p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>{record.reviewer}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No performance records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search invoices..."
                className="pl-8"
                value={invoiceSearchQuery}
                onChange={e => setInvoiceSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <select className="p-2 rounded-md border text-sm">
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Invoice
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>PO Reference</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice: any) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.purchaseOrderReference}</TableCell>
                      <TableCell>{invoice.supplierName}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={invoiceStatusColors[invoice.status as keyof typeof invoiceStatusColors] || ""}>
                          <div className="flex items-center gap-1">
                            {invoice.status === "paid" && <CheckCircle2 className="h-3 w-3" />}
                            {invoice.status === "overdue" && <XCircle className="h-3 w-3" />}
                            {invoice.status === "pending" && <Clock className="h-3 w-3" />}
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </div>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}