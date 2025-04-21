import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Plus, Building, ClipboardList, ShoppingCart } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { purchaseOrderStatusColors } from "@/lib/constants";
import NewPurchaseOrderModal from "@/components/procurement/new-purchase-order-modal";
import NewSupplierModal from "@/components/procurement/new-supplier-modal";
import ViewPurchaseOrderModal from "@/components/procurement/view-purchase-order-modal";

interface PurchaseOrderDashboard {
  totalPOs: number;
  pendingPOs: number;
  totalValue: number;
  supplierCount: number;
  recentPOs: {
    id: number;
    reference: string;
    supplierName: string;
    totalCost: number;
    status: string;
    createdAt: string;
  }[];
  posByStatus: {
    status: string;
    count: number;
  }[];
}

interface PurchaseOrder {
  id: number;
  reference: string;
  projectReference: string;
  supplierName: string;
  description: string;
  totalCost: number;
  status: string;
  createdAt: string;
}

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

export default function Procurement() {
  // Fetch purchase order dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<PurchaseOrderDashboard>({
    queryKey: ['/api/procurement/dashboard'],
  });

  // Fetch purchase orders
  const { data: purchaseOrders = [], isLoading: isPOsLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['/api/purchase-orders'],
  });

  // Fetch suppliers
  const { data: suppliers = [], isLoading: isSuppliersLoading } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  // State for tab
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  
  // State for search
  const [poSearchQuery, setPoSearchQuery] = useState<string>("");
  const [supplierSearchQuery, setSupplierSearchQuery] = useState<string>("");
  
  // State for modals
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState<boolean>(false);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState<boolean>(false);
  const [viewPurchaseOrderId, setViewPurchaseOrderId] = useState<number | null>(null);

  // Filter purchase orders based on search query
  const filteredPOs = purchaseOrders.filter(po => 
    po.reference.toLowerCase().includes(poSearchQuery.toLowerCase()) ||
    po.supplierName.toLowerCase().includes(poSearchQuery.toLowerCase()) ||
    po.description.toLowerCase().includes(poSearchQuery.toLowerCase()) ||
    po.status.toLowerCase().includes(poSearchQuery.toLowerCase())
  );

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
    supplier.email.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
    (supplier.isGpsmacs && "gpsmacs".includes(supplierSearchQuery.toLowerCase()))
  );

  // Format currency
  const formatCurrency = (value: number): string => {
    return `£${(value / 100).toFixed(2)}`;
  };

  if (isPOsLoading || isSuppliersLoading || isDashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Procurement Management" 
        subtitle="Manage purchase orders, suppliers, and procurement processes"
      />

      <Tabs 
        defaultValue="dashboard" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-4 w-[600px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="create-requisition">Create Requisition</TabsTrigger>
          <TabsTrigger value="requisition-list">Requisition List</TabsTrigger>
          <TabsTrigger value="delivery-tracker">Delivery Tracker</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboardData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total POs</CardTitle>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.totalPOs}</div>
                    <p className="text-xs text-muted-foreground">
                      purchase orders in the system
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                    <ClipboardList className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.pendingPOs}</div>
                    <p className="text-xs text-muted-foreground">
                      purchase orders awaiting approval
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalValue)}</div>
                    <p className="text-xs text-muted-foreground">
                      total procurement value
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.supplierCount}</div>
                    <p className="text-xs text-muted-foreground">
                      registered suppliers
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Purchase Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.recentPOs.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.recentPOs.map(po => (
                          <div key={po.id} className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                              <div>
                                <div className="font-medium">{po.reference}</div>
                                <div className="text-sm text-muted-foreground">
                                  {po.supplierName}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <Badge className={purchaseOrderStatusColors[po.status] || ""}>
                                {po.status.replace('_', ' ')}
                              </Badge>
                              <div className="text-sm font-medium mt-1">
                                {formatCurrency(po.totalCost)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No recent purchase orders
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">POs by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.posByStatus.map(status => (
                        <div key={status.status} className="flex items-center justify-between">
                          <div className="font-medium capitalize">
                            {status.status.replace('_', ' ')}
                          </div>
                          <Badge variant="outline">{status.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button 
                  onClick={() => setIsNewPOModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Purchase Order
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewSupplierModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  Add New Supplier
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="purchase-orders" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search purchase orders..."
                className="pl-8"
                value={poSearchQuery}
                onChange={e => setPoSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsNewPOModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Purchase Order
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.length > 0 ? (
                  filteredPOs.map((po) => (
                    <TableRow 
                      key={po.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setViewPurchaseOrderId(po.id)}
                    >
                      <TableCell>
                        <div className="font-medium">{po.reference}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(po.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{po.projectReference}</TableCell>
                      <TableCell>{po.supplierName}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{po.description}</TableCell>
                      <TableCell>
                        <Badge className={purchaseOrderStatusColors[po.status] || ""}>
                          {po.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(po.totalCost)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No purchase orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
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
            <Button onClick={() => setIsNewSupplierModalOpen(true)} className="flex items-center gap-2">
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
      </Tabs>

      {/* Modals */}
      {isNewPOModalOpen && (
        <NewPurchaseOrderModal
          open={isNewPOModalOpen}
          onClose={() => setIsNewPOModalOpen(false)}
          suppliers={suppliers}
        />
      )}

      <NewSupplierModal
        open={isNewSupplierModalOpen}
        onClose={() => setIsNewSupplierModalOpen(false)}
      />

      {viewPurchaseOrderId && (
        <ViewPurchaseOrderModal
          open={!!viewPurchaseOrderId}
          onClose={() => setViewPurchaseOrderId(null)}
          purchaseOrderId={viewPurchaseOrderId}
        />
      )}
    </div>
  );
}