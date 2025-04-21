import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Plus, Building, Phone, Mail, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import NewSupplierModal from "@/components/procurement/new-supplier-modal";
import PageHeader from "@/components/layout/page-header";

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  accountNumber: string;
  isGpsmacs: boolean;
}

interface SupplierPerformance {
  id: number;
  supplierId: number;
  supplierName: string;
  onTimeDelivery: number;
  qualityRating: number;
  responseTime: number;
  costCompetitiveness: number;
  lastUpdated: string;
}

interface SupplierInvoice {
  id: number;
  supplierId: number;
  supplierName: string;
  invoiceNumber: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

export default function SupplierAccounts() {
  // Fetch suppliers
  const { data: suppliers = [], isLoading: isSuppliersLoading } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  // Fetch supplier performance data
  const { data: performanceData = [], isLoading: isPerformanceLoading } = useQuery<SupplierPerformance[]>({
    queryKey: ['/api/supplier-performance'],
  });

  // Fetch supplier invoices
  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery<SupplierInvoice[]>({
    queryKey: ['/api/supplier-invoices'],
  });

  // State for tab
  const [activeTab, setActiveTab] = useState<string>("approved-suppliers");
  
  // State for search
  const [supplierSearchQuery, setSupplierSearchQuery] = useState<string>("");
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>("");
  
  // State for modals
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState<boolean>(false);

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
    supplier.email.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
    (supplier.isGpsmacs && "gpsmacs".includes(supplierSearchQuery.toLowerCase()))
  );

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter(invoice => 
    invoice.supplierName.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
    invoice.status.toLowerCase().includes(invoiceSearchQuery.toLowerCase())
  );

  // Format currency
  const formatCurrency = (value: number): string => {
    return `£${(value / 100).toFixed(2)}`;
  };

  const invoiceStatusColors = {
    paid: 'bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800',
    pending: 'bg-amber-100 text-amber-800 hover:bg-amber-100 hover:text-amber-800',
    overdue: 'bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800',
  };

  if (isSuppliersLoading || isPerformanceLoading || isInvoicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Supplier Accounts" 
        subtitle="Manage supplier information, performance metrics, and invoices"
      />

      <Tabs 
        defaultValue="approved-suppliers" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-4 w-[600px]">
          <TabsTrigger value="approved-suppliers">Approved Suppliers</TabsTrigger>
          <TabsTrigger value="add-supplier">Add New Supplier</TabsTrigger>
          <TabsTrigger value="performance-log">Performance Log</TabsTrigger>
          <TabsTrigger value="invoices">Supplier Invoices</TabsTrigger>
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
            <Button onClick={() => setActiveTab("add-supplier")} className="flex items-center gap-2">
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
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {supplier.address.substring(0, 30)}
                          {supplier.address.length > 30 ? '...' : ''}
                        </div>
                      </TableCell>
                      <TableCell>{supplier.contactPerson || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> 
                          {supplier.email || '—'}
                        </div>
                        <div className="flex items-center mt-1">
                          <Phone className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          {supplier.phone || '—'}
                        </div>
                      </TableCell>
                      <TableCell>{supplier.accountNumber || '—'}</TableCell>
                      <TableCell className="text-right">
                        {supplier.isGpsmacs ? (
                          <Badge className="bg-blue-100 text-blue-800">GPSMACS</Badge>
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
        <TabsContent value="add-supplier" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add a New Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-4">
                <Button 
                  onClick={() => setIsNewSupplierModalOpen(true)} 
                  className="flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  Register New Supplier
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supplier Registration Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Required Information</h4>
                    <p className="text-sm text-muted-foreground">
                      Ensure you have company name, contact person, email, phone, and address when registering a new supplier.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Supplier Types</h4>
                    <p className="text-sm text-muted-foreground">
                      Mark suppliers as GPSMACS suppliers if they provide materials, plant, equipment, and PPE using the GPSMACS coding system.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Account Numbers</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter the supplier's account number if applicable to help track purchases across systems.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Log Tab */}
        <TabsContent value="performance-log" className="space-y-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead className="text-center">On-Time Delivery</TableHead>
                  <TableHead className="text-center">Quality Rating</TableHead>
                  <TableHead className="text-center">Response Time</TableHead>
                  <TableHead className="text-center">Cost Competitiveness</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceData.length > 0 ? (
                  performanceData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">{item.supplierName}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getRatingClass(item.onTimeDelivery)}>{item.onTimeDelivery.toFixed(1)}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getRatingClass(item.qualityRating)}>{item.qualityRating.toFixed(1)}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getRatingClass(item.responseTime)}>{item.responseTime.toFixed(1)}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getRatingClass(item.costCompetitiveness)}>{item.costCompetitiveness.toFixed(1)}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(item.lastUpdated).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No performance data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Supplier Invoices Tab */}
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
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                      </TableCell>
                      <TableCell>{invoice.supplierName}</TableCell>
                      <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={invoiceStatusColors[invoice.status]}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add New Supplier Modal */}
      {isNewSupplierModalOpen && (
        <NewSupplierModal 
          open={isNewSupplierModalOpen} 
          onClose={() => setIsNewSupplierModalOpen(false)}
        />
      )}
    </div>
  );
}

// Helper function to determine rating badge color
function getRatingClass(rating: number): string {
  if (rating >= 4) return 'bg-green-100 text-green-800';
  if (rating >= 3) return 'bg-blue-100 text-blue-800';
  if (rating >= 2) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}