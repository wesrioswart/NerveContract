import { EarlyWarning } from "@shared/schema";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type EWTableProps = {
  projectId: number;
  earlyWarnings: EarlyWarning[];
  isLoading?: boolean;
  limit?: number;
  showViewAll?: boolean;
  onViewDetails?: (ewId: number) => void;
  onNewEarlyWarning?: () => void;
};

export default function EWTable({ 
  projectId, 
  earlyWarnings = [], 
  isLoading = false,
  limit, 
  showViewAll = false,
  onViewDetails,
  onNewEarlyWarning
}: EWTableProps) {

  const handleViewDetails = (ew: EarlyWarning) => {
    if (onViewDetails) {
      onViewDetails(ew.id);
    }
  };

  const handleNewEarlyWarning = () => {
    if (onNewEarlyWarning) {
      onNewEarlyWarning();
    }
  };

  // Limit the number of EWs to display if limit is provided
  const displayedEWs = limit ? earlyWarnings.slice(0, limit) : earlyWarnings;

  // Generate status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
      case "Mitigated":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            {status}
          </Badge>
        );
      case "Closed":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-medium">Early Warnings</h3>
        <Button
          onClick={handleNewEarlyWarning}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Early Warning
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
          <span className="ml-2">Loading early warnings...</span>
        </div>
      ) : displayedEWs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="mb-2">No early warnings found</p>
          <p className="text-sm text-gray-400">
            Early warnings help identify potential issues before they become problems.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-3">REF</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-3">DESCRIPTION</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-3">STATUS</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-3">RAISED</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-3">MEETING</th>
              </tr>
            </thead>
            <tbody>
              {displayedEWs.map((ew: EarlyWarning) => {
                return (
                  <tr 
                    key={ew.id} 
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" 
                    onClick={() => handleViewDetails(ew)}
                  >
                    <td className="py-3 text-sm font-medium px-3">
                      <div className="flex items-center">
                        <span className="text-amber-600 mr-2">{ew.reference}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm px-3">
                      {/* Truncate long descriptions */}
                      {ew.description.length > 80 
                        ? `${ew.description.substring(0, 80)}...` 
                        : ew.description
                      }
                    </td>
                    <td className="py-3 text-sm px-3">
                      {getStatusBadge(ew.status)}
                    </td>
                    <td className="py-3 text-sm text-gray-500 px-3">
                      {formatDate(ew.raisedAt, "dd MMM yyyy")}
                    </td>
                    <td className="py-3 text-sm text-gray-500 px-3">
                      {ew.meetingDate 
                        ? formatDate(ew.meetingDate, "dd MMM yyyy")
                        : <span className="text-gray-400">Not scheduled</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {showViewAll && displayedEWs.length > 0 && (
        <div className="mt-4 text-center">
          <a 
            href="/early-warnings" 
            className="text-sm text-primary hover:text-blue-800 flex items-center justify-center"
          >
            View all early warnings
            <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </div>
      )}
    </div>
  );
}
