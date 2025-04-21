import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Download, FileText, ClipboardList, User, Building, Phone, Mail, MapPin, Truck, Calendar } from 'lucide-react';
import { purchaseOrderStatusColors } from '@/lib/constants';
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ViewPurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  purchaseOrderId: number;
}

interface PurchaseOrderItem {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
}

interface PurchaseOrderDetails {
  id: number;
  reference: string;
  projectReference: string;
  projectName: string;
  nominalCode: string;
  supplierId: number;
  supplierName: string;
  supplierEmail: string | null;
  supplierPhone: string | null;
  supplierContactPerson: string | null;
  description: string;
  deliveryMethod: string;
  hireDuration: string;
  estimatedCost: number;
  totalCost: number;
  vatIncluded: boolean;
  deliveryDate: string;
  deliveryAddress: string;
  status: string;
  createdAt: string;
  items: PurchaseOrderItem[];
}

export default function ViewPurchaseOrderModal({ open, onClose, purchaseOrderId }: ViewPurchaseOrderModalProps) {
  const { toast } = useToast();
  
  // Fetch purchase order details
  const { data: po, isLoading, isError } = useQuery<PurchaseOrderDetails>({
    queryKey: ['/api/purchase-orders', purchaseOrderId],
    enabled: open && !!purchaseOrderId
  });

  // Format currency
  const formatCurrency = (value: number): string => {
    return `£${(value / 100).toFixed(2)}`;
  };

  // Update PO status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await apiRequest('PATCH', `/api/purchase-orders/${purchaseOrderId}`, {
        status: newStatus
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Purchase order status has been updated successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Download PO as PDF
  const downloadPDF = async () => {
    try {
      const res = await apiRequest('GET', `/api/purchase-orders/${purchaseOrderId}/pdf`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PO-${po?.reference || purchaseOrderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download purchase order PDF.",
        variant: "destructive",
      });
    }
  };

  // Handle status update
  const handleStatusUpdate = (newStatus: string) => {
    if (po?.status === newStatus) return;
    updateStatusMutation.mutate(newStatus);
  };

  // Get next status options based on current status
  const getNextStatusOptions = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case 'draft':
        return ['pending_approval'];
      case 'pending_approval':
        return ['approved', 'cancelled'];
      case 'approved':
        return ['ordered', 'cancelled'];
      case 'ordered':
        return ['delivered', 'cancelled'];
      case 'delivered':
        return ['completed'];
      default:
        return [];
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

  if (isError || !po) {
    return (
      <Dialog open={open} onOpenChange={open => !open && onClose()}>
        <DialogContent className="sm:max-w-[700px]">
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

  const nextStatusOptions = getNextStatusOptions(po.status);

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <DialogTitle className="text-xl">Purchase Order {po.reference}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Created on {new Date(po.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge className={purchaseOrderStatusColors[po.status]}>
            {po.status.replace('_', ' ')}
          </Badge>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Supplier</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="py-3">
              <div className="text-sm space-y-2">
                <p className="font-medium">{po.supplierName}</p>
                {po.supplierContactPerson && (
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{po.supplierContactPerson}</span>
                  </div>
                )}
                {po.supplierPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{po.supplierPhone}</span>
                  </div>
                )}
                {po.supplierEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{po.supplierEmail}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Project Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="py-3">
              <div className="text-sm space-y-2">
                <p><span className="text-muted-foreground">Project:</span> {po.projectName}</p>
                <p><span className="text-muted-foreground">Reference:</span> {po.projectReference}</p>
                <p><span className="text-muted-foreground">Nominal Code:</span> {po.nominalCode}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Delivery Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="py-3">
              <div className="text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{po.deliveryDate}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <span className="whitespace-pre-line">{po.deliveryAddress}</span>
                </div>
                <p><span className="text-muted-foreground">Method:</span> {po.deliveryMethod}</p>
                {po.hireDuration && po.hireDuration !== "N/A" && (
                  <p><span className="text-muted-foreground">Hire Duration:</span> {po.hireDuration}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-sm whitespace-pre-line">{po.description}</p>
        </div>

        <div className="rounded-md border mb-6">
          <div className="p-4 bg-muted font-medium flex items-center justify-between">
            <h3>Items</h3>
            <span>Total: {formatCurrency(po.totalCost)}{po.vatIncluded ? " + VAT" : " (VAT included)"}</span>
          </div>
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="py-3 px-4 text-left font-medium">Description</th>
                <th className="py-3 px-4 text-right font-medium">Quantity</th>
                <th className="py-3 px-4 text-right font-medium">Unit Price</th>
                <th className="py-3 px-4 text-right font-medium">VAT</th>
                <th className="py-3 px-4 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {po.items.map(item => (
                <tr key={item.id}>
                  <td className="py-3 px-4 text-sm">{item.description}</td>
                  <td className="py-3 px-4 text-sm text-right">{item.quantity} {item.unit}</td>
                  <td className="py-3 px-4 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 px-4 text-sm text-right">{item.vatRate}%</td>
                  <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={downloadPDF}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>

          {nextStatusOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {nextStatusOptions.map(status => (
                <Button
                  key={status}
                  variant={status === 'cancelled' ? 'destructive' : 'default'}
                  size="sm"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => handleStatusUpdate(status)}
                >
                  {status === 'pending_approval' && 'Submit for Approval'}
                  {status === 'approved' && 'Approve'}
                  {status === 'ordered' && 'Mark as Ordered'}
                  {status === 'delivered' && 'Mark as Delivered'}
                  {status === 'completed' && 'Mark as Completed'}
                  {status === 'cancelled' && 'Cancel Order'}
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}