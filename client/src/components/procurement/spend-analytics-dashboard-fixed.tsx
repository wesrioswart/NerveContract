import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AlertCircle, 
  AlertTriangle,
  AlertOctagon,
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  DollarSign, 
  Lightbulb, 
  Calendar,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  Info,
  Download,
  HelpCircle,
  Filter,
  BellRing,
  Check,
  ExternalLink,
  LayoutList,
  RotateCcw,
  Table,
  LineChart,
  Clock
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

// Enhanced data structure with more detailed information to better demonstrate functionality
const spendData = {
  weeklySpend: [
    { week: 'Week 1', amount: 12450, date: '01 Apr - 07 Apr', budget: 12000 },
    { week: 'Week 2', amount: 15780, date: '08 Apr - 14 Apr', budget: 14500 },
    { week: 'Week 3', amount: 9800, date: '15 Apr - 21 Apr', budget: 13000 },
    { week: 'Week 4', amount: 22100, date: '22 Apr - 28 Apr', hasAnomaly: true, budget: 12800, anomalyReason: 'Unexpected emergency site works and duplicate material orders identified' },
    { week: 'Week 5', amount: 10350, date: '29 Apr - 05 May', budget: 12500 },
    { week: 'Week 6', amount: 11250, date: '06 May - 12 May', budget: 12000 },
    { week: 'Week 7', amount: 18980, date: '13 May - 19 May', hasAnomaly: true, budget: 13200, anomalyReason: 'Unplanned equipment rental extension and labor overtime costs' },
    { week: 'Week 8', amount: 14670, date: '20 May - 26 May', budget: 14800 }
  ],
  monthlySpend: [
    { month: 'Jan', year: 2025, amount: 92450, change: null, budget: 88000 },
    { month: 'Feb', year: 2025, amount: 86700, change: -6.2, budget: 90000 },
    { month: 'Mar', year: 2025, amount: 105800, change: 22.0, hasAnomaly: true, budget: 92000, anomalyReason: 'Significant increase in material costs and unexpected equipment repairs' },
    { month: 'Apr', year: 2025, amount: 94300, change: -10.9, budget: 95000 },
    { month: 'May', year: 2025, amount: 97500, change: 3.4, budget: 94000 }
  ],
  categoryBreakdown: [
    { category: 'Materials', amount: 243500, percentage: 42.3, trend: 'up' },
    { category: 'Equipment Rental', amount: 118700, percentage: 20.6, trend: 'stable' },
    { category: 'Subcontractors', amount: 87900, percentage: 15.3, trend: 'down' },
    { category: 'Labour', amount: 63200, percentage: 11.0, trend: 'up', hasAnomaly: true },
    { category: 'Site Facilities', amount: 28300, percentage: 4.9, trend: 'stable' },
    { category: 'Professional Fees', amount: 19800, percentage: 3.4, trend: 'down' },
    { category: 'Insurance', amount: 9200, percentage: 1.6, trend: 'stable' },
    { category: 'Miscellaneous', amount: 5400, percentage: 0.9, trend: 'down' }
  ],
  anomalies: [
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
  ],
  forecasts: [
    {
      id: 1,
      description: 'Potential savings opportunity in materials procurement',
      details: 'Analysis of recent material purchases shows consistent price variance between suppliers A and B for similar items. Historical pricing trends indicate potential for 8-12% savings through supplier consolidation.',
      recommendation: 'Consolidate orders with Supplier B for steel and concrete supplies, which consistently offers 10.5% lower prices on average.',
      impact: 'Estimated savings of £26,400 over the next quarter based on projected material needs.',
      confidence: 87
    },
    {
      id: 2,
      description: 'Equipment rental optimization opportunity',
      details: 'Current equipment utilization shows multiple pieces of similar equipment rented from different suppliers with overlapping idle periods.',
      recommendation: 'Create consolidated equipment schedule and renegotiate with preferred supplier for bundled long-term rental.',
      impact: 'Potential reduction of 22% in equipment rental costs (approximately £18,300 per quarter).',
      confidence: 92
    },
    {
      id: 3,
      description: 'Subcontractor payment timing optimization',
      details: 'Analysis of payment terms shows inconsistent approaches across subcontractors with early payments not leveraged for discounts.',
      recommendation: 'Standardize payment terms to Net 45 with early payment discount options for all subcontractors.',
      impact: 'Improved cash flow projection accuracy and potential for 2.5% savings through early payment discounts.',
      confidence: 79
    },
    {
      id: 4,
      description: 'Inventory stockpiling risk identified',
      details: 'Current procurement pattern shows excessive stockpiling of non-critical materials, particularly cement and aggregates.',
      recommendation: 'Implement just-in-time delivery schedule for bulk materials to reduce on-site storage costs.',
      impact: 'Storage cost reduction estimated at £4,200 per month with improved site space utilization.',
      confidence: 85
    },
    {
      id: 5,
      description: 'Seasonal pricing advantage window',
      details: 'Historical pricing data shows Q2 typically offers 8-14% lower prices for timber and roofing materials before summer construction peak.',
      recommendation: 'Forward purchase May requirements for timber packages to lock in current favorable pricing.',
      impact: 'Projected savings of 11% on timber package (approximately £9,700).',
      confidence: 91
    }
  ]  
};

interface SpendAnalyticsDashboardProps {
  className?: string;
}

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

export default function SpendAnalyticsDashboard({ className }: SpendAnalyticsDashboardProps) {
  // State for filter options
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '6m' | '1y'>('90d');
  const [comparisonMode, setComparisonMode] = useState<'previous-period' | 'budget' | 'none'>('previous-period');
  const [sortField, setSortField] = useState<'amount' | 'percentage' | 'name' | 'trend'>('amount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [thresholdType, setThresholdType] = useState<'above' | 'below'>('above');
  const [thresholdValue, setThresholdValue] = useState<number>(10000);
  const [exportInProgress, setExportInProgress] = useState<boolean>(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    spendData.categoryBreakdown.map(c => c.category)
  );
  
  // State for modal/dialog visibility
  const [anomalyDialogOpen, setAnomalyDialogOpen] = useState<boolean>(false);
  const [forecastDialogOpen, setForecastDialogOpen] = useState<boolean>(false);
  const [detailedBreakdownOpen, setDetailedBreakdownOpen] = useState<boolean>(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const [selectedForecast, setSelectedForecast] = useState<any>(null);
  const [breakdownType, setBreakdownType] = useState<'weekly' | 'monthly' | 'category'>('weekly');
  
  // State to track which anomalies have been resolved and which forecasts implemented
  const [resolvedAnomalies, setResolvedAnomalies] = useState<number[]>([]);
  const [implementedForecasts, setImplementedForecasts] = useState<number[]>([]);
  
  // Calculate maximum values for chart scaling
  // Add a small buffer (10%) to the max value to ensure tallest bar doesn't touch the top
  const rawMaxWeeklyAmount = Math.max(...spendData.weeklySpend.map(w => w.amount));
  const rawMaxMonthlyAmount = Math.max(...spendData.monthlySpend.map(m => m.amount));
  
  // Improved calculation to ensure bars are proportionally accurate
  const maxWeeklyAmount = Math.ceil(rawMaxWeeklyAmount * 1.1 / 5000) * 5000;
  const maxMonthlyAmount = Math.ceil(rawMaxMonthlyAmount * 1.1 / 10000) * 10000;
  
  // Filter and sort data based on current selections
  const filteredCategories = spendData.categoryBreakdown
    .filter(cat => selectedCategories.includes(cat.category))
    .filter(cat => {
      if (thresholdType === 'above') return cat.amount >= thresholdValue;
      return cat.amount <= thresholdValue;
    })
    .sort((a, b) => {
      if (sortField === 'amount') {
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else if (sortField === 'percentage') {
        return sortDirection === 'asc' ? a.percentage - b.percentage : b.percentage - a.percentage;
      } else if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.category.localeCompare(b.category) 
          : b.category.localeCompare(a.category);
      } else {
        // Sort by trend (up, stable, down)
        const trendOrder = { up: 0, stable: 1, down: 2 };
        const aOrder = trendOrder[a.trend as keyof typeof trendOrder];
        const bOrder = trendOrder[b.trend as keyof typeof trendOrder];
        return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
      }
    });
  
  // Simulate generating a forecast report
  const generateForecastReport = () => {
    setExportInProgress(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setExportInProgress(false);
      alert('Forecast report generated and downloaded successfully.');
    }, 1500);
  };
  
  // Handle opening anomaly details
  const openAnomalyDetails = (anomaly: any) => {
    setSelectedAnomaly(anomaly);
    setAnomalyDialogOpen(true);
  };
  
  // Handle opening forecast details
  const openForecastDetails = (forecast: any) => {
    setSelectedForecast(forecast);
    setForecastDialogOpen(true);
  };
  
  // Handle taking action on an anomaly
  const handleAnomalyAction = (anomalyId: number) => {
    // Track this anomaly as being resolved
    setResolvedAnomalies(prev => [...prev, anomalyId]);
    
    // Simulate API call to mark anomaly as being addressed
    console.log(`Taking action on anomaly ${anomalyId}`);
    setAnomalyDialogOpen(false);
    
    // Show success message
    alert(`Action started for anomaly #${anomalyId}. A notification has been sent to the procurement team.`);
  };
  
  // Handle undoing a resolved anomaly
  const handleUndoAnomalyResolution = (anomalyId: number) => {
    // Remove this anomaly from the resolved list
    setResolvedAnomalies(prev => prev.filter(id => id !== anomalyId));
    
    // Simulate API call to mark anomaly as unresolved
    console.log(`Marking anomaly ${anomalyId} as unresolved`);
    
    // Show success message
    alert(`Anomaly #${anomalyId} has been marked as unresolved and returned to active status.`);
  };
  
  // Handle implementing a forecast recommendation
  const handleImplementForecast = (forecastId: number) => {
    // Track this forecast as being implemented
    setImplementedForecasts(prev => [...prev, forecastId]);
    
    // Simulate API call to implement forecast recommendation
    console.log(`Implementing forecast ${forecastId}`);
    setForecastDialogOpen(false);
    
    // Show success message
    alert(`Implementation plan for forecast #${forecastId} has been created and assigned to the procurement team.`);
  };
  
  // Handle undoing an implemented forecast
  const handleUndoForecastImplementation = (forecastId: number) => {
    // Remove this forecast from the implemented list
    setImplementedForecasts(prev => prev.filter(id => id !== forecastId));
    
    // Simulate API call to mark forecast as not implemented
    console.log(`Marking forecast ${forecastId} as not implemented`);
    
    // Show success message
    alert(`Forecast #${forecastId} implementation has been reversed and returned to pending status.`);
  };
  
  // Open detailed breakdown modal
  const openDetailedBreakdown = (type: 'weekly' | 'monthly' | 'category') => {
    setBreakdownType(type);
    setDetailedBreakdownOpen(true);
    
    // For logging purposes
    console.log(`Opening detailed breakdown for ${type}`);
  };

  return (
    <div className={className}>
      {/* Main Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">Spend Analytics Dashboard</CardTitle>
              <CardDescription>
                Comprehensive analysis of procurement spend with AI-powered insights
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1" onClick={generateForecastReport} disabled={exportInProgress}>
                {exportInProgress ? (
                  <>
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full mr-1"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Export Report
                  </>
                )}
              </Button>
              
              <Button variant="ghost" size="sm" className="h-8">
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="sr-only">Help</span>
              </Button>
            </div>
          </div>
          
          {/* Filters Section */}
          <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">View:</span>
                <div className="flex border border-input rounded-md overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-2 rounded-none ${viewMode === 'chart' ? 'bg-muted' : ''}`}
                    onClick={() => setViewMode('chart')}
                  >
                    <BarChart3 className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Chart</span>
                  </Button>
                  <Separator orientation="vertical" className="h-7" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-2 rounded-none ${viewMode === 'table' ? 'bg-muted' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    <Table className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Table</span>
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Date range:</span>
                <Select value={dateRange} onValueChange={(value) => setDateRange(value as any)}>
                  <SelectTrigger className="h-7 w-[110px] text-xs">
                    <SelectValue placeholder="Date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-1">
                      <h4 className="text-xs font-semibold mb-1 text-muted-foreground px-2">Select time period</h4>
                      <Separator className="my-1" />
                      <div className="py-1">
                        <SelectItem value="30d" className="text-xs">Last 30 days</SelectItem>
                        <SelectItem value="90d" className="text-xs">Last 90 days</SelectItem>
                        <SelectItem value="6m" className="text-xs">Last 6 months</SelectItem>
                        <SelectItem value="1y" className="text-xs">Last year</SelectItem>
                      </div>
                    </div>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Compare to:</span>
                <Select value={comparisonMode} onValueChange={(value) => setComparisonMode(value as any)}>
                  <SelectTrigger className="h-7 w-[160px] text-xs">
                    <SelectValue placeholder="Select comparison" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-1">
                      <h4 className="text-xs font-semibold mb-1 text-muted-foreground px-2">Select comparison type</h4>
                      <Separator className="my-1" />
                      <div className="py-1">
                        <SelectItem value="none" className="flex items-center">
                          <div className="flex items-center">
                            <Check className={`mr-2 h-4 w-4 ${comparisonMode === 'none' ? 'opacity-100' : 'opacity-0'}`} />
                            <span>No comparison</span>
                          </div>
                        </SelectItem>
                        
                        <SelectItem value="previous-period" className="flex items-center">
                          <div className="flex items-center">
                            <Check className={`mr-2 h-4 w-4 ${comparisonMode === 'previous-period' ? 'opacity-100' : 'opacity-0'}`} />
                            <span>vs. Previous period</span>
                          </div>
                        </SelectItem>
                        
                        <SelectItem value="budget" className="flex items-center">
                          <div className="flex items-center">
                            <Check className={`mr-2 h-4 w-4 ${comparisonMode === 'budget' ? 'opacity-100' : 'opacity-0'}`} />
                            <span>vs. Budget</span>
                          </div>
                        </SelectItem>
                      </div>
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Comparison indicator banner */}
          <div className="mt-4 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between gap-4">
              {comparisonMode !== 'none' && (
                <div className="bg-blue-50 border border-blue-100 rounded-md py-1.5 px-3 flex items-center shadow-sm">
                  <Info className="h-3.5 w-3.5 text-blue-500 mr-2" />
                  <span className="text-xs text-blue-700 font-medium mr-2">Currently comparing:</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs font-normal border-blue-200">
                    {comparisonMode === 'previous-period' ? 'vs. Previous period' : 'vs. Budget'}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Tabs for different views */}
          <div className="mt-4">
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="grid grid-cols-4 w-full md:w-[540px]">
                <TabsTrigger value="weekly" className="flex items-center gap-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  Weekly
                </TabsTrigger>
                <TabsTrigger value="monthly" className="flex items-center gap-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  Monthly
                </TabsTrigger>
                <TabsTrigger value="category" className="flex items-center gap-1.5 text-xs">
                  <PieChart className="h-3.5 w-3.5" />
                  Category
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-1.5 text-xs">
                  <Lightbulb className="h-3.5 w-3.5" />
                  AI Insights
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <Tabs defaultValue="weekly">
            {/* Weekly Spend Chart */}
            <TabsContent value="weekly" className="mt-0">
              <div className="relative h-[250px]">
                {/* Y-axis labels with intermediate values - abbreviated for readability */}
                <div className="absolute top-0 left-0 text-xs text-muted-foreground">
                  {formatCurrency(maxWeeklyAmount, { abbreviated: true })}
                </div>
                <div className="absolute top-1/4 left-0 text-xs text-muted-foreground">
                  {formatCurrency(maxWeeklyAmount * 0.75, { abbreviated: true })}
                </div>
                <div className="absolute top-1/2 left-0 text-xs text-muted-foreground">
                  {formatCurrency(maxWeeklyAmount * 0.5, { abbreviated: true })}
                </div>
                <div className="absolute top-3/4 left-0 text-xs text-muted-foreground">
                  {formatCurrency(maxWeeklyAmount * 0.25, { abbreviated: true })}
                </div>
                <div className="absolute bottom-0 left-0 text-xs text-muted-foreground">
                  £0
                </div>
                
                {/* View Detailed Breakdown Button for Weekly - moved to the right, above the graph */}
                <div className="absolute top-0 right-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-6 bg-secondary/10 hover:bg-secondary/20 border-secondary/20 px-2"
                    onClick={() => openDetailedBreakdown('weekly')}
                  >
                    <PieChart className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </div>
                
                {/* Light grid lines that match the value points */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full mt-[25%]"></div>
                  <div className="h-px bg-muted/30 w-full mt-[25%]"></div>
                  <div className="h-px bg-muted/30 w-full mt-[25%]"></div>
                  <div className="h-px bg-muted/30 w-full mt-[25%]"></div>
                </div>
                
                {/* Trend Lines Visualization */}
                {comparisonMode !== 'none' && (
                  <div className="relative h-[200px] mt-6 mx-auto" style={{ maxWidth: "800px" }}>
                    <svg width="100%" height="200" className="absolute top-0 left-0 z-0 overflow-visible">
                      {/* Trend line for actual spend */}
                      <polyline
                        points={spendData.weeklySpend.map((week, i) => {
                          const x = 45 + i * 80;
                          const y = 200 - (week.amount / maxWeeklyAmount) * 180;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#7C3AED"
                        strokeWidth="2"
                        strokeDasharray="3,2"
                        className="opacity-60"
                      />
                      
                      {/* Trend line for budget when in budget comparison mode */}
                      {comparisonMode === 'budget' && (
                        <polyline
                          points={spendData.weeklySpend.map((week, i) => {
                            const x = 45 + i * 80;
                            const y = 200 - (week.budget / maxWeeklyAmount) * 180;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#22C55E"
                          strokeWidth="2"
                          strokeDasharray="2,2"
                          className="opacity-60"
                        />
                      )}
                    </svg>
                  </div>
                )}
                
                {/* Chart bars */}
                <div className="relative flex justify-center items-end h-[200px] mt-6 mx-auto" style={{ maxWidth: "800px" }}>
                  {spendData.weeklySpend.map((week, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center mx-2" style={{ width: "80px" }}>
                            <div className="relative" style={{ width: "50px" }}>
                              {/* Budget indicator in budget comparison mode */}
                              {comparisonMode === 'budget' && (
                                <div className="flex flex-col items-center">
                                  <div 
                                    className="absolute border-2 border-dashed border-green-500 w-full"
                                    style={{ 
                                      top: `${100 - (week.budget / maxWeeklyAmount) * 100}%`, 
                                      height: '0px',
                                      zIndex: 2
                                    }}
                                  ></div>
                                  {/* Budget label */}
                                  <span 
                                    className="absolute text-[9px] font-medium text-green-600"
                                    style={{ 
                                      top: `${95 - (week.budget / maxWeeklyAmount) * 100}%`, 
                                      right: '-30px',
                                      zIndex: 2
                                    }}
                                  >
                                    {formatCurrency(week.budget, { abbreviated: true })}
                                  </span>
                                </div>
                              )}
                              
                              <div 
                                className={`bg-gradient-to-t from-primary/70 to-primary w-full 
                                  rounded-t hover:brightness-110 transition-all duration-200 
                                  ${week.hasAnomaly ? 'ring-2 ring-red-500 ring-offset-2' : ''}
                                  ${comparisonMode === 'budget' && week.amount > week.budget ? 'border-t-2 border-red-500' : ''}`} 
                                style={{ 
                                  height: `${(week.amount / maxWeeklyAmount) * 100}%`,
                                  minHeight: "10px"
                                }}
                              ></div>
                              {week.hasAnomaly && (
                                <div 
                                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 cursor-help" 
                                  title={week.anomalyReason}
                                >
                                  <AlertCircle className="h-3.5 w-3.5 text-white" />
                                </div>
                              )}
                              {implementedForecasts.includes(1) && index === 3 && (
                                <div className="absolute -top-2 -left-2 bg-green-500 rounded-full p-0.5">
                                  <Check className="h-3.5 w-3.5 text-white" />
                                </div>
                              )}
                              {index > 0 && spendData.weeklySpend[index-1].amount < week.amount && (
                                <div className="absolute -bottom-1 right-0 text-red-500">
                                  <TrendingUp className="h-4 w-4" />
                                </div>
                              )}
                              {index > 0 && spendData.weeklySpend[index-1].amount > week.amount && (
                                <div className="absolute -bottom-1 right-0 text-green-500">
                                  <TrendingDown className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-center" style={{ width: "80px" }}>
                              <span className="block text-xs font-medium">{week.week}</span>
                              <span className="block text-xs text-muted-foreground">
                                {formatCurrency(week.amount)}
                              </span>
                              {comparisonMode === 'budget' && (
                                <span className={`block text-xs ${
                                  week.amount > week.budget ? 'text-red-500' : 'text-green-500'
                                }`}>
                                  {week.amount > week.budget ? '+' : ''}
                                  {Math.round((week.amount - week.budget) / week.budget * 100)}%
                                </span>
                              )}
                              {week.hasAnomaly && resolvedAnomalies.includes(week.week === 'Week 4' ? 1 : (week.week === 'Week 7' ? 3 : 0)) && (
                                <span className="text-xs text-green-500 flex items-center justify-center mt-1">
                                  <Check className="h-3 w-3 mr-1" />
                                  Resolved
                                </span>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="w-64 p-3">
                          <div className="space-y-1.5">
                            <p className="font-medium text-sm">{week.week}: {formatCurrency(week.amount)}</p>
                            <p className="text-xs text-muted-foreground">{week.date}</p>
                            
                            {/* Previous Period Comparison */}
                            {comparisonMode === 'previous-period' && (
                              <div className="pt-1 mt-1 border-t border-border/30">
                                <p className="text-xs font-medium flex items-center">
                                  <ArrowRight className="h-3 w-3 mr-1 text-blue-500" />
                                  Comparison to Previous Week:
                                </p>
                                <p className={`text-xs ${
                                  index > 0 && (week.amount > spendData.weeklySpend[index-1].amount) 
                                    ? 'text-red-500' 
                                    : index > 0 ? 'text-green-500' : 'text-muted-foreground'
                                } flex items-center`}>
                                  {index > 0 ? (
                                    week.amount > spendData.weeklySpend[index-1].amount ? (
                                      <>
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        {Math.round((week.amount - spendData.weeklySpend[index-1].amount) / spendData.weeklySpend[index-1].amount * 100)}% increase 
                                        ({formatCurrency(week.amount - spendData.weeklySpend[index-1].amount)})
                                      </>
                                    ) : (
                                      <>
                                        <TrendingDown className="h-3 w-3 mr-1" />
                                        {Math.round((spendData.weeklySpend[index-1].amount - week.amount) / spendData.weeklySpend[index-1].amount * 100)}% decrease 
                                        ({formatCurrency(spendData.weeklySpend[index-1].amount - week.amount)})
                                      </>
                                    )
                                  ) : (
                                    <span>First week in period</span>
                                  )}
                                </p>
                              </div>
                            )}
                            
                            {/* Budget Comparison if in budget mode */}
                            {comparisonMode === 'budget' && (
                              <div className="pt-1 mt-1 border-t border-border/30">
                                <p className="text-xs font-medium flex items-center">
                                  <BarChart3 className="h-3 w-3 mr-1 text-blue-500" />
                                  Budget Performance:
                                </p>
                                <p className={`text-xs ${
                                  week.amount > week.budget ? 'text-red-500' : 'text-green-500'
                                } flex items-center`}>
                                  {week.amount > week.budget ? (
                                    <>
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      {Math.round((week.amount - week.budget) / week.budget * 100)}% over budget 
                                      ({formatCurrency(week.amount - week.budget)})
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      {Math.round((week.budget - week.amount) / week.budget * 100)}% under budget
                                      ({formatCurrency(week.budget - week.amount)})
                                    </>
                                  )}
                                </p>
                              </div>
                            )}
                            
                            {/* Anomaly Details with Explanation */}
                            {week.hasAnomaly && (
                              <div className="pt-1 mt-1 border-t border-border/30">
                                <p className="text-xs font-medium text-red-500 flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Anomaly Detected:
                                </p>
                                <p className="text-xs text-red-500/90 mt-1">
                                  {week.anomalyReason || (week.week === 'Week 4' 
                                    ? "125% increase from previous week. Unusually high spend in materials category." 
                                    : "Unexpected 68% increase from average weekly spend. Labor costs significantly elevated.")}
                                </p>
                                <p className="text-xs flex items-center mt-1 text-muted-foreground">
                                  <Info className="h-3 w-3 mr-1" />
                                  Click for detailed analysis
                                </p>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* Monthly Spend Chart */}
            <TabsContent value="monthly" className="mt-0">
              <div className="relative h-[250px]">
                {/* Y-axis labels with intermediate values - abbreviated for readability */}
                <div className="absolute top-0 left-0 text-xs text-muted-foreground">
                  {formatCurrency(maxMonthlyAmount, { abbreviated: true })}
                </div>
                <div className="absolute top-1/4 left-0 text-xs text-muted-foreground">
                  {formatCurrency(maxMonthlyAmount * 0.75, { abbreviated: true })}
                </div>
                <div className="absolute top-1/2 left-0 text-xs text-muted-foreground">
                  {formatCurrency(maxMonthlyAmount * 0.5, { abbreviated: true })}
                </div>
                <div className="absolute top-3/4 left-0 text-xs text-muted-foreground">
                  {formatCurrency(maxMonthlyAmount * 0.25, { abbreviated: true })}
                </div>
                <div className="absolute bottom-0 left-0 text-xs text-muted-foreground">
                  £0
                </div>
                
                {/* View Detailed Breakdown Button for Monthly - moved to the right, above the graph */}
                <div className="absolute top-0 right-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-6 bg-secondary/10 hover:bg-secondary/20 border-secondary/20 px-2"
                    onClick={() => openDetailedBreakdown('monthly')}
                  >
                    <PieChart className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </div>
                
                {/* Light grid lines that match the value points */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full mt-[25%]"></div>
                  <div className="h-px bg-muted/30 w-full mt-[25%]"></div>
                  <div className="h-px bg-muted/30 w-full mt-[25%]"></div>
                  <div className="h-px bg-muted/30 w-full mt-[25%]"></div>
                </div>
                
                {/* Trend Lines Visualization */}
                {comparisonMode !== 'none' && (
                  <div className="relative h-[200px] mt-6 mx-auto" style={{ maxWidth: "800px" }}>
                    <svg width="100%" height="200" className="absolute top-0 left-0 z-0 overflow-visible">
                      {/* Trend line for actual spend */}
                      <polyline
                        points={spendData.monthlySpend.map((month, i) => {
                          const x = 55 + i * 90;
                          const y = 200 - (month.amount / maxMonthlyAmount) * 180;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#7C3AED"
                        strokeWidth="2"
                        strokeDasharray="3,2"
                        className="opacity-60"
                      />
                      
                      {/* Trend line for budget when in budget comparison mode */}
                      {comparisonMode === 'budget' && (
                        <polyline
                          points={spendData.monthlySpend.map((month, i) => {
                            const x = 55 + i * 90;
                            const y = 200 - (month.budget / maxMonthlyAmount) * 180;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#22C55E"
                          strokeWidth="2"
                          strokeDasharray="2,2"
                          className="opacity-60"
                        />
                      )}
                    </svg>
                  </div>
                )}
                
                {/* Chart bars - using fixed width for perfect column alignment */}
                <div className="relative flex justify-center items-end h-[200px] mt-6 mx-auto" style={{ maxWidth: "800px" }}>
                  {spendData.monthlySpend.map((month, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center mx-2" style={{ width: "90px" }}>
                            <div className="relative" style={{ width: "60px" }}>
                              {/* Budget indicator in budget comparison mode */}
                              {comparisonMode === 'budget' && (
                                <div className="flex flex-col items-center">
                                  <div 
                                    className="absolute border-2 border-dashed border-green-500 w-full"
                                    style={{ 
                                      top: `${100 - (month.budget / maxMonthlyAmount) * 100}%`, 
                                      height: '0px',
                                      zIndex: 2
                                    }}
                                  ></div>
                                  {/* Budget label */}
                                  <span 
                                    className="absolute text-[9px] font-medium text-green-600"
                                    style={{ 
                                      top: `${95 - (month.budget / maxMonthlyAmount) * 100}%`, 
                                      right: '-35px',
                                      zIndex: 2
                                    }}
                                  >
                                    {formatCurrency(month.budget, { abbreviated: true })}
                                  </span>
                                </div>
                              )}
                              
                              <div 
                                className={`bg-gradient-to-t from-secondary/70 to-secondary w-full 
                                  rounded-t hover:brightness-110 transition-all duration-200 
                                  ${month.hasAnomaly ? 'ring-2 ring-red-500 ring-offset-2' : ''}
                                  ${comparisonMode === 'budget' && month.amount > month.budget ? 'border-t-2 border-red-500' : ''}`}
                                style={{ 
                                  height: `${(month.amount / maxMonthlyAmount) * 100}%`,
                                  minHeight: "10px"
                                }}
                              ></div>
                              {month.hasAnomaly && (
                                <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5">
                                  <AlertCircle className="h-3.5 w-3.5 text-white" />
                                </div>
                              )}
                              {implementedForecasts.includes(5) && index === 3 && (
                                <div className="absolute -top-2 -left-2 bg-green-500 rounded-full p-0.5">
                                  <Check className="h-3.5 w-3.5 text-white" />
                                </div>
                              )}
                              {month.change !== null && month.change < 0 && (
                                <div className="absolute -bottom-1 right-0 text-green-500">
                                  <TrendingDown className="h-4 w-4" />
                                </div>
                              )}
                              {month.change !== null && month.change > 0 && (
                                <div className="absolute -bottom-1 right-0 text-red-500">
                                  <TrendingUp className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="mt-3 text-center">
                              <span className="block text-xs font-medium">{month.month}</span>
                              <span className="block text-xs text-muted-foreground">
                                {formatCurrency(month.amount)}
                              </span>
                              {month.change !== null && (
                                <span className={`text-xs ${month.change > 0 ? 'text-red-500' : month.change < 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                  {month.change > 0 ? '+' : ''}{month.change}%
                                </span>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="w-64 p-3">
                          <div className="space-y-1.5">
                            <p className="font-medium text-sm">{month.month} {month.year}: {formatCurrency(month.amount)}</p>
                            
                            {/* Previous Period Comparison */}
                            {month.change !== null && (
                              <div className="pt-1">
                                <p className="text-xs font-medium flex items-center">
                                  <ArrowRight className="h-3 w-3 mr-1 text-blue-500" />
                                  Comparison to Previous Month:
                                </p>
                                <p className={`text-xs flex items-center ${
                                  month.change > 0 ? 'text-red-500' : 
                                  month.change < 0 ? 'text-green-500' : 'text-muted-foreground'
                                }`}>
                                  {month.change > 0 ? (
                                    <>
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                      {month.change}% increase ({formatCurrency(month.amount * month.change / 100)})
                                    </>
                                  ) : month.change < 0 ? (
                                    <>
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                      {Math.abs(month.change)}% decrease ({formatCurrency(month.amount * Math.abs(month.change) / 100)})
                                    </>
                                  ) : (
                                    <span>No change from previous month</span>
                                  )}
                                </p>
                              </div>
                            )}
                            
                            {/* Budget Comparison if in budget mode */}
                            {comparisonMode === 'budget' && (
                              <div className="pt-1 mt-1 border-t border-border/30">
                                <p className="text-xs font-medium flex items-center">
                                  <BarChart3 className="h-3 w-3 mr-1 text-blue-500" />
                                  Budget Performance:
                                </p>
                                <p className={`text-xs ${
                                  month.amount > month.budget ? 'text-red-500' : 'text-green-500'
                                } flex items-center`}>
                                  {month.amount > month.budget ? (
                                    <>
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      {Math.round((month.amount - month.budget) / month.budget * 100)}% over budget
                                      ({formatCurrency(month.amount - month.budget)})
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      {Math.round((month.budget - month.amount) / month.budget * 100)}% under budget
                                      ({formatCurrency(month.budget - month.amount)})
                                    </>
                                  )}
                                </p>
                              </div>
                            )}
                            
                            {/* Anomaly Details with Explanation */}
                            {month.hasAnomaly && (
                              <div className="pt-1 mt-1 border-t border-border/30">
                                <p className="text-xs font-medium text-red-500 flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Anomaly Detected:
                                </p>
                                <p className="text-xs text-red-500/90 mt-1">
                                  {month.anomalyReason || (month.month === 'Jan' 
                                    ? "Significant increase in materials category from seasonal average. Potential over-ordering detected." 
                                    : month.month === 'Mar'
                                    ? "Equipment rental costs 35% above forecast without corresponding project activity increase."
                                    : "Unexpected expense pattern in transportation costs - 3x normal volume.")}
                                </p>
                                <p className="text-xs flex items-center mt-1 text-muted-foreground">
                                  <Info className="h-3 w-3 mr-1" />
                                  Click for AI analysis
                                </p>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* Category Breakdown */}
            <TabsContent value="category" className="mt-0">
              <div className="relative mt-2 mb-2">
                {/* View Detailed Breakdown Button for Category at the top right */}
                <div className="absolute top-0 right-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-6 bg-primary/10 hover:bg-primary/20 border-primary/20 px-2"
                    onClick={() => openDetailedBreakdown('category')}
                  >
                    <PieChart className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
              {viewMode === 'chart' ? (
                <div className="space-y-4 pt-3 px-1">
                  {filteredCategories.map((category, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="group">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center">
                                <span className="text-sm font-medium">{category.category}</span>
                                {category.hasAnomaly && (
                                  <div className="ml-2 bg-red-500/10 text-red-500 rounded-full px-2 py-0.5 text-xs flex items-center">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Anomaly
                                  </div>
                                )}
                                {category.hasAnomaly && resolvedAnomalies.includes(3) && (
                                  <div className="ml-2 bg-green-500/10 text-green-500 rounded-full px-2 py-0.5 text-xs flex items-center">
                                    <Check className="h-3 w-3 mr-1" />
                                    Resolved
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
                                className={`h-2 ${category.hasAnomaly ? 'bg-red-100' : ''}`}
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
                        </TooltipTrigger>
                        <TooltipContent side="right" className="w-64 p-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">{category.category}</p>
                              <p className="font-medium text-sm">{formatCurrency(category.amount)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-1">
                              <div>% of Total:</div>
                              <div className="text-right">{category.percentage}%</div>
                              <div>Trend:</div>
                              <div className="text-right flex items-center justify-end">
                                {category.trend === 'up' && (
                                  <>
                                    <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
                                    <span className="text-red-500">Increasing</span>
                                  </>
                                )}
                                {category.trend === 'down' && (
                                  <>
                                    <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
                                    <span className="text-green-500">Decreasing</span>
                                  </>
                                )}
                                {category.trend === 'stable' && (
                                  <>
                                    <ArrowLeftRight className="h-3 w-3 mr-1" />
                                    <span>Stable</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {category.hasAnomaly && (
                              <div className="pt-1 mt-2 border-t border-border/30">
                                <p className="text-xs font-medium text-red-500 flex items-center mb-1">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Anomaly Detected:
                                </p>
                                {category.category === 'Labour' ? (
                                  <p className="text-xs text-red-500/90">
                                    Labour expenses are 18% above forecast despite consistent workforce numbers. Potential timesheet or rate issue detected.
                                  </p>
                                ) : (
                                  <p className="text-xs text-red-500/90">
                                    Spending in this category is significantly above the projected trend without corresponding project progress.
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {category.trend === 'up' && !category.hasAnomaly && (
                              <div className="pt-1 mt-2 border-t border-border/30">
                                <p className="text-xs text-amber-500 flex items-center mb-1">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Increasing Trend:
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  This category has been consistently increasing over the last 3 periods. Consider reviewing purchasing patterns.
                                </p>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  
                  {filteredCategories.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No categories match the current filter criteria. Try adjusting your filters.
                    </div>
                  )}
                  
                  <div className="pt-4 mt-4 border-t border-border/30">
                    <div className="text-xs text-muted-foreground mb-2">
                      Current filter: {thresholdType === 'above' ? 'Only showing categories above' : 'Only showing categories below'} {formatCurrency(thresholdValue)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={thresholdType} onValueChange={(v) => setThresholdType(v as 'above' | 'below')}>
                        <SelectTrigger className="h-7 text-xs w-[110px]">
                          <SelectValue placeholder="Threshold type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above" className="text-xs">Above value</SelectItem>
                          <SelectItem value="below" className="text-xs">Below value</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input 
                        type="number" 
                        className="h-7 text-xs" 
                        value={thresholdValue} 
                        onChange={(e) => setThresholdValue(Number(e.target.value))}
                      />
                      
                      <div className="text-xs font-medium">
                        Showing {filteredCategories.length} of {spendData.categoryBreakdown.length} categories
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden border rounded-md mt-4">
                  <table className="w-full">
                    <thead className="bg-muted/50 text-xs">
                      <tr>
                        <th className="text-left font-medium py-2 px-3 cursor-pointer" 
                          onClick={() => {
                            if (sortField === 'name') {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField('name');
                              setSortDirection('asc');
                            }
                          }}
                        >
                          <div className="flex items-center">
                            Category
                            {sortField === 'name' && (
                              <span className="ml-1">
                                {sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="text-right font-medium py-2 px-3 cursor-pointer"
                          onClick={() => {
                            if (sortField === 'amount') {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField('amount');
                              setSortDirection('desc');
                            }
                          }}
                        >
                          <div className="flex items-center justify-end">
                            Amount
                            {sortField === 'amount' && (
                              <span className="ml-1">
                                {sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="text-right font-medium py-2 px-3 cursor-pointer"
                          onClick={() => {
                            if (sortField === 'percentage') {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField('percentage');
                              setSortDirection('desc');
                            }
                          }}
                        >
                          <div className="flex items-center justify-end">
                            % of Total
                            {sortField === 'percentage' && (
                              <span className="ml-1">
                                {sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="text-right font-medium py-2 px-3 cursor-pointer"
                          onClick={() => {
                            if (sortField === 'trend') {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField('trend');
                              setSortDirection('asc');
                            }
                          }}
                        >
                          <div className="flex items-center justify-end">
                            Trend
                            {sortField === 'trend' && (
                              <span className="ml-1">
                                {sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              </span>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-border">
                      {filteredCategories.map((category, index) => (
                        <tr key={index} className="hover:bg-muted/30">
                          <td className="py-2 px-3">
                            <div className="flex items-center">
                              <span>{category.category}</span>
                              {category.hasAnomaly && (
                                <div className="ml-2 bg-red-500/10 text-red-500 rounded-full px-1.5 py-0.5 text-[10px] flex items-center">
                                  <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                                  Anomaly
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right">{formatCurrency(category.amount)}</td>
                          <td className="py-2 px-3 text-right">{category.percentage}%</td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end">
                              {category.trend === 'up' && <div className="text-red-500 flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                <span>Increasing</span>
                              </div>}
                              {category.trend === 'down' && <div className="text-green-500 flex items-center">
                                <TrendingDown className="h-4 w-4 mr-1" />
                                <span>Decreasing</span>
                              </div>}
                              {category.trend === 'stable' && <div className="text-muted-foreground flex items-center">
                                <ArrowLeftRight className="h-4 w-4 mr-1" />
                                <span>Stable</span>
                              </div>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            {/* AI Insights */}
            <TabsContent value="insights" className="mt-0">
              <div className="space-y-4 pt-3 px-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AI-Generated Insights Card */}
                  <Card className="overflow-hidden shadow-sm hover:shadow transition-all">
                    <CardHeader className="pb-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                      <div className="flex items-center">
                        <div className="bg-blue-500/90 rounded-full p-1.5 mr-3">
                          <Lightbulb className="h-4 w-4 text-white" />
                        </div>
                        <CardTitle className="text-sm font-semibold">AI Spend Pattern Analysis</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3 pb-2 text-xs space-y-2">
                      <div className="flex items-start border-l-2 border-blue-400 pl-3 py-1">
                        <p className="text-xs leading-relaxed">
                          <span className="font-medium">Weekly spend volatility detected:</span> Your weekly spend shows a 46% variance between minimum and maximum values, significantly higher than the industry average of 22%. This suggests potential opportunity for better scheduling of major purchases.
                        </p>
                      </div>
                      <div className="flex items-start border-l-2 border-green-400 pl-3 py-1">
                        <p className="text-xs leading-relaxed">
                          <span className="font-medium">Cost reduction opportunity:</span> Analysis indicates that consolidated ordering could reduce materials costs by approximately 8.2% (£19,900 per quarter) based on identifying duplicate small orders with higher unit pricing.
                        </p>
                      </div>
                      <div className="flex items-start border-l-2 border-amber-400 pl-3 py-1">
                        <p className="text-xs leading-relaxed">
                          <span className="font-medium">Budget alignment needed:</span> March spending exceeded budget by 15% primarily due to equipment rental costs. Historical patterns suggest improved forecasting in this category can prevent similar overruns.
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
                    <CardHeader className="pb-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
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
                  <CardHeader className="pb-2 bg-gradient-to-br from-red-50 to-amber-50 dark:from-red-950/30 dark:to-amber-950/30">
                    <div className="flex items-center">
                      <div className="bg-red-500/90 rounded-full p-1.5 mr-3">
                        <AlertOctagon className="h-4 w-4 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold">AI Anomaly Detection</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="mt-1 space-y-3">
                      {spendData.anomalies.map((anomaly, index) => (
                        <div key={index} className={`rounded-md border ${
                          resolvedAnomalies.includes(anomaly.id) ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        } p-3`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className={`text-sm font-medium flex items-center ${
                                resolvedAnomalies.includes(anomaly.id) ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {resolvedAnomalies.includes(anomaly.id) ? (
                                  <Check className="h-4 w-4 mr-1.5" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 mr-1.5" />
                                )}
                                {anomaly.title}
                              </h3>
                              <p className="mt-1 text-xs text-muted-foreground">{anomaly.description}</p>
                              {!resolvedAnomalies.includes(anomaly.id) && (
                                <p className="mt-2 text-xs text-red-600 flex items-center">
                                  <Info className="h-3 w-3 mr-1" />
                                  Impact: {anomaly.impact}
                                </p>
                              )}
                            </div>
                            <div>
                              {resolvedAnomalies.includes(anomaly.id) ? (
                                <Button size="sm" variant="outline" 
                                  className="h-7 text-xs border-green-200 text-green-600 hover:text-green-700 hover:bg-green-100 bg-green-50"
                                  onClick={() => handleUndoAnomalyResolution(anomaly.id)}
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Undo
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" 
                                  className="h-7 text-xs border-red-200 text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50"
                                  onClick={() => handleAnomalyAction(anomaly.id)}
                                >
                                  <span>Take Action</span>
                                </Button>
                              )}
                            </div>
                          </div>
                          {resolvedAnomalies.includes(anomaly.id) && (
                            <p className="mt-1 text-xs text-green-600 flex items-center">
                              <Check className="h-3 w-3 mr-1" />
                              This anomaly has been addressed.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recommendations Card */}
                <Card className="overflow-hidden shadow-sm hover:shadow transition-all">
                  <CardHeader className="pb-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                    <div className="flex items-center">
                      <div className="bg-green-500/90 rounded-full p-1.5 mr-3">
                        <LineChart className="h-4 w-4 text-white" />
                      </div>
                      <CardTitle className="text-sm font-semibold">AI Cost Optimization Recommendations</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="mt-1 space-y-3">
                      {spendData.forecasts.map((forecast, index) => (
                        <div key={index} className={`rounded-md border ${
                          implementedForecasts.includes(forecast.id) ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'
                        } p-3`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className={`text-sm font-medium flex items-center ${
                                implementedForecasts.includes(forecast.id) ? 'text-green-600' : 'text-blue-600'
                              }`}>
                                {implementedForecasts.includes(forecast.id) ? (
                                  <Check className="h-4 w-4 mr-1.5" />
                                ) : (
                                  <Lightbulb className="h-4 w-4 mr-1.5" />
                                )}
                                {forecast.description}
                              </h3>
                              <p className="mt-1 text-xs text-muted-foreground">{forecast.recommendation}</p>
                              <p className="mt-2 text-xs flex items-center">
                                <Info className="h-3.5 w-3.5 mr-1" />
                                <span className={implementedForecasts.includes(forecast.id) ? 'text-green-600' : 'text-blue-600'}>
                                  {forecast.impact} 
                                </span>
                                <span className="ml-3 bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 text-[10px]">
                                  {forecast.confidence}% confidence
                                </span>
                              </p>
                            </div>
                            <div>
                              {implementedForecasts.includes(forecast.id) ? (
                                <Button size="sm" variant="outline" 
                                  className="h-7 text-xs border-green-200 text-green-600 hover:text-green-700 hover:bg-green-100 bg-green-50"
                                  onClick={() => handleUndoForecastImplementation(forecast.id)}
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Undo
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" 
                                  className="h-7 text-xs border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-100 bg-blue-50"
                                  onClick={() => handleImplementForecast(forecast.id)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Implement
                                </Button>
                              )}
                            </div>
                          </div>
                          {implementedForecasts.includes(forecast.id) && (
                            <p className="mt-1 text-xs text-green-600 flex items-center">
                              <Check className="h-3 w-3 mr-1" />
                              This recommendation has been implemented.
                            </p>
                          )}
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

      {/* Anomaly Details Dialog */}
      <Dialog open={anomalyDialogOpen} onOpenChange={setAnomalyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span>Anomaly Details</span>
            </DialogTitle>
            <DialogDescription>
              Detailed information about the detected spending anomaly
            </DialogDescription>
          </DialogHeader>
          {selectedAnomaly && (
            <div className="space-y-4 pt-2">
              <div>
                <h3 className="text-base font-medium">{selectedAnomaly.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedAnomaly.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Severity</p>
                  <div className="flex items-center">
                    {selectedAnomaly.severity === 'high' ? (
                      <Badge variant="destructive" className="h-6">High</Badge>
                    ) : selectedAnomaly.severity === 'medium' ? (
                      <Badge variant="default" className="bg-amber-500 h-6">Medium</Badge>
                    ) : (
                      <Badge variant="outline" className="h-6">Low</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Impact</p>
                  <p className="font-medium">{selectedAnomaly.impact}</p>
                </div>
              </div>
              
              <div className="bg-secondary/30 rounded-md p-3">
                <p className="text-xs font-medium mb-1">AI-Suggested Action:</p>
                <p className="text-sm">{selectedAnomaly.suggestedAction}</p>
              </div>
              
              <div className="bg-muted/30 border border-border rounded-md p-3">
                <p className="text-xs font-medium flex items-center mb-1">
                  <Lightbulb className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                  AI Analysis:
                </p>
                <p className="text-sm">
                  This anomaly appears to be {selectedAnomaly.severity === 'high' ? 'significantly' : ''} outside normal spending patterns.
                  {selectedAnomaly.id === 1 ? 
                    ' The increase during Week 4 coincides with emergency works that were not originally planned in the budget.' :
                    selectedAnomaly.id === 2 ? 
                    ' March expenses exhibit an unusual pattern typically seen during fiscal year-end rushes, but this is outside that timeframe.' :
                    ' Labor costs have steadily increased without corresponding project progress indicators.'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setAnomalyDialogOpen(false)}
            >
              Close
            </Button>
            <Button 
              onClick={() => selectedAnomaly && handleAnomalyAction(selectedAnomaly.id)}
              disabled={selectedAnomaly && resolvedAnomalies.includes(selectedAnomaly.id)}
            >
              {selectedAnomaly && resolvedAnomalies.includes(selectedAnomaly.id) ? (
                <span className="flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  Already Resolved
                </span>
              ) : (
                'Take Action'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forecast Details Dialog */}
      <Dialog open={forecastDialogOpen} onOpenChange={setForecastDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 text-primary mr-2" />
              <span>AI Forecast Details</span>
            </DialogTitle>
            <DialogDescription>
              Detailed information about the AI-generated cost optimization opportunity
            </DialogDescription>
          </DialogHeader>
          {selectedForecast && (
            <div className="space-y-4 pt-2">
              <div>
                <h3 className="text-base font-medium">{selectedForecast.description}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedForecast.details}</p>
              </div>
              
              <div className="bg-primary/10 rounded-md p-3">
                <p className="text-xs font-medium mb-1">AI Recommendation:</p>
                <p className="text-sm">{selectedForecast.recommendation}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Projected Impact</p>
                  <p className="font-medium">{selectedForecast.impact}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Confidence Level</p>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedForecast.confidence} className="h-2 w-16" />
                    <span className="font-medium">{selectedForecast.confidence}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/30 border border-border rounded-md p-3">
                <p className="text-xs font-medium flex items-center mb-1">
                  <LineChart className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                  Historical Context:
                </p>
                <p className="text-sm">
                  Similar patterns were observed in previous projects, where implementing this recommendation resulted in average savings of 
                  {selectedForecast.id === 1 ? ' 9.2%' :
                   selectedForecast.id === 2 ? ' 18.7%' :
                   selectedForecast.id === 3 ? ' 2.1%' :
                   selectedForecast.id === 4 ? ' 3.8%' : ' 10.5%'} 
                  in the affected category. The AI model has analyzed 
                  {selectedForecast.id === 1 ? ' 37' :
                   selectedForecast.id === 2 ? ' 42' :
                   selectedForecast.id === 3 ? ' 28' :
                   selectedForecast.id === 4 ? ' 31' : ' 24'} 
                  similar historical cases to generate this recommendation.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setForecastDialogOpen(false)}
            >
              Close
            </Button>
            <Button 
              onClick={() => selectedForecast && handleImplementForecast(selectedForecast.id)}
              disabled={selectedForecast && implementedForecasts.includes(selectedForecast.id)}
            >
              {selectedForecast && implementedForecasts.includes(selectedForecast.id) ? (
                <span className="flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  Already Implemented
                </span>
              ) : (
                'Implement Recommendation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}