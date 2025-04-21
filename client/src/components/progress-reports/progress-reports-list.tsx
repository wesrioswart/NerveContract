import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, AlertTriangle, ArrowUpCircle, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectContext } from "@/contexts/project-context";
import { ProgressReportModal } from "./progress-report-modal";
import { format } from "date-fns";

interface ProgressReport {
  id: number;
  title: string;
  reportDate: string;
  overallProgress: number;
  statusColor: 'green' | 'amber' | 'red';
  overallSummary: string;
  aiSummary?: string;
}

export function ProgressReportsList() {
  const { projectId } = useProjectContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const {
    data: progressReports,
    isLoading,
    error
  } = useQuery<ProgressReport[]>({
    queryKey: ['/api/projects', projectId, 'progress-reports'],
    enabled: !!projectId
  });

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Progress Reports</h2>
          <Skeleton className="h-10 w-36" />
        </div>
        {[1, 2, 3].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Error Loading Progress Reports
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Progress Reports</h2>
        <Button onClick={handleOpenModal} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>New Report</span>
        </Button>
      </div>

      {progressReports && progressReports.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {progressReports.map((report) => (
            <Link key={report.id} href={`/progress-reports/${report.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {report.title}
                    </CardTitle>
                    <CardDescription>
                      Date: {format(new Date(report.reportDate), 'PPP')}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(report.statusColor)}>
                    {report.overallProgress.toFixed(1)}% Complete
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    {getProgressIcon(report.overallProgress, report.statusColor)}
                    <span className="font-medium">{report.overallSummary}</span>
                  </div>
                  {report.aiSummary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      {report.aiSummary}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-lg bg-gray-50 dark:bg-gray-900">
          <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <h3 className="text-lg font-medium mb-1">No progress reports yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first progress report to track project status
          </p>
          <Button onClick={handleOpenModal} variant="outline">
            Create Progress Report
          </Button>
        </div>
      )}

      {isModalOpen && (
        <ProgressReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          projectId={projectId || 0}
        />
      )}
    </div>
  );
}