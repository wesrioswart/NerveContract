import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PurchaseOrder {
  id: number;
  reference: string;
  supplier: string;
  amount: number;
  week: string;
  status: 'draft' | 'ordered' | 'pending approval' | 'completed';
}

const purchaseOrders: PurchaseOrder[] = [
  { id: 1, reference: 'PO-2023-0009', supplier: 'TimberTech Solutions', amount: 22100, week: 'Week 4', status: 'completed' },
  { id: 2, reference: 'PO-2023-0008', supplier: 'ConcreteWorks UK', amount: 15780, week: 'Week 2', status: 'pending approval' },
  { id: 3, reference: 'PO-2023-0007', supplier: 'HeavyLift Equipment', amount: 18980, week: 'Week 7', status: 'ordered' },
  { id: 4, reference: 'PO-2023-0006', supplier: 'MetalFraming Inc', amount: 11250, week: 'Week 6', status: 'draft' }
];

const POSummary = {
  completed: 5,
  approved: 1,
  draft: 1,
  pendingApproval: 1
};

const RecentPurchaseOrders: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Recent Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            {purchaseOrders.map((po) => (
              <div key={po.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium text-sm">{po.reference}</p>
                  <p className="text-sm text-muted-foreground">{po.supplier}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center mb-1">
                    <Badge 
                      className={`
                        ${po.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        po.status === 'draft' ? 'bg-blue-100 text-blue-800' : 
                        po.status === 'pending approval' ? 'bg-amber-100 text-amber-800' : 
                        'bg-purple-100 text-purple-800'}
                      `}
                    >
                      {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">{po.week}</Badge>
                    <span className="font-semibold">£{po.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">POs by Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-green-50 p-3 rounded-md">
              <span className="font-medium">Completed</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">{POSummary.completed}</Badge>
            </div>
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
              <span className="font-medium">Approved</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">{POSummary.approved}</Badge>
            </div>
            <div className="flex items-center justify-between bg-amber-50 p-3 rounded-md">
              <span className="font-medium">Pending Approval</span>
              <Badge variant="outline" className="bg-amber-100 text-amber-800">{POSummary.pendingApproval}</Badge>
            </div>
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
              <span className="font-medium">Draft</span>
              <Badge variant="outline" className="bg-slate-100">{POSummary.draft}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentPurchaseOrders;