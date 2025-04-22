import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  Info,
  Download,
  HelpCircle,
  Filter,
  BellRing,
  Check,
  ExternalLink,
  LayoutList,
  RotateCcw
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
    { week: 'Week 1', amount: 12450, date: '01 Apr - 07 Apr' },
    { week: 'Week 2', amount: 15780, date: '08 Apr - 14 Apr' },
    { week: 'Week 3', amount: 9800, date: '15 Apr - 21 Apr' },
    { week: 'Week 4', amount: 22100, date: '22 Apr - 28 Apr', hasAnomaly: true },
    { week: 'Week 5', amount: 10350, date: '29 Apr - 05 May' },
    { week: 'Week 6', amount: 11250, date: '06 May - 12 May' },
    { week: 'Week 7', amount: 18980, date: '13 May - 19 May', hasAnomaly: true },
    { week: 'Week 8', amount: 14670, date: '20 May - 26 May' }
  ],
  monthlySpend: [
    { month: 'Jan', year: 2025, amount: 92450, change: null },
    { month: 'Feb', year: 2025, amount: 86700, change: -6.2 },
    { month: 'Mar', year: 2025, amount: 105800, change: 22.0, hasAnomaly: true },
    { month: 'Apr', year: 2025, amount: 94300, change: -10.9 },
    { month: 'May', year: 2025, amount: 97500, change: 3.4 }
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
  };

  return (
    <div className={className}>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Spend Analytics Dashboard
              </CardTitle>
              <CardDescription>
                AI-powered procurement spend analysis and anomaly detection
              </CardDescription>
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="sm" className="px-2.5" onClick={generateForecastReport} disabled={exportInProgress}>
                {exportInProgress ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-1.5"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1.5" />
                    Export
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`px-2.5 ${viewMode === 'chart' ? 'bg-secondary/20' : ''}`}
                onClick={() => setViewMode('chart')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`px-2.5 ${viewMode === 'table' ? 'bg-secondary/20' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Filter options */}
          {viewMode === 'chart' && (
            <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-3">
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  Date Range
                </h3>
                <div className="flex space-x-2">
                  <Select value={dateRange} onValueChange={(value) => setDateRange(value as any)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="6m">Last 6 months</SelectItem>
                      <SelectItem value="1y">Last 12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  Filter Options
                </h3>
                <div className="flex space-x-2">
                  <Select 
                    value={thresholdType} 
                    onValueChange={(value) => setThresholdType(value as 'above' | 'below')}
                  >
                    <SelectTrigger className="h-8 text-xs w-32">
                      <SelectValue placeholder="Threshold type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    type="number" 
                    className="h-8 text-xs"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  Comparison
                </h3>
                <div className="flex space-x-2">
                  <Select 
                    value={comparisonMode} 
                    onValueChange={(value) => setComparisonMode(value as 'previous-period' | 'budget' | 'none')}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Comparison mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No comparison</SelectItem>
                      <SelectItem value="previous-period">vs. Previous period</SelectItem>
                      <SelectItem value="budget">vs. Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          {/* Tabs for different views */}
          <div className="mt-4">
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
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
                
                {/* Light grid lines that match the value points */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full mt-[25%]"></div>
                  <div className="h-px bg-muted/30 w-full mt-[25%]"></div>
                  <div className="h-px bg-muted/30 w-full mt-[25%]"></div>
                  <div className="h-px bg-muted/30 w-full mt-[25%]"></div>
                </div>
                
                {/* View Detailed Breakdown Button for Weekly */}
                <div className="absolute top-0 right-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => openDetailedBreakdown('weekly')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                </div>
                
                {/* Chart bars */}
                <div className="flex justify-between items-end h-[200px] px-6 mt-6">
                  {spendData.weeklySpend.map((week, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center group">
                            <div className="relative">
                              <div 
                                className={`bg-gradient-to-t from-primary/70 to-primary w-12 
                                  rounded-t hover:brightness-110 transition-all duration-200 
                                  group-hover:shadow-lg ${week.hasAnomaly ? 'ring-2 ring-red-500 ring-offset-2' : ''}`} 
                                style={{ 
                                  height: `${(week.amount / maxWeeklyAmount) * 100}%`,
                                  minHeight: "10px"
                                }}
                              ></div>
                              {week.hasAnomaly && (
                                <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5">
                                  <AlertCircle className="h-3.5 w-3.5 text-white" />
                                </div>
                              )}
                              {implementedForecasts.includes(1) && index === 3 && (
                                <div className="absolute -top-2 -left-2 bg-green-500 rounded-full p-0.5">
                                  <Check className="h-3.5 w-3.5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-center">
                              <span className="block text-xs font-medium">{week.week}</span>
                              <span className="block text-xs text-muted-foreground">
                                {formatCurrency(week.amount)}
                              </span>
                              {week.hasAnomaly && resolvedAnomalies.includes(week.week === 'Week 4' ? 1 : (week.week === 'Week 7' ? 3 : 0)) && (
                                <span className="text-xs text-green-500 flex items-center justify-center mt-1">
                                  <Check className="h-3 w-3 mr-1" />
                                  Resolved
                                </span>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="w-48 p-3">
                          <div className="space-y-1.5">
                            <p className="font-medium text-sm">{week.week}: {formatCurrency(week.amount)}</p>
                            <p className="text-xs text-muted-foreground">{week.date}</p>
                            {week.hasAnomaly && (
                              <p className="text-xs text-red-500 flex items-center mt-1">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Anomaly detected in this period
                              </p>
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
                
                {/* View Detailed Breakdown Button for Monthly */}
                <div className="absolute top-0 right-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => openDetailedBreakdown('monthly')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Details
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
                
                {/* Chart bars */}
                <div className="flex justify-between items-end h-[200px] px-6 mt-6">
                  {spendData.monthlySpend.map((month, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center group">
                            <div className="relative">
                              <div 
                                className={`bg-gradient-to-t from-secondary/70 to-secondary w-16 
                                  rounded-t hover:brightness-110 transition-all duration-200 
                                  group-hover:shadow-lg ${month.hasAnomaly ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
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
                        <TooltipContent side="top" className="w-48 p-3">
                          <div className="space-y-1.5">
                            <p className="font-medium text-sm">{month.month} {month.year}: {formatCurrency(month.amount)}</p>
                            {month.change !== null && (
                              <p className={`text-xs flex items-center ${
                                month.change > 0 ? 'text-red-500' : 
                                month.change < 0 ? 'text-green-500' : 'text-muted-foreground'
                              }`}>
                                {month.change > 0 ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : month.change < 0 ? (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                ) : null}
                                {month.change > 0 ? '+' : ''}{month.change}% vs previous month
                              </p>
                            )}
                            {month.hasAnomaly && (
                              <p className="text-xs text-red-500 flex items-center mt-1">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Anomaly detected in this period
                              </p>
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
              <div className="relative">
                {/* View Detailed Breakdown Button for Category */}
                <div className="absolute top-0 right-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => openDetailedBreakdown('category')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Details
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
                        <TooltipContent side="right" className="w-48 p-3">
                          <div className="space-y-1.5">
                            <p className="font-medium text-sm">{category.category}</p>
                            <p className="text-xs">{formatCurrency(category.amount)} ({category.percentage}% of total)</p>
                            <p className={`text-xs flex items-center ${
                                category.trend === 'up' ? 'text-red-500' : 
                                category.trend === 'down' ? 'text-green-500' : 'text-muted-foreground'
                              }`}>
                              {category.trend === 'up' ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : category.trend === 'down' ? (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              ) : (
                                <ArrowRight className="h-3 w-3 mr-1" />
                              )}
                              {
                                category.trend === 'up' 
                                ? 'Increasing trend' 
                                : category.trend === 'down' 
                                  ? 'Decreasing trend' 
                                  : 'Stable trend'
                              }
                            </p>
                            {category.hasAnomaly && (
                              <p className="text-xs text-red-500 flex items-center mt-1">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Anomaly detected in this category
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium py-2 px-3">Category</th>
                        <th className="text-right font-medium py-2 px-3">Amount</th>
                        <th className="text-right font-medium py-2 px-3">Percentage</th>
                        <th className="text-center font-medium py-2 px-3">Trend</th>
                        <th className="text-center font-medium py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategories.map((category, index) => (
                        <tr key={index} className="border-b border-muted/30 hover:bg-muted/50">
                          <td className="py-2 px-3">{category.category}</td>
                          <td className="text-right py-2 px-3">{formatCurrency(category.amount)}</td>
                          <td className="text-right py-2 px-3">{category.percentage}%</td>
                          <td className="text-center py-2 px-3">
                            {category.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500 mx-auto" />}
                            {category.trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500 mx-auto" />}
                            {category.trend === 'stable' && <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />}
                          </td>
                          <td className="text-center py-2 px-3">
                            {category.hasAnomaly ? (
                              resolvedAnomalies.includes(3) ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                                  <Check className="h-3 w-3 mr-1" />
                                  Resolved
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Anomaly
                                </Badge>
                              )
                            ) : (
                              <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
                                Normal
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* AI Insights Section */}
          <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Anomalies */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-1.5" />
                Detected Anomalies
              </h3>
              <div className="space-y-3">
                {spendData.anomalies.map((anomaly, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-md p-3 hover:bg-muted/50 
                      cursor-pointer transition-colors ${resolvedAnomalies.includes(anomaly.id) ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}
                    onClick={() => openAnomalyDetails(anomaly)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <Badge 
                          variant="outline" 
                          className={`mr-2 ${
                            anomaly.severity === 'high' 
                              ? 'text-red-500 border-red-500/50' 
                              : anomaly.severity === 'medium' 
                                ? 'text-amber-500 border-amber-500/50' 
                                : 'text-blue-500 border-blue-500/50'
                          }`}
                        >
                          {anomaly.severity}
                        </Badge>
                        <h4 className="text-sm font-medium">{anomaly.title}</h4>
                      </div>
                      {resolvedAnomalies.includes(anomaly.id) && (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{anomaly.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-medium">{anomaly.impact}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAnomalyDetails(anomaly);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* AI Forecasts */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <Lightbulb className="h-4 w-4 text-amber-500 mr-1.5" />
                AI Forecast Recommendations
              </h3>
              <div className="space-y-3">
                {spendData.forecasts.slice(0, 3).map((forecast, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-md p-3 hover:bg-muted/50 
                      cursor-pointer transition-colors ${
                        implementedForecasts.includes(forecast.id) 
                          ? 'bg-green-500/5 border-green-500/20' 
                          : 'bg-amber-500/5 border-amber-500/20'
                      }`}
                    onClick={() => openForecastDetails(forecast)}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium flex items-center">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                        {forecast.description}
                      </h4>
                      {implementedForecasts.includes(forecast.id) && (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Implemented
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <Badge variant="outline">{forecast.confidence}% confidence</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          openForecastDetails(forecast);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Anomaly Details Dialog */}
      <Dialog open={anomalyDialogOpen} onOpenChange={setAnomalyDialogOpen}>
        {selectedAnomaly && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                Spend Anomaly Details
              </DialogTitle>
              <DialogDescription>
                AI-detected procurement irregularity details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="pb-3 border-b flex items-start justify-between">
                <div>
                  <Badge 
                    variant="outline" 
                    className={`${
                      selectedAnomaly.severity === 'high' 
                        ? 'text-red-500 border-red-500/50' 
                        : selectedAnomaly.severity === 'medium' 
                          ? 'text-amber-500 border-amber-500/50' 
                          : 'text-blue-500 border-blue-500/50'
                    }`}
                  >
                    {selectedAnomaly.severity} severity
                  </Badge>
                  <h3 className="text-base font-semibold mt-2">{selectedAnomaly.title}</h3>
                </div>
                {resolvedAnomalies.includes(selectedAnomaly.id) && (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-semibold">Issue Description</h4>
                <p className="text-sm mt-1">{selectedAnomaly.description}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-1.5" />
                  Financial Impact
                </h4>
                <p className="text-sm mt-1">{selectedAnomaly.impact}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold flex items-center">
                  <Lightbulb className="h-4 w-4 text-amber-500 mr-1.5" />
                  Suggested Action
                </h4>
                <p className="text-sm mt-1">{selectedAnomaly.suggestedAction}</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <BellRing className="h-4 w-4" />
                Remind Later
              </Button>
              
              {resolvedAnomalies.includes(selectedAnomaly.id) ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => handleUndoAnomalyResolution(selectedAnomaly.id)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Undo Resolution
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  className="gap-1.5"
                  onClick={() => handleAnomalyAction(selectedAnomaly.id)}
                >
                  <Check className="h-4 w-4" />
                  Take Action
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Forecast Details Dialog */}
      <Dialog open={forecastDialogOpen} onOpenChange={setForecastDialogOpen}>
        {selectedForecast && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 text-amber-500 mr-2" />
                AI Forecast Details
              </DialogTitle>
              <DialogDescription>
                Detailed procurement intelligence and recommendations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="pb-3 border-b flex items-start justify-between">
                <div>
                  <Badge variant="outline">
                    {selectedForecast.confidence}% confidence
                  </Badge>
                  <h3 className="text-base font-semibold mt-2">{selectedForecast.description}</h3>
                </div>
                {implementedForecasts.includes(selectedForecast.id) && (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Implemented
                  </Badge>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-semibold">Analysis Basis</h4>
                <p className="text-sm mt-1">{selectedForecast.details}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold flex items-center">
                  <Lightbulb className="h-4 w-4 text-amber-500 mr-1.5" />
                  Recommended Action
                </h4>
                <p className="text-sm mt-1">{selectedForecast.recommendation}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1.5" />
                  Potential Benefit
                </h4>
                <p className="text-sm mt-1">{selectedForecast.impact}</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" />
                Generate Report
              </Button>
              
              {implementedForecasts.includes(selectedForecast.id) ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => handleUndoForecastImplementation(selectedForecast.id)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Undo Implementation
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  className="gap-1.5"
                  onClick={() => handleImplementForecast(selectedForecast.id)}
                >
                  <Check className="h-4 w-4" />
                  Implement
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Detailed Breakdown Modal */}
      <Dialog open={detailedBreakdownOpen} onOpenChange={setDetailedBreakdownOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {breakdownType === 'weekly' && (
                <>
                  <Calendar className="h-5 w-5 text-primary mr-2" />
                  Weekly Spend Detailed Breakdown
                </>
              )}
              {breakdownType === 'monthly' && (
                <>
                  <Calendar className="h-5 w-5 text-secondary mr-2" />
                  Monthly Spend Detailed Breakdown
                </>
              )}
              {breakdownType === 'category' && (
                <>
                  <PieChart className="h-5 w-5 text-primary mr-2" />
                  Category Spend Detailed Breakdown
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Comprehensive analysis of procurement spend patterns
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
            {/* Main visualization */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border rounded-lg p-4 h-[300px] flex items-center justify-center">
                {/* Placeholder for detailed chart - would use a real chart library in production */}
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Detailed data visualization would appear here</p>
                  <p className="text-xs">Using a chart library like Recharts or Chart.js</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Trend Analysis</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium py-2 px-3">Period</th>
                      <th className="text-right font-medium py-2 px-3">Amount</th>
                      <th className="text-right font-medium py-2 px-3">Change</th>
                      <th className="text-right font-medium py-2 px-3">vs. Budget</th>
                      <th className="text-center font-medium py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Sample data rows - would be dynamic in production */}
                    <tr className="border-b border-muted/30">
                      <td className="py-2 px-3">Week 4</td>
                      <td className="text-right py-2 px-3">£22,100</td>
                      <td className="text-right py-2 px-3 text-red-500">+125.5%</td>
                      <td className="text-right py-2 px-3 text-red-500">+32.4%</td>
                      <td className="text-center py-2 px-3">
                        <Badge variant="outline" className="bg-red-500/10 text-red-500">Anomaly</Badge>
                      </td>
                    </tr>
                    <tr className="border-b border-muted/30">
                      <td className="py-2 px-3">Week 5</td>
                      <td className="text-right py-2 px-3">£10,350</td>
                      <td className="text-right py-2 px-3 text-green-500">-53.2%</td>
                      <td className="text-right py-2 px-3 text-green-500">-12.1%</td>
                      <td className="text-center py-2 px-3">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">Under Budget</Badge>
                      </td>
                    </tr>
                    <tr className="border-b border-muted/30">
                      <td className="py-2 px-3">Week 6</td>
                      <td className="text-right py-2 px-3">£11,250</td>
                      <td className="text-right py-2 px-3 text-green-500">+8.7%</td>
                      <td className="text-right py-2 px-3 text-green-500">-6.3%</td>
                      <td className="text-center py-2 px-3">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">Under Budget</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Sidebar with additional metrics */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Info className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  Key Metrics
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Spend</span>
                      <span className="font-medium">£115,380</span>
                    </div>
                    <Progress value={72} className="h-1.5 mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">vs Budget</span>
                      <span className="font-medium text-amber-500">+4.2%</span>
                    </div>
                    <Progress value={104.2} max={200} className="h-1.5 mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">vs Last Period</span>
                      <span className="font-medium text-red-500">+12.8%</span>
                    </div>
                    <Progress value={112.8} max={200} className="h-1.5 mt-1" />
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-1.5 text-amber-500" />
                  AI Insights
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p>Unusual spending pattern detected week-over-week, with a notable spike in Week 4.</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p>Category breakdown shows Materials consistently representing the largest expense segment.</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p>May forecast predicts decreased spending as major material purchases have been completed.</p>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <ArrowDown className="h-4 w-4 mr-1.5 text-green-500" />
                  Savings Opportunities
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bulk ordering</span>
                    <span className="font-medium">£4,200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Early payment</span>
                    <span className="font-medium">£1,850</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier consolidation</span>
                    <span className="font-medium">£7,300</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              Export Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}