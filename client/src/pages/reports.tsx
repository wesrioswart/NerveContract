import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { FileText, Calendar as CalendarIcon, Download, BarChart3, TrendingUp, AlertTriangle, Clock, Bot } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface ReportSummary {
  period: string;
  type: 'weekly' | 'monthly';
  summary: {
    totalEvents: number;
    totalValue: number;
    riskLevel: 'low' | 'medium' | 'high';
    completionStatus: number;
  };
  metrics: {
    compensationEvents: any;
    earlyWarnings: any;
    rfis: any;
    equipment: any;
    procurement: any;
    programme: any;
  };
}

interface ReportData {
  report: string;
  period: string;
  type: 'weekly' | 'monthly';
  generatedAt: string;
}

export default function Reports() {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [startDate, setStartDate] = useState<Date>(subWeeks(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<ReportData | null>(null);
  const { toast } = useToast();

  // Quick date range presets
  const setQuickRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'last-week':
        setStartDate(startOfWeek(subWeeks(now, 1)));
        setEndDate(endOfWeek(subWeeks(now, 1)));
        setReportType('weekly');
        break;
      case 'this-week':
        setStartDate(startOfWeek(now));
        setEndDate(endOfWeek(now));
        setReportType('weekly');
        break;
      case 'last-month':
        setStartDate(startOfMonth(subMonths(now, 1)));
        setEndDate(endOfMonth(subMonths(now, 1)));
        setReportType('monthly');
        break;
      case 'this-month':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        setReportType('monthly');
        break;
    }
  };

  // Fetch report summary for preview
  const { data: reportSummary, isLoading: summaryLoading } = useQuery({
    queryKey: [`/api/projects/1/report-summary`, reportType, startDate.toISOString(), endDate.toISOString()],
    enabled: startDate && endDate ? true : false,
    queryFn: async () => {
      const params = new URLSearchParams({
        periodType: reportType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      const response = await fetch(`/api/projects/1/report-summary?${params}`);
      const result = await response.json();
      return result.data as ReportSummary;
    }
  });

  // Generate full AI report
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/projects/1/generate-report", {
        periodType: reportType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedReport(data.data);
      toast({
        title: "Report Generated",
        description: `AI ${reportType} report generated successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const downloadReport = () => {
    if (!generatedReport) return;
    
    const blob = new Blob([generatedReport.report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-report-${generatedReport.type}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI-Generated Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive project analysis powered by artificial intelligence
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
          <Bot className="h-4 w-4 mr-1" />
          AI-Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <CardDescription>
              Configure report parameters and generate AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Report Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={(value: 'weekly' | 'monthly') => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Range Buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Ranges</label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuickRange('this-week')}>
                  This Week
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange('last-week')}>
                  Last Week
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange('this-month')}>
                  This Month
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange('last-month')}>
                  Last Month
                </Button>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Custom Date Range</label>
              
              <div className="space-y-2">
                <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) setStartDate(date);
                        setShowStartCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        if (date) setEndDate(date);
                        setShowEndCalendar(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={() => generateReportMutation.mutate()}
              disabled={generateReportMutation.isPending || !startDate || !endDate}
              className="w-full"
            >
              {generateReportMutation.isPending ? (
                <>
                  <Bot className="mr-2 h-4 w-4 animate-spin" />
                  Generating AI Report...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate AI Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview and Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Summary Preview */}
          {reportSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Report Preview - {reportSummary.period}
                </CardTitle>
                <CardDescription>
                  Key metrics overview for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportSummary.summary.totalEvents}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      £{reportSummary.summary.totalValue.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Value</div>
                  </div>
                  <div className="text-center">
                    <Badge className={cn("text-sm", getRiskColor(reportSummary.summary.riskLevel))}>
                      {reportSummary.summary.riskLevel.toUpperCase()} RISK
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">Risk Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {reportSummary.summary.completionStatus.toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Completion</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium mb-1">Compensation Events</div>
                    <div className="text-lg font-bold">{reportSummary.metrics.compensationEvents.total}</div>
                    <div className="text-xs text-muted-foreground">
                      £{reportSummary.metrics.compensationEvents.value.toLocaleString()} value
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium mb-1">Early Warnings</div>
                    <div className="text-lg font-bold">{reportSummary.metrics.earlyWarnings.total}</div>
                    <div className="text-xs text-muted-foreground">
                      {reportSummary.metrics.earlyWarnings.openItems.length} open items
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium mb-1">RFIs</div>
                    <div className="text-lg font-bold">{reportSummary.metrics.rfis.total}</div>
                    <div className="text-xs text-muted-foreground">
                      {reportSummary.metrics.rfis.responseRate.toFixed(1)}% response rate
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium mb-1">Equipment</div>
                    <div className="text-lg font-bold">£{reportSummary.metrics.equipment.totalCost.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {reportSummary.metrics.equipment.activeHires} active hires
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium mb-1">Procurement</div>
                    <div className="text-lg font-bold">£{reportSummary.metrics.procurement.totalValue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {reportSummary.metrics.procurement.orderCount} orders
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium mb-1">Programme</div>
                    <div className="text-lg font-bold">{reportSummary.metrics.programme.completedMilestones}</div>
                    <div className="text-xs text-muted-foreground">
                      {reportSummary.metrics.programme.delayedMilestones} delayed
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Report */}
          {generatedReport && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      AI-Generated {generatedReport.type === 'weekly' ? 'Weekly' : 'Monthly'} Report
                    </CardTitle>
                    <CardDescription>
                      Generated on {format(new Date(generatedReport.generatedAt), "PPP 'at' p")}
                    </CardDescription>
                  </div>
                  <Button onClick={downloadReport} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {generatedReport.report}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}