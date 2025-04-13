import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EarlyWarning } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock, Calendar, Users, FileText, CheckCircle2 } from "lucide-react";

type EWDetailsProps = {
  ewId: number;
  onClose: () => void;
  onEdit?: () => void;
};

export default function EWDetails({ ewId, onClose, onEdit }: EWDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Fetch early warning details
  const { data: ew, isLoading, error } = useQuery<EarlyWarning>({
    queryKey: [`/api/early-warnings/${ewId}`],
    refetchOnWindowFocus: false,
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/early-warnings/${ewId}`, {
        status,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update status");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Update the cache with new data
      queryClient.setQueryData([`/api/early-warnings/${ewId}`], data);
      
      // Invalidate related queries to refresh lists
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${data.projectId}/early-warnings`],
      });
      
      toast({
        title: "Status Updated",
        description: `Early warning status changed to ${data.status}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  const handleStatusChange = async (newStatus: string) => {
    if (ew?.status === newStatus) return;
    
    setIsUpdating(true);
    await updateStatus.mutateAsync(newStatus);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-3xl mx-auto h-96 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !ew) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-3xl mx-auto">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Early Warning</h3>
          <p className="text-gray-500 mb-6">
            {error instanceof Error ? error.message : "Failed to load early warning details"}
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  // Determine status color class
  const getStatusClass = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-amber-100 text-amber-800";
      case "Mitigated":
        return "bg-green-100 text-green-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-gray-800">{ew.reference}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(ew.status)}`}>
              {ew.status}
            </span>
          </div>
          <p className="text-gray-600 text-sm">{ew.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">Early Warning Details</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Raised On</p>
                <p className="text-sm font-medium">
                  {formatDate(ew.raisedAt, "dd MMMM yyyy")}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Raised By</p>
                <p className="text-sm font-medium">Jane Cooper</p>
              </div>
            </div>
            
            {ew.meetingDate && (
              <div className="flex gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Risk Reduction Meeting</p>
                  <p className="text-sm font-medium">
                    {formatDate(ew.meetingDate, "dd MMMM yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">NEC4 Contract Information</h3>
          <div className="bg-blue-50 p-4 rounded-md text-blue-800">
            <h4 className="text-sm font-medium mb-2">Clause 15: Early Warning</h4>
            <p className="text-xs mb-2">
              15.1 - The Contractor and the Project Manager give an early 
              warning by notifying the other as soon as either becomes 
              aware of any matter which could:
            </p>
            <ul className="text-xs list-disc pl-5 space-y-1">
              <li>increase the total of the Prices,</li>
              <li>delay Completion,</li>
              <li>delay meeting a Key Date, or</li>
              <li>impair the performance of the works in use.</li>
            </ul>
            <p className="text-xs mt-2">
              15.2 - Either the Project Manager or the Contractor may instruct 
              the other to attend a risk reduction meeting.
            </p>
          </div>
        </div>
      </div>

      {ew.mitigationPlan && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Mitigation Plan</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex gap-2">
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <p className="text-sm">{ew.mitigationPlan}</p>
            </div>
          </div>
        </div>
      )}

      {/* Attachments (placeholder) */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Attachments</h3>
        <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
          <p className="text-sm text-gray-500">No attachments available</p>
        </div>
      </div>

      {/* Status update buttons */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Update Status</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant={ew.status === "Open" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("Open")}
            disabled={isUpdating || ew.status === "Open"}
            className={ew.status === "Open" ? "bg-amber-500 hover:bg-amber-600" : ""}
          >
            Open
          </Button>
          <Button
            variant={ew.status === "Mitigated" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("Mitigated")}
            disabled={isUpdating || ew.status === "Mitigated"}
            className={ew.status === "Mitigated" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Mitigated
          </Button>
          <Button
            variant={ew.status === "Closed" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("Closed")}
            disabled={isUpdating || ew.status === "Closed"}
            className={ew.status === "Closed" ? "bg-gray-600 hover:bg-gray-700" : ""}
          >
            Closed
          </Button>
        </div>
      </div>
    </div>
  );
}