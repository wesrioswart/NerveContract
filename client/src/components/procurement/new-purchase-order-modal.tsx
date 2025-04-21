import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { PlusCircle, X, Trash2 } from 'lucide-react';
import { Supplier, InsertPurchaseOrder, Project } from '@shared/schema';
import { Switch } from '@/components/ui/switch';

interface NewPurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  suppliers: Supplier[];
}

interface PurchaseOrderItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  vatRate: number;
}

export default function NewPurchaseOrderModal({ open, onClose, suppliers }: NewPurchaseOrderModalProps) {
  const { toast } = useToast();
  
  // Get projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Get nominal codes
  const { data: nominalCodes = [] } = useQuery({
    queryKey: ['/api/nominal-codes'],
  });

  // Form state
  const [formData, setFormData] = useState<Partial<InsertPurchaseOrder>>({
    description: '',
    deliveryMethod: 'delivery',
    hireDuration: 'N/A',
    estimatedCost: 0,
    totalCost: 0,
    vatIncluded: false,
    deliveryDate: '',
    deliveryAddress: '',
    status: 'draft',
  });

  const [items, setItems] = useState<PurchaseOrderItem[]>([
    { description: '', quantity: 1, unitPrice: 0, unit: 'item', vatRate: 20 }
  ]);

  // Mutation for creating a purchase order
  const createPOMutation = useMutation({
    mutationFn: async (data: { items: PurchaseOrderItem[], ...InsertPurchaseOrder }) => {
      const res = await apiRequest('POST', '/api/purchase-orders', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchase-orders'] });
      toast({
        title: "Purchase Order Created",
        description: "The purchase order has been created successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Purchase Order",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);

    // Recalculate totals
    const total = newItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    setFormData({
      ...formData,
      estimatedCost: total,
      totalCost: total,
    });
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, unit: 'item', vatRate: 20 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      return; // Keep at least one item
    }
    
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);

    // Recalculate totals
    const total = newItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    setFormData({
      ...formData,
      estimatedCost: total,
      totalCost: total,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.projectId) {
      toast({
        title: "Missing Project",
        description: "Please select a project for this purchase order.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.nominalCodeId) {
      toast({
        title: "Missing Nominal Code",
        description: "Please select a nominal code for this purchase order.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.supplierId) {
      toast({
        title: "Missing Supplier",
        description: "Please select a supplier for this purchase order.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description || formData.description.trim() === '') {
      toast({
        title: "Missing Description",
        description: "Please provide a description for this purchase order.",
        variant: "destructive",
      });
      return;
    }

    // Convert monetary values from decimal pounds to pennies
    const processedData = {
      ...formData,
      estimatedCost: Math.round((formData.estimatedCost || 0) * 100),
      totalCost: Math.round((formData.totalCost || 0) * 100)
    } as InsertPurchaseOrder;

    // Process items to convert unitPrice from pounds to pennies
    const processedItems = items.map(item => ({
      ...item,
      unitPrice: Math.round(item.unitPrice * 100)
    }));

    // Submit the form
    createPOMutation.mutate({
      ...processedData,
      items: processedItems
    });
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project Code *</Label>
              <Select 
                onValueChange={value => handleSelectChange('projectId', value)}
                required
              >
                <SelectTrigger id="projectId">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.contractReference} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nominalCodeId">Nominal Code *</Label>
              <Select 
                onValueChange={value => handleSelectChange('nominalCodeId', value)}
                required
              >
                <SelectTrigger id="nominalCodeId">
                  <SelectValue placeholder="Select a nominal code" />
                </SelectTrigger>
                <SelectContent>
                  {nominalCodes.map(code => (
                    <SelectItem key={code.id} value={code.id.toString()}>
                      {code.code} - {code.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier *</Label>
              <Select 
                onValueChange={value => handleSelectChange('supplierId', value)}
                required
              >
                <SelectTrigger id="supplierId">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryMethod">Delivery Method *</Label>
              <Select 
                value={formData.deliveryMethod} 
                onValueChange={value => handleSelectChange('deliveryMethod', value)}
                required
              >
                <SelectTrigger id="deliveryMethod">
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="collection">Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea 
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter item description"
                required
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hireDuration">Hire Duration</Label>
              <Input 
                id="hireDuration"
                name="hireDuration"
                value={formData.hireDuration}
                onChange={handleInputChange}
                placeholder="N/A for purchases"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Delivery Date *</Label>
              <Input 
                id="deliveryDate"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleInputChange}
                placeholder="e.g. After Easter or 21/04/2025"
                required
              />
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor="deliveryAddress">Delivery Address *</Label>
              <Textarea 
                id="deliveryAddress"
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleInputChange}
                placeholder="Enter delivery address"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Items</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addItem}
                className="flex items-center gap-1"
              >
                <PlusCircle size={16} />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-md">
                <div className="col-span-12 sm:col-span-4">
                  <Label htmlFor={`item-${index}-description`}>Description</Label>
                  <Input 
                    id={`item-${index}-description`}
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Item description"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor={`item-${index}-quantity`}>Quantity</Label>
                  <Input 
                    id={`item-${index}-quantity`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor={`item-${index}-unit`}>Unit</Label>
                  <Select 
                    value={item.unit} 
                    onValueChange={(value) => handleItemChange(index, 'unit', value)}
                  >
                    <SelectTrigger id={`item-${index}-unit`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="item">Item</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="m2">Square Meter</SelectItem>
                      <SelectItem value="m3">Cubic Meter</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <Label htmlFor={`item-${index}-unitPrice`}>Unit Price (£)</Label>
                  <Input 
                    id={`item-${index}-unitPrice`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-5 sm:col-span-1">
                  <Label htmlFor={`item-${index}-vatRate`}>VAT %</Label>
                  <Input 
                    id={`item-${index}-vatRate`}
                    type="number"
                    min="0"
                    max="100"
                    value={item.vatRate}
                    onChange={(e) => handleItemChange(index, 'vatRate', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="h-10 w-10 text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-end items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="vatIncluded" className="cursor-pointer">VAT Included</Label>
                <Switch 
                  id="vatIncluded"
                  checked={formData.vatIncluded}
                  onCheckedChange={checked => handleSwitchChange('vatIncluded', checked)}
                />
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Cost</div>
                <div className="text-lg font-semibold">
                  £{(formData.totalCost || 0).toFixed(2)}
                  {formData.vatIncluded && " + VAT"}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createPOMutation.isPending}>
              {createPOMutation.isPending ? "Creating..." : "Create Purchase Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}