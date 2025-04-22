import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, Plus, Building, ClipboardList, ShoppingCart, ShieldAlert, AlertCircle, TrendingUp, Lightbulb, Clock, FileText, BarChart3 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { purchaseOrderStatusColors } from "@/lib/constants";
import NewPurchaseOrderModal from "@/components/procurement/new-purchase-order-modal";
import NewSupplierModal from "@/components/procurement/new-supplier-modal";
import ViewPurchaseOrderModal from "@/components/procurement/view-purchase-order-modal";
import SpendAnalyticsDashboard from "@/components/procurement/spend-analytics-dashboard";
import AIRequisitionForm from "@/components/procurement/ai-requisition-form";
import { useUser } from "@/contexts/user-context";

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

// Replace local Supplier interface with the one from schema.ts
import { Supplier } from "@shared/schema";

export default function Procurement() {
  // Get authentication status from user context
  const { isAuthenticated, user } = useUser();

  // Fetch purchase order dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useQuery<PurchaseOrderDashboard>({
    queryKey: ['/api/procurement/dashboard'],
    enabled: isAuthenticated, // Only run query if authenticated
  });

  // Fetch purchase orders
  const { data: purchaseOrders = [], isLoading: isPOsLoading, error: purchaseOrdersError } = useQuery<PurchaseOrder[]>({
    queryKey: ['/api/purchase-orders'],
    enabled: isAuthenticated, // Only run query if authenticated
  });

  // Fetch suppliers
  const { data: suppliers = [], isLoading: isSuppliersLoading, error: suppliersError } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
    enabled: isAuthenticated, // Only run query if authenticated
  });

  // State for tab
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  
  // Effect to handle tab change from URL parameters and custom events
  useEffect(() => {
    // Check URL parameters for tab selection
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
    
    // Listen for custom tab change events from child components
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail.tab);
    };
    
    window.addEventListener('tabChange', handleTabChange as EventListener);
    
    return () => {
      window.removeEventListener('tabChange', handleTabChange as EventListener);
    };
  }, []);
  
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
    (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(supplierSearchQuery.toLowerCase())) ||
    (supplier.contactEmail && supplier.contactEmail.toLowerCase().includes(supplierSearchQuery.toLowerCase())) ||
    (supplier.isGpsmacs && "gpsmacs".includes(supplierSearchQuery.toLowerCase()))
  );

  // Format currency
  const formatCurrency = (value: number): string => {
    return `£${(value / 100).toFixed(2)}`;
  };

  // Check if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <ShieldAlert className="h-12 w-12 text-amber-500" />
            </div>
            <CardTitle className="text-center">Authentication Required</CardTitle>
            <CardDescription className="text-center">
              You need to log in to access procurement management features.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={() => window.location.href = '/auth'}>
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle loading state
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
        <TabsList className="grid grid-cols-5 w-[750px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="create-requisition">Create Requisition</TabsTrigger>
          <TabsTrigger value="requisition-list">Requisition List</TabsTrigger>
          <TabsTrigger value="delivery-tracker">Delivery Tracker</TabsTrigger>
          <TabsTrigger value="detailed-breakdown">Detailed Breakdown</TabsTrigger>
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

              {/* Import SpendAnalyticsDashboard component */}
              <div className="mb-6">
                <SpendAnalyticsDashboard />
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

        {/* AI-enhanced Requisition Tab */}
        <TabsContent value="create-requisition" className="space-y-6">
          <AIRequisitionForm 
            onSubmit={(data) => {
              console.log('Requisition data:', data);
              // In a real application, this would submit to the backend
              setIsNewPOModalOpen(true);
            }}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">GPSMACS Code Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search GPSMACS codes..."
                  className="pl-8"
                />
              </div>
              
              <div className="mt-4 text-sm">
                <p className="text-muted-foreground mb-2">Common GPSMACS codes:</p>
                <ul className="space-y-1">
                  <li><span className="font-medium">5000-5999:</span> Construction Materials</li>
                  <li><span className="font-medium">6000-6999:</span> Plant & Equipment</li>
                  <li><span className="font-medium">7000-7999:</span> Small Equipment & Tools</li>
                  <li><span className="font-medium">8000-8999:</span> PPE & Safety Equipment</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="requisition-list" className="space-y-6">
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
        
        {/* Detailed Breakdown Tab */}
        <TabsContent value="detailed-breakdown" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Project-Based Spend Analysis */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Project-Based Spend Analysis</CardTitle>
                <CardDescription>Breakdown of procurement spend by project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Project spend chart - simplified visual */}
                  <div className="h-[300px] flex items-end space-x-2">
                    <div className="flex-1 flex flex-col items-center">
                      <div className="bg-blue-500 w-24 rounded-t-md" style={{ height: '65%' }}></div>
                      <div className="mt-2 text-sm font-medium">Westfield</div>
                      <div className="text-xs text-muted-foreground">£122,450</div>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="bg-green-500 w-24 rounded-t-md" style={{ height: '40%' }}></div>
                      <div className="mt-2 text-sm font-medium">Littlebrook</div>
                      <div className="text-xs text-muted-foreground">£75,780</div>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <div className="bg-amber-500 w-24 rounded-t-md" style={{ height: '25%' }}></div>
                      <div className="mt-2 text-sm font-medium">Corys</div>
                      <div className="text-xs text-muted-foreground">£46,980</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Top Project</h4>
                      <div className="text-sm">Westfield Development</div>
                      <div className="text-xs text-muted-foreground">49.8% of total spend</div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Avg. PO Value</h4>
                      <div className="text-sm">£28,450</div>
                      <div className="text-xs text-muted-foreground">across all projects</div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Spend Trend</h4>
                      <div className="text-sm flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1 rotate-180" />
                        <span>Decreasing</span>
                      </div>
                      <div className="text-xs text-muted-foreground">-4.2% month-on-month</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* GPSMACS Coded Spending */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GPSMACS Coding Analysis</CardTitle>
                <CardDescription>Spend by GPSMACS code category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="text-sm font-medium">5000-5999: Materials</div>
                        <div className="text-sm">42%</div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="text-sm font-medium">6000-6999: Plant</div>
                        <div className="text-sm">28%</div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="text-sm font-medium">7000-7999: Tools</div>
                        <div className="text-sm">18%</div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: '18%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <div className="text-sm font-medium">8000-8999: PPE</div>
                        <div className="text-sm">12%</div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Top GPSMACS Codes:</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div>5100: CONCRETE</div>
                        <Badge variant="outline">£36,450</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div>6200: EXCAVATORS</div>
                        <Badge variant="outline">£28,750</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div>5200: STEEL</div>
                        <Badge variant="outline">£22,800</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Supplier Spend Analysis */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Supplier Spend Analysis</CardTitle>
                <CardDescription>Breakdown of procurement spend by supplier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Total Spend</TableHead>
                          <TableHead>PO Count</TableHead>
                          <TableHead>Avg. PO Value</TableHead>
                          <TableHead>% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>BuildMaster Supplies Ltd</TableCell>
                          <TableCell>£56,780</TableCell>
                          <TableCell>4</TableCell>
                          <TableCell>£14,195</TableCell>
                          <TableCell>23.1%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Concrete Express</TableCell>
                          <TableCell>£42,350</TableCell>
                          <TableCell>2</TableCell>
                          <TableCell>£21,175</TableCell>
                          <TableCell>17.2%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>FastTrack Equipment Hire</TableCell>
                          <TableCell>£38,450</TableCell>
                          <TableCell>3</TableCell>
                          <TableCell>£12,817</TableCell>
                          <TableCell>15.6%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Other Suppliers</TableCell>
                          <TableCell>£108,630</TableCell>
                          <TableCell>7</TableCell>
                          <TableCell>£15,519</TableCell>
                          <TableCell>44.1%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Top Supplier Insights:</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
                          <span>56% of spend concentrated with top 3 suppliers</span>
                        </li>
                        <li className="flex items-start">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                          <span>14% increase in GPSMACS-compliant supplier spend</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Supplier Optimization:</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <Lightbulb className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                          <span>Potential £15,800 savings through consolidation</span>
                        </li>
                        <li className="flex items-start">
                          <Clock className="h-4 w-4 text-purple-500 mr-2 mt-0.5" />
                          <span>Avg. payment term: 30 days (2.4 days decrease)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Time-Based Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Time-Based Analysis</CardTitle>
                <CardDescription>Procurement activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Monthly Spend Trend</h4>
                    <div className="h-[180px] flex items-end justify-between px-2">
                      {['Jan', 'Feb', 'Mar', 'Apr'].map((month, i) => (
                        <div key={month} className="flex flex-col items-center">
                          <div 
                            className="bg-primary/80 w-12 hover:bg-primary transition-all duration-200" 
                            style={{ 
                              height: `${[70, 60, 85, 65][i]}%`,
                              minHeight: "10px"
                            }}
                          ></div>
                          <span className="text-xs mt-2">{month}</span>
                          <span className="text-xs text-muted-foreground">
                            £{[42.3, 36.8, 51.2, 38.9][i]}k
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Process Timelines:</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm">Avg. PO Approval Time</div>
                        <div className="flex items-center">
                          <div className="bg-blue-100 h-4 rounded-full" style={{ width: '80%' }}>
                            <div className="bg-blue-500 h-4 rounded-l-full" style={{ width: '40%' }}></div>
                          </div>
                          <span className="text-xs ml-2">1.8 days</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm">Avg. Delivery Time</div>
                        <div className="flex items-center">
                          <div className="bg-green-100 h-4 rounded-full" style={{ width: '80%' }}>
                            <div className="bg-green-500 h-4 rounded-l-full" style={{ width: '60%' }}></div>
                          </div>
                          <span className="text-xs ml-2">5.4 days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Export Options */}
          <div className="flex justify-center gap-4 mt-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={async () => {
                try {
                  // Show loading state
                  const button = document.querySelector('[data-export-button]');
                  if (button) {
                    button.innerHTML = '<svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...';
                  }
                  
                  const response = await fetch('/api/export/procurement-report', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      reportType: 'Detailed Breakdown',
                      dateRange: 'Jan 2023 - Apr 2023'
                    }),
                  });
                  
                  const data = await response.json();
                  
                  if (!data.success) {
                    throw new Error('Failed to generate report');
                  }
                  
                  // Create CSV content
                  let csvContent = "data:text/csv;charset=utf-8,";
                  
                  // Add header
                  csvContent += `"${data.reportData.title}"\r\n`;
                  csvContent += `"Generated","${new Date(data.reportData.generatedAt).toLocaleString()}"\r\n`;
                  csvContent += `"Period","${data.reportData.dateRange}"\r\n\r\n`;
                  csvContent += `"Total Spend","£${(data.reportData.summary.totalSpend / 100).toFixed(2)}"\r\n\r\n`;
                  
                  // Projects section
                  csvContent += `"Projects"\r\n`;
                  csvContent += `"Project","Spend (£)","% of Total"\r\n`;
                  data.reportData.summary.projects.forEach(project => {
                    csvContent += `"${project.name}","£${(project.spend / 100).toFixed(2)}","${project.percentageOfTotal}%"\r\n`;
                  });
                  csvContent += "\r\n";
                  
                  // GPSMACS Categories section
                  csvContent += `"GPSMACS Categories"\r\n`;
                  csvContent += `"Code","Description","Spend (£)","%"\r\n`;
                  data.reportData.summary.gpsmacsCodes.forEach(code => {
                    csvContent += `"${code.code}","${code.name}","£${(code.spend / 100).toFixed(2)}","${code.percentage}%"\r\n`;
                  });
                  csvContent += "\r\n";
                  
                  // Top Suppliers section
                  csvContent += `"Top Suppliers"\r\n`;
                  csvContent += `"Supplier","Spend (£)","PO Count","Avg. PO Value (£)","% of Total"\r\n`;
                  data.reportData.summary.topSuppliers.forEach(supplier => {
                    csvContent += `"${supplier.name}","£${(supplier.spend / 100).toFixed(2)}","${supplier.poCount}","£${(supplier.avgPoValue / 100).toFixed(2)}","${supplier.percentageOfTotal}%"\r\n`;
                  });
                  csvContent += "\r\n";
                  
                  // Monthly Trend section
                  csvContent += `"Monthly Spend Trend"\r\n`;
                  csvContent += `"Month","Spend (£)"\r\n`;
                  data.reportData.summary.monthlyTrend.forEach(month => {
                    csvContent += `"${month.month}","£${(month.spend / 100).toFixed(2)}"\r\n`;
                  });
                  csvContent += "\r\n";
                  
                  // Key Insights section
                  csvContent += `"Key Insights"\r\n`;
                  data.reportData.insights.forEach(insight => {
                    csvContent += `"${insight}"\r\n`;
                  });
                  
                  // Create download link
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `procurement_report_${new Date().toISOString().slice(0, 10)}.csv`);
                  document.body.appendChild(link);
                  
                  // Trigger download
                  link.click();
                  
                  // Clean up
                  document.body.removeChild(link);
                  
                  // Reset button
                  if (button) {
                    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Export Full Report';
                  }
                } catch (error) {
                  console.error('Error generating report:', error);
                  alert('Failed to generate report. Please try again later.');
                  
                  // Reset button
                  const button = document.querySelector('[data-export-button]');
                  if (button) {
                    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Export Full Report';
                  }
                }
              }}
              data-export-button
            >
              <FileText className="h-4 w-4 mr-2" />
              Export Full Report
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 mr-2" />
              Configure Dashboard
            </Button>
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="delivery-tracker" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search deliveries..."
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-3">
              <select className="p-2 rounded-md border text-sm">
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="delayed">Delayed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Delivery Note
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Reference</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Delivery Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.length > 0 ? (
                  filteredPOs.map((po) => (
                    <TableRow 
                      key={po.id} 
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="font-medium">{po.reference}</div>
                      </TableCell>
                      <TableCell>{po.supplierName}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{po.description}</TableCell>
                      <TableCell>15/05/2025</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        Site address here
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Scheduled
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No deliveries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
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
                        <div>{supplier.contactEmail || '—'}</div>
                        <div className="text-sm text-muted-foreground">
                          {supplier.contactPhone || '—'}
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