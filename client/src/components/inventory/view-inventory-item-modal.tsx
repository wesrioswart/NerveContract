import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Package, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '@shared/schema';
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { transactionTypeColors } from '@/lib/constants';

interface ViewInventoryItemModalProps {
  open: boolean;
  onClose: () => void;
  itemId: number;
}

interface StockLevel {
  id: number;
  itemId: number;
  locationId: number;
  quantity: number;
  lastUpdated: string;
  locationName: string;
  locationType: string;
}

interface Transaction {
  id: number;
  type: 'purchase' | 'issue' | 'return' | 'transfer' | 'adjustment' | 'stocktake';
  quantity: number;
  fromLocationName?: string;
  toLocationName?: string;
  comments?: string;
  transactionDate: string;
}

interface ItemDetails extends InventoryItem {
  stockLevels: StockLevel[];
  recentTransactions: Transaction[];
  totalStock: number;
}

export default function ViewInventoryItemModal({ open, onClose, itemId }: ViewInventoryItemModalProps) {
  // Fetch inventory item details
  const { data: item, isLoading, isError } = useQuery<ItemDetails>({
    queryKey: ['/api/inventory/items', itemId],
    enabled: open && !!itemId
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ArrowDownToLine className="h-4 w-4" />;
      case 'issue':
        return <ArrowUpFromLine className="h-4 w-4" />;
      case 'return':
        return <ArrowDownToLine className="h-4 w-4" />;
      case 'transfer':
        return <ArrowLeftRight className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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

  if (isError || !item) {
    return (
      <Dialog open={open} onOpenChange={open => !open && onClose()}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex flex-col items-center my-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Item</h3>
            <p className="text-muted-foreground">There was a problem loading the inventory item details.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isLowStock = item.reorderPoint !== null && item.totalStock <= item.reorderPoint;

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">{item.name}</DialogTitle>
          <Badge className="capitalize bg-blue-100 text-blue-800 hover:bg-blue-100">
            {item.category}
          </Badge>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Item Code</p>
            <p className="font-medium">{item.code}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Unit of Measurement</p>
            <p className="font-medium capitalize">{item.unit}</p>
          </div>
        </div>

        {item.description && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p>{item.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className={isLowStock ? "border-amber-300" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm">Total Stock</h3>
                {isLowStock && (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <p className="text-2xl font-bold">{item.totalStock}</p>
              {item.reorderPoint !== null && (
                <p className="text-xs text-muted-foreground">
                  Reorder at {item.reorderPoint}
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-1">Locations</h3>
              <p className="text-2xl font-bold">{item.stockLevels.length}</p>
              <p className="text-xs text-muted-foreground">
                Storage locations
              </p>
            </CardContent>
          </Card>
          
          {item.unitCost !== null && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sm mb-1">Unit Cost</h3>
                <p className="text-2xl font-bold">£{(item.unitCost / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  Per {item.unit}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stock Levels */}
        {item.stockLevels.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Stock Levels by Location</h3>
            <div className="space-y-3">
              {item.stockLevels.map((level) => (
                <div key={level.id}>
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="font-medium">{level.locationName}</span>
                      <span className="text-xs text-muted-foreground ml-2 capitalize">({level.locationType})</span>
                    </div>
                    <span className="font-medium">{level.quantity} {item.unit}</span>
                  </div>
                  <Progress value={(level.quantity / Math.max(1, item.totalStock)) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {item.recentTransactions.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Recent Transactions</h3>
            <div className="border rounded-md divide-y">
              {item.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${transactionTypeColors[transaction.type]}`}>
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </Badge>
                          <span className="font-medium">
                            {transaction.quantity} {item.unit}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {transaction.type === 'transfer' 
                            ? `${transaction.fromLocationName} → ${transaction.toLocationName}`
                            : transaction.type === 'issue'
                              ? `From: ${transaction.fromLocationName}`
                              : transaction.type === 'purchase'
                                ? `To: ${transaction.toLocationName}`
                                : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(transaction.transactionDate)}
                    </span>
                  </div>
                  {transaction.comments && (
                    <p className="text-sm mt-2 ml-6 text-muted-foreground">{transaction.comments}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}