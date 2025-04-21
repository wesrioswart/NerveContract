import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { InsertSupplier } from '@shared/schema';

interface NewSupplierModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewSupplierModal({ open, onClose }: NewSupplierModalProps) {
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState<InsertSupplier>({
    name: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    isPreferred: false,
    notes: '',
  });

  // Mutation for creating a supplier
  const createSupplierMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const res = await apiRequest('POST', '/api/suppliers', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: "Supplier Created",
        description: "The supplier has been created successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Supplier",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || formData.name.trim() === '') {
      toast({
        title: "Missing Name",
        description: "Please provide a name for this supplier.",
        variant: "destructive",
      });
      return;
    }

    // Submit the form
    createSupplierMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Supplier Name *</Label>
            <Input 
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter supplier name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input 
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleInputChange}
              placeholder="Enter contact person name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input 
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="Enter contact email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone</Label>
              <Input 
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="Enter contact phone"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea 
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter supplier address"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="isPreferred"
              checked={formData.isPreferred}
              onCheckedChange={(checked) => handleSwitchChange('isPreferred', checked)}
            />
            <Label htmlFor="isPreferred" className="cursor-pointer">Preferred Supplier</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createSupplierMutation.isPending}>
              {createSupplierMutation.isPending ? "Creating..." : "Create Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}