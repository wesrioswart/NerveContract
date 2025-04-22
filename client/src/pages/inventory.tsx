import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Package, Search, Plus, Warehouse, 
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, 
  ShieldAlert, BarChart3, PieChart, TrendingUp,
  DollarSign
} from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { InventoryItem, InventoryLocation } from "@shared/schema";
import NewInventoryItemModal from "@/components/inventory/new-inventory-item-modal";
import NewInventoryLocationModal from "@/components/inventory/new-inventory-location-modal";
import StockTransactionModal from "@/components/inventory/stock-transaction-modal";
import ViewInventoryItemModal from "@/components/inventory/view-inventory-item-modal";
import ViewInventoryLocationModal from "@/components/inventory/view-inventory-location-modal";
import BatchInventoryOperationsModal from "@/components/inventory/batch-inventory-operations-modal";
import { useUser } from "@/contexts/user-context";
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart as RPieChart, Pie, 
  Sector, Cell 
} from 'recharts';

interface StockLevel {
  locationId: number;
  locationName: string;
  locationType: string;
  quantity: number;
}

export interface InventoryDashboard {
  totalItems: number;
  totalLocations: number;
  totalStock: number;
  totalValue?: number;
  lowStockCount: number;
  lowStockItems: {
    id: number;
    name: string;
    code: string;
    category: string;
    reorderPoint: number;
    unit: string;
    totalStock?: number;
  }[];
  itemsByCategory: {
    category: string;
    count: number;
    totalStock?: number;
    totalValue?: number;
  }[];
  recentTransactions: {
    id: number;
    type: 'purchase' | 'issue' | 'return' | 'transfer' | 'adjustment' | 'stocktake';
    itemName: string;
    itemCode?: string;
    quantity: number;
    fromLocationName?: string;
    date: string;
  }[];
  stockTrends?: {
    date: string;
    netChange: number;
  }[];
  transactionByType?: {
    type: string;
    count: number;
  }[];
}

export default function Inventory() {
  // Get authentication status from user context
  const { isAuthenticated, user } = useUser();

  // Fetch inventory dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useQuery<InventoryDashboard>({
    queryKey: ['/api/inventory/dashboard'],
    enabled: isAuthenticated, // Only run query if authenticated
  });

  // Fetch inventory items
  const { data: items = [], isLoading: isItemsLoading, error: itemsError } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory/items'],
    enabled: isAuthenticated, // Only run query if authenticated
  });

  // Fetch inventory locations
  const { data: locations = [], isLoading: isLocationsLoading, error: locationsError } = useQuery<InventoryLocation[]>({
    queryKey: ['/api/inventory/locations'],
    enabled: isAuthenticated, // Only run query if authenticated
  });

  // State for tab
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  
  // State for item and location search
  const [itemSearchQuery, setItemSearchQuery] = useState<string>("");
  const [locationSearchQuery, setLocationSearchQuery] = useState<string>("");
  
  // State for modals
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState<boolean>(false);
  const [isNewLocationModalOpen, setIsNewLocationModalOpen] = useState<boolean>(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [transactionType, setTransactionType] = useState<'purchase' | 'issue' | 'transfer'>('purchase');
  const [batchOperationType, setBatchOperationType] = useState<'purchase' | 'issue' | 'adjustment'>('purchase');
  const [viewItemId, setViewItemId] = useState<number | null>(null);
  const [viewLocationId, setViewLocationId] = useState<number | null>(null);

  // Add totalStock property to each item
  const itemsWithTotalStock = items.map(item => ({
    ...item,
    totalStock: 0 // This would normally come from the API, we're setting a default for now
  }));

  // Add itemCount property to each location
  const locationsWithItemCount = locations.map(location => ({
    ...location,
    itemCount: 0 // This would normally come from the API, we're setting a default for now
  }));

  // Filter items based on search query
  const filteredItems = itemsWithTotalStock.filter(item => 
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  // Filter locations based on search query
  const filteredLocations = locationsWithItemCount.filter(location => 
    location.name.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
    location.type.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  // Helper to open transaction modal with specified type
  const openTransactionModal = (type: 'purchase' | 'issue' | 'transfer') => {
    setTransactionType(type);
    setIsTransactionModalOpen(true);
  };
  
  // Helper to open batch operations modal with specified type
  const openBatchModal = (type: 'purchase' | 'issue' | 'adjustment') => {
    setBatchOperationType(type);
    setIsBatchModalOpen(true);
  };

  // Helper to determine if an item has low stock
  const isLowStock = (item: InventoryItem, stockLevels: StockLevel[]): boolean => {
    if (item.reorderPoint === null) return false;
    
    const totalStock = stockLevels.reduce((sum, level) => sum + level.quantity, 0);
    return totalStock <= item.reorderPoint;
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
              You need to log in to access inventory management features.
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
  if (isItemsLoading || isLocationsLoading || isDashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Inventory Management" 
        subtitle="Manage inventory items, locations, and stock levels"
      />

      <Tabs 
        defaultValue="dashboard" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 w-[400px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboardData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.totalItems || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      across {dashboardData?.itemsByCategory?.length || 0} categories
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.totalLocations || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      across different sites and yards
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Stock Levels</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.totalStock || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      units across all inventory items
                    </p>
                  </CardContent>
                </Card>
                
                <Card className={(dashboardData?.lowStockCount || 0) > 0 ? "border-amber-300" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                    <Package className={cn(
                      "h-4 w-4",
                      (dashboardData?.lowStockCount || 0) > 0 ? "text-amber-500" : "text-muted-foreground"
                    )} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.lowStockCount || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {(dashboardData?.lowStockCount || 0) > 0 
                        ? "items below reorder point" 
                        : "all items are in stock"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Stock Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Stock Level Trends (30 Days)
                  </CardTitle>
                  <CardDescription>
                    Net change in stock levels over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData?.stockTrends && dashboardData.stockTrends.length > 0 ? (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={dashboardData.stockTrends}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="stockTrend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getDate()}/${date.getMonth() + 1}`;
                            }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value) => [`${value} units`, 'Net Change']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="netChange" 
                            stroke="hsl(var(--primary))" 
                            fillOpacity={1} 
                            fill="url(#stockTrend)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No trend data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transaction Analysis and Recent Transactions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Transaction Type Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary" />
                      Transactions by Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardData?.transactionByType && dashboardData.transactionByType.length > 0 ? (
                      <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RPieChart>
                            <Pie
                              data={dashboardData.transactionByType}
                              dataKey="count"
                              nameKey="type"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              label={({type, percent}) => `${type} (${(percent * 100).toFixed(0)}%)`}
                              labelLine={false}
                            >
                              {dashboardData.transactionByType.map((entry, index) => {
                                const COLORS = [
                                  'hsl(var(--primary))', 
                                  'hsl(var(--secondary))', 
                                  '#ff9800', 
                                  '#e91e63', 
                                  '#673ab7'
                                ];
                                return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                              })}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`${value} transactions`, 'Count']}
                              labelFormatter={(label) => label}
                            />
                          </RPieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[220px] text-muted-foreground">
                        No transaction data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.recentTransactions?.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.recentTransactions.map(transaction => (
                          <div key={transaction.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {transaction.type === 'purchase' && <ArrowDownToLine className="h-4 w-4 text-blue-500" />}
                              {transaction.type === 'issue' && <ArrowUpFromLine className="h-4 w-4 text-amber-500" />}
                              {transaction.type === 'transfer' && <ArrowLeftRight className="h-4 w-4 text-purple-500" />}
                              <div>
                                <div className="font-medium">{transaction.itemName}</div>
                                <div className="text-sm text-muted-foreground">
                                  <span className="capitalize">{transaction.type}</span> • {transaction.quantity} units
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No recent transactions
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Category Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Inventory by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.itemsByCategory && dashboardData.itemsByCategory.length > 0 ? (
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dashboardData.itemsByCategory}
                          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="category" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                          />
                          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value, name) => {
                              if (name === 'count') return [`${value} items`, 'Item Count'];
                              if (name === 'totalStock') return [`${value} units`, 'Total Stock'];
                              return [value, name];
                            }}
                          />
                          <Legend />
                          <Bar 
                            yAxisId="left"
                            dataKey="count" 
                            name="Item Count"
                            fill="hsl(var(--primary))" 
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            yAxisId="right"
                            dataKey="totalStock" 
                            name="Total Stock"
                            fill="hsl(var(--secondary))" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No category data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-md">Individual Operations</CardTitle>
                    <CardDescription>Process transactions for a single item</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="default" 
                        onClick={() => openTransactionModal('purchase')}
                        className="flex items-center gap-2"
                      >
                        <ArrowDownToLine className="h-4 w-4" />
                        Receive Stock
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => openTransactionModal('issue')}
                        className="flex items-center gap-2"
                      >
                        <ArrowUpFromLine className="h-4 w-4" />
                        Issue Stock
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => openTransactionModal('transfer')}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                        Transfer Stock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-md">Batch Operations</CardTitle>
                    <CardDescription>Process multiple items at once</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="default" 
                        onClick={() => openBatchModal('purchase')}
                        className="flex items-center gap-2"
                      >
                        <ArrowDownToLine className="h-4 w-4" />
                        Batch Receive
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => openBatchModal('issue')}
                        className="flex items-center gap-2"
                      >
                        <ArrowUpFromLine className="h-4 w-4" />
                        Batch Issue
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => openBatchModal('adjustment')}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                        Batch Adjustment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search items by name, code, or category..."
                className="pl-8"
                value={itemSearchQuery}
                onChange={e => setItemSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsNewItemModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Item
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Stock Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow 
                      key={item.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setViewItemId(item.id)}
                    >
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                      </TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{item.unit}</TableCell>
                      <TableCell className="text-right">
                        {item.unitCost !== null ? `£${(item.unitCost / 100).toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        item.totalStock <= (item.reorderPoint || 0) && item.reorderPoint !== null
                          ? "text-amber-600"
                          : ""
                      )}>
                        {item.totalStock || 0}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No items found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search locations by name or type..."
                className="pl-8"
                value={locationSearchQuery}
                onChange={e => setLocationSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsNewLocationModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Location
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead className="text-right">Total Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((location) => (
                    <TableRow 
                      key={location.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setViewLocationId(location.id)}
                    >
                      <TableCell>
                        <div className="font-medium">{location.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {location.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {location.address ? location.address.split('\n')[0] : '—'}
                      </TableCell>
                      <TableCell>
                        {location.contactPerson || '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {location.itemCount || 0}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No locations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <NewInventoryItemModal 
        open={isNewItemModalOpen} 
        onClose={() => setIsNewItemModalOpen(false)} 
      />

      <NewInventoryLocationModal 
        open={isNewLocationModalOpen} 
        onClose={() => setIsNewLocationModalOpen(false)} 
      />

      {isTransactionModalOpen && (
        <StockTransactionModal 
          open={isTransactionModalOpen} 
          onClose={() => setIsTransactionModalOpen(false)} 
          type={transactionType}
          items={items}
          locations={locations}
        />
      )}

      {viewItemId && (
        <ViewInventoryItemModal 
          open={!!viewItemId} 
          onClose={() => setViewItemId(null)} 
          itemId={viewItemId}
        />
      )}
      
      {viewLocationId && (
        <ViewInventoryLocationModal 
          open={!!viewLocationId} 
          onClose={() => setViewLocationId(null)} 
          locationId={viewLocationId}
        />
      )}
      
      {isBatchModalOpen && (
        <BatchInventoryOperationsModal
          open={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          items={items}
          locations={locations}
          defaultType={batchOperationType}
        />
      )}
    </div>
  );
}