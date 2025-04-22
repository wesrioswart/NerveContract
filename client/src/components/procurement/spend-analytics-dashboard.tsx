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
  LayoutList
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

// Enhanced data structure with more detailed information
const spendData = {
  weeklySpend: [
    { week: 'Week 1', amount: 12450, date: '01 Apr - 07 Apr' },
    { week: 'Week 2', amount: 15780, date: '08 Apr - 14 Apr' },
    { week: 'Week 3', amount: 9800, date: '15 Apr - 21 Apr' },
    { week: 'Week 4', amount: 22100, date: '22 Apr - 28 Apr', hasAnomaly: true },
    { week: 'Week 5', amount: 10350, date: '29 Apr - 05 May' },
    { week: 'Week 6', amount: 16200, date: '06 May - 12 May' },
  ],
  monthlySpend: [
    { month: 'Jan', amount: 42300, year: '2025', change: null },
    { month: 'Feb', amount: 36750, year: '2025', change: -13.1 },
    { month: 'Mar', amount: 51200, year: '2025', change: 39.3 },
    { month: 'Apr', amount: 38900, year: '2025', change: -24.0 },
  ],
  categoryBreakdown: [
    { category: 'Materials', amount: 85600, percentage: 38, trend: 'up', changePercent: 8.2 },
    { category: 'Plant Hire', amount: 62400, percentage: 28, trend: 'down', changePercent: -5.3 },
    { category: 'Subcontractors', amount: 45800, percentage: 21, trend: 'stable', changePercent: 0.8 },
    { category: 'PPE & Safety', amount: 18200, percentage: 8, trend: 'up', changePercent: 12.5 },
    { category: 'Other', amount: 11000, percentage: 5, trend: 'stable', changePercent: -0.2 },
  ],
  anomalies: [
    { 
      id: 1, 
      description: 'Unusually high spend on Plant Hire in Week 4',
      severity: 'high',
      amount: 15800,
      details: 'Apex Plant Hire invoice DB-4872 shows rates 22% above contract.',
      recommendation: 'Review invoice DB-4872 and verify against contract rates.',
      impact: 'Potential £45,000 budget overrun by project completion if not addressed.'
    },
    { 
      id: 2, 
      description: 'Duplicate invoice detected for Thurrock Engineering',
      severity: 'medium',
      amount: 3450,
      details: 'Invoices TH-9921 and TH-9924 appear to be for the same delivery.',
      recommendation: 'Compare invoice details and contact supplier to verify.',
      impact: 'Direct cost impact of £3,450 if duplicate payment is made.'
    },
    { 
      id: 3, 
      description: 'Price increase of 15% on concrete supplies',
      severity: 'low',
      amount: 1200,
      details: 'C&R Concrete applied price increase without prior notification.',
      recommendation: 'Check if increase aligns with contract terms or market conditions.',
      impact: 'Cumulative impact of £12,800 over remaining project duration.'
    },
  ],
  nominalInsights: [
    {
      code: '5399',
      description: 'OTHER SITE CONSUMABLES',
      spend: 18750,
      trend: 'up',
      insight: 'Spending is 23% higher than previous month',
      recommendation: 'Review itemization - potential consolidation opportunity'
    },
    {
      code: '5402',
      description: 'PLANT HIRE',
      spend: 42300,
      trend: 'down',
      insight: 'Consistent weekly pattern detected',
      recommendation: 'Efficiency gains identified - consider similar approach for other areas'
    },
    {
      code: '5100',
      description: 'CONCRETE',
      spend: 35600,
      trend: 'neutral',
      insight: 'Multiple suppliers used - consolidation opportunity',
      recommendation: 'Analyze supplier performance data and consolidate to top performers'
    },
  ],
  aiForecasts: [
    {
      id: 1,
      description: 'Based on current trends, expect 15-20% increase in material costs next month',
      confidence: 85,
      details: 'Analysis of supplier notifications, market indices, and historical patterns indicate rising material costs.',
      recommendation: 'Consider accelerating material purchases for critical path items.',
      impact: 'Potential savings of £28,500 if action taken before June 1st.'
    },
    {
      id: 2,
      description: 'Plant hire spending likely to decrease as project moves to next phase',
      confidence: 72,
      details: 'Project schedule analysis shows reduced heavy equipment requirements starting week 8.',
      recommendation: 'Review plant hire agreements and terminate unnecessary rentals.',
      impact: 'Projected savings of £14,200 over next 6 weeks.'
    },
    {
      id: 3,
      description: 'Potential savings of £12,500 identified through supplier consolidation',
      confidence: 90,
      details: 'Current procurement spread across 14 suppliers where 7 could fulfill all requirements.',
      recommendation: 'Consolidate consumables purchasing to preferred suppliers with better rates.',
      impact: 'Additional benefits include reduced admin overhead and improved delivery reliability.'
    }
  ],
  gpsmacsCodes: [
    { code: 'G.01.02.01', description: 'Earthworks', spend: 24500, percentage: 11 },
    { code: 'P.03.04.01', description: 'Plant - Excavators', spend: 35800, percentage: 16 },
    { code: 'S.02.01.03', description: 'Steel Reinforcement', spend: 48200, percentage: 22 },
    { code: 'M.01.03.02', description: 'Concrete Supply', spend: 36700, percentage: 17 },
    { code: 'A.01.02.01', description: 'Professional Services', spend: 19800, percentage: 9 },
    { code: 'C.01.01.01', description: 'Various Materials', spend: 54000, percentage: 25 }
  ]
};

// Format currency with proper commas for thousands
const formatCurrency = (value: number): string => {
  return `£${value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

interface SpendAnalyticsDashboardProps {
  className?: string;
}

// Reusable trend icon component
const TrendIcon = ({ trend, className = "h-4 w-4" }: { trend: string, className?: string }) => {
  if (trend === 'up') return <TrendingUp className={`${className} text-red-500`} />;
  if (trend === 'down') return <TrendingDown className={`${className} text-green-500`} />;
  return <ArrowRight className={`${className} text-yellow-500`} />;
};

const SpendAnalyticsDashboard: React.FC<SpendAnalyticsDashboardProps> = ({ className }) => {
  // State for dialogs
  const [anomalyDialogOpen, setAnomalyDialogOpen] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<typeof spendData.anomalies[0] | null>(null);
  
  const [forecastDialogOpen, setForecastDialogOpen] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<typeof spendData.aiForecasts[0] | null>(null);
  
  // Filter panel
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Date range filtering
  const [startDate, setStartDate] = useState<string>("2025-01-01");
  const [endDate, setEndDate] = useState<string>("2025-04-30");
  const [dateFilterActive, setDateFilterActive] = useState(false);
  
  // Category filtering
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    spendData.categoryBreakdown.map(cat => cat.category)
  );
  
  // View mode for data visualization
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  
  // Sort options
  const [sortField, setSortField] = useState<'amount' | 'percentage' | 'name' | 'trend'>('amount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filter by threshold
  const [thresholdValue, setThresholdValue] = useState<number>(0);
  const [thresholdType, setThresholdType] = useState<'above' | 'below'>('above');
  
  // Export options
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [exportInProgress, setExportInProgress] = useState(false);
  
  // Comparison mode
  const [comparisonMode, setComparisonMode] = useState<'previous-period' | 'budget' | 'none'>('none');
  
  // Calculate maximum values for chart scaling
  const maxWeeklyAmount = Math.max(...spendData.weeklySpend.map(w => w.amount));
  const maxMonthlyAmount = Math.max(...spendData.monthlySpend.map(m => m.amount));
  
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
      // Show success message or trigger download
      alert("Forecast report generated successfully!");
    }, 1500);
  };
  
  // Open anomaly details dialog
  const openAnomalyDetails = (anomaly: typeof spendData.anomalies[0]) => {
    setSelectedAnomaly(anomaly);
    setAnomalyDialogOpen(true);
  };
  
  // Open forecast details dialog
  const openForecastDetails = (forecast: typeof spendData.aiForecasts[0]) => {
    setSelectedForecast(forecast);
    setForecastDialogOpen(true);
  };
  
  // Handle taking action on an anomaly
  const handleAnomalyAction = (anomalyId: number) => {
    // Simulate API call to mark anomaly as being addressed
    console.log(`Taking action on anomaly ${anomalyId}`);
    setAnomalyDialogOpen(false);
    
    // Show success message
    alert(`Action started for anomaly #${anomalyId}. A notification has been sent to the procurement team.`);
  };
  
  // Handle implementing a forecast recommendation
  const handleImplementForecast = (forecastId: number) => {
    // Simulate API call to implement forecast recommendation
    console.log(`Implementing forecast ${forecastId}`);
    setForecastDialogOpen(false);
    
    // Show success message
    alert(`Implementation plan for forecast #${forecastId} has been created and assigned to the procurement team.`);
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Spend Analytics Card with Chart Tabs */}
      <Card className="shadow-md border border-muted/30">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Spend Analytics
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Lightbulb className="h-4 w-4 text-amber-500 mr-1.5" />
                AI-powered procurement intelligence
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              {/* Data view toggle */}
              <div className="flex items-center bg-muted/40 rounded-md p-0.5 border border-muted">
                <Button
                  variant={viewMode === 'chart' ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => setViewMode('chart')}
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-1" />
                  Chart
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => setViewMode('table')}
                >
                  <LayoutList className="h-3.5 w-3.5 mr-1" />
                  Table
                </Button>
              </div>
              
              {/* Filter button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Filters
                {dateFilterActive || selectedCategories.length !== spendData.categoryBreakdown.length ? (
                  <Badge className="ml-1.5 bg-primary h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {(dateFilterActive ? 1 : 0) + (selectedCategories.length !== spendData.categoryBreakdown.length ? 1 : 0)}
                  </Badge>
                ) : null}
              </Button>
            </div>
          </div>
          
          {/* Filter panel */}
          {filtersOpen && (
            <div className="mt-4 p-3 bg-muted/20 rounded-md border border-muted/50 animate-in fade-in duration-200">
              <div className="text-sm font-medium mb-2 flex items-center justify-between">
                <span>Filters</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setDateFilterActive(false);
                    setSelectedCategories(spendData.categoryBreakdown.map(cat => cat.category));
                    setThresholdValue(0);
                    setThresholdType('above');
                  }}
                >
                  Reset filters
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Date range filter */}
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <Checkbox 
                      id="date-filter" 
                      checked={dateFilterActive}
                      onCheckedChange={(checked) => setDateFilterActive(checked === true)}
                    />
                    <label htmlFor="date-filter" className="text-xs ml-2 cursor-pointer">
                      Date range
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        disabled={!dateFilterActive}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="w-1/2">
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        disabled={!dateFilterActive}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Category filter */}
                <div className="space-y-1.5">
                  <label className="text-xs">Categories</label>
                  <div className="flex flex-wrap gap-1.5">
                    {spendData.categoryBreakdown.map((category, index) => (
                      <Badge 
                        key={index}
                        variant={selectedCategories.includes(category.category) ? "default" : "outline"}
                        className="cursor-pointer text-xs py-0.5"
                        onClick={() => {
                          if (selectedCategories.includes(category.category)) {
                            // Don't allow deselecting the last category
                            if (selectedCategories.length > 1) {
                              setSelectedCategories(prev => prev.filter(cat => cat !== category.category));
                            }
                          } else {
                            setSelectedCategories(prev => [...prev, category.category]);
                          }
                        }}
                      >
                        {category.category}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Threshold filter */}
                <div className="space-y-1.5">
                  <label className="text-xs">Amount threshold</label>
                  <div className="flex gap-2">
                    <Select 
                      value={thresholdType} 
                      onValueChange={(value) => setThresholdType(value as 'above' | 'below')}
                    >
                      <SelectTrigger className="h-8 text-xs w-24">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above</SelectItem>
                        <SelectItem value="below">Below</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={thresholdValue}
                      onChange={(e) => setThresholdValue(parseInt(e.target.value) || 0)}
                      className="h-8 text-xs"
                      placeholder="Amount threshold"
                    />
                  </div>
                </div>
                
                {/* Comparison mode */}
                <div className="space-y-1.5">
                  <label className="text-xs">Comparison</label>
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
              <div className="relative h-[220px]">
                {/* Y-axis labels */}
                <div className="absolute top-0 left-0 text-xs text-muted-foreground">
                  {formatCurrency(maxWeeklyAmount)}
                </div>
                <div className="absolute bottom-0 left-0 text-xs text-muted-foreground">
                  £0
                </div>
                
                {/* Light grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                </div>
                
                {/* Chart bars */}
                <div className="flex justify-between items-end h-[175px] px-6 mt-6">
                  {spendData.weeklySpend.map((week, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center group">
                            <div 
                              className={`bg-gradient-to-t from-primary/80 to-primary w-10 
                                rounded-t-sm hover:brightness-110 transition-all duration-200 
                                group-hover:shadow-md ${week.hasAnomaly ? 'ring-2 ring-red-500 ring-offset-1' : ''}`} 
                              style={{ 
                                height: `${(week.amount / maxWeeklyAmount) * 100}%`,
                                minHeight: "10px"
                              }}
                            ></div>
                            <div className="mt-2 text-center">
                              <span className="block text-xs font-medium">{week.week}</span>
                              <span className="block text-xs text-muted-foreground">
                                {formatCurrency(week.amount)}
                              </span>
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
              <div className="relative h-[220px]">
                {/* Y-axis labels */}
                <div className="absolute top-0 left-0 text-xs text-muted-foreground">
                  {formatCurrency(maxMonthlyAmount)}
                </div>
                <div className="absolute bottom-0 left-0 text-xs text-muted-foreground">
                  £0
                </div>
                
                {/* Light grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                  <div className="h-px bg-muted/30 w-full"></div>
                </div>
                
                {/* Chart bars */}
                <div className="flex justify-between items-end h-[175px] px-6 mt-6">
                  {spendData.monthlySpend.map((month, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center group">
                            <div 
                              className="bg-gradient-to-t from-secondary/80 to-secondary w-16 
                                rounded-t-sm hover:brightness-110 transition-all duration-200 
                                group-hover:shadow-md" 
                              style={{ 
                                height: `${(month.amount / maxMonthlyAmount) * 100}%`,
                                minHeight: "10px"
                              }}
                            ></div>
                            <div className="mt-2 text-center">
                              <span className="block text-xs font-medium">{month.month}</span>
                              <span className="block text-xs text-muted-foreground">
                                {formatCurrency(month.amount)}
                              </span>
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
              {viewMode === 'chart' ? (
                <div className="space-y-4 pt-3 px-1">
                  {filteredCategories.map((category, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="space-y-1.5 cursor-pointer">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-sm 
                                  ${index === 0 ? 'bg-blue-500' : 
                                    index === 1 ? 'bg-green-500' : 
                                    index === 2 ? 'bg-amber-500' : 
                                    index === 3 ? 'bg-purple-500' : 'bg-gray-500'} 
                                  mr-2`}
                                ></div>
                                <span className="text-sm font-medium">{category.category}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <TrendIcon trend={category.trend} />
                                <span className="text-sm font-medium">{formatCurrency(category.amount)}</span>
                              </div>
                            </div>
                            <div className="bg-muted h-2 w-full rounded-full overflow-hidden">
                              <div 
                                className={`h-2 rounded-full
                                  ${index === 0 ? 'bg-blue-500' : 
                                    index === 1 ? 'bg-green-500' : 
                                    index === 2 ? 'bg-amber-500' : 
                                    index === 3 ? 'bg-purple-500' : 'bg-gray-500'}`
                                }
                                style={{ width: `${category.percentage}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{category.percentage}% of total</span>
                              <span className={`
                                ${category.changePercent > 0 ? 'text-red-500' : 
                                  category.changePercent < 0 ? 'text-green-500' : 'text-muted-foreground'}
                                flex items-center gap-1
                              `}>
                                {category.changePercent > 0 ? <TrendingUp className="h-3 w-3" /> : 
                                category.changePercent < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                                {category.changePercent > 0 ? '+' : ''}{category.changePercent}%
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="w-60 p-3">
                          <div className="space-y-1.5">
                            <p className="font-medium text-sm">{category.category}</p>
                            <p className="text-xs">Total spend: {formatCurrency(category.amount)}</p>
                            <p className="text-xs">Percentage of total: {category.percentage}%</p>
                            <p className={`text-xs flex items-center gap-1.5 ${
                              category.changePercent > 0 ? 'text-red-500' : 
                              category.changePercent < 0 ? 'text-green-500' : 'text-muted-foreground'
                            }`}>
                              {category.changePercent > 0 ? <TrendingUp className="h-3 w-3" /> : 
                              category.changePercent < 0 ? <TrendingDown className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                              {category.trend === 'up' ? 'Increasing' : 
                              category.trend === 'down' ? 'Decreasing' : 'Stable'} trend
                              ({category.changePercent > 0 ? '+' : ''}{category.changePercent}% vs previous period)
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              ) : (
                <div className="pt-3">
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th 
                            className="px-4 py-3 text-left font-medium text-sm cursor-pointer hover:bg-muted/80 transition-colors" 
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
                                sortDirection === 'asc' ? 
                                <ArrowUp className="h-3.5 w-3.5 ml-1" /> : 
                                <ArrowDown className="h-3.5 w-3.5 ml-1" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left font-medium text-sm cursor-pointer hover:bg-muted/80 transition-colors" 
                            onClick={() => {
                              if (sortField === 'amount') {
                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortField('amount');
                                setSortDirection('desc');
                              }
                            }}
                          >
                            <div className="flex items-center">
                              Amount
                              {sortField === 'amount' && (
                                sortDirection === 'asc' ? 
                                <ArrowUp className="h-3.5 w-3.5 ml-1" /> : 
                                <ArrowDown className="h-3.5 w-3.5 ml-1" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left font-medium text-sm cursor-pointer hover:bg-muted/80 transition-colors" 
                            onClick={() => {
                              if (sortField === 'percentage') {
                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortField('percentage');
                                setSortDirection('desc');
                              }
                            }}
                          >
                            <div className="flex items-center">
                              % of Total
                              {sortField === 'percentage' && (
                                sortDirection === 'asc' ? 
                                <ArrowUp className="h-3.5 w-3.5 ml-1" /> : 
                                <ArrowDown className="h-3.5 w-3.5 ml-1" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-4 py-3 text-left font-medium text-sm cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => {
                              if (sortField === 'trend') {
                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortField('trend');
                                setSortDirection('asc');
                              }
                            }}
                          >
                            <div className="flex items-center">
                              Trend
                              {sortField === 'trend' && (
                                sortDirection === 'asc' ? 
                                <ArrowUp className="h-3.5 w-3.5 ml-1" /> : 
                                <ArrowDown className="h-3.5 w-3.5 ml-1" />
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCategories.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                              No data found matching the current filters
                            </td>
                          </tr>
                        ) : (
                          filteredCategories.map((category, index) => (
                            <tr 
                              key={index} 
                              className={`hover:bg-muted/20 ${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}
                            >
                              <td className="px-4 py-3 border-t">
                                {category.category}
                              </td>
                              <td className="px-4 py-3 border-t font-medium">
                                {formatCurrency(category.amount)}
                              </td>
                              <td className="px-4 py-3 border-t">
                                <div className="flex items-center">
                                  <div className="bg-muted h-1.5 w-12 rounded-full overflow-hidden mr-2">
                                    <div 
                                      className={`h-1.5 rounded-full
                                      ${index === 0 ? 'bg-blue-500' : 
                                        index === 1 ? 'bg-green-500' : 
                                        index === 2 ? 'bg-amber-500' : 
                                        index === 3 ? 'bg-purple-500' : 'bg-gray-500'}`
                                      }
                                      style={{ width: `${category.percentage}%` }}
                                    />
                                  </div>
                                  <span>{category.percentage}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 border-t">
                                <div className="flex items-center">
                                  <TrendIcon trend={category.trend} className="mr-1.5" />
                                  <span className={
                                    category.changePercent > 0 ? 'text-red-500' : 
                                    category.changePercent < 0 ? 'text-green-500' : 'text-muted-foreground'
                                  }>
                                    {category.changePercent > 0 ? '+' : ''}{category.changePercent}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <div>
                      Showing {filteredCategories.length} of {spendData.categoryBreakdown.length} categories
                    </div>
                    <div className="flex items-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-7 px-2 flex gap-1"
                        onClick={() => {
                          // Create a CSV 
                          const headers = ['Category', 'Amount', 'Percentage', 'Trend', 'Change'];
                          const rows = filteredCategories.map(cat => [
                            cat.category,
                            formatCurrency(cat.amount),
                            `${cat.percentage}%`,
                            cat.trend,
                            `${cat.changePercent > 0 ? '+' : ''}${cat.changePercent}%`
                          ]);
                          
                          // Create CSV content
                          const csvContent = [
                            headers.join(','),
                            ...rows.map(row => row.join(','))
                          ].join('\n');
                          
                          // Create download
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', 'spend-analysis-data.csv');
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="bg-muted/20 py-3 flex justify-between items-center">
          <div className="flex items-center text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 mr-1.5" />
            Last updated: 22 April 2025
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            <PieChart className="h-3.5 w-3.5 mr-1.5" />
            View Detailed Breakdown
          </Button>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Anomaly Detection - Enhanced */}
        <Card className="border border-muted/30 shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-red-500/5 to-transparent">
            <CardTitle className="flex items-center text-lg">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Anomaly Detection
            </CardTitle>
            <CardDescription className="flex items-center">
              AI-detected unusual spending patterns
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 ml-1.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="w-60 p-3">
                    <p className="text-xs">
                      Anomalies are detected using AI analysis of historical spending patterns, 
                      contract terms, and market conditions. High severity anomalies require 
                      immediate attention.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {spendData.anomalies.map((anomaly) => (
                <div 
                  key={anomaly.id} 
                  className="flex items-start justify-between border-b pb-3 last:border-b-0"
                >
                  <div>
                    <div className="flex items-center">
                      <Badge variant={
                        anomaly.severity === 'high' ? 'destructive' : 
                        anomaly.severity === 'medium' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {anomaly.severity}
                      </Badge>
                    </div>
                    <div className="mt-1.5 text-sm">
                      {anomaly.description}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-medium">
                      {formatCurrency(anomaly.amount)}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-7 px-2.5 mt-1"
                      onClick={() => openAnomalyDetails(anomaly)}
                    >
                      Details
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 py-3 flex justify-between items-center">
            <div className="flex items-center text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-red-500" />
              {spendData.anomalies.length} anomalies detected
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              View All Anomalies
            </Button>
          </CardFooter>
        </Card>

        {/* AI Forecasts - Enhanced */}
        <Card className="border border-muted/30 shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent">
            <CardTitle className="flex items-center text-lg">
              <Lightbulb className="h-5 w-5 text-amber-500 mr-2" />
              AI Spend Forecasts
            </CardTitle>
            <CardDescription className="flex items-center">
              Predictive insights based on procurement patterns
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 ml-1.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="w-60 p-3">
                    <p className="text-xs">
                      AI forecasts are generated by analyzing historical procurement data, 
                      market trends, project schedules, and supplier information. Confidence 
                      scores indicate prediction reliability.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {spendData.aiForecasts.map((forecast) => (
                <div 
                  key={forecast.id} 
                  className="p-3.5 bg-muted/30 rounded-lg relative group overflow-hidden hover:bg-muted/40 transition-colors duration-200"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="flex justify-between">
                    <div className="text-sm pr-2">{forecast.description}</div>
                    <div className="flex flex-col items-end ml-2">
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {forecast.confidence}% confidence
                      </Badge>
                      <div className="flex gap-1 mt-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-7 px-2.5"
                          onClick={() => handleImplementForecast(forecast.id)}
                        >
                          Implement
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-7 px-2.5"
                          onClick={() => openForecastDetails(forecast)}
                        >
                          Details
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 py-3">
            <Button 
              variant="outline" 
              className="w-full text-sm gap-1.5"
              onClick={() => generateForecastReport()}
              disabled={exportInProgress}
            >
              {exportInProgress ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  Generate Detailed Forecast Report
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* GPSMACS Coding Analysis - New Section */}
      <Card className="border border-muted/30 shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent">
          <CardTitle className="flex items-center text-lg">
            <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
            GPSMACS Coding Analysis
          </CardTitle>
          <CardDescription className="flex items-center">
            Procurement spend by GPSMACS coding structure
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 ml-1.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="w-60 p-3">
                  <p className="text-xs">
                    GPSMACS (General, Preliminaries, Subcontractors, Materials, Accommodation, 
                    Controllable, Specialists) is the standard coding structure for construction 
                    procurement and cost tracking.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {spendData.gpsmacsCodes.map((code, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-mono bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded mr-2">
                      {code.code}
                    </span>
                    <span className="text-sm">{code.description}</span>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(code.spend)}
                  </div>
                </div>
                <div className="bg-muted h-1.5 w-full rounded-full overflow-hidden">
                  <div 
                    className="h-1.5 bg-blue-500 rounded-full" 
                    style={{ width: `${code.percentage}%` }} 
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground">{code.percentage}% of total</span>
                  {code.code === 'P.03.04.01' && (
                    <span className="text-xs text-red-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Anomaly detected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 py-3 flex justify-between items-center">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filter by Code
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export Analysis
          </Button>
        </CardFooter>
      </Card>

      {/* Anomaly Details Dialog */}
      <Dialog open={anomalyDialogOpen} onOpenChange={setAnomalyDialogOpen}>
        {selectedAnomaly && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                Anomaly Details
              </DialogTitle>
              <DialogDescription>
                AI-detected spending pattern requiring attention
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="pb-3 border-b">
                <Badge variant={
                  selectedAnomaly.severity === 'high' ? 'destructive' : 
                  selectedAnomaly.severity === 'medium' ? 'secondary' : 'outline'
                }>
                  {selectedAnomaly.severity} priority
                </Badge>
                <h3 className="text-base font-semibold mt-2">{selectedAnomaly.description}</h3>
                <p className="text-sm mt-1 text-muted-foreground">Amount: {formatCurrency(selectedAnomaly.amount)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold">Details</h4>
                <p className="text-sm mt-1">{selectedAnomaly.details}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold flex items-center">
                  <Lightbulb className="h-4 w-4 text-amber-500 mr-1.5" />
                  AI Recommendation
                </h4>
                <p className="text-sm mt-1">{selectedAnomaly.recommendation}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-1.5" />
                  Potential Impact
                </h4>
                <p className="text-sm mt-1">{selectedAnomaly.impact}</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <BellRing className="h-4 w-4" />
                Remind Later
              </Button>
              <Button 
                size="sm" 
                className="gap-1.5"
                onClick={() => handleAnomalyAction(selectedAnomaly.id)}
              >
                <Check className="h-4 w-4" />
                Take Action
              </Button>
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
              <div className="pb-3 border-b">
                <Badge variant="outline">
                  {selectedForecast.confidence}% confidence
                </Badge>
                <h3 className="text-base font-semibold mt-2">{selectedForecast.description}</h3>
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
              <Button 
                size="sm" 
                className="gap-1.5"
                onClick={() => handleImplementForecast(selectedForecast.id)}
              >
                <Check className="h-4 w-4" />
                Implement
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default SpendAnalyticsDashboard;