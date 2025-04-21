import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowLeftRight,
  Warehouse,
  AlertTriangle
} from 'lucide-react';
import PageHeader from '@/components/layout/page-header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import NewInventoryItemModal from '@/components/inventory/new-inventory-item-modal';
import NewInventoryLocationModal from '@/components/inventory/new-inventory-location-modal';
import StockTransactionModal from '@/components/inventory/stock-transaction-modal';
import ViewInventoryItemModal from '@/components/inventory/view-inventory-item-modal';
import ViewInventoryLocationModal from '@/components/inventory/view-inventory-location-modal';
import { InventoryItem, InventoryLocation, PurchaseOrder } from '@shared/schema';
import { Progress } from '@/components/ui/progress';

interface DashboardData {
  lowStockCount: number;
  lowStockItems: InventoryItem[];
  totalItems: number;
  totalValue: number;
  recentTransactions: any[];
  stockByCategory: {
    category: string;
    totalItems: number;
    totalStock: number;
    totalValue: number;
  }[];
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [newLocationModalOpen, setNewLocationModalOpen] = useState(false);
  const [stockTransactionModalOpen, setStockTransactionModalOpen] = useState(false);
  const [viewItemModalOpen, setViewItemModalOpen] = useState(false);
  const [viewLocationModalOpen, setViewLocationModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [transactionType, setTransactionType] = useState<'purchase' | 'issue' | 'transfer'>('purchase');

  // Get inventory items
  const { data: items = [], isLoading: itemsLoading } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory/items'],
  });

  // Get inventory locations
  const { data: locations = [], isLoading: locationsLoading } = useQuery<InventoryLocation[]>({
    queryKey: ['/api/inventory/locations'],
  });

  // Get inventory dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ['/api/inventory/dashboard'],
  });

  // Filter items by search query
  const filteredItems = searchQuery
    ? items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  // Filter locations by search query
  const filteredLocations = searchQuery
    ? locations.filter(location => 
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : locations;

  const handleViewItem = (itemId: number) => {
    setSelectedItemId(itemId);
    setViewItemModalOpen(true);
  };

  const handleViewLocation = (locationId: number) => {
    setSelectedLocationId(locationId);
    setViewLocationModalOpen(true);
  };

  const handleTransactionClick = (type: 'purchase' | 'issue' | 'transfer') => {
    setTransactionType(type);
    setStockTransactionModalOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'materials':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'plant':
        return <Warehouse className="h-4 w-4 text-green-500" />;
      case 'ppe':
        return <Package className="h-4 w-4 text-orange-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PageHeader title="Inventory & Stock Control" subtitle="Manage inventory items, locations and stock levels" />

      {/* Dashboard */}
      {dashboardData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardData.stockByCategory.length} categories
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{(dashboardData.totalValue / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Inventory value</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{locations.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Storage locations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-500 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.lowStockCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Items below reorder point</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Distribution */}
      {dashboardData && dashboardData.stockByCategory.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.stockByCategory.map((category) => (
                <div key={category.category} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category.category)}
                      <span className="text-sm font-medium">{category.category}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {category.totalItems} items · £{(category.totalValue / 100).toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={category.totalValue / (dashboardData.totalValue || 1) * 100} 
                    className="h-2" 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => handleTransactionClick('purchase')}
        >
          <ArrowDownToLine size={16} />
          Receive Stock
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => handleTransactionClick('issue')}
        >
          <ArrowUpFromLine size={16} />
          Issue Stock
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => handleTransactionClick('transfer')}
        >
          <ArrowLeftRight size={16} />
          Transfer Stock
        </Button>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="items">Inventory Items</TabsTrigger>
          <TabsTrigger value="locations">Storage Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Button onClick={() => setNewItemModalOpen(true)} className="flex items-center gap-2">
              <Plus size={16} />
              New Inventory Item
            </Button>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {itemsLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <Card 
                  key={item.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewItem(item.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.code}</div>
                      </div>
                      <Badge className="capitalize bg-blue-100 text-blue-800 hover:bg-blue-100">
                        {item.category}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {item.description || "No description provided"}
                    </p>
                    
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">Unit: </span>
                        <span className="font-medium">{item.unit}</span>
                      </div>
                      {item.unitCost && (
                        <div>
                          <span className="text-muted-foreground">Cost: </span>
                          <span className="font-medium">£{(item.unitCost / 100).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {searchQuery ? 'No items found matching your search' : 'No inventory items found'}
            </div>
          )}
        </TabsContent>

        <TabsContent value="locations" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Button onClick={() => setNewLocationModalOpen(true)} className="flex items-center gap-2">
              <Plus size={16} />
              New Location
            </Button>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {locationsLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredLocations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredLocations.map((location) => (
                <Card 
                  key={location.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewLocation(location.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-semibold">{location.name}</div>
                      <Badge variant="outline" className="capitalize">
                        {location.type}
                      </Badge>
                    </div>
                    
                    {location.address && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {location.address}
                      </p>
                    )}
                    
                    {location.contactPerson && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Contact: </span>
                        <span>{location.contactPerson}</span>
                        {location.contactPhone && (
                          <span className="text-muted-foreground ml-2">{location.contactPhone}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {searchQuery ? 'No locations found matching your search' : 'No locations found'}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {newItemModalOpen && (
        <NewInventoryItemModal
          open={newItemModalOpen}
          onClose={() => setNewItemModalOpen(false)}
        />
      )}

      {newLocationModalOpen && (
        <NewInventoryLocationModal
          open={newLocationModalOpen}
          onClose={() => setNewLocationModalOpen(false)}
        />
      )}

      {stockTransactionModalOpen && (
        <StockTransactionModal
          open={stockTransactionModalOpen}
          onClose={() => setStockTransactionModalOpen(false)}
          type={transactionType}
          items={items}
          locations={locations}
        />
      )}

      {viewItemModalOpen && selectedItemId && (
        <ViewInventoryItemModal
          open={viewItemModalOpen}
          onClose={() => {
            setViewItemModalOpen(false);
            setSelectedItemId(null);
          }}
          itemId={selectedItemId}
        />
      )}

      {viewLocationModalOpen && selectedLocationId && (
        <ViewInventoryLocationModal
          open={viewLocationModalOpen}
          onClose={() => {
            setViewLocationModalOpen(false);
            setSelectedLocationId(null);
          }}
          locationId={selectedLocationId}
        />
      )}
    </div>
  );
}