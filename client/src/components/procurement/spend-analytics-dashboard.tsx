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
    { week: 'Week 6', amount: 16200, date: '06 May - 12 May' },
    { week: 'Week 7', amount: 19300, date: '13 May - 19 May', hasAnomaly: true },
    { week: 'Week 8', amount: 15700, date: '20 May - 26 May' },
  ],
  monthlySpend: [
    { month: 'Jan', amount: 42300, year: '2025', change: null },
    { month: 'Feb', amount: 36750, year: '2025', change: -13.1 },
    { month: 'Mar', amount: 51200, year: '2025', change: 39.3 },
    { month: 'Apr', amount: 58900, year: '2025', change: 15.0, hasAnomaly: true },
    { month: 'May', amount: 45200, year: '2025', change: -23.3 },
  ],
  categoryBreakdown: [
    { category: 'Materials', amount: 85600, percentage: 36, trend: 'up', changePercent: 8.2 },
    { category: 'Plant Hire', amount: 62400, percentage: 26, trend: 'down', changePercent: -5.3 },
    { category: 'Subcontractors', amount: 45800, percentage: 19, trend: 'stable', changePercent: 0.8 },
    { category: 'PPE & Safety', amount: 22700, percentage: 9, trend: 'up', changePercent: 12.5, hasAnomaly: true },
    { category: 'Concrete', amount: 15400, percentage: 6, trend: 'up', changePercent: 14.7 },
    { category: 'Other', amount: 9800, percentage: 4, trend: 'stable', changePercent: -0.2 },
  ],
  anomalies: [
    { 
      id: 1, 
      description: 'Unusually high spend on Plant Hire in Week 4',
      severity: 'high',
      amount: 15800,
      details: 'Apex Plant Hire invoice DB-4872 shows rates 22% above contract. Equipment was needed urgently due to unexpected foundation issues, resulting in premium rates being charged.',
      recommendation: 'Review invoice DB-4872 and verify against contract rates. Negotiate retroactive discount based on volume commitment or initiate early contract renewal discussion.',
      impact: 'Potential £45,000 budget overrun by project completion if not addressed. This could affect the contingency fund allocation for other critical project areas.'
    },
    { 
      id: 2, 
      description: 'Duplicate invoice detected for Thurrock Engineering',
      severity: 'medium',
      amount: 3450,
      details: 'Invoices TH-9921 and TH-9924 appear to be for the same delivery of structural materials on April 18th. Both invoices contain identical line items and quantities with minor reference number variations.',
      recommendation: 'Compare invoice details and contact supplier to verify. Put payment on hold pending resolution and update AP procedures to include additional verification steps for this supplier.',
      impact: 'Direct cost impact of £3,450 if duplicate payment is made. Multiple instances of this issue have been detected with this supplier over the past 6 months.'
    },
    { 
      id: 3, 
      description: 'Price increase of 15% on concrete supplies',
      severity: 'low',
      amount: 1200,
      details: 'C&R Concrete applied price increase without prior notification on invoice CR-20250421. The contract stipulates a 30-day notice period for price adjustments.',
      recommendation: 'Check if increase aligns with contract terms or market conditions. Request immediate supplier meeting to discuss compliance with contract notification terms and potential alternatives.',
      impact: 'Cumulative impact of £12,800 over remaining project duration. May need to explore alternative suppliers or negotiate stepped increase to manage budget impact.'
    },
    { 
      id: 4, 
      description: 'Unusual PPE expenditure pattern detected',
      severity: 'medium',
      amount: 5700,
      details: 'Safety equipment purchases have increased 47% in Week 7 compared to previous 6-week average without corresponding increase in staffing levels. Large orders placed with non-preferred suppliers.',
      recommendation: 'Audit PPE inventory levels and check for potential overordering or diversion. Implement additional approval steps for non-preferred supplier purchases.',
      impact: 'Current pattern suggests potential annual impact of £41,000 in excess purchases if not addressed promptly.'
    },
    { 
      id: 5, 
      description: 'Multiple small purchases below approval threshold',
      severity: 'low',
      amount: 1950,
      details: 'Pattern of small electrical component purchases just below £500 approval threshold from same supplier (Jenkins Electrical) over consecutive days, potentially circumventing procurement policy.',
      recommendation: 'Consolidate electrical materials purchasing through framework agreement and implement cumulative approval thresholds.',
      impact: 'Current approach increases administrative costs by approximately £300 per transaction and eliminates bulk purchase discounts.'
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
    {
      code: '5204',
      description: 'SITE SECURITY',
      spend: 12800,
      trend: 'up',
      insight: 'Weekend coverage costs increased significantly',
      recommendation: 'Review requirement for 24/7 coverage during non-critical phases'
    },
    {
      code: '5330',
      description: 'SAFETY EQUIPMENT',
      spend: 22700,
      trend: 'up',
      insight: 'Unusual purchasing pattern detected',
      recommendation: 'Implement enhanced inventory tracking system'
    },
  ],
  aiForecasts: [
    {
      id: 1,
      description: 'Based on current trends, expect 15-20% increase in material costs next month',
      confidence: 85,
      details: 'Analysis of supplier notifications, market indices, and historical patterns indicate rising material costs. Three major suppliers have signaled price increases between 12-22% due to raw material shortages and transportation cost increases.',
      recommendation: 'Consider accelerating material purchases for critical path items. Explore fixed-price agreements for critical materials needed in months 6-9 of the project timeline.',
      impact: 'Potential savings of £28,500 if action taken before June 1st. Early purchasing would also mitigate potential schedule impacts from material delays.'
    },
    {
      id: 2,
      description: 'Plant hire spending likely to decrease as project moves to next phase',
      confidence: 72,
      details: 'Project schedule analysis shows reduced heavy equipment requirements starting week 8. Excavation and foundation work is 87% complete, with structural and fit-out phases beginning in Week 9.',
      recommendation: 'Review plant hire agreements and terminate unnecessary rentals. Implement 7-day notification system with site management to flag equipment that will no longer be needed.',
      impact: 'Projected savings of £14,200 over next 6 weeks. Additional benefits include reduced fuel costs and site congestion improvements.'
    },
    {
      id: 3,
      description: 'Potential savings of £12,500 identified through supplier consolidation',
      confidence: 90,
      details: 'Current procurement spread across 14 suppliers where 7 could fulfill all requirements. Analysis shows 3 suppliers (BuildCorp, Apex Materials, and Northern Supplies) could handle 72% of all purchases with existing framework agreements.',
      recommendation: 'Consolidate consumables purchasing to preferred suppliers with better rates. Create standardized ordering schedule for predictable materials to improve supplier planning ability.',
      impact: 'Additional benefits include reduced admin overhead and improved delivery reliability. Consolidated invoicing would reduce AP processing by approximately 60 hours per month.'
    },
    {
      id: 4,
      description: 'Concrete pricing expected to stabilize in Q3',
      confidence: 78,
      details: 'Market analysis shows new production capacity coming online in July 2025. Current supply constraints driving price volatility should ease with three major suppliers expanding production.',
      recommendation: 'For non-urgent concrete work, consider scheduling for Q3 when possible. Maintain minimum essential purchasing until July price corrections.',
      impact: 'Strategic scheduling could yield 8-12% savings on concrete expenditure, approximately £24,000 for remainder of project.'
    },
    {
      id: 5,
      description: 'Framework agreement opportunity with safety equipment suppliers',
      confidence: 88,
      details: 'Current PPE purchasing patterns show high variability in supplier selection and pricing. Volume-based framework agreement potential identified with SafetyFirst and ProGuard suppliers.',
      recommendation: 'Initiate negotiations for 24-month framework agreement with consolidated suppliers. Set minimum inventory levels to prevent rush orders.',
      impact: 'Projected 22% reduction in safety equipment expenditure through standardization and volume pricing, with annual savings of approximately £32,000 across all active projects.'
    },
  ],
  gpsmacsCodes: [
    { code: 'G.01.02.01', description: 'Earthworks', spend: 24500, percentage: 10 },
    { code: 'P.03.04.01', description: 'Plant - Excavators', spend: 35800, percentage: 15 },
    { code: 'S.02.01.03', description: 'Steel Reinforcement', spend: 48200, percentage: 20 },
    { code: 'M.01.03.02', description: 'Concrete Supply', spend: 36700, percentage: 15 },
    { code: 'A.01.02.01', description: 'Professional Services', spend: 19800, percentage: 8 },
    { code: 'S.03.05.02', description: 'Electrical Contractors', spend: 22100, percentage: 9 },
    { code: 'M.02.04.03', description: 'Timber & Formwork', spend: 18400, percentage: 8 },
    { code: 'C.01.01.01', description: 'Various Materials', spend: 36500, percentage: 15 }
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
  
  const [detailedBreakdownOpen, setDetailedBreakdownOpen] = useState(false);
  const [breakdownType, setBreakdownType] = useState<'weekly' | 'monthly' | 'category'>('monthly');
  
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
  
  // Implementation tracking
  const [implementedForecasts, setImplementedForecasts] = useState<number[]>([]);
  const [resolvedAnomalies, setResolvedAnomalies] = useState<number[]>([]);
  
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
                              className={`bg-gradient-to-t from-secondary/80 to-secondary w-16 
                                rounded-t-sm hover:brightness-110 transition-all duration-200 
                                group-hover:shadow-md ${month.hasAnomaly ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}
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
              {spendData.anomalies.map((anomaly) => {
                const isResolved = resolvedAnomalies.includes(anomaly.id);
                return (
                  <div 
                    key={anomaly.id} 
                    className={`flex items-start justify-between border-b pb-3 last:border-b-0 ${
                      isResolved ? 'bg-green-50 dark:bg-green-950/30 rounded-md px-3 py-2 -mx-3 -my-2' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center">
                        <Badge variant={
                          isResolved ? 'outline' :
                          anomaly.severity === 'high' ? 'destructive' : 
                          anomaly.severity === 'medium' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {isResolved ? 'Resolved' : anomaly.severity}
                        </Badge>
                        
                        {isResolved && (
                          <span className="text-xs text-green-600 dark:text-green-400 ml-2 flex items-center">
                            <Check className="h-3 w-3 mr-0.5" />
                            Action taken
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 text-sm">
                        {anomaly.description}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-medium flex items-center">
                        {formatCurrency(anomaly.amount)}
                      </div>
                      <div className="flex mt-1 gap-1">
                        {isResolved ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7 px-2.5"
                            onClick={() => handleUndoAnomalyResolution(anomaly.id)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Undo
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs h-7 px-2.5"
                            onClick={() => handleAnomalyAction(anomaly.id)}
                          >
                            Resolve
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-7 px-2.5"
                          onClick={() => openAnomalyDetails(anomaly)}
                        >
                          Details
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 py-3 flex justify-between items-center">
            <div className="flex items-center text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-red-500" />
              {spendData.anomalies.length - resolvedAnomalies.length} active anomalies
              {resolvedAnomalies.length > 0 && (
                <span className="ml-2 flex items-center text-green-600 dark:text-green-400">
                  <Check className="h-3 w-3 mr-0.5" />
                  {resolvedAnomalies.length} resolved
                </span>
              )}
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
              {spendData.aiForecasts.map((forecast) => {
                const isImplemented = implementedForecasts.includes(forecast.id);
                return (
                  <div 
                    key={forecast.id} 
                    className={`p-3.5 rounded-lg relative group overflow-hidden transition-colors duration-200 ${
                      isImplemented 
                        ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900' 
                        : 'bg-muted/30 hover:bg-muted/40'
                    }`}
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Implementation status badge */}
                    {isImplemented && (
                      <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 text-[10px] px-1.5">
                        <Check className="h-2.5 w-2.5 mr-0.5" />
                        Implemented
                      </Badge>
                    )}
                    
                    <div className="flex justify-between">
                      <div className="text-sm pr-2">{forecast.description}</div>
                      <div className="flex flex-col items-end ml-2">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {forecast.confidence}% confidence
                        </Badge>
                        <div className="flex gap-1 mt-1.5">
                          {isImplemented ? (
                            <Button 
                              variant="outline"
                              size="sm" 
                              className="text-xs h-7 px-2.5"
                              onClick={() => handleUndoForecastImplementation(forecast.id)}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Undo
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost"
                              size="sm" 
                              className="text-xs h-7 px-2.5"
                              onClick={() => handleImplementForecast(forecast.id)}
                            >
                              Implement
                            </Button>
                          )}
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
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 py-3">
            <div className="w-full space-y-2">
              <div className="flex items-center justify-center text-xs mb-1 text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                {implementedForecasts.length > 0 ? (
                  <span>
                    {implementedForecasts.length} of {spendData.aiForecasts.length} forecasts implemented
                  </span>
                ) : (
                  <span>
                    {spendData.aiForecasts.length} forecasts available
                  </span>
                )}
              </div>
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
            </div>
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
              <div className="pb-3 border-b flex items-start justify-between">
                <div>
                  <Badge variant={
                    selectedAnomaly.severity === 'high' ? 'destructive' : 
                    selectedAnomaly.severity === 'medium' ? 'secondary' : 'outline'
                  }>
                    {selectedAnomaly.severity} priority
                  </Badge>
                  <h3 className="text-base font-semibold mt-2">{selectedAnomaly.description}</h3>
                  <p className="text-sm mt-1 text-muted-foreground">Amount: {formatCurrency(selectedAnomaly.amount)}</p>
                </div>
                
                {resolvedAnomalies.includes(selectedAnomaly.id) && (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Resolved
                  </Badge>
                )}
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
          
          <div className="py-4">
            <Tabs defaultValue="data" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="data">Data Table</TabsTrigger>
                <TabsTrigger value="chart">Enhanced Chart</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
              </TabsList>
              
              <TabsContent value="data" className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">
                          {breakdownType === 'weekly' ? 'Week' : 
                           breakdownType === 'monthly' ? 'Month' : 'Category'}
                        </th>
                        <th className="px-4 py-3 text-left font-medium">Amount</th>
                        <th className="px-4 py-3 text-left font-medium">
                          {breakdownType === 'weekly' || breakdownType === 'monthly' ? 'Date Range' : '% of Total'}
                        </th>
                        <th className="px-4 py-3 text-left font-medium">Change</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdownType === 'weekly' && spendData.weeklySpend.map((item, index) => (
                        <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}>
                          <td className="px-4 py-3 border-t">{item.week}</td>
                          <td className="px-4 py-3 border-t font-medium">{formatCurrency(item.amount)}</td>
                          <td className="px-4 py-3 border-t">{item.date}</td>
                          <td className="px-4 py-3 border-t">
                            {index > 0 ? (
                              <span className={`inline-flex items-center ${
                                item.amount > spendData.weeklySpend[index-1].amount ? 'text-red-500' : 'text-green-500'
                              }`}>
                                {item.amount > spendData.weeklySpend[index-1].amount ? (
                                  <><TrendingUp className="h-3.5 w-3.5 mr-1" />+{(((item.amount - spendData.weeklySpend[index-1].amount) / spendData.weeklySpend[index-1].amount) * 100).toFixed(1)}%</>
                                ) : (
                                  <><TrendingDown className="h-3.5 w-3.5 mr-1" />{(((item.amount - spendData.weeklySpend[index-1].amount) / spendData.weeklySpend[index-1].amount) * 100).toFixed(1)}%</>
                                )}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 border-t">
                            {item.hasAnomaly ? (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Anomaly
                              </Badge>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                      
                      {breakdownType === 'monthly' && spendData.monthlySpend.map((item, index) => (
                        <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}>
                          <td className="px-4 py-3 border-t">{item.month} {item.year}</td>
                          <td className="px-4 py-3 border-t font-medium">{formatCurrency(item.amount)}</td>
                          <td className="px-4 py-3 border-t">Full month</td>
                          <td className="px-4 py-3 border-t">
                            {item.change !== null ? (
                              <span className={`inline-flex items-center ${
                                item.change > 0 ? 'text-red-500' : 'text-green-500'
                              }`}>
                                {item.change > 0 ? (
                                  <><TrendingUp className="h-3.5 w-3.5 mr-1" />+{item.change}%</>
                                ) : (
                                  <><TrendingDown className="h-3.5 w-3.5 mr-1" />{item.change}%</>
                                )}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 border-t">
                            {item.hasAnomaly ? (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Anomaly
                              </Badge>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                      
                      {breakdownType === 'category' && spendData.categoryBreakdown.map((item, index) => (
                        <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}>
                          <td className="px-4 py-3 border-t">{item.category}</td>
                          <td className="px-4 py-3 border-t font-medium">{formatCurrency(item.amount)}</td>
                          <td className="px-4 py-3 border-t">{item.percentage}%</td>
                          <td className="px-4 py-3 border-t">
                            <span className={`inline-flex items-center ${
                              item.changePercent > 0 ? 'text-red-500' : 
                              item.changePercent < 0 ? 'text-green-500' : 'text-muted-foreground'
                            }`}>
                              {item.changePercent > 0 ? (
                                <><TrendingUp className="h-3.5 w-3.5 mr-1" />+{item.changePercent}%</>
                              ) : item.changePercent < 0 ? (
                                <><TrendingDown className="h-3.5 w-3.5 mr-1" />{item.changePercent}%</>
                              ) : (
                                <><ArrowRight className="h-3.5 w-3.5 mr-1" />0%</>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-t">
                            {item.hasAnomaly ? (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Anomaly
                              </Badge>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="chart" className="space-y-4">
                <div className="bg-muted/20 p-4 rounded-md border">
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Enhanced chart visualization would appear here</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="insights" className="space-y-4">
                <div className="bg-gradient-to-r from-amber-500/5 to-amber-500/10 p-4 rounded-md border">
                  <div className="flex items-start gap-3 mb-4">
                    <Lightbulb className="h-6 w-6 text-amber-500 mt-0.5" />
                    <div>
                      <h3 className="text-base font-medium mb-1">AI Spend Pattern Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        {breakdownType === 'weekly' && 'Weekly spend patterns show fluctuations with peak spending in Week 4.'}
                        {breakdownType === 'monthly' && 'Monthly spend analysis shows increasing trend with a peak in April 2025.'}
                        {breakdownType === 'category' && 'Materials and Plant Hire dominate spend, representing 62% of total procurement.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium mb-2">Key Observations:</h4>
                    <ul className="space-y-2">
                      {breakdownType === 'weekly' && (
                        <>
                          <li className="text-sm flex items-start">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 shrink-0" />
                            <span>Weekly spend anomalies detected in Week 4 and Week 7 indicate possible procurement policy issues</span>
                          </li>
                          <li className="text-sm flex items-start">
                            <TrendingUp className="h-4 w-4 text-primary mt-0.5 mr-2 shrink-0" />
                            <span>Plant hire spend shows 22% variance from standard rates in Week 4</span>
                          </li>
                          <li className="text-sm flex items-start">
                            <DollarSign className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
                            <span>Opportunity to reduce weekly spend by approximately £3,400 through improved scheduling</span>
                          </li>
                        </>
                      )}
                      
                      {breakdownType === 'monthly' && (
                        <>
                          <li className="text-sm flex items-start">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 shrink-0" />
                            <span>April 2025 shows 15% increase over baseline with anomalous spending pattern</span>
                          </li>
                          <li className="text-sm flex items-start">
                            <TrendingUp className="h-4 w-4 text-primary mt-0.5 mr-2 shrink-0" />
                            <span>February-March transition shows 39.3% increase - likely due to project phase shift</span>
                          </li>
                          <li className="text-sm flex items-start">
                            <DollarSign className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
                            <span>May shows promising 23.3% reduction - suggests effectiveness of recent cost controls</span>
                          </li>
                        </>
                      )}
                      
                      {breakdownType === 'category' && (
                        <>
                          <li className="text-sm flex items-start">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 shrink-0" />
                            <span>PPE & Safety spending shows concerning 12.5% increase without corresponding staffing changes</span>
                          </li>
                          <li className="text-sm flex items-start">
                            <TrendingUp className="h-4 w-4 text-primary mt-0.5 mr-2 shrink-0" />
                            <span>Materials spending consistently trending upward at 8.2%, above market rate increases of 5.4%</span>
                          </li>
                          <li className="text-sm flex items-start">
                            <DollarSign className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
                            <span>Plant Hire shows promising 5.3% decrease, suggesting optimization efforts are effective</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter className="space-x-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button size="sm" className="gap-1.5">
              <Check className="h-4 w-4" />
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpendAnalyticsDashboard;