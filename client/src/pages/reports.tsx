import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ReportGenerator from "@/components/reports/report-generator";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("compensation");
  const [dateRange, setDateRange] = useState("last30");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // For MVP, we'll assume project ID 1
  const projectId = 1;
  
  const handleExport = () => {
    setLoading(true);
    
    // Simulate export process
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Export Successful",
        description: `Your ${getReportTitle()} has been exported as ${exportFormat.toUpperCase()}`,
      });
    }, 2000);
  };
  
  const getReportTitle = () => {
    switch (activeTab) {
      case "compensation":
        return "Compensation Events Summary";
      case "earlywarning":
        return "Early Warnings Log";
      case "programme":
        return "Programme vs Progress Report";
      case "ncr":
        return "Non-Conformance Report";
      case "payment":
        return "Payment Summary";
      default:
        return "Report";
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports & Exports</h1>
        <Button
          onClick={handleExport}
          disabled={loading}
          className="bg-primary hover:bg-blue-800"
        >
          {loading ? (
            <>
              <span className="material-icons animate-spin mr-2">refresh</span>
              Generating...
            </>
          ) : (
            <>
              <span className="material-icons mr-2">download</span>
              Export Report
            </>
          )}
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>
            Configure your report parameters before export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Date Range</label>
              <Select
                value={dateRange}
                onValueChange={setDateRange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7">Last 7 days</SelectItem>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Export Format</label>
              <Select
                value={exportFormat}
                onValueChange={setExportFormat}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV File</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Report Title</label>
              <Input 
                placeholder="Enter custom report title (optional)"
                defaultValue={getReportTitle()}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs 
        defaultValue="compensation" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="compensation">CE Summary</TabsTrigger>
          <TabsTrigger value="earlywarning">Risk Log</TabsTrigger>
          <TabsTrigger value="programme">Programme vs Progress</TabsTrigger>
          <TabsTrigger value="ncr">NCR Report</TabsTrigger>
          <TabsTrigger value="payment">Payment Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="compensation" className="space-y-4">
          <ReportGenerator 
            reportType="compensation" 
            projectId={projectId} 
            dateRange={dateRange} 
          />
        </TabsContent>
        
        <TabsContent value="earlywarning" className="space-y-4">
          <ReportGenerator 
            reportType="earlywarning" 
            projectId={projectId} 
            dateRange={dateRange} 
          />
        </TabsContent>
        
        <TabsContent value="programme" className="space-y-4">
          <ReportGenerator 
            reportType="programme" 
            projectId={projectId} 
            dateRange={dateRange} 
          />
        </TabsContent>
        
        <TabsContent value="ncr" className="space-y-4">
          <ReportGenerator 
            reportType="ncr" 
            projectId={projectId} 
            dateRange={dateRange} 
          />
        </TabsContent>
        
        <TabsContent value="payment" className="space-y-4">
          <ReportGenerator 
            reportType="payment" 
            projectId={projectId} 
            dateRange={dateRange} 
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
