import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Calendar,
  ArrowRight,
  Info,
  Download,
  HelpCircle,
  AlertCircle,
  Check,
  Table
} from "lucide-react";

// Sample data for the dashboard
const weeklyData = [
  { week: 'Week 1', value: 12450, date: '01 Apr - 07 Apr' },
  { week: 'Week 2', value: 15780, date: '08 Apr - 14 Apr' },
  { week: 'Week 3', value: 9800, date: '15 Apr - 21 Apr' },
  { week: 'Week 4', value: 22100, date: '22 Apr - 28 Apr', anomaly: true },
  { week: 'Week 5', value: 10350, date: '29 Apr - 05 May' },
  { week: 'Week 6', value: 11250, date: '06 May - 12 May' },
  { week: 'Week 7', value: 18980, date: '13 May - 19 May', anomaly: true },
  { week: 'Week 8', value: 14670, date: '20 May - 26 May' }
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

function formatCurrency(amount: number): string {
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
              <div className="text-center py-8 text-muted-foreground">
                Monthly analytics data will be displayed here.
              </div>
            </TabsContent>

            <TabsContent value="category">
              <div className="text-center py-8 text-muted-foreground">
                Category-based analytics data will be displayed here.
              </div>
            </TabsContent>

            <TabsContent value="insights">
              <div className="text-center py-8 text-muted-foreground">
                AI-powered insights and recommendations will be displayed here.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}