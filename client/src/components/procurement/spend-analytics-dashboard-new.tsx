import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Calendar,
  ArrowRight,
  ArrowDown,
  ArrowLeftRight,
  Info,
  Download,
  HelpCircle,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  Check,
  Table,
  Lightbulb,
  DollarSign,
  Clock,
  ExternalLink,
  RotateCcw,
  LineChart,
  Filter
} from "lucide-react";

// Enhanced data structures
const weeklyData = [
  { week: 'Week 1', value: 12450, date: '01 Apr - 07 Apr', budget: 12000 },
  { week: 'Week 2', value: 15780, date: '08 Apr - 14 Apr', budget: 14500 },
  { week: 'Week 3', value: 9800, date: '15 Apr - 21 Apr', budget: 13000 },
  { week: 'Week 4', value: 22100, date: '22 Apr - 28 Apr', anomaly: true, budget: 12800, anomalyReason: 'Unexpected emergency site works and duplicate material orders identified' },
  { week: 'Week 5', value: 10350, date: '29 Apr - 05 May', budget: 12500 },
  { week: 'Week 6', value: 11250, date: '06 May - 12 May', budget: 12000 },
  { week: 'Week 7', value: 18980, date: '13 May - 19 May', anomaly: true, budget: 13200, anomalyReason: 'Unplanned equipment rental extension and labor overtime costs' },
  { week: 'Week 8', value: 14670, date: '20 May - 26 May', budget: 14800 }
];

const monthlyData = [
  { month: 'Jan', year: 2025, value: 92450, change: null, budget: 88000 },
  { month: 'Feb', year: 2025, value: 86700, change: -6.2, budget: 90000 },
  { month: 'Mar', year: 2025, value: 105800, change: 22.0, anomaly: true, budget: 92000, anomalyReason: 'Significant increase in material costs and unexpected equipment repairs' },
  { month: 'Apr', year: 2025, value: 94300, change: -10.9, budget: 95000 },
  { month: 'May', year: 2025, value: 97500, change: 3.4, budget: 94000 }
];

const categoryData = [
  { category: 'Materials', amount: 243500, percentage: 42.3, trend: 'up' },
  { category: 'Equipment Rental', amount: 118700, percentage: 20.6, trend: 'stable' },
  { category: 'Subcontractors', amount: 87900, percentage: 15.3, trend: 'down' },
  { category: 'Labour', amount: 63200, percentage: 11.0, trend: 'up', anomaly: true },
  { category: 'Site Facilities', amount: 28300, percentage: 4.9, trend: 'stable' },
  { category: 'Professional Fees', amount: 19800, percentage: 3.4, trend: 'down' },
  { category: 'Insurance', amount: 9200, percentage: 1.6, trend: 'stable' },
  { category: 'Miscellaneous', amount: 5400, percentage: 0.9, trend: 'down' }
];

const anomalies = [
  { 
    id: 1, 
    title: 'Unusual spike in weekly spend', 
    description: 'Week 4 (Apr 22-28) shows a 125% increase compared to the previous week', 
    severity: 'high',
    impact: '£12,300 above expected spend level',
    suggestedAction: 'Review all purchase orders from this period to identify potential duplications or errors.'
  },
  { 
    id: 2, 
    title: 'Unexpected increase in March expenses', 
    description: 'March spending is 22% higher than February and 14% above quarterly budget', 
    severity: 'medium',
    impact: 'Potential budget overrun of £9,200 for Q1',
    suggestedAction: 'Analyze March expenses by category to identify major contributors to the increase.'
  },
  { 
    id: 3, 
    title: 'Labour cost anomaly detected', 
    description: 'Labour expenses are 18% above forecast despite consistent workforce numbers', 
    severity: 'medium',
    impact: 'Increased cost of £8,700 in labour category',
    suggestedAction: 'Review overtime claims and hourly rates for the current period.'
  }
];

const forecasts = [
  {
    id: 1,
    description: 'Potential savings opportunity in materials procurement',
    details: 'Analysis of recent material purchases shows consistent price variance between suppliers A and B for similar items.',
    recommendation: 'Consolidate orders with Supplier B for steel and concrete supplies.',
    impact: 'Estimated savings of £26,400 over the next quarter.',
    confidence: 87
  },
  {
    id: 2,
    description: 'Equipment rental optimization opportunity',
    details: 'Current equipment utilization shows multiple pieces of similar equipment rented from different suppliers with overlapping idle periods.',
    recommendation: 'Create consolidated equipment schedule and renegotiate with preferred supplier for bundled long-term rental.',
    impact: 'Potential reduction of 22% in equipment rental costs (approx. £18,300 per quarter).',
    confidence: 92
  },
  {
    id: 3,
    description: 'Seasonal pricing advantage window',
    details: 'Historical pricing data shows Q2 typically offers 8-14% lower prices for timber and roofing materials before summer construction peak.',
    recommendation: 'Forward purchase May requirements for timber packages to lock in current favorable pricing.',
    impact: 'Projected savings of 11% on timber package (approx. £9,700).',
    confidence: 91
  }
];

const purchaseOrders = [
  { 
    reference: 'PO-2023-0009', 
    supplier: 'TimberTech Solutions', 
    amount: 22100, 
    week: 'Week 4',
    status: 'completed'
  },
  { 
    reference: 'PO-2023-0008', 
    supplier: 'ConcreteWorks UK', 
    amount: 15780,
    week: 'Week 2',
    status: 'draft'
  },
  { 
    reference: 'PO-2023-0007', 
    supplier: 'HeavyLift Equipment', 
    amount: 18980,
    week: 'Week 7',
    status: 'pending approval'
  }
];

function formatCurrency(amount: number, options?: { abbreviated?: boolean }): string {
  if (options?.abbreviated && amount >= 1000) {
    if (amount >= 1000000) {
      return `£${(amount / 1000000).toFixed(1)}M`;
    } else {
      return `£${(amount / 1000).toFixed(0)}k`;
    }
  }
  return `£${amount.toLocaleString()}`;
}

interface SpendAnalyticsDashboardProps {
  className?: string;
}

export default function SpendAnalyticsDashboard({ className }: SpendAnalyticsDashboardProps) {
  const [viewType, setViewType] = useState<'chart' | 'table'>('chart');
  const [dateRange, setDateRange] = useState<string>('Last 90 days');
  const [comparisonType, setComparisonType] = useState<string>('vs. Previous period');
  
  // Calculate max value for Y-axis
  const maxValue = Math.max(...weeklyData.map(d => d.value)) * 1.2;
  
  // Function to get Y position for line chart
  const getYPosition = (value: number): number => {
    return 180 - (value / maxValue) * 180;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Spend Analytics Dashboard</CardTitle>
              <CardDescription>Comprehensive analysis of procurement spend with AI-powered insights</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
              <Button variant="ghost" size="sm" className="px-2">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span>View:</span>
              <div className="flex">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`px-2 py-1 h-auto rounded-md ${viewType === 'chart' ? 'bg-muted' : ''}`}
                  onClick={() => setViewType('chart')}
                >
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  <span>Chart</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={`px-2 py-1 h-auto rounded-md ${viewType === 'table' ? 'bg-muted' : ''}`}
                  onClick={() => setViewType('table')}
                >
                  <Table className="h-4 w-4 mr-1.5" />
                  <span>Table</span>
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span>Date range:</span>
              <Button variant="outline" size="sm" className="h-9 min-w-[130px] text-left justify-between">
                {dateRange}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span>Compare to:</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 min-w-[180px] text-left justify-between"
              >
                {comparisonType}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
          
          {/* Current comparison banner */}
          <div className="flex items-center mt-4 rounded-md py-1.5 px-3 bg-blue-50 border border-blue-100">
            <Info className="h-4 w-4 text-blue-500 mr-2" />
            <span className="text-sm text-blue-700 font-medium">Currently comparing:</span>
            <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-700 border-blue-200">
              vs. Previous period
            </Badge>
          </div>
          
          {/* Tab navigation */}
          <div className="mt-4 border-b border-border">
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="bg-transparent border-b-0 h-10 justify-start p-0 w-full gap-3">
                <TabsTrigger 
                  value="weekly" 
                  className="data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent border-b-2 border-transparent pb-2 mb-0 px-2 rounded-none"
                >
                  <Calendar className="h-4 w-4 mr-1.5" />
                  Weekly
                </TabsTrigger>
                <TabsTrigger 
                  value="monthly" 
                  className="data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent border-b-2 border-transparent pb-2 mb-0 px-2 rounded-none"
                >
                  <Calendar className="h-4 w-4 mr-1.5" />
                  Monthly
                </TabsTrigger>
                <TabsTrigger 
                  value="category" 
                  className="data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent border-b-2 border-transparent pb-2 mb-0 px-2 rounded-none"
                >
                  <PieChart className="h-4 w-4 mr-1.5" />
                  Category
                </TabsTrigger>
                <TabsTrigger 
                  value="insights" 
                  className="data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:bg-transparent border-b-2 border-transparent pb-2 mb-0 px-2 rounded-none"
                >
                  <Info className="h-4 w-4 mr-1.5" />
                  AI Insights
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs defaultValue="weekly">
            <TabsContent value="weekly">
              <div className="relative h-[300px]">
                {/* Y-axis labels */}
                <div className="absolute top-0 left-0 text-xs text-muted-foreground">
                  £25k
                </div>
                <div className="absolute top-1/4 left-0 text-xs text-muted-foreground">
                  £19k
                </div>
                <div className="absolute top-1/2 left-0 text-xs text-muted-foreground">
                  £13k
                </div>
                <div className="absolute top-3/4 left-0 text-xs text-muted-foreground">
                  £6k
                </div>
                <div className="absolute bottom-0 left-0 text-xs text-muted-foreground">
                  £0
                </div>

                {/* View Details link */}
                <div className="absolute top-0 right-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm flex items-center"
                  >
                    View Details
                  </Button>
                </div>

                {/* Grid lines */}
                <div className="absolute inset-0 mt-8 flex flex-col justify-between pointer-events-none">
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                </div>

                {/* Line chart */}
                <div className="relative h-[200px] mt-10 mx-auto pl-8">
                  <svg width="100%" height="200" className="overflow-visible">
                    {/* Line chart path */}
                    <polyline
                      points={weeklyData.map((week, i) => {
                        const x = 30 + i * 80;
                        const y = getYPosition(week.value);
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2.5"
                      className="opacity-90"
                    />
                    
                    {/* Data points */}
                    {weeklyData.map((week, i) => {
                      const x = 30 + i * 80;
                      const y = getYPosition(week.value);
                      return (
                        <g key={i}>
                          <circle 
                            cx={x} 
                            cy={y} 
                            r="4"
                            className={`${week.anomaly ? 'fill-red-500 stroke-white stroke-2' : 'fill-violet-500'}`}
                          />
                          {week.anomaly && (
                            <circle 
                              cx={x} 
                              cy={y} 
                              r="8"
                              className="fill-red-500 opacity-30 animate-pulse"
                            />
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* X-axis labels */}
                  <div className="flex justify-between pl-8 pr-16 mt-4">
                    {weeklyData.map((week, index) => (
                      <div key={index} className="text-center" style={{ width: "60px" }}>
                        <div className="text-xs font-medium">{week.week}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(week.value)}
                        </div>
                        {week.anomaly && (
                          <Badge 
                            variant="outline" 
                            className="h-5 px-1 mt-1 text-[10px] border-red-200 bg-red-50 text-red-700"
                          >
                            <AlertCircle className="h-2.5 w-2.5 mr-0.5" /> 
                            Anomaly
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Purchase Orders Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">Recent Purchase Orders</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-3">
                      {purchaseOrders.map((po, i) => (
                        <div key={i} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-medium text-sm">{po.reference}</p>
                            <p className="text-sm text-muted-foreground">{po.supplier}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <Badge 
                              className={`
                                ${po.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                po.status === 'draft' ? 'bg-blue-100 text-blue-800' : 
                                'bg-amber-100 text-amber-800'}
                                mb-1
                              `}
                            >
                              {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                            </Badge>
                            <div className="flex items-center">
                              <Badge variant="outline" className="mr-2">{po.week}</Badge>
                              <span className="font-semibold">{formatCurrency(po.amount)}</span>
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
                        <Badge variant="outline" className="bg-green-100 text-green-800">5</Badge>
                      </div>
                      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
                        <span className="font-medium">Approved</span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">1</Badge>
                      </div>
                      <div className="flex items-center justify-between bg-amber-50 p-3 rounded-md">
                        <span className="font-medium">Pending Approval</span>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800">1</Badge>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                        <span className="font-medium">Draft</span>
                        <Badge variant="outline" className="bg-slate-100">1</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monthly">
              <div className="relative h-[300px]">
                {/* Y-axis labels */}
                <div className="absolute top-0 left-0 text-xs text-muted-foreground">
                  £110k
                </div>
                <div className="absolute top-1/4 left-0 text-xs text-muted-foreground">
                  £85k
                </div>
                <div className="absolute top-1/2 left-0 text-xs text-muted-foreground">
                  £55k
                </div>
                <div className="absolute top-3/4 left-0 text-xs text-muted-foreground">
                  £25k
                </div>
                <div className="absolute bottom-0 left-0 text-xs text-muted-foreground">
                  £0
                </div>

                {/* View Details link */}
                <div className="absolute top-0 right-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm flex items-center"
                  >
                    View Details
                  </Button>
                </div>

                {/* Grid lines */}
                <div className="absolute inset-0 mt-8 flex flex-col justify-between pointer-events-none">
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                </div>

                {/* Line chart */}
                <div className="relative h-[200px] mt-10 mx-auto pl-8">
                  <svg width="100%" height="200" className="overflow-visible">
                    {/* Line chart path */}
                    <polyline
                      points={monthlyData.map((month, i) => {
                        const x = 50 + i * 120;
                        const y = 200 - (month.value / 110000) * 180;
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2.5"
                      className="opacity-90"
                    />
                    
                    {/* Budget comparison line */}
                    <polyline
                      points={monthlyData.map((month, i) => {
                        const x = 50 + i * 120;
                        const y = 200 - (month.budget / 110000) * 180;
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      strokeDasharray="4,2"
                      className="opacity-70"
                    />
                    
                    {/* Data points */}
                    {monthlyData.map((month, i) => {
                      const x = 50 + i * 120;
                      const y = 200 - (month.value / 110000) * 180;
                      return (
                        <g key={i}>
                          <circle 
                            cx={x} 
                            cy={y} 
                            r="4"
                            className={`${month.anomaly ? 'fill-red-500 stroke-white stroke-2' : 'fill-violet-500'}`}
                          />
                          {month.anomaly && (
                            <circle 
                              cx={x} 
                              cy={y} 
                              r="8"
                              className="fill-red-500 opacity-30 animate-pulse"
                            />
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* X-axis labels */}
                  <div className="flex justify-between pl-12 pr-20 mt-4">
                    {monthlyData.map((month, index) => (
                      <div key={index} className="text-center" style={{ width: "100px" }}>
                        <div className="text-xs font-medium">{month.month} {month.year}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(month.value, { abbreviated: true })}
                        </div>
                        {month.change !== null && (
                          <div className={`text-xs ${month.change > 0 ? 'text-red-500' : month.change < 0 ? 'text-green-500' : ''}`}>
                            {month.change > 0 ? '+' : ''}{month.change}%
                          </div>
                        )}
                        {month.anomaly && (
                          <Badge 
                            variant="outline" 
                            className="h-5 px-1 mt-1 text-[10px] border-red-200 bg-red-50 text-red-700"
                          >
                            <AlertCircle className="h-2.5 w-2.5 mr-0.5" /> 
                            Anomaly
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Purchase Orders Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">Recent Purchase Orders</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-3">
                      {purchaseOrders.map((po, i) => (
                        <div key={i} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-medium text-sm">{po.reference}</p>
                            <p className="text-sm text-muted-foreground">{po.supplier}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <Badge 
                              className={`
                                ${po.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                po.status === 'draft' ? 'bg-blue-100 text-blue-800' : 
                                'bg-amber-100 text-amber-800'}
                                mb-1
                              `}
                            >
                              {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                            </Badge>
                            <div className="flex items-center">
                              <Badge variant="outline" className="mr-2">{po.week}</Badge>
                              <span className="font-semibold">{formatCurrency(po.amount)}</span>
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
                        <Badge variant="outline" className="bg-green-100 text-green-800">5</Badge>
                      </div>
                      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
                        <span className="font-medium">Approved</span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">1</Badge>
                      </div>
                      <div className="flex items-center justify-between bg-amber-50 p-3 rounded-md">
                        <span className="font-medium">Pending Approval</span>
                        <Badge variant="outline" className="bg-amber-100 text-amber-800">1</Badge>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                        <span className="font-medium">Draft</span>
                        <Badge variant="outline" className="bg-slate-100">1</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="category">
              <div className="space-y-6">
                {/* Category breakdown */}
                <div className="space-y-4 px-1">
                  {categoryData.map((category, index) => (
                    <div key={index} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{category.category}</span>
                          {category.anomaly && (
                            <div className="ml-2 bg-red-500/10 text-red-500 rounded-full px-2 py-0.5 text-xs flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Anomaly
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{formatCurrency(category.amount)}</span>
                          <span className="text-xs text-muted-foreground">{category.percentage}%</span>
                          {category.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
                          {category.trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
                          {category.trend === 'stable' && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                      <div className="relative">
                        <Progress
                          value={category.percentage}
                          className={`h-2 ${category.anomaly ? 'bg-red-100' : ''}`}
                        />
                        <div 
                          className={`absolute inset-0 bg-gradient-to-r from-transparent ${
                            category.trend === 'up' 
                              ? 'via-red-500/20 to-red-500/40' 
                              : category.trend === 'down' 
                                ? 'via-green-500/20 to-green-500/40' 
                                : ''
                          }`}
                          style={{ 
                            width: `${category.percentage}%`,
                            opacity: 0.3
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filtering and controls */}
                <div className="pt-4 mt-4 border-t border-border">
                  <div className="flex flex-wrap items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Select defaultValue="all">
                        <SelectTrigger className="h-8 w-[160px] text-xs">
                          <SelectValue placeholder="Filter by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="increasing">Increasing Only</SelectItem>
                          <SelectItem value="decreasing">Decreasing Only</SelectItem>
                          <SelectItem value="stable">Stable Only</SelectItem>
                          <SelectItem value="anomaly">With Anomalies</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select defaultValue="amount">
                        <SelectTrigger className="h-8 w-[160px] text-xs">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amount">Amount (Highest First)</SelectItem>
                          <SelectItem value="percentage">Percentage (Highest First)</SelectItem>
                          <SelectItem value="name">Name (A-Z)</SelectItem>
                          <SelectItem value="trend">Trend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center mt-2 sm:mt-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-8 px-2 flex items-center gap-1.5"
                      >
                        <Filter className="h-3.5 w-3.5" />
                        Advanced Filters
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground text-center mt-2">
                  Showing all 8 categories • Last updated 4 minutes ago
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insights">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AI-Generated Insights Card */}
                  <Card className="overflow-hidden shadow-sm hover:shadow transition-all">
                    <CardHeader className="pb-2 bg-gradient-to-br from-blue-50 to-indigo-50">
                      <div className="flex items-center">
                        <div className="bg-blue-500/90 rounded-full p-1.5 mr-3">
                          <Lightbulb className="h-4 w-4 text-white" />
                        </div>
                        <CardTitle className="text-sm font-semibold">AI Spend Analysis</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3 pb-2 text-xs space-y-2">
                      <div className="flex items-start border-l-2 border-blue-400 pl-3 py-1">
                        <p className="text-xs leading-relaxed">
                          <span className="font-medium">Weekly spend volatility detected:</span> Your weekly spend shows a 46% variance between minimum and maximum values, significantly higher than industry average of 22%.
                        </p>
                      </div>
                      <div className="flex items-start border-l-2 border-green-400 pl-3 py-1">
                        <p className="text-xs leading-relaxed">
                          <span className="font-medium">Cost reduction opportunity:</span> Analysis indicates that consolidated ordering could reduce materials costs by approximately 8.2% (£19,900 per quarter).
                        </p>
                      </div>
                      <div className="flex items-start border-l-2 border-amber-400 pl-3 py-1">
                        <p className="text-xs leading-relaxed">
                          <span className="font-medium">Budget alignment needed:</span> March spending exceeded budget by 15% primarily due to equipment rental costs.
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="pb-3 pt-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs h-7 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700">
                        <span>Generate Detailed AI Report</span>
                        <Lightbulb className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                
                  {/* AI Forecasting Card */}
                  <Card className="overflow-hidden shadow-sm hover:shadow transition-all">
                    <CardHeader className="pb-2 bg-gradient-to-br from-purple-50 to-pink-50">
                      <div className="flex items-center">
                        <div className="bg-purple-500/90 rounded-full p-1.5 mr-3">
                          <LineChart className="h-4 w-4 text-white" />
                        </div>
                        <CardTitle className="text-sm font-semibold">AI-Powered Forecasting</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3 pb-2 text-xs space-y-2">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-2 mt-1">
                          <Clock className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium mb-0.5">Upcoming expense forecast (Q2)</p>
                          <p className="text-xs text-muted-foreground mb-1.5">Based on historical patterns and current project timeline:</p>
                          <ul className="list-disc pl-4 space-y-1 text-xs">
                            <li>Expected Q2 total: <span className="font-medium">£387,400</span> (±5%)</li>
                            <li>Projected spike in <span className="text-purple-500 font-medium">Week 12</span> due to scheduled equipment deliveries</li>
                            <li><span className="text-green-500">12% reduction</span> opportunity in subcontractor costs through early booking</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pb-3 pt-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs h-7 border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700">
                        <span>View Advanced Forecast Models</span>
                        <LineChart className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                {/* Anomaly Analysis Card */}
                <Card className="overflow-hidden shadow-sm hover:shadow transition-all">
                  <CardHeader className="pb-2 bg-gradient-to-br from-red-50 to-amber-50">
                    <div className="flex items-center">
                      <div className="bg-red-500/90 rounded-full p-1.5 mr-3">
                        <AlertOctagon className="h-4 w-4 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold">AI Anomaly Detection</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="mt-1 space-y-3">
                      {anomalies.map((anomaly, index) => (
                        <div key={index} className="rounded-md border border-red-200 bg-red-50 p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-sm font-medium flex items-center text-red-600">
                                <AlertTriangle className="h-4 w-4 mr-1.5" />
                                {anomaly.title}
                              </h3>
                              <p className="mt-1 text-xs text-muted-foreground">{anomaly.description}</p>
                              <p className="mt-2 text-xs text-red-600 flex items-center">
                                <Info className="h-3 w-3 mr-1" />
                                Impact: {anomaly.impact}
                              </p>
                            </div>
                            <div>
                              <Button size="sm" variant="outline" 
                                className="h-7 text-xs border-red-200 text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50"
                              >
                                <span>Take Action</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recommendations Card */}
                <Card className="overflow-hidden shadow-sm hover:shadow transition-all">
                  <CardHeader className="pb-2 bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="flex items-center">
                      <div className="bg-green-500/90 rounded-full p-1.5 mr-3">
                        <LineChart className="h-4 w-4 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold">AI Cost Optimization Recommendations</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="mt-1 space-y-3">
                      {forecasts.map((forecast, index) => (
                        <div key={index} className="rounded-md border border-blue-200 bg-blue-50 p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-sm font-medium flex items-center text-blue-600">
                                <Lightbulb className="h-4 w-4 mr-1.5" />
                                {forecast.description}
                              </h3>
                              <p className="mt-1 text-xs text-muted-foreground">{forecast.recommendation}</p>
                              <p className="mt-2 text-xs flex items-center">
                                <Info className="h-3.5 w-3.5 mr-1" />
                                <span className="text-blue-600">
                                  {forecast.impact} 
                                </span>
                                <span className="ml-3 bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 text-[10px]">
                                  {forecast.confidence}% confidence
                                </span>
                              </p>
                            </div>
                            <div>
                              <Button size="sm" variant="outline" 
                                className="h-7 text-xs border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-100 bg-blue-50"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Implement
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}