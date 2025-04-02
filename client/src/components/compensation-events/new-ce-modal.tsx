import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type NewCEModalProps = {
  projectId: number;
  onClose: () => void;
};

export default function NewCEModal({ projectId, onClose }: NewCEModalProps) {
  const [title, setTitle] = useState("");
  const [clauseReference, setClauseReference] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [description, setDescription] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createCEMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/compensation-events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/compensation-events`] });
      toast({
        title: "Compensation Event Created",
        description: "The CE notification has been submitted successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create compensation event: " + error,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = async () => {
    if (!title || !clauseReference || !description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Here we're creating a simplified CE, in a real app we'd get the user ID from context
      // and generate a proper reference number
      await createCEMutation.mutateAsync({
        projectId,
        reference: `CE-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        title,
        description,
        clauseReference,
        estimatedValue: estimatedValue ? parseInt(estimatedValue) : null,
        status: "Notification",
        raisedBy: 1, // This would be the current user's ID
        raisedAt: new Date(),
        responseDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      });
    } catch (error) {
      console.error("Error creating CE:", error);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">New Compensation Event</h3>
          <button className="text-gray-500 hover:text-gray-900" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">CE Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter a descriptive title"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">NEC4 Clause Reference</label>
              <select
                value={clauseReference}
                onChange={(e) => setClauseReference(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select a clause</option>
                <option value="60.1(1)">60.1(1) - Changed instruction</option>
                <option value="60.1(2)">60.1(2) - Changed decision</option>
                <option value="60.1(12)">60.1(12) - Weather measurement</option>
                <option value="60.1(14)">60.1(14) - Physical conditions</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Estimated Value</label>
              <Input
                type="text"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="£0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Describe the compensation event..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Attachments</label>
            <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
              <span className="material-icons text-gray-500 text-xl mb-1">cloud_upload</span>
              <p className="text-sm text-gray-500">Drag files here or click to browse</p>
              <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC up to 10MB</p>
              <input type="file" className="hidden" multiple />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-900 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createCEMutation.isPending}
              className="px-4 py-2 bg-primary hover:bg-blue-800 text-white rounded-md"
            >
              {createCEMutation.isPending ? (
                <>
                  <span className="material-icons animate-spin mr-2">refresh</span>
                  Submitting...
                </>
              ) : (
                "Submit CE Notification"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
