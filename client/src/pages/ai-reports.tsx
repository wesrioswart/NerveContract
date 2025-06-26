import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useProject } from "@/contexts/project-context";
import { 
  FileText, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  Download,
  Loader2,
  BarChart3
} from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import ReactMarkdown from "react-markdown";

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
  };
}

interface ReportData {
  report: string;
  period: string;
  type: 'weekly' | 'monthly';
  generatedAt: string;
}

export default function AIReports() {
  const { currentProject } = useProject();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("generate");
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>('weekly');
  const [customDateRange, setCustomDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('last-week');
  const [generatedReport, setGeneratedReport] = useState<ReportData | null>(null);

  // Quick date presets
  const datePresets = [
    { value: 'last-week', label: 'Last Week', type: 'weekly' as const },
    { value: 'this-week', label: 'This Week', type: 'weekly' as const },
    { value: 'last-month', label: 'Last Month', type: 'monthly' as const },
    { value: 'this-month', label: 'This Month', type: 'monthly' as const },
    { value: 'last-3-months', label: 'Last 3 Months', type: 'monthly' as const },
    { value: 'custom', label: 'Custom Range', type: 'weekly' as const },
  ];

  const getDateRange = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case 'last-week':
        const lastWeekStart = startOfWeek(subWeeks(now, 1));
        const lastWeekEnd = endOfWeek(subWeeks(now, 1));
        return { start: lastWeekStart, end: lastWeekEnd };
      case 'this-week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'last-month':
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));
        return { start: lastMonthStart, end: lastMonthEnd };
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-3-months':
        return { start: startOfMonth(subMonths(now, 3)), end: endOfMonth(subMonths(now, 1)) };
      case 'custom':
        return customDateRange;
      default:
        return { start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) };
    }
  };

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (params: { periodType: 'weekly' | 'monthly', startDate: Date, endDate: Date }) => {
      if (!currentProject) throw new Error('No project selected');
      
      const response = await fetch(`/api/projects/${currentProject.id}/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          periodType: params.periodType,
          startDate: params.startDate.toISOString(),
          endDate: params.endDate.toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedReport(data.data);
      setActiveTab("view");
      toast({
        title: "Report Generated",
        description: "Your AI-powered project report has been generated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive"
      });
    }
  });

  // Report summary query
  const { data: reportSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/projects', currentProject?.id, 'report-summary', periodType, selectedPreset],
    queryFn: async () => {
      if (!currentProject) return null;
      
      const dateRange = getDateRange(selectedPreset);
      if (!dateRange.start || !dateRange.end) return null;

      const params = new URLSearchParams({
        periodType,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      });

      const response = await fetch(`/api/projects/${currentProject.id}/report-summary?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report summary');
      
      const result = await response.json();
      return result.data as ReportSummary;
    },
    enabled: !!currentProject && selectedPreset !== 'custom',
    retry: 1,
    staleTime: 30000
  });

  const handleGenerateReport = () => {
    const dateRange = getDateRange(selectedPreset);
    if (!dateRange.start || !dateRange.end) {
      toast({
        title: "Error",
        description: "Please select a valid date range",
        variant: "destructive"
      });
      return;
    }

    const preset = datePresets.find(p => p.value === selectedPreset);
    const reportType = preset?.type || periodType;

    generateReportMutation.mutate({
      periodType: reportType,
      startDate: dateRange.start,
      endDate: dateRange.end
    });
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  if (!currentProject) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Project Selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please select a project to generate AI-powered reports.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI-Powered Project Reports</h1>
        <p className="text-gray-600 mt-1">Generate comprehensive project analysis with AI insights</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="view">View Report</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Report Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Report Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Report Period</label>
                  <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      {datePresets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPreset === 'custom' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Custom Date Range</label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customDateRange.start ? format(customDateRange.start, "PPP") : "Start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customDateRange.start || undefined}
                            onSelect={(date) => setCustomDateRange(prev => ({ ...prev, start: date || null }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="flex-1">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customDateRange.end ? format(customDateRange.end, "PPP") : "End date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customDateRange.end || undefined}
                            onSelect={(date) => setCustomDateRange(prev => ({ ...prev, end: date || null }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleGenerateReport} 
                  className="w-full"
                  disabled={generateReportMutation.isPending}
                >
                  {generateReportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
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

            {/* Report Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Report Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : reportSummary ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Period</span>
                      <span className="text-sm text-gray-600">{reportSummary.period}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Events</span>
                      <Badge variant="outline">{reportSummary.summary.totalEvents}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Value</span>
                      <span className="text-sm font-medium">£{(reportSummary.summary.totalValue || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Risk Level</span>
                      <Badge variant={getRiskBadgeVariant(reportSummary.summary.riskLevel)}>
                        {reportSummary.summary.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Completion</span>
                      <span className="text-sm text-gray-600">{reportSummary.summary.completionStatus || 0}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-8 w-8 mb-2" />
                    <p>Select a period to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="view" className="space-y-6">
          {generatedReport ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Generated Report</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {generatedReport.type} report for {generatedReport.period}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Generated {format(new Date(generatedReport.generatedAt), "PPP")}
                  </Badge>
                  <Button size="sm" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{generatedReport.report}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Report Generated</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Generate a report from the "Generate Report" tab to view it here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto h-8 w-8 mb-2" />
                <p>Report history feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}