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
import { Loader2, Package, Search, Plus, Warehouse, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { InventoryItem, InventoryLocation } from "@shared/schema";
import NewInventoryItemModal from "@/components/inventory/new-inventory-item-modal";
import NewInventoryLocationModal from "@/components/inventory/new-inventory-location-modal";
import StockTransactionModal from "@/components/inventory/stock-transaction-modal";
import ViewInventoryItemModal from "@/components/inventory/view-inventory-item-modal";
import ViewInventoryLocationModal from "@/components/inventory/view-inventory-location-modal";

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
  lowStockItems: number;
  itemsByCategory: {
    category: string;
    count: number;
  }[];
  recentTransactions: {
    id: number;
    type: 'purchase' | 'issue' | 'return' | 'transfer' | 'adjustment' | 'stocktake';
    itemName: string;
    quantity: number;
    date: string;
  }[];
}

export default function Inventory() {
  // Fetch inventory dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<InventoryDashboard>({
    queryKey: ['/api/inventory/dashboard'],
  });

  // Fetch inventory items
  const { data: items = [], isLoading: isItemsLoading } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory/items'],
  });

  // Fetch inventory locations
  const { data: locations = [], isLoading: isLocationsLoading } = useQuery<InventoryLocation[]>({
    queryKey: ['/api/inventory/locations'],
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
  const [transactionType, setTransactionType] = useState<'purchase' | 'issue' | 'transfer'>('purchase');
  const [viewItemId, setViewItemId] = useState<number | null>(null);
  const [viewLocationId, setViewLocationId] = useState<number | null>(null);

  // Filter items based on search query
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  // Filter locations based on search query
  const filteredLocations = locations.filter(location => 
    location.name.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
    location.type.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  // Helper to open transaction modal with specified type
  const openTransactionModal = (type: 'purchase' | 'issue' | 'transfer') => {
    setTransactionType(type);
    setIsTransactionModalOpen(true);
  };

  // Helper to determine if an item has low stock
  const isLowStock = (item: InventoryItem, stockLevels: StockLevel[]): boolean => {
    if (item.reorderPoint === null) return false;
    
    const totalStock = stockLevels.reduce((sum, level) => sum + level.quantity, 0);
    return totalStock <= item.reorderPoint;
  };

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
                    <div className="text-2xl font-bold">{dashboardData.totalItems}</div>
                    <p className="text-xs text-muted-foreground">
                      across {dashboardData.itemsByCategory.length} categories
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.totalLocations}</div>
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
                    <div className="text-2xl font-bold">{dashboardData.totalStock}</div>
                    <p className="text-xs text-muted-foreground">
                      units across all inventory items
                    </p>
                  </CardContent>
                </Card>
                
                <Card className={dashboardData.lowStockItems > 0 ? "border-amber-300" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                    <Package className={cn(
                      "h-4 w-4",
                      dashboardData.lowStockItems > 0 ? "text-amber-500" : "text-muted-foreground"
                    )} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.lowStockItems}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.lowStockItems > 0 
                        ? "items below reorder point" 
                        : "all items are in stock"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.recentTransactions.length > 0 ? (
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

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Items by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.itemsByCategory.map(category => (
                        <div key={category.category} className="flex items-center justify-between">
                          <div className="font-medium">{category.category}</div>
                          <Badge variant="outline">{category.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-center gap-4">
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
                  variant="ghost" 
                  onClick={() => openTransactionModal('transfer')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Transfer Stock
                </Button>
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
    </div>
  );
}