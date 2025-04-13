import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertEarlyWarningSchema, type InsertEarlyWarning } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Extend the insert schema with additional validation
const EarlyWarningFormSchema = insertEarlyWarningSchema.extend({
  description: z.string().min(10, {
    message: "Description must be at least 10 characters",
  }),
  mitigationPlan: z.string().optional(),
  meetingDate: z.union([z.string(), z.date()]).optional(),
  raisedAt: z.union([z.string(), z.date()]),
});

type EarlyWarningFormData = z.infer<typeof EarlyWarningFormSchema>;

type EarlyWarningFormProps = {
  projectId: number;
  userId: number; // Current user ID
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function EarlyWarningForm({
  projectId,
  userId,
  onSuccess,
  onCancel,
}: EarlyWarningFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define the form
  const form = useForm<EarlyWarningFormData>({
    resolver: zodResolver(EarlyWarningFormSchema),
    defaultValues: {
      projectId,
      raisedBy: userId,
      ownerId: userId,
      status: "Open",
      raisedAt: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
      reference: "", // Will be auto-generated on the server or provided by user
      description: "",
      mitigationPlan: "",
      meetingDate: "",
      attachments: null,
    },
  });

  // Create mutation
  const createEarlyWarning = useMutation({
    mutationFn: async (data: EarlyWarningFormData) => {
      const response = await apiRequest("POST", "/api/early-warnings", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create early warning");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}/early-warnings`],
      });
      toast({
        title: "Early Warning Created",
        description: "The early warning has been successfully created.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Error creating early warning:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create early warning",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: EarlyWarningFormData) => {
    setIsSubmitting(true);
    try {
      await createEarlyWarning.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Create Early Warning</h2>
        <p className="text-sm text-gray-500">
          An early warning notifies all stakeholders about matters that could increase cost, delay 
          the project, or impair performance. Under NEC4 clause 15.1, any party should give an early warning 
          as soon as they become aware of a matter that could affect time, cost, or quality.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reference Number */}
          <div className="space-y-2">
            <label htmlFor="reference" className="block text-sm font-medium">
              Reference Number <span className="text-red-500">*</span>
            </label>
            <input
              id="reference"
              type="text"
              placeholder="EW-XXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...form.register("reference")}
            />
            {form.formState.errors.reference && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.reference.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Format: EW-XXX (e.g., EW-001)
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...form.register("status")}
            >
              <option value="Open">Open</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Closed">Closed</option>
            </select>
            {form.formState.errors.status && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.status.message}
              </p>
            )}
          </div>
          
          {/* Date Raised */}
          <div className="space-y-2">
            <label htmlFor="raisedAt" className="block text-sm font-medium">
              Date Raised <span className="text-red-500">*</span>
            </label>
            <input
              id="raisedAt"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...form.register("raisedAt")}
            />
            {form.formState.errors.raisedAt && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.raisedAt.message}
              </p>
            )}
          </div>

          {/* Risk Reduction Meeting Date */}
          <div className="space-y-2">
            <label htmlFor="meetingDate" className="block text-sm font-medium">
              Risk Reduction Meeting Date
            </label>
            <input
              id="meetingDate"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...form.register("meetingDate")}
            />
            {form.formState.errors.meetingDate && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.meetingDate.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              NEC4 Clause 15.2 requires a risk reduction meeting when requested.
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Describe the potential issue that could affect time, cost, or quality..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...form.register("description")}
          />
          {form.formState.errors.description && (
            <p className="text-red-500 text-xs mt-1">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        {/* Mitigation Plan */}
        <div className="space-y-2">
          <label htmlFor="mitigationPlan" className="block text-sm font-medium">
            Proposed Mitigation Plan
          </label>
          <textarea
            id="mitigationPlan"
            rows={4}
            placeholder="Describe actions to reduce this risk..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...form.register("mitigationPlan")}
          />
          {form.formState.errors.mitigationPlan && (
            <p className="text-red-500 text-xs mt-1">
              {form.formState.errors.mitigationPlan.message}
            </p>
          )}
          <p className="text-xs text-gray-500">
            NEC4 Clause 15.1 requires all parties to cooperate in seeking solutions that reduce the impact.
          </p>
        </div>

        {/* Attachments (placeholder for future implementation) */}
        <div className="space-y-2">
          <label htmlFor="attachments" className="block text-sm font-medium">
            Attachments
          </label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, Word, or image files (MAX. 10MB)
                </p>
              </div>
              <input id="file-upload" type="file" className="hidden" disabled />
            </label>
          </div>
          <p className="text-xs text-gray-500">
            Attachment functionality will be enabled in a future update.
          </p>
        </div>

        {/* NEC4 Compliance Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-1">NEC4 Contract Compliance</h4>
          <p className="text-xs text-blue-600">
            This early warning is issued in accordance with Clause 15.1 of the NEC4 contract, 
            which requires the Contractor and the Project Manager to notify each other as soon as 
            they become aware of a matter that could increase the cost, delay completion, or impair 
            the performance of the works.
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 text-white rounded-md text-sm font-medium hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Early Warning"}
          </button>
        </div>
      </form>
    </div>
  );
}