import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ReportGenerator from "@/components/reports/report-generator";
import { Download, FileType } from "lucide-react";

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Reports & Exports</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => {
              window.print();
            }}
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
          
          <Button
            onClick={handleExport}
            disabled={loading}
            size="sm"
            className="bg-primary hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <FileType className="h-4 w-4 mr-1" />
                Export Report
              </>
            )}
          </Button>
        </div>
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
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="compensation" className="mb-2 sm:mb-0">CE Summary</TabsTrigger>
          <TabsTrigger value="earlywarning" className="mb-2 sm:mb-0">Risk Log</TabsTrigger>
          <TabsTrigger value="programme" className="mb-2 sm:mb-0">Programme</TabsTrigger>
          <TabsTrigger value="ncr" className="mb-2 sm:mb-0">NCR Report</TabsTrigger>
          <TabsTrigger value="payment" className="mb-2 sm:mb-0">Payment</TabsTrigger>
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
