import { useQuery } from "@tanstack/react-query";
import { CompensationEvent } from "@shared/schema";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, RefreshCw, ArrowRight } from "lucide-react";
import NewCEModal from "./new-ce-modal";

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
    // In a complete implementation, this would navigate to a details page
    // or show a modal with the CE details
    alert(`Viewing details for ${ce.reference}`);
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
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">DUE</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">VALUE</th>
              </tr>
            </thead>
            <tbody>
              {displayedCEs.map((ce: CompensationEvent) => {
                const { bgColor, textColor } = getStatusColor(ce.status);
                
                return (
                  <tr 
                    key={ce.id} 
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" 
                    onClick={() => handleViewDetails(ce)}
                  >
                    <td className="py-3 text-sm font-medium px-2">{ce.reference}</td>
                    <td className="py-3 text-sm px-2">{ce.title}</td>
                    <td className="py-3 text-sm px-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${bgColor} ${textColor}`}>
                        {ce.status}
                      </span>
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
    </div>
  );
}
