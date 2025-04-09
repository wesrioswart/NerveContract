import { useQuery } from "@tanstack/react-query";
import { EarlyWarning } from "@shared/schema";
import { formatDate, getStatusColor, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type EWTableProps = {
  projectId: number;
  limit?: number;
  showViewAll?: boolean;
};

export default function EWTable({ projectId, limit, showViewAll = false }: EWTableProps) {
  const { data: earlyWarnings = [], isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/early-warnings`],
  });

  const handleViewDetails = (ew: EarlyWarning) => {
    // In a complete implementation, this would navigate to a details page
    // or show a modal with the EW details
    alert(`Viewing details for ${ew.reference}`);
  };

  const handleNewEarlyWarning = () => {
    // In a complete implementation, this would show a form to create a new EW
    alert("This would open the early warning form");
  };

  // Limit the number of EWs to display if limit is provided
  const displayedEWs = limit ? earlyWarnings.slice(0, limit) : earlyWarnings;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-medium">Early Warnings</h3>
        <Button
          onClick={handleNewEarlyWarning}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
          New Early Warning
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <span className="material-icons animate-spin text-primary">refresh</span>
          <span className="ml-2">Loading early warnings...</span>
        </div>
      ) : displayedEWs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No early warnings found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">REF</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">DESCRIPTION</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">OWNER</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">STATUS</th>
                <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">RAISED</th>
              </tr>
            </thead>
            <tbody>
              {displayedEWs.map((ew: EarlyWarning) => {
                const { bgColor, textColor } = getStatusColor(ew.status);
                
                return (
                  <tr 
                    key={ew.id} 
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" 
                    onClick={() => handleViewDetails(ew)}
                  >
                    <td className="py-3 text-sm font-medium px-2">{ew.reference}</td>
                    <td className="py-3 text-sm px-2">{ew.description}</td>
                    <td className="py-3 text-sm px-2">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                          <span className="text-xs font-medium">JC</span>
                        </div>
                        <span className="text-sm">Jane Cooper</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm px-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${bgColor} ${textColor}`}>
                        {ew.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-500 px-2">
                      {formatDate(ew.raisedAt, "dd MMM yyyy")}
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
            href="/early-warnings" 
            className="text-sm text-primary hover:text-blue-800 flex items-center justify-center"
          >
            View all early warnings
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </a>
        </div>
      )}
    </div>
  );
}
