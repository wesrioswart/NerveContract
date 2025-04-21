import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { InsertInventoryLocation } from '@shared/schema';

interface NewInventoryLocationModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewInventoryLocationModal({ open, onClose }: NewInventoryLocationModalProps) {
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState<InsertInventoryLocation>({
    name: '',
    address: '',
    type: 'yard',
    contactPerson: '',
    contactPhone: '',
  });

  // Mutation for creating a location
  const createLocationMutation = useMutation({
    mutationFn: async (data: InsertInventoryLocation) => {
      const res = await apiRequest('POST', '/api/inventory/locations', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/locations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/dashboard'] });
      toast({
        title: "Location Created",
        description: "The inventory location has been created successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Location",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || formData.name.trim() === '') {
      toast({
        title: "Missing Name",
        description: "Please provide a name for this location.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.type) {
      toast({
        title: "Missing Type",
        description: "Please select a type for this location.",
        variant: "destructive",
      });
      return;
    }

    // Submit the form
    createLocationMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Location Name *</Label>
            <Input 
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter location name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Location Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={value => handleSelectChange('type', value)}
              required
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yard">Yard</SelectItem>
                <SelectItem value="store">Store</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
                <SelectItem value="site">Site</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea 
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter location address"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input 
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                placeholder="Enter contact person"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input 
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="Enter contact phone"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createLocationMutation.isPending}>
              {createLocationMutation.isPending ? "Creating..." : "Create Location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}