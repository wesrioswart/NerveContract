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

interface NewSupplierModalProps {
  open: boolean;
  onClose: () => void;
}

interface SupplierFormData {
  name: string;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  accountNumber: string | null;
  isGpsmacs: boolean | null;
}

export default function NewSupplierModal({ open, onClose }: NewSupplierModalProps) {
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    accountNumber: '',
    isGpsmacs: false,
  });

  // Mutation for creating a supplier
  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const res = await apiRequest('POST', '/api/suppliers', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/procurement/dashboard'] });
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

  const handleSwitchChange = (checked: boolean) => {
    setFormData({ ...formData, isGpsmacs: checked });
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
              value={formData.contactPerson || ''}
              onChange={handleInputChange}
              placeholder="Enter contact person"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input 
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={formData.contactEmail || ''}
                onChange={handleInputChange}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone</Label>
              <Input 
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone || ''}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea 
              id="address"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              placeholder="Enter supplier address"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input 
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber || ''}
              onChange={handleInputChange}
              placeholder="Enter account number"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isGpsmacs"
              checked={formData.isGpsmacs || false}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="isGpsmacs">GPSMACS Supplier</Label>
            <div className="ml-2 text-sm text-muted-foreground">
              (GPSMACS suppliers provide materials, equipment, plant or PPE using the GPSMACS coding system)
            </div>
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