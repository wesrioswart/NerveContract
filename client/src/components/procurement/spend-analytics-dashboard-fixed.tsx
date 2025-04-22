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
    
    // For logging purposes
    console.log(`Opening detailed breakdown for ${type}`);
  };
  
  // Get detailed breakdown content based on type
  const getDetailedBreakdownContent = () => {
    switch (breakdownType) {
      case 'weekly':
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold mb-3">Weekly Spend Detailed Analysis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comprehensive breakdown of weekly spend patterns with project allocation and cost category analysis.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Project-based analysis */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Spend by Project</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {['Project Alpha', 'Project Beta', 'Project Gamma', 'Other Projects'].map((project, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-xs">{project}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {formatCurrency(Math.round(40000 - i * 8000))}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(35 - i * 7)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Spend by GPSMACS code */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Spend by GPSMACS Code</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {['L.3.400.10', 'G.2.100.30', 'P.1.200.40', 'S.5.300.20'].map((code, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-xs">{code}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {formatCurrency(Math.round(35000 - i * 7000))}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(30 - i * 6)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Anomaly Analysis */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Anomaly Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {spendData.weeklySpend.filter(week => week.hasAnomaly).map((week, i) => (
                        <div key={i} className="flex items-start border-b border-border/40 pb-2">
                          <div className="rounded-full p-1 bg-red-100 mr-2 mt-0.5">
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          </div>
                          <div>
                            <p className="text-xs font-medium">{week.week}: {formatCurrency(week.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {week.week === 'Week 4' 
                                ? 'Unusual spike in material purchases' 
                                : 'Significant deviation from historical pattern'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Time-based Analysis */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Time-based Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Avg. Weekly Spend</span>
                        <span className="text-xs font-medium">{formatCurrency(78500)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Weekly Growth</span>
                        <div className="flex items-center">
                          <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                          <span className="text-xs text-red-500">+8.2%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Peak Day</span>
                        <span className="text-xs font-medium">Wednesday</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Forecast Accuracy</span>
                        <span className="text-xs font-medium">92%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
      case 'monthly':
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold mb-3">Monthly Spend Detailed Analysis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comprehensive breakdown of monthly spend patterns with trend analysis and category insights.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Supplier Analysis */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Top Suppliers</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {['BuildMaster Supplies', 'TechnoConstruct', 'EcoMaterials', 'SafetyFirst'].map((supplier, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-xs">{supplier}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {formatCurrency(Math.round(120000 - i * 25000))}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(32 - i * 6)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Budget vs Actual */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Budget vs Actual</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {spendData.monthlySpend.map((month, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-xs">{month.month}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{formatCurrency(month.amount)}</span>
                            <span className={`text-xs ${
                              i % 2 === 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {i % 2 === 0 ? '-4.2%' : '+7.8%'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Category Trends */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Category Trends</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {['Materials', 'Equipment', 'Labor', 'Services'].map((category, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-xs">{category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {i % 2 === 0 ? 'Increasing' : 'Decreasing'}
                            </span>
                            <span className={`text-xs ${
                              i % 2 === 0 ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {i % 2 === 0 ? '+12%' : '-8%'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Financial Metrics */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Financial Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Monthly Average</span>
                        <span className="text-xs font-medium">{formatCurrency(342500)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">YTD Total</span>
                        <span className="text-xs font-medium">{formatCurrency(2740000)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Forecast Q4</span>
                        <div className="flex items-center">
                          <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                          <span className="text-xs text-red-500">+15.3%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Cost Saving Target</span>
                        <span className="text-xs font-medium">{formatCurrency(180000)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
      case 'category':
      default:
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold mb-3">Category Spend Detailed Analysis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comprehensive breakdown of category-based spend with trend analysis and procurement insights.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Category Details */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {spendData.categoryBreakdown.map((category, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-xs">{category.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {formatCurrency(category.amount)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {category.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Subcategory Analysis */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Subcategory Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {['Concrete Materials', 'Structural Steel', 'Electrical Components', 'HVAC Systems'].map((subcategory, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-xs">{subcategory}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {formatCurrency(Math.round(85000 - i * 15000))}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(22 - i * 4)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Supplier Comparison */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Supplier Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {['BuildMaster', 'EcoMaterials', 'TechnoConstruct', 'SafetyFirst'].map((supplier, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-xs">{supplier}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {formatCurrency(Math.round(65000 - i * 12000))}
                            </span>
                            <span className={`text-xs ${
                              i === 1 || i === 3 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {i === 1 || i === 3 ? '-7.2%' : '+5.8%'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Optimization Opportunities */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Optimization Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-start border-b border-border/40 pb-2">
                        <div className="rounded-full p-1 bg-green-100 mr-2 mt-0.5">
                          <Lightbulb className="h-3 w-3 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">Materials Consolidation</p>
                          <p className="text-xs text-muted-foreground">
                            Potential savings of £45,000 through order consolidation
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start border-b border-border/40 pb-2">
                        <div className="rounded-full p-1 bg-green-100 mr-2 mt-0.5">
                          <Lightbulb className="h-3 w-3 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">Supplier Negotiation</p>
                          <p className="text-xs text-muted-foreground">
                            Identify 3 suppliers for price negotiation based on volume
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="rounded-full p-1 bg-green-100 mr-2 mt-0.5">
                          <Lightbulb className="h-3 w-3 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">Inventory Optimization</p>
                          <p className="text-xs text-muted-foreground">
                            Reduce carrying costs by implementing just-in-time delivery
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
    }
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
                    <SelectContent className="w-[240px]">
                      <div className="px-1 py-1">
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
          )}
          
          {/* Comparison selector */}
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
                
                {/* View Detailed Breakdown Button for Weekly - moved to the right, above the graph */}
                <div className="absolute top-0 right-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-6 bg-primary/10 hover:bg-primary/20 border-primary/20 px-2"
                    onClick={() => openDetailedBreakdown('weekly')}
                  >
                    <PieChart className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </div>
                
                {/* Chart bars - using table layout for perfect column alignment */}
                <div className="relative flex justify-center items-end h-[200px] mt-6 mx-auto" style={{ maxWidth: "800px" }}>
                  {spendData.weeklySpend.map((week, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center mx-2" style={{ width: "80px" }}>
                            <div className="relative" style={{ width: "50px" }}>
                              <div 
                                className={`bg-gradient-to-t from-primary/70 to-primary w-full 
                                  rounded-t hover:brightness-110 transition-all duration-200 
                                  ${week.hasAnomaly ? 'ring-2 ring-red-500 ring-offset-2' : ''}`} 
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
                            <div className="mt-2 text-center" style={{ width: "80px" }}>
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
                            
                            {/* Anomaly Details with Explanation */}
                            {week.hasAnomaly && (
                              <div className="pt-1 mt-1 border-t border-border/30">
                                <p className="text-xs font-medium text-red-500 flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Anomaly Detected:
                                </p>
                                <p className="text-xs text-red-500/90 mt-1">
                                  {week.week === 'Week 4' 
                                    ? "125% increase from previous week. Unusually high spend in materials category." 
                                    : "Unexpected 68% increase from average weekly spend. Labor costs significantly elevated."}
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
                
                {/* Chart bars - using fixed width for perfect column alignment */}
                <div className="relative flex justify-center items-end h-[200px] mt-6 mx-auto" style={{ maxWidth: "800px" }}>
                  {spendData.monthlySpend.map((month, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center mx-2" style={{ width: "90px" }}>
                            <div className="relative" style={{ width: "60px" }}>
                              <div 
                                className={`bg-gradient-to-t from-secondary/70 to-secondary w-full 
                                  rounded-t hover:brightness-110 transition-all duration-200 
                                  ${month.hasAnomaly ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
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
                                  month.month === 'Mar' ? 'text-red-500' : 'text-green-500'
                                } flex items-center`}>
                                  {month.month === 'Mar' ? (
                                    <>
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      8.5% over budget
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      {month.month === 'Jan' ? '3.2' : month.month === 'Feb' ? '4.7' : '2.1'}% under budget
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
                                  {month.month === 'Jan' 
                                    ? "Significant increase in materials category from seasonal average. Potential over-ordering detected." 
                                    : month.month === 'Mar'
                                    ? "Equipment rental costs 35% above forecast without corresponding project activity increase."
                                    : "Unexpected expense pattern in transportation costs - 3x normal volume."}
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
          <div className="mt-12 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Anomalies */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-1.5" />
                Detected Anomalies
              </h3>
              
              {/* Anomalies Summary Section */}
              <div className="mb-4 p-3 bg-red-50/50 border border-red-100 rounded-md">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-1.5 bg-red-500/10 mt-0.5">
                    <AlertOctagon className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-700">Risk Analysis Summary</h4>
                    <p className="text-xs text-red-700/90 mt-1">
                      {resolvedAnomalies.length === 0 ? (
                        <>
                          We've detected {spendData.anomalies.length} irregularities in your procurement data that require 
                          attention. Taking action on these items could prevent approximately £43,200 in unnecessary expenditure.
                        </>
                      ) : (
                        <>
                          Good progress! You've resolved {resolvedAnomalies.length} of {spendData.anomalies.length} detected irregularities. 
                          Taking action on the remaining items could prevent approximately £{resolvedAnomalies.includes(2) ? '18,400' : '43,200'} in unnecessary expenditure.
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 inline-flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        {resolvedAnomalies.length} of {spendData.anomalies.length} issues resolved
                      </span>
                      <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 inline-flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Priority: {spendData.anomalies.filter(a => a.severity === 'high').length} high, {spendData.anomalies.filter(a => a.severity === 'medium').length} medium
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {spendData.anomalies.map((anomaly, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-md p-3 hover:bg-muted/50 
                      cursor-pointer transition-colors ${resolvedAnomalies.includes(anomaly.id) ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'} group`}
                    onClick={() => openAnomalyDetails(anomaly)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center">
                          <div className={`rounded-full p-1 ${
                            anomaly.severity === 'high' 
                              ? 'bg-red-100' 
                              : anomaly.severity === 'medium' 
                                ? 'bg-amber-100' 
                                : 'bg-blue-100'
                          } mr-2`}>
                            <AlertCircle className={`h-3.5 w-3.5 ${
                              anomaly.severity === 'high' 
                                ? 'text-red-500' 
                                : anomaly.severity === 'medium' 
                                  ? 'text-amber-500' 
                                  : 'text-blue-500'
                            }`} />
                          </div>
                          <h4 className="text-sm font-medium group-hover:text-primary/80 transition-colors">{anomaly.title}</h4>
                          <Badge 
                            variant="outline" 
                            className={`ml-2 ${
                              anomaly.severity === 'high' 
                                ? 'text-red-500 border-red-500/50' 
                                : anomaly.severity === 'medium' 
                                  ? 'text-amber-500 border-amber-500/50' 
                                  : 'text-blue-500 border-blue-500/50'
                            }`}
                          >
                            {anomaly.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 ml-8">{anomaly.description}</p>
                      </div>
                      {resolvedAnomalies.includes(anomaly.id) && (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2 ml-8">
                      <span className={`text-xs rounded-full px-2 py-0.5 inline-flex items-center ${
                        anomaly.severity === 'high' 
                          ? 'bg-red-100 text-red-700' 
                          : anomaly.severity === 'medium' 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-blue-100 text-blue-700'
                      }`}>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {anomaly.impact}
                      </span>
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
              
              {/* AI Summary Section */}
              <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-md">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-1.5 bg-blue-500/10 mt-0.5">
                    <BellRing className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-700">Cost Optimization Summary</h4>
                    <p className="text-xs text-blue-700/90 mt-1">
                      Analysis of your procurement data reveals potential savings of approximately £58,600 
                      over the next quarter through implementing the recommendations below. 
                      Priority focus areas: materials consolidation, equipment optimization, and payment terms.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 inline-flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        {implementedForecasts.length} of {spendData.forecasts.length} recommendations implemented
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 inline-flex items-center">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Potential savings: £{Math.floor(26400 + 18300 + (4200*3))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {spendData.forecasts.slice(0, 3).map((forecast, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-md p-3 hover:bg-muted/50 
                      cursor-pointer transition-colors ${
                        implementedForecasts.includes(forecast.id) 
                          ? 'bg-green-500/5 border-green-500/20' 
                          : 'bg-amber-500/5 border-amber-500/20'
                      } group`}
                    onClick={() => openForecastDetails(forecast)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium flex items-center group-hover:text-primary/80 transition-colors">
                          <div className={`rounded-full p-1 ${implementedForecasts.includes(forecast.id) ? 'bg-green-100' : 'bg-amber-100'} mr-2`}>
                            <Lightbulb className={`h-3.5 w-3.5 ${implementedForecasts.includes(forecast.id) ? 'text-green-500' : 'text-amber-500'}`} />
                          </div>
                          {forecast.description}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1.5 ml-8">
                          {forecast.impact}
                        </p>
                      </div>
                      {implementedForecasts.includes(forecast.id) && (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Implemented
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-3 ml-8">
                      <span className={`text-xs rounded-full px-2 py-0.5 inline-flex items-center ${
                        forecast.confidence > 90 
                          ? 'bg-green-100 text-green-700' 
                          : forecast.confidence > 80 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        <Check className="h-3 w-3 mr-1" />
                        {forecast.confidence}% confidence
                      </span>
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
        <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto">
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
            {getDetailedBreakdownContent()}
          </div>
          
          <DialogFooter className="flex justify-between">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => alert('Report exported to PDF')}>
                <Download className="h-4 w-4" />
                Export as PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => alert('Data exported to Excel')}>
                <Table className="h-4 w-4" />
                Export to Excel
              </Button>
            </div>
            <Button size="sm" onClick={() => setDetailedBreakdownOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}