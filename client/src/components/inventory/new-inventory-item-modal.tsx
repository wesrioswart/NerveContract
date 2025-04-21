import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { InsertInventoryItem } from '@shared/schema';

interface NewInventoryItemModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewInventoryItemModal({ open, onClose }: NewInventoryItemModalProps) {
  const { toast } = useToast();
  
  // Get nominal codes
  const { data: nominalCodes = [] } = useQuery({
    queryKey: ['/api/nominal-codes'],
  });

  // Form state
  const [formData, setFormData] = useState<Partial<InsertInventoryItem>>({
    name: '',
    code: '',
    description: '',
    category: 'Materials',
    subcategory: '',
    unit: 'each',
    minStockLevel: 0,
    maxStockLevel: null,
    reorderPoint: 5,
    unitCost: 0,
  });

  // Mutation for creating an inventory item
  const createItemMutation = useMutation({
    mutationFn: async (data: Partial<InsertInventoryItem>) => {
      // Convert monetary values from decimal pounds to pennies
      const processedData = {
        ...data,
        unitCost: data.unitCost ? Math.round(data.unitCost * 100) : null
      };
      
      const res = await apiRequest('POST', '/api/inventory/items', processedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/dashboard'] });
      toast({
        title: "Inventory Item Created",
        description: "The inventory item has been created successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Inventory Item",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'unitCost') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else if (['minStockLevel', 'maxStockLevel', 'reorderPoint'].includes(name)) {
      const parsedValue = value === '' ? null : parseInt(value, 10);
      setFormData({ ...formData, [name]: parsedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || formData.name.trim() === '') {
      toast({
        title: "Missing Name",
        description: "Please provide a name for this item.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Missing Category",
        description: "Please select a category for this item.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.unit) {
      toast({
        title: "Missing Unit",
        description: "Please select a unit of measurement for this item.",
        variant: "destructive",
      });
      return;
    }

    // Submit the form
    createItemMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input 
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter item name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Item Code</Label>
              <Input 
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="Auto-generated if left blank"
              />
              <p className="text-xs text-muted-foreground">Optional - will be auto-generated if not provided</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="Enter item description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={value => handleSelectChange('category', value)}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Materials">Materials</SelectItem>
                  <SelectItem value="Plant">Plant</SelectItem>
                  <SelectItem value="PPE">PPE</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Consumables">Consumables</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input 
                id="subcategory"
                name="subcategory"
                value={formData.subcategory || ''}
                onChange={handleInputChange}
                placeholder="Enter subcategory (optional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nominalCodeId">Nominal Code</Label>
              <Select 
                value={formData.nominalCodeId?.toString() || ''} 
                onValueChange={value => handleSelectChange('nominalCodeId', value)}
              >
                <SelectTrigger id="nominalCodeId">
                  <SelectValue placeholder="Select a nominal code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {nominalCodes.map(code => (
                    <SelectItem key={code.id} value={code.id.toString()}>
                      {code.code} - {code.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit of Measurement *</Label>
              <Select 
                value={formData.unit} 
                onValueChange={value => handleSelectChange('unit', value)}
                required
              >
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="each">Each</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="pair">Pair</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                  <SelectItem value="m">Meter</SelectItem>
                  <SelectItem value="m2">Square Meter</SelectItem>
                  <SelectItem value="m3">Cubic Meter</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                  <SelectItem value="l">Liter</SelectItem>
                  <SelectItem value="roll">Roll</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Min Stock Level</Label>
              <Input 
                id="minStockLevel"
                name="minStockLevel"
                type="number"
                min="0"
                value={formData.minStockLevel === null ? '' : formData.minStockLevel}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderPoint">Reorder Point</Label>
              <Input 
                id="reorderPoint"
                name="reorderPoint"
                type="number"
                min="0"
                value={formData.reorderPoint === null ? '' : formData.reorderPoint}
                onChange={handleInputChange}
                placeholder="5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxStockLevel">Max Stock Level</Label>
              <Input 
                id="maxStockLevel"
                name="maxStockLevel"
                type="number"
                min="0"
                value={formData.maxStockLevel === null ? '' : formData.maxStockLevel}
                onChange={handleInputChange}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitCost">Unit Cost (£)</Label>
            <Input 
              id="unitCost"
              name="unitCost"
              type="number"
              step="0.01"
              min="0"
              value={formData.unitCost === null ? '' : formData.unitCost}
              onChange={handleInputChange}
              placeholder="0.00"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createItemMutation.isPending}>
              {createItemMutation.isPending ? "Creating..." : "Create Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}