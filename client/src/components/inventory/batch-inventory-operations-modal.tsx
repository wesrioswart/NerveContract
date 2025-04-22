import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableHeader, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Loader2, 
  Plus, 
  Trash2, 
  Upload,
  Download
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InventoryItem, InventoryLocation } from "@shared/schema";

const batchOperationSchema = z.object({
  type: z.enum(['purchase', 'issue', 'adjustment']),
  locationId: z.number().min(1, "Please select a location"),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      itemId: z.number().min(1, "Item is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
    })
  ).min(1, "At least one item is required"),
});

type BatchOperationFormData = z.infer<typeof batchOperationSchema>;

interface BatchInventoryOperationsModalProps {
  open: boolean;
  onClose: () => void;
  items: InventoryItem[];
  locations: InventoryLocation[];
  defaultType?: 'purchase' | 'issue' | 'adjustment';
}

export default function BatchInventoryOperationsModal({
  open,
  onClose,
  items,
  locations,
  defaultType = 'purchase'
}: BatchInventoryOperationsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BatchOperationFormData>({
    resolver: zodResolver(batchOperationSchema),
    defaultValues: {
      type: defaultType,
      locationId: undefined as unknown as number,
      notes: "",
      items: [{ itemId: undefined as unknown as number, quantity: 1 }]
    }
  });

  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isFileImportOpen, setIsFileImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const batchMutation = useMutation({
    mutationFn: async (data: BatchOperationFormData) => {
      const res = await apiRequest('POST', '/api/inventory/batch-transactions', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Batch operation completed",
        description: `Successfully processed ${form.getValues().items?.length || 0} items`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/dashboard'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Operation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const addItemRow = () => {
    const currentItems = form.getValues().items || [];
    form.setValue('items', [...currentItems, { itemId: undefined as unknown as number, quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    const currentItems = form.getValues().items || [];
    form.setValue('items', currentItems.filter((_, i) => i !== index));
  };

  const toggleItemSelection = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const addSelectedItems = () => {
    const currentItems = form.getValues().items || [];
    const newItems = selectedItems.map(itemId => ({ itemId, quantity: 1 }));
    form.setValue('items', [...currentItems, ...newItems]);
    setSelectedItems([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setCsvFile(files[0]);
    }
  };

  const importFromCsv = async () => {
    if (!csvFile) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        
        // Skip header row
        const dataRows = lines.slice(1).filter(line => line.trim().length > 0);
        
        const importedItems = dataRows.map(row => {
          const [itemCode, quantityStr] = row.split(',');
          const item = items.find(i => i.code === itemCode.trim());
          
          if (!item) {
            toast({
              title: "Import warning",
              description: `Item with code ${itemCode} not found`,
              variant: "destructive",
            });
            return null;
          }
          
          const quantity = parseInt(quantityStr.trim(), 10);
          if (isNaN(quantity) || quantity <= 0) {
            toast({
              title: "Import warning",
              description: `Invalid quantity for item ${itemCode}`,
              variant: "destructive",
            });
            return null;
          }
          
          return { itemId: item.id, quantity };
        }).filter(item => item !== null);
        
        // Merge with current items or replace
        form.setValue('items', importedItems as { itemId: number, quantity: number }[]);
        
        toast({
          title: "Import completed",
          description: `${importedItems.length} items imported from CSV`,
        });
        
        setIsFileImportOpen(false);
        setCsvFile(null);
      };
      
      reader.readAsText(csvFile);
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to process CSV file",
        variant: "destructive",
      });
    }
  };

  const exportTemplate = () => {
    // Create CSV header
    const csvContent = "item_code,quantity\n";
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory_batch_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onSubmit = (data: BatchOperationFormData) => {
    batchMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {form.getValues().type === 'purchase' && (
              <span className="flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5" />
                Batch Receive Stock
              </span>
            )}
            {form.getValues().type === 'issue' && (
              <span className="flex items-center gap-2">
                <ArrowUpFromLine className="h-5 w-5" />
                Batch Issue Stock
              </span>
            )}
            {form.getValues().type === 'adjustment' && (
              <span className="flex items-center gap-2">
                <ArrowUpFromLine className="h-5 w-5" />
                Batch Stock Adjustment
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Process multiple inventory items in a single operation
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operation Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select operation type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="purchase">Receive Stock</SelectItem>
                        <SelectItem value="issue">Issue Stock</SelectItem>
                        <SelectItem value="adjustment">Stock Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location.id} value={location.id.toString()}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Add notes about this batch operation" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Items</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFileImportOpen(!isFileImportOpen)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={exportTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Template
                </Button>
              </div>
            </div>

            {isFileImportOpen && (
              <div className="border rounded-md p-4 space-y-4">
                <h4 className="font-medium">Import Items from CSV</h4>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with item codes and quantities.
                  Format: item_code,quantity (one per line)
                </p>
                <div className="flex gap-4 items-center">
                  <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange}
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={importFromCsv}
                    disabled={!csvFile}
                  >
                    Import
                  </Button>
                </div>
              </div>
            )}

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="w-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.getValues().items?.map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.itemId`}
                          render={({ field }) => (
                            <FormItem className="m-0">
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select item" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {items.map(item => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                      {item.name} ({item.code})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem className="m-0">
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemRow(index)}
                          disabled={(form.getValues().items?.length || 0) <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addItemRow}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Item
            </Button>

            <div className="border rounded-md p-4">
              <h4 className="font-medium mb-2">Quick Add Multiple Items</h4>
              <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-4">
                {items.slice(0, 12).map(item => (
                  <div 
                    key={item.id} 
                    className="flex items-center space-x-2"
                  >
                    <Checkbox 
                      id={`item-${item.id}`} 
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                    />
                    <label
                      htmlFor={`item-${item.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {item.name}
                    </label>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addSelectedItems}
                disabled={selectedItems.length === 0}
              >
                Add Selected Items ({selectedItems.length})
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={batchMutation.isPending}
              >
                {batchMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Process Batch Operation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}