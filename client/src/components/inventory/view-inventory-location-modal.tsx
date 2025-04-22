import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Package, HomeIcon, Phone, User } from 'lucide-react';
import { InventoryLocation } from '@shared/schema';

interface ViewInventoryLocationModalProps {
  open: boolean;
  onClose: () => void;
  locationId: number;
}

interface StockItem {
  id: number;
  itemId: number;
  locationId: number;
  quantity: number;
  lastUpdated: string;
  itemName: string;
  itemCode: string;
  category: string;
  unit: string;
}

interface LocationDetails extends InventoryLocation {
  stock: StockItem[];
}

export default function ViewInventoryLocationModal({ open, onClose, locationId }: ViewInventoryLocationModalProps) {
  // Fetch location details
  const { data: location, isLoading, isError } = useQuery<LocationDetails>({
    queryKey: ['/api/inventory/locations', locationId],
    enabled: open && !!locationId
  });

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'yard':
        return <HomeIcon className="h-5 w-5 text-blue-600" />;
      case 'store':
        return <HomeIcon className="h-5 w-5 text-green-600" />;
      case 'warehouse':
        return <HomeIcon className="h-5 w-5 text-purple-600" />;
      case 'site':
        return <HomeIcon className="h-5 w-5 text-orange-600" />;
      default:
        return <HomeIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={open => !open && onClose()}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex justify-center my-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isError || !location) {
    return (
      <Dialog open={open} onOpenChange={open => !open && onClose()}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex flex-col items-center my-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Location</h3>
            <p className="text-muted-foreground">There was a problem loading the location details.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const totalItems = location.stock?.length || 0;
  const totalStock = location.stock?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const uniqueCategories = new Set(location.stock?.map(item => item.category) || []);

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {getLocationIcon(location.type)}
            <DialogTitle className="text-xl">{location.name}</DialogTitle>
          </div>
          <Badge className="capitalize">
            {location.type}
          </Badge>
        </DialogHeader>

        {location.address && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Address</p>
            <p className="whitespace-pre-line">{location.address}</p>
          </div>
        )}

        {(location.contactPerson || location.contactPhone) && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {location.contactPerson && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p>{location.contactPerson}</p>
                </div>
              </div>
            )}
            
            {location.contactPhone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact Phone</p>
                  <p>{location.contactPhone}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-1">Total Items</h3>
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-xs text-muted-foreground">
                Unique items
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-1">Total Stock</h3>
              <p className="text-2xl font-bold">{totalStock}</p>
              <p className="text-xs text-muted-foreground">
                Units across all items
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-1">Categories</h3>
              <p className="text-2xl font-bold">{uniqueCategories.size}</p>
              <p className="text-xs text-muted-foreground">
                Item categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Items */}
        {(location.stock?.length || 0) > 0 ? (
          <div>
            <h3 className="font-semibold mb-3">Inventory Items</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Item</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Category</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {location.stock?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <Package className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <div className="font-medium">{item.itemName}</div>
                            <div className="text-xs text-muted-foreground">{item.itemCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {item.quantity} {item.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            No inventory items at this location
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}