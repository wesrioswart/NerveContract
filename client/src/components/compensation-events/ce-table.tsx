import { useQuery } from "@tanstack/react-query";
import { CompensationEvent } from "@shared/schema";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, RefreshCw, ArrowRight, Brain, Eye } from "lucide-react";
import NewCEModal from "./new-ce-modal";
import { AISourceAttribution } from "../ai-evidence/ai-source-attribution";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type CETableProps = {
  projectId: number;
  limit?: number;
  showViewAll?: boolean;
};

export default function CETable({ projectId, limit, showViewAll = false }: CETableProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedCE, setSelectedCE] = useState<CompensationEvent | null>(null);
  
  const { data: compensationEvents = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectId}/compensation-events`],
  });

  const handleViewDetails = (ce: CompensationEvent) => {
    setSelectedCE(ce);
  };

  // Limit the number of CEs to display if limit is provided
  const displayedCEs = limit ? compensationEvents.slice(0, limit) : compensationEvents;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-medium">Compensation Events</h3>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-cyan-700 hover:bg-cyan-800 text-white px-3 py-1 rounded-lg text-sm flex items-center"
        >
          <Plus className="h-3 w-3 mr-1" /> New CE
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-cyan-700" />
          <span className="ml-2">Loading compensation events...</span>
        </div>
      ) : displayedCEs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No compensation events found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">REF</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">DESCRIPTION</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">STATUS</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">SOURCE</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">DUE</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">VALUE</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayedCEs.map((ce: CompensationEvent) => {
                const { bgColor, textColor } = getStatusColor(ce.status);
                
                return (
                  <tr 
                    key={ce.id} 
                    className="border-b border-gray-200 hover:bg-gray-50" 
                  >
                    <td className="py-3 text-sm font-medium px-2">{ce.reference}</td>
                    <td className="py-3 text-sm px-2">
                      <div>
                        <div className="font-medium">{ce.title}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{ce.description}</div>
                      </div>
                    </td>
                    <td className="py-3 text-sm px-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${bgColor} ${textColor}`}>
                        {ce.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm px-2">
                      {(ce as any).aiGenerated ? (
                        <div className="flex items-center gap-1">
                          <Brain className="h-3 w-3 text-blue-600" />
                          <Badge variant="secondary" className="text-xs">AI</Badge>
                          {(ce as any).aiConfidenceScore && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round((ce as any).aiConfidenceScore * 100)}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">Manual</Badge>
                      )}
                    </td>
                    <td className="py-3 text-sm text-gray-500 px-2">
                      {ce.status === "Implemented" || ce.status === "Accepted" 
                        ? "Complete" 
                        : ce.responseDeadline 
                          ? formatDate(ce.responseDeadline, "dd MMM yyyy")
                          : "N/A"}
                    </td>
                    <td className="py-3 text-sm font-medium px-2">
                      {formatCurrency(ce.actualValue || ce.estimatedValue)}
                    </td>
                    <td className="py-3 text-sm px-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewDetails(ce)}
                        className="h-6 px-2"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {showViewAll && (
        <div className="mt-4 text-center">
          <a 
            href="/compensation-events" 
            className="text-sm text-cyan-700 hover:text-cyan-800 flex items-center justify-center"
          >
            View all compensation events
            <ArrowRight className="h-4 w-4 ml-1" />
          </a>
        </div>
      )}
      
      {showModal && (
        <NewCEModal 
          projectId={projectId} 
          onClose={() => setShowModal(false)} 
        />
      )}

      {/* CE Details Dialog with AI Evidence */}
      {selectedCE && (
        <Dialog open={!!selectedCE} onOpenChange={() => setSelectedCE(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{selectedCE.reference}: {selectedCE.title}</span>
                {(selectedCE as any).aiGenerated && (
                  <Badge variant="secondary" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge variant="outline">{selectedCE.status}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Estimated Value</h4>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedCE.estimatedValue || 0)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Clause Reference</h4>
                  <Badge variant="outline">{selectedCE.clauseReference}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Response Deadline</h4>
                  <p>{selectedCE.responseDeadline ? formatDate(selectedCE.responseDeadline, "dd MMM yyyy") : "N/A"}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedCE.description}</p>
              </div>

              {/* AI Evidence Section */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Source Attribution & Evidence</h4>
                <AISourceAttribution
                  aiGenerated={(selectedCE as any).aiGenerated}
                  confidenceScore={(selectedCE as any).aiConfidenceScore}
                  sourceEmailId={(selectedCE as any).sourceEmailId}
                  sourceDocumentPath={(selectedCE as any).sourceDocumentPath}
                  reasoningEvidence={(selectedCE as any).aiReasoningEvidence}
                  clauseJustification={(selectedCE as any).clauseJustification}
                  triggerCriteria={(selectedCE as any).triggerCriteria}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
