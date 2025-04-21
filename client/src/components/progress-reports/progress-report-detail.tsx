import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { AlertTriangle, ArrowUpCircle, Calendar, CheckCircle, ChevronLeft, Clock, Download, InfoIcon, Printer, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Link } from "wouter";
import html2pdf from "html2pdf.js";
import { useToast } from "@/hooks/use-toast";

interface ProgressReport {
  id: number;
  title: string;
  reportDate: string;
  reportPeriodStart: string;
  reportPeriodEnd: string;
  overallProgress: number;
  statusColor: 'green' | 'amber' | 'red';
  overallSummary: string;
  forecastCompletion?: string;
  contractCompletion?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  aiSummary?: string;
  sectionProgress?: Array<{
    section: string;
    team: string;
    percentComplete: number;
    issues: string;
    nextWeekFocus: string;
  }>;
  risksAndEarlyWarnings?: Array<{
    riskId: string;
    description: string;
    status: string;
    mitigation: string;
    registerLink: string;
  }>;
  compensationEvents?: Array<{
    ceRef: string;
    description: string;
    status: string;
    costImpact: number;
    timeImpact: number;
    affectedSection: string;
  }>;
  issuesAndQueries?: Array<{
    ref: string;
    type: string;
    description: string;
    section: string;
    status: string;
    raisedDate: string;
  }>;
}

export function ProgressReportDetail() {
  const { id } = useParams<{ id: string }>();
  const reportId = parseInt(id || "0");
  const { toast } = useToast();
  
  const {
    data: report,
    isLoading,
    error
  } = useQuery<ProgressReport>({
    queryKey: ['/api/progress-reports', reportId],
    enabled: !!reportId && !isNaN(reportId)
  });

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-500 text-white';
      case 'amber': return 'bg-amber-500 text-white';
      case 'red': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getProgressIcon = (progress: number, color: 'green' | 'amber' | 'red') => {
    if (color === 'red') return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (color === 'amber') return <ArrowUpCircle className="h-5 w-5 text-amber-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: `Progress-Report-${report?.title || "Report"}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    toast({
      title: "Generating PDF",
      description: "Your PDF is being generated, please wait...",
    });
    
    html2pdf().set(opt).from(element).save().then(() => {
      toast({
        title: "PDF Generated",
        description: "Your PDF has been downloaded successfully.",
      });
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Error Loading Progress Report
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {error instanceof Error ? error.message : "Report not found or an unknown error occurred"}
        </p>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{report.title}</h1>
          <Badge className={getStatusColor(report.statusColor)}>
            {report.overallProgress.toFixed(1)}% Complete
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>
      
      <div id="report-content" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Overall Progress Summary</span>
              <div className="flex items-center gap-3 text-sm font-normal">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>Report Date: {format(new Date(report.reportDate), 'PPP')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Period: {format(new Date(report.reportPeriodStart), 'PP')} - {format(new Date(report.reportPeriodEnd), 'PP')}</span>
                </div>
              </div>
            </CardTitle>
            <CardDescription>
              Project status overview and key metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-2/3">
                <div className="flex items-center gap-2 mb-4">
                  {getProgressIcon(report.overallProgress, report.statusColor)}
                  <span className="font-medium text-lg">{report.overallSummary}</span>
                </div>
                
                {report.aiSummary && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                      <InfoIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">AI Analysis</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {report.aiSummary}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="w-full md:w-1/3 border-l pl-6">
                <h3 className="text-sm font-medium mb-2 text-gray-500">Key Dates</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Contract Completion:</span>
                    <span className="font-medium">
                      {report.contractCompletion ? format(new Date(report.contractCompletion), 'PP') : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Forecast Completion:</span>
                    <span className="font-medium">
                      {report.forecastCompletion ? format(new Date(report.forecastCompletion), 'PP') : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Overall Progress:</span>
                    <span className="font-medium">{report.overallProgress.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="sections">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="sections">Sections/Phases</TabsTrigger>
            <TabsTrigger value="risks">Risks & EW</TabsTrigger>
            <TabsTrigger value="ces">CEs</TabsTrigger>
            <TabsTrigger value="issues">Issues & Queries</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sections" className="space-y-4 pt-4">
            {report.sectionProgress && report.sectionProgress.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section/Phase</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>% Complete</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Focus Next Week</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.sectionProgress.map((section, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{section.section}</TableCell>
                      <TableCell>{section.team}</TableCell>
                      <TableCell>{section.percentComplete}%</TableCell>
                      <TableCell>{section.issues}</TableCell>
                      <TableCell>{section.nextWeekFocus}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 border rounded-lg">
                <p className="text-gray-500">No section breakdown data available</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="risks" className="space-y-4 pt-4">
            {report.risksAndEarlyWarnings && report.risksAndEarlyWarnings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mitigation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.risksAndEarlyWarnings.map((risk, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{risk.riskId}</TableCell>
                      <TableCell>{risk.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant={risk.status === "Open" ? "destructive" : 
                                 risk.status === "Mitigated" ? "outline" : "default"}
                        >
                          {risk.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{risk.mitigation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 border rounded-lg">
                <p className="text-gray-500">No risks or early warnings data available</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="ces" className="space-y-4 pt-4">
            {report.compensationEvents && report.compensationEvents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CE Ref</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost Impact</TableHead>
                    <TableHead>Time Impact</TableHead>
                    <TableHead>Affected Section</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.compensationEvents.map((ce, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{ce.ceRef}</TableCell>
                      <TableCell>{ce.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant={ce.status === "Quotation Due" ? "outline" : 
                                 ce.status === "Implemented" ? "default" :
                                 ce.status === "Accepted" ? "default" : "secondary"}
                        >
                          {ce.status}
                        </Badge>
                      </TableCell>
                      <TableCell>£{ce.costImpact.toLocaleString()}</TableCell>
                      <TableCell>{ce.timeImpact} days</TableCell>
                      <TableCell>{ce.affectedSection}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 border rounded-lg">
                <p className="text-gray-500">No compensation events data available</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="issues" className="space-y-4 pt-4">
            {report.issuesAndQueries && report.issuesAndQueries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Raised Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.issuesAndQueries.map((issue, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{issue.ref}</TableCell>
                      <TableCell>{issue.type}</TableCell>
                      <TableCell>{issue.description}</TableCell>
                      <TableCell>{issue.section}</TableCell>
                      <TableCell>
                        <Badge
                          variant={issue.status === "Open" ? "outline" : 
                                 issue.status === "Closed" ? "default" : "secondary"}
                        >
                          {issue.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{issue.raisedDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 border rounded-lg">
                <p className="text-gray-500">No issues or queries data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <Card>
          <CardFooter className="flex justify-between text-xs text-gray-500 pt-4">
            <div>
              Created: {format(new Date(report.createdAt), 'PPP p')}
            </div>
            <div>
              Last Updated: {format(new Date(report.updatedAt), 'PPP p')}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}