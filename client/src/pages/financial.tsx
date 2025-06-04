import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProject } from "@/contexts/project-context";
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  DollarSign
} from "lucide-react";

interface EquipmentCost {
  id: number;
  equipmentName: string;
  supplierName: string;
  hireReference: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalDays: number;
  totalCost: number;
  status: 'active' | 'completed' | 'disputed';
  sccCompliant: boolean;
  validationNotes: string;
}

interface CostSummary {
  totalEquipmentCosts: number;
  validatedCosts: number;
  pendingValidation: number;
  disputedCosts: number;
  thisMonth: number;
  lastMonth: number;
}

export default function Financial() {
  const { projectId, currentProject } = useProject();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch cost summary data
  const { data: costSummary, isLoading: summaryLoading } = useQuery<CostSummary>({
    queryKey: [`/api/projects/${projectId}/cost-summary`],
    enabled: projectId > 0,
  });

  // Fetch equipment costs
  const { data: equipmentCosts = [], isLoading: costsLoading } = useQuery<EquipmentCost[]>({
    queryKey: [`/api/projects/${projectId}/equipment-costs`],
    enabled: projectId > 0,
  });

  // Mock data for demonstration
  const mockCostSummary: CostSummary = {
    totalEquipmentCosts: 125750.00,
    validatedCosts: 98500.00,
    pendingValidation: 22100.00,
    disputedCosts: 5150.00,
    thisMonth: 45200.00,
    lastMonth: 38900.00
  };

  const mockEquipmentCosts: EquipmentCost[] = [
    {
      id: 1,
      equipmentName: "Excavator - 20T (CAT 320)",
      supplierName: "Nationwide Plant Hire",
      hireReference: "NPH-2024-1205",
      startDate: "2024-12-01",
      endDate: "2024-12-15",
      dailyRate: 450.00,
      totalDays: 14,
      totalCost: 6300.00,
      status: 'active',
      sccCompliant: true,
      validationNotes: "Valid hire agreement on file. Used within Working Areas."
    },
    {
      id: 2,
      equipmentName: "Dump Truck - 30T",
      supplierName: "Regional Hire Co",
      hireReference: "RHC-EX-4401",
      startDate: "2024-11-25",
      endDate: "2024-12-10",
      dailyRate: 380.00,
      totalDays: 15,
      totalCost: 5700.00,
      status: 'completed',
      sccCompliant: true,
      validationNotes: "Compliant with SCC Item 2. All documentation verified."
    },
    {
      id: 3,
      equipmentName: "Concrete Pump - 42m",
      supplierName: "Pumping Solutions Ltd",
      hireReference: "PSL-CP-0089",
      startDate: "2024-12-05",
      endDate: "2024-12-06",
      dailyRate: 850.00,
      totalDays: 2,
      totalCost: 1700.00,
      status: 'disputed',
      sccCompliant: false,
      validationNotes: "Query: Equipment used for works outside defined scope. Requires PM review."
    }
  ];

  const displayCostSummary = costSummary || mockCostSummary;
  const displayEquipmentCosts = equipmentCosts.length > 0 ? equipmentCosts : mockEquipmentCosts;

  const getStatusBadge = (status: string, sccCompliant: boolean) => {
    if (status === 'disputed' || !sccCompliant) {
      return <Badge variant="destructive">Requires Review</Badge>;
    }
    if (status === 'active') {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Validated</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP' 
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Financial Management</h1>
        <p className="text-gray-600">
          Project: {currentProject?.name} - Cost validation and Schedule of Cost Components compliance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Cost Overview</TabsTrigger>
          <TabsTrigger value="equipment">Equipment Costs</TabsTrigger>
          <TabsTrigger value="validation">SCC Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Equipment Costs</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(displayCostSummary.totalEquipmentCosts)}</div>
                <p className="text-xs text-muted-foreground">
                  Current project to date
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Validated Costs</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(displayCostSummary.validatedCosts)}</div>
                <p className="text-xs text-muted-foreground">
                  SCC compliant and approved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Validation</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(displayCostSummary.pendingValidation)}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting commercial review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(displayCostSummary.thisMonth)}</div>
                <p className="text-xs text-muted-foreground">
                  +16% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Commercial Agent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Commercial Agent Alerts
              </CardTitle>
              <CardDescription>
                Automated cost validation alerts for Option E Schedule of Cost Components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start justify-between p-3 border border-amber-200 rounded-lg bg-amber-50">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-amber-800">
                      Equipment Cost Query - Concrete Pump
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                      PSL-CP-0089: Equipment appears to be used outside defined Working Areas. 
                      Requires Project Manager review for SCC Item 2 compliance.
                    </p>
                    <div className="text-xs text-amber-600 mt-2">
                      Cost Impact: {formatCurrency(1700.00)} | Reference: PSL-CP-0089
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="ml-4">
                    Review
                  </Button>
                </div>

                <div className="flex items-start justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-green-800">
                      Hire Documentation Complete
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      NPH-2024-1205: All required documentation validated for 20T Excavator hire. 
                      Compliant with NEC4 Option E requirements.
                    </p>
                    <div className="text-xs text-green-600 mt-2">
                      Validated Cost: {formatCurrency(6300.00)} | Days: 14
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Hire Costs</CardTitle>
              <CardDescription>
                Detailed breakdown of equipment hire costs for Option E defined cost assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayEquipmentCosts.map((cost) => (
                  <div
                    key={cost.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{cost.equipmentName}</h4>
                        {getStatusBadge(cost.status, cost.sccCompliant)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Supplier:</span> {cost.supplierName}
                        </div>
                        <div>
                          <span className="font-medium">Reference:</span> {cost.hireReference}
                        </div>
                        <div>
                          <span className="font-medium">Daily Rate:</span> {formatCurrency(cost.dailyRate)}
                        </div>
                        <div>
                          <span className="font-medium">Total Days:</span> {cost.totalDays}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Period:</span> {cost.startDate} to {cost.endDate}
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Validation Notes:</span> {cost.validationNotes}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold">{formatCurrency(cost.totalCost)}</div>
                      <Button variant="outline" size="sm" className="mt-2">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule of Cost Components - Item 2: Equipment</CardTitle>
              <CardDescription>
                NEC4 Option E validation rules for equipment hire costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">SCC Item 2 Requirements</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Equipment hired from others: amounts paid to hiring company as stated in hire contract</li>
                    <li>• Equipment must be used within the Working Areas to Provide the Works</li>
                    <li>• Valid hire agreements and invoices must be maintained</li>
                    <li>• Proof of payment and delivery records required</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Compliant Equipment</h4>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {displayEquipmentCosts.filter(c => c.sccCompliant).length}
                    </div>
                    <p className="text-sm text-gray-600">Items validated against SCC</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">Requiring Review</h4>
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {displayEquipmentCosts.filter(c => !c.sccCompliant).length}
                    </div>
                    <p className="text-sm text-gray-600">Items needing validation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}