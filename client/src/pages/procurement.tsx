import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Plus, FileText, Truck, Search } from 'lucide-react';
import PageHeader from '@/components/layout/page-header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { purchaseOrderStatusColors } from '@/lib/constants';
import { format } from 'date-fns';
import NewPurchaseOrderModal from '@/components/procurement/new-purchase-order-modal';
import NewSupplierModal from '@/components/procurement/new-supplier-modal';
import ViewPurchaseOrderModal from '@/components/procurement/view-purchase-order-modal';
import { Supplier, PurchaseOrder } from '@shared/schema';

export default function ProcurementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [newPOModalOpen, setNewPOModalOpen] = useState(false);
  const [newSupplierModalOpen, setNewSupplierModalOpen] = useState(false);
  const [viewPOModalOpen, setViewPOModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<number | null>(null);

  // Get suppliers
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  // Get purchase orders
  const { data: purchaseOrders = [], isLoading: posLoading } = useQuery<(PurchaseOrder & { supplierName?: string, nominalCodeDescription?: string })[]>({
    queryKey: ['/api/purchase-orders'],
  });

  // Filter purchase orders by search query
  const filteredPOs = searchQuery
    ? purchaseOrders.filter(po => 
        po.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (po.supplierName && po.supplierName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (po.nominalCodeDescription && po.nominalCodeDescription.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : purchaseOrders;

  const handleViewPO = (poId: number) => {
    setSelectedPO(poId);
    setViewPOModalOpen(true);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PageHeader title="Procurement & Supply Chain" subtitle="Manage purchase orders, suppliers and requisitions" />

      <Tabs defaultValue="purchase-orders" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase-orders" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Button onClick={() => setNewPOModalOpen(true)} className="flex items-center gap-2">
              <Plus size={16} />
              New Purchase Order
            </Button>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search POs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {posLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredPOs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPOs.map((po) => (
                <Card 
                  key={po.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewPO(po.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-semibold">{po.reference}</div>
                      <Badge className={`${purchaseOrderStatusColors[po.status]}`}>
                        {po.status.charAt(0).toUpperCase() + po.status.slice(1).replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{po.description}</p>
                    <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Truck size={14} />
                        <span className="line-clamp-1">{po.supplierName || 'Unknown Supplier'}</span>
                      </div>
                      <div className="font-medium">
                        £{(po.totalCost / 100).toFixed(2)}
                        {po.vatIncluded && ' + VAT'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {searchQuery ? 'No purchase orders found matching your search' : 'No purchase orders found'}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Button onClick={() => setNewSupplierModalOpen(true)} className="flex items-center gap-2">
              <Plus size={16} />
              New Supplier
            </Button>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {suppliersLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : suppliers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suppliers
                .filter(supplier => searchQuery 
                  ? supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) 
                  : true
                )
                .map((supplier) => (
                  <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-semibold">{supplier.name}</div>
                        {supplier.isPreferred && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Preferred
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        {supplier.contactPerson && (
                          <p className="text-muted-foreground">{supplier.contactPerson}</p>
                        )}
                        {supplier.contactEmail && (
                          <p className="text-muted-foreground overflow-hidden text-ellipsis">{supplier.contactEmail}</p>
                        )}
                        {supplier.contactPhone && (
                          <p className="text-muted-foreground">{supplier.contactPhone}</p>
                        )}
                        {supplier.address && (
                          <p className="text-muted-foreground line-clamp-2 mt-2">{supplier.address}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {searchQuery ? 'No suppliers found matching your search' : 'No suppliers found'}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {newPOModalOpen && (
        <NewPurchaseOrderModal
          open={newPOModalOpen}
          onClose={() => setNewPOModalOpen(false)}
          suppliers={suppliers}
        />
      )}

      {newSupplierModalOpen && (
        <NewSupplierModal
          open={newSupplierModalOpen}
          onClose={() => setNewSupplierModalOpen(false)}
        />
      )}

      {viewPOModalOpen && selectedPO && (
        <ViewPurchaseOrderModal
          open={viewPOModalOpen}
          onClose={() => {
            setViewPOModalOpen(false);
            setSelectedPO(null);
          }}
          purchaseOrderId={selectedPO}
        />
      )}
    </div>
  );
}