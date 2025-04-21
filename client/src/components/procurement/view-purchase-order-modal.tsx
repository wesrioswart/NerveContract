import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AlertCircle, Printer, FileDown, Truck, Calendar, ClipboardList } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from '@shared/schema';
import { Separator } from "@/components/ui/separator";
import { purchaseOrderStatusColors } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ViewPurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  purchaseOrderId: number;
}

interface PurchaseOrderDetails extends PurchaseOrder {
  supplierName?: string;
  supplierContact?: string;
  supplierEmail?: string;
  nominalCodeDescription?: string;
  items: PurchaseOrderItem[];
}

export default function ViewPurchaseOrderModal({ open, onClose, purchaseOrderId }: ViewPurchaseOrderModalProps) {
  const { toast } = useToast();
  const [statusUpdateMode, setStatusUpdateMode] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  // Fetch purchase order details
  const { data: po, isLoading, isError } = useQuery<PurchaseOrderDetails>({
    queryKey: ['/api/purchase-orders', purchaseOrderId],
    enabled: open && !!purchaseOrderId
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest('PATCH', `/api/purchase-orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/purchase-orders', purchaseOrderId] });
      setStatusUpdateMode(false);
      toast({
        title: "Status Updated",
        description: "The purchase order status has been updated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Status",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleStatusUpdate = () => {
    if (!po || !newStatus || newStatus === po.status) return;
    updateStatusMutation.mutate({ id: po.id, status: newStatus });
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  const printPO = () => {
    window.print();
  };

  // This would be more sophisticated in a production app
  const downloadPOAsPDF = () => {
    toast({
      title: "Coming Soon",
      description: "PDF download functionality is coming soon."
    });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={open => !open && onClose()}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="flex justify-center my-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isError || !po) {
    return (
      <Dialog open={open} onOpenChange={open => !open && onClose()}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="flex flex-col items-center my-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Purchase Order</h3>
            <p className="text-muted-foreground">There was a problem loading the purchase order details.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const totalItems = po.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = po.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const vat = po.vatIncluded ? po.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.vatRate / 100), 0) : 0;

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between print:hidden">
          <DialogTitle className="text-xl mr-4">Purchase Order</DialogTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={printPO} className="flex items-center gap-1">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPOAsPDF} className="flex items-center gap-1">
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </DialogHeader>

        {/* PO Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">{po.reference}</h2>
            <div className="flex items-center gap-2 mt-1">
              {statusUpdateMode ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={newStatus || po.status}
                    onValueChange={setNewStatus}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleStatusUpdate} disabled={updateStatusMutation.isPending}>
                    {updateStatusMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setStatusUpdateMode(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <Badge className={`${purchaseOrderStatusColors[po.status]}`}>
                    {getStatusLabel(po.status)}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setNewStatus(po.status);
                      setStatusUpdateMode(true);
                    }}
                    className="print:hidden"
                  >
                    Change
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end text-sm md:text-right">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Delivery Date: {po.deliveryDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span>
                {po.deliveryMethod.charAt(0).toUpperCase() + po.deliveryMethod.slice(1)}
                {po.hireDuration && po.hireDuration !== 'N/A' && ` (Hire: ${po.hireDuration})`}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:grid-cols-2">
          {/* Supplier Info */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Supplier</h3>
              <p className="font-medium">{po.supplierName}</p>
              {po.supplierContact && <p className="text-sm">{po.supplierContact}</p>}
              {po.supplierEmail && <p className="text-sm">{po.supplierEmail}</p>}
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Delivery Address</h3>
              <p className="whitespace-pre-line">{po.deliveryAddress}</p>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Description</h3>
          </div>
          <p className="whitespace-pre-line">{po.description}</p>
          
          <div className="text-sm text-muted-foreground mt-2">
            Nominal Code: {po.nominalCodeDescription}
          </div>
        </div>

        {/* Items */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Order Items</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr className="divide-x divide-border">
                  <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
                  <th className="px-4 py-2 text-right text-sm font-medium w-20">Qty</th>
                  <th className="px-4 py-2 text-center text-sm font-medium w-20">Unit</th>
                  <th className="px-4 py-2 text-right text-sm font-medium w-28">Unit Price</th>
                  <th className="px-4 py-2 text-right text-sm font-medium w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {po.items.map((item, index) => (
                  <tr key={index} className="divide-x divide-border">
                    <td className="px-4 py-2 text-sm">{item.description}</td>
                    <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm text-center">{item.unit}</td>
                    <td className="px-4 py-2 text-sm text-right">£{(item.unitPrice / 100).toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">£{((item.quantity * item.unitPrice) / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Summary */}
        <div className="flex flex-col items-end mb-6">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Items:</span>
              <span>{totalItems} items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>£{(subtotal / 100).toFixed(2)}</span>
            </div>
            {po.vatIncluded && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT:</span>
                  <span>£{(vat / 100).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total (incl. VAT):</span>
                  <span>£{((subtotal + vat) / 100).toFixed(2)}</span>
                </div>
              </>
            )}
            {!po.vatIncluded && (
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>£{(subtotal / 100).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}