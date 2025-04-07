import { useQuery } from "@tanstack/react-query";
import { CompensationEvent, EarlyWarning, NonConformanceReport, ProgrammeMilestone, PaymentCertificate } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ReportGeneratorProps = {
  reportType: "compensation" | "earlywarning" | "programme" | "ncr" | "payment";
  projectId: number;
  dateRange: string;
};

export default function ReportGenerator({ reportType, projectId, dateRange }: ReportGeneratorProps) {
  // Fetch data based on report type
  const { data: compensationEvents = [], isLoading: ceLoading } = useQuery<CompensationEvent[]>({
    queryKey: [`/api/projects/${projectId}/compensation-events`],
    enabled: reportType === "compensation",
  });

  const { data: earlyWarnings = [], isLoading: ewLoading } = useQuery<EarlyWarning[]>({
    queryKey: [`/api/projects/${projectId}/early-warnings`],
    enabled: reportType === "earlywarning",
  });

  const { data: nonConformanceReports = [], isLoading: ncrLoading } = useQuery<NonConformanceReport[]>({
    queryKey: [`/api/projects/${projectId}/non-conformance-reports`],
    enabled: reportType === "ncr",
  });

  const { data: programmeMilestones = [], isLoading: pmLoading } = useQuery<ProgrammeMilestone[]>({
    queryKey: [`/api/projects/${projectId}/programme-milestones`],
    enabled: reportType === "programme",
  });

  const { data: paymentCertificates = [], isLoading: pcLoading } = useQuery<PaymentCertificate[]>({
    queryKey: [`/api/projects/${projectId}/payment-certificates`],
    enabled: reportType === "payment",
  });

  // Determine if any data is loading
  const isLoading = ceLoading || ewLoading || ncrLoading || pmLoading || pcLoading;
  
  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col justify-center items-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-gray-500">Loading report data...</span>
        </div>
      );
    }
    
    switch (reportType) {
      case "compensation":
        return renderCompensationReport(compensationEvents as CompensationEvent[]);
      case "earlywarning":
        return renderEarlyWarningReport(earlyWarnings as EarlyWarning[]);
      case "programme":
        return renderProgrammeReport(programmeMilestones as ProgrammeMilestone[]);
      case "ncr":
        return renderNCRReport(nonConformanceReports as NonConformanceReport[]);
      case "payment":
        return renderPaymentReport(paymentCertificates as PaymentCertificate[]);
    }
  };
  
  const renderCompensationReport = (data: CompensationEvent[]) => {
    const totalValue = data.reduce((sum, ce) => sum + (ce.actualValue || ce.estimatedValue || 0), 0);
    const implementedCount = data.filter(ce => ce.status === "Implemented" || ce.status === "Accepted").length;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Total CEs</p>
            <p className="text-2xl font-bold">{data.length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Implemented</p>
            <p className="text-2xl font-bold text-green-700">{implementedCount}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{data.length - implementedCount}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">REFERENCE</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">TITLE</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">STATUS</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">RAISED</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">VALUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((ce) => (
                <tr key={ce.id}>
                  <td className="py-2 px-3 text-sm">{ce.reference}</td>
                  <td className="py-2 px-3 text-sm">{ce.title}</td>
                  <td className="py-2 px-3 text-sm">{ce.status}</td>
                  <td className="py-2 px-3 text-sm">{formatDate(ce.raisedAt, "dd MMM yyyy")}</td>
                  <td className="py-2 px-3 text-sm">{formatCurrency(ce.actualValue || ce.estimatedValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderEarlyWarningReport = (data: EarlyWarning[]) => {
    const openCount = data.filter(ew => ew.status === "Open").length;
    const mitigatedCount = data.filter(ew => ew.status === "Mitigated").length;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Total Warnings</p>
            <p className="text-2xl font-bold">{data.length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Open</p>
            <p className="text-2xl font-bold text-amber-600">{openCount}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Mitigated</p>
            <p className="text-2xl font-bold text-green-700">{mitigatedCount}</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">REFERENCE</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">DESCRIPTION</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">STATUS</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">RAISED</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">MITIGATION PLAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((ew) => (
                <tr key={ew.id}>
                  <td className="py-2 px-3 text-sm">{ew.reference}</td>
                  <td className="py-2 px-3 text-sm">{ew.description}</td>
                  <td className="py-2 px-3 text-sm">{ew.status}</td>
                  <td className="py-2 px-3 text-sm">{formatDate(ew.raisedAt, "dd MMM yyyy")}</td>
                  <td className="py-2 px-3 text-sm">{ew.mitigationPlan || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderProgrammeReport = (data: ProgrammeMilestone[]) => {
    const completedCount = data.filter(ms => ms.status === "Completed").length;
    const delayedCount = data.filter(ms => ms.delayDays && ms.delayDays > 0).length;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Total Milestones</p>
            <p className="text-2xl font-bold">{data.length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-700">{completedCount}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Delayed</p>
            <p className="text-2xl font-bold text-amber-600">{delayedCount}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">% Complete</p>
            <p className="text-2xl font-bold">{data.length > 0 ? Math.round((completedCount / data.length) * 100) : 0}%</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">MILESTONE</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">PLANNED DATE</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">ACTUAL DATE</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">STATUS</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">DELAY (DAYS)</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">REASON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((ms) => (
                <tr key={ms.id}>
                  <td className="py-2 px-3 text-sm">{ms.name}</td>
                  <td className="py-2 px-3 text-sm">{formatDate(ms.plannedDate, "dd MMM yyyy")}</td>
                  <td className="py-2 px-3 text-sm">{ms.actualDate ? formatDate(ms.actualDate, "dd MMM yyyy") : "-"}</td>
                  <td className="py-2 px-3 text-sm">{ms.status}</td>
                  <td className="py-2 px-3 text-sm">{ms.delayDays || "-"}</td>
                  <td className="py-2 px-3 text-sm">{ms.delayReason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderNCRReport = (data: NonConformanceReport[]) => {
    const openCount = data.filter(ncr => ncr.status === "Open").length;
    const closedCount = data.filter(ncr => ncr.status === "Closed").length;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Total NCRs</p>
            <p className="text-2xl font-bold">{data.length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Open</p>
            <p className="text-2xl font-bold text-amber-600">{openCount}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Closed</p>
            <p className="text-2xl font-bold text-green-700">{closedCount}</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">REFERENCE</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">DESCRIPTION</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">LOCATION</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">STATUS</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">RAISED</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">CORRECTIVE ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((ncr) => (
                <tr key={ncr.id}>
                  <td className="py-2 px-3 text-sm">{ncr.reference}</td>
                  <td className="py-2 px-3 text-sm">{ncr.description}</td>
                  <td className="py-2 px-3 text-sm">{ncr.location}</td>
                  <td className="py-2 px-3 text-sm">{ncr.status}</td>
                  <td className="py-2 px-3 text-sm">{formatDate(ncr.raisedAt, "dd MMM yyyy")}</td>
                  <td className="py-2 px-3 text-sm">{ncr.correctiveAction || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderPaymentReport = (data: PaymentCertificate[]) => {
    const totalAmount = data.reduce((sum, pc) => sum + pc.amount, 0);
    const certifiedAmount = data
      .filter(pc => pc.status === "Certified" || pc.status === "Paid")
      .reduce((sum, pc) => sum + pc.amount, 0);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Total Certificates</p>
            <p className="text-2xl font-bold">{data.length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Certified Amount</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(certifiedAmount)}</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">REFERENCE</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">AMOUNT</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">STATUS</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">DUE DATE</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">SUBMITTED</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 border-b">CERTIFIED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((pc) => (
                <tr key={pc.id}>
                  <td className="py-2 px-3 text-sm">{pc.reference}</td>
                  <td className="py-2 px-3 text-sm">{formatCurrency(pc.amount)}</td>
                  <td className="py-2 px-3 text-sm">{pc.status}</td>
                  <td className="py-2 px-3 text-sm">{formatDate(pc.dueDate, "dd MMM yyyy")}</td>
                  <td className="py-2 px-3 text-sm">{pc.submittedAt ? formatDate(pc.submittedAt, "dd MMM yyyy") : "-"}</td>
                  <td className="py-2 px-3 text-sm">{pc.certifiedAt ? formatDate(pc.certifiedAt, "dd MMM yyyy") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {renderReportContent()}
      </CardContent>
    </Card>
  );
}
