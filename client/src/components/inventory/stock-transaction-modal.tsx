import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { InventoryItem, InventoryLocation, InsertStockTransaction } from '@shared/schema';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from 'lucide-react';

interface StockTransactionModalProps {
  open: boolean;
  onClose: () => void;
  type: 'purchase' | 'issue' | 'transfer';
  items: InventoryItem[];
  locations: InventoryLocation[];
}

const transactionTypeLabels = {
  purchase: 'Receive Stock',
  issue: 'Issue Stock',
  transfer: 'Transfer Stock'
};

const transactionTypeIcons = {
  purchase: <ArrowDownToLine className="h-5 w-5" />,
  issue: <ArrowUpFromLine className="h-5 w-5" />,
  transfer: <ArrowLeftRight className="h-5 w-5" />
};

export default function StockTransactionModal({ open, onClose, type, items, locations }: StockTransactionModalProps) {
  const { toast } = useToast();
  
  // Get projects
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Get purchase orders
  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['/api/purchase-orders'],
  });

  // Form state
  const [formData, setFormData] = useState<Partial<InsertStockTransaction>>({
    type,
    quantity: 1,
    comments: '',
  });

  // Update the transaction type when the prop changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, type }));
  }, [type]);

  // Mutation for creating a stock transaction
  const createTransactionMutation = useMutation({
    mutationFn: async (data: Partial<InsertStockTransaction>) => {
      const res = await apiRequest('POST', '/api/inventory/transactions', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/dashboard'] });
      toast({
        title: "Transaction Recorded",
        description: "The stock transaction has been recorded successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Record Transaction",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'quantity') {
      setFormData({ ...formData, [name]: parseInt(value, 10) || 1 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: name === 'itemId' || name === 'fromLocationId' || name === 'toLocationId' || name === 'projectId' || name === 'purchaseOrderId' 
      ? parseInt(value, 10) 
      : value 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.itemId) {
      toast({
        title: "Missing Item",
        description: "Please select an item for this transaction.",
        variant: "destructive",
      });
      return;
    }

    if (type === 'purchase' && !formData.toLocationId) {
      toast({
        title: "Missing Destination",
        description: "Please select a destination location for this purchase.",
        variant: "destructive",
      });
      return;
    }

    if (type === 'issue' && !formData.fromLocationId) {
      toast({
        title: "Missing Source",
        description: "Please select a source location for this issue.",
        variant: "destructive",
      });
      return;
    }

    if (type === 'transfer' && (!formData.fromLocationId || !formData.toLocationId)) {
      toast({
        title: "Missing Locations",
        description: "Please select both source and destination locations for this transfer.",
        variant: "destructive",
      });
      return;
    }

    if (type === 'transfer' && formData.fromLocationId === formData.toLocationId) {
      toast({
        title: "Invalid Transfer",
        description: "Source and destination locations cannot be the same.",
        variant: "destructive",
      });
      return;
    }

    if (formData.quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be greater than zero.",
        variant: "destructive",
      });
      return;
    }

    // Submit the form with adjustment flag
    createTransactionMutation.mutate({
      ...formData,
      adjustStockAt: type === 'purchase' ? 'destination' : type === 'issue' ? 'source' : 'both'
    });
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {transactionTypeIcons[type]}
            {transactionTypeLabels[type]}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="itemId">Item *</Label>
            <Select 
              value={formData.itemId?.toString() || ''} 
              onValueChange={value => handleSelectChange('itemId', value)}
              required
            >
              <SelectTrigger id="itemId">
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {items.map(item => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name} ({item.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input 
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={handleInputChange}
              required
            />
          </div>

          {(type === 'purchase' || type === 'transfer') && (
            <div className="space-y-2">
              <Label htmlFor="toLocationId">Destination Location *</Label>
              <Select 
                value={formData.toLocationId?.toString() || ''}

                onValueChange={value => handleSelectChange('toLocationId', value)}
                required
              >
                <SelectTrigger id="toLocationId">
                  <SelectValue placeholder="Select destination location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name} ({location.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(type === 'issue' || type === 'transfer') && (
            <div className="space-y-2">
              <Label htmlFor="fromLocationId">Source Location *</Label>
              <Select 
                value={formData.fromLocationId?.toString() || ''} 
                onValueChange={value => handleSelectChange('fromLocationId', value)}
                required
              >
                <SelectTrigger id="fromLocationId">
                  <SelectValue placeholder="Select source location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name} ({location.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'issue' && (
            <div className="space-y-2">
              <Label htmlFor="projectId">Project (Optional)</Label>
              <Select 
                value={formData.projectId?.toString() || ''} 
                onValueChange={value => handleSelectChange('projectId', value)}
              >
                <SelectTrigger id="projectId">
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.contractReference} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'purchase' && (
            <div className="space-y-2">
              <Label htmlFor="purchaseOrderId">Purchase Order (Optional)</Label>
              <Select 
                value={formData.purchaseOrderId?.toString() || ''} 
                onValueChange={value => handleSelectChange('purchaseOrderId', value)}
              >
                <SelectTrigger id="purchaseOrderId">
                  <SelectValue placeholder="Select purchase order (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {purchaseOrders.map(po => (
                    <SelectItem key={po.id} value={po.id.toString()}>
                      {po.reference}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea 
              id="comments"
              name="comments"
              value={formData.comments || ''}
              onChange={handleInputChange}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createTransactionMutation.isPending}>
              {createTransactionMutation.isPending ? "Processing..." : "Record Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}