import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimationWrapper } from "@/components/ui/animation-wrapper";
import { AlertCircle, Download, Printer, Save, Loader2, DollarSign } from "lucide-react";
import { useProject } from "@/contexts/project-context";
import { useToast } from "@/hooks/use-toast";

// Form schema for Compensation Event
const formSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  dateIssued: z.string().min(1, "Date is required"),
  issuedBy: z.string().min(1, "Issued by is required"),
  role: z.string().min(1, "Role is required"),
  raisedTo: z.string().min(1, "Raised to is required"),
  ceType: z.enum(["Contractor Notification", "PM Notification", "Proposed Instruction"], {
    required_error: "CE type is required",
  }),
  eventDescription: z.string().min(1, "Event description is required"),
  relevantClause: z.string().min(1, "Relevant clause is required"),
  proposedEffect: z.string().min(1, "Proposed effect is required"),
  estimatedCost: z.string().optional(),
  estimatedTimeEffect: z.string().optional(),
  quotationRequired: z.boolean().default(false),
  quotationDeadline: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CompensationEventTemplate() {
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentProject } = useProject();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: currentProject?.name || "Westfield Development Project",
      referenceNumber: "CE-" + Math.floor(Math.random() * 900 + 100), // Generate a random number for demo
      dateIssued: new Date().toISOString().split("T")[0],
      issuedBy: "John Smith",
      role: "Contractor's Project Manager",
      raisedTo: "Jane Cooper",
      ceType: "Contractor Notification",
      eventDescription: "",
      relevantClause: "60.1(1)",
      proposedEffect: "",
      estimatedCost: "",
      estimatedTimeEffect: "",
      quotationRequired: false,
      quotationDeadline: "",
    },
  });
  
  const quotationRequired = watch("quotationRequired");
  const ceType = watch("ceType");
  
  // Update project name when current project changes
  useEffect(() => {
    if (currentProject) {
      setValue("projectName", currentProject.name);
    }
  }, [currentProject, setValue]);
  
  const onSubmit = async (data: FormValues) => {
    if (!data.eventDescription || !data.proposedEffect) {
      toast({
        title: "Missing information",
        description: "Please provide all required information for the Compensation Event Notice",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // In a real implementation, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "Compensation Event submitted successfully",
        description: "The Compensation Event Notice has been saved and sent to the appropriate parties",
      });
      
      // Show preview after saving
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Failed to submit Compensation Event",
        description: "There was an error submitting the form. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    // This would be implemented with a PDF generation library
    toast({
      title: "Download started",
      description: "Your PDF is being generated and will download shortly."
    });
  };
  
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <AnimationWrapper as="h2" type="slideIn" className="text-xl font-bold mb-2">
          Compensation Event Notice
        </AnimationWrapper>
        <AnimationWrapper as="p" type="fadeIn" delay={0.2} className="text-sm text-gray-500">
          Template for notifying Compensation Events under NEC4 Clause 61.3
        </AnimationWrapper>
      </div>
      
      {!showPreview ? (
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <DollarSign className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="font-medium">NEC4 Contract Clause 61.3</h3>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded text-sm text-blue-800 mb-4">
              <p>
                "The Contractor notifies the Project Manager of an event which has happened or which is expected to happen as a compensation event if the Contractor believes that the event is a compensation event and the Project Manager has not notified the event to the Contractor."
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("projectName")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              {errors.projectName && (
                <p className="text-red-500 text-xs mt-1">{errors.projectName.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register("referenceNumber")}
                placeholder="CE-XXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              {errors.referenceNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.referenceNumber.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Date Issued <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("dateIssued")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              {errors.dateIssued && (
                <p className="text-red-500 text-xs mt-1">{errors.dateIssued.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Issued By <span className="text-red-500">*</span>
              </label>
              <input
                {...register("issuedBy")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              {errors.issuedBy && (
                <p className="text-red-500 text-xs mt-1">{errors.issuedBy.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                {...register("role")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="Contractor's Project Manager">Contractor's Project Manager</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Contractor's Quantity Surveyor">Contractor's Quantity Surveyor</option>
                <option value="Client's Representative">Client's Representative</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Raised To <span className="text-red-500">*</span>
              </label>
              <input
                {...register("raisedTo")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              {errors.raisedTo && (
                <p className="text-red-500 text-xs mt-1">{errors.raisedTo.message}</p>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Compensation Event Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register("ceType")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="Contractor Notification">Contractor Notification</option>
              <option value="PM Notification">Project Manager Notification</option>
              <option value="Proposed Instruction">Proposed Instruction</option>
            </select>
            {errors.ceType && (
              <p className="text-red-500 text-xs mt-1">{errors.ceType.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Relevant Contract Clause <span className="text-red-500">*</span>
            </label>
            <input
              {...register("relevantClause")}
              placeholder="e.g., 60.1(1)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            {errors.relevantClause && (
              <p className="text-red-500 text-xs mt-1">{errors.relevantClause.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Description of Event <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              {...register("eventDescription")}
              placeholder="Describe the event that has happened or is expected to happen..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            {errors.eventDescription && (
              <p className="text-red-500 text-xs mt-1">{errors.eventDescription.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Proposed Effect on Defined Cost and Time <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              {...register("proposedEffect")}
              placeholder="Describe how this event will affect the Defined Cost and/or the Completion Date..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            {errors.proposedEffect && (
              <p className="text-red-500 text-xs mt-1">{errors.proposedEffect.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Estimated Cost Effect
              </label>
              <input
                {...register("estimatedCost")}
                placeholder="£0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Estimated Time Effect
              </label>
              <input
                {...register("estimatedTimeEffect")}
                placeholder="0 days"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="quotationRequired"
                {...register("quotationRequired")}
                className="h-4 w-4 border-gray-300 rounded"
              />
              <label htmlFor="quotationRequired" className="ml-2 block text-sm text-gray-900">
                Quotation Required (per Clause 62.1)
              </label>
            </div>
            
            {quotationRequired && (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">
                  Quotation Deadline
                </label>
                <input
                  type="date"
                  {...register("quotationDeadline")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            )}
          </div>
          
          <AnimationWrapper type="fadeIn" delay={0.3} className="mt-8">
            <div className="w-full flex justify-between">
              <div className="flex space-x-4">
                <AnimatedButton 
                  type="button" 
                  variant="outline" 
                  className="gap-1 bg-white" 
                  animation="subtle"
                  disabled={isSubmitting}
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </AnimatedButton>
                
                <AnimatedButton 
                  type="button" 
                  onClick={handlePrint}
                  variant="outline" 
                  className="gap-1 bg-white" 
                  animation="subtle"
                  disabled={isSubmitting}
                >
                  <Printer className="w-4 h-4" />
                  Print
                </AnimatedButton>
                
                <AnimatedButton 
                  type="button" 
                  onClick={handleDownload}
                  className="gap-1 bg-teal-600 hover:bg-teal-700 text-white" 
                  animation="subtle"
                  disabled={isSubmitting}
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </AnimatedButton>
              </div>
              
              <AnimatedButton 
                type="submit" 
                className="gap-1 bg-blue-500 hover:bg-blue-600 text-white" 
                animation="bounce"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Submit CE Notice
                  </>
                )}
              </AnimatedButton>
            </div>
          </AnimationWrapper>
        </form>
      ) : (
        <div>
          <AnimationWrapper type="fadeIn" delay={0.2} className="p-6 border-b border-gray-200 print:hidden">
            <div className="flex justify-between items-center">
              <AnimatedButton
                onClick={() => setShowPreview(false)}
                variant="outline"
                animation="subtle"
                className="bg-white"
              >
                Back to Edit
              </AnimatedButton>
              
              <div className="flex space-x-2">
                <AnimatedButton 
                  variant="outline" 
                  onClick={handlePrint} 
                  className="gap-1 bg-white" 
                  animation="subtle"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </AnimatedButton>
                
                <AnimatedButton 
                  onClick={handleDownload} 
                  className="gap-1 bg-teal-600 hover:bg-teal-700 text-white" 
                  animation="subtle"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </AnimatedButton>
              </div>
            </div>
          </AnimationWrapper>
          
          <div className="p-8 max-w-4xl mx-auto">
            <AnimationWrapper type="fadeIn" delay={0.3} className="text-center mb-8">
              <AnimationWrapper as="h1" type="scale" delay={0.4} className="text-2xl font-bold">
                COMPENSATION EVENT NOTICE
              </AnimationWrapper>
              <AnimationWrapper as="p" type="fadeIn" delay={0.5} className="text-sm text-gray-500 mt-1">
                In accordance with Clause 61.3 of the NEC4 Contract
              </AnimationWrapper>
            </AnimationWrapper>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm font-medium text-gray-500">Project</p>
                <p className="font-medium">{watch("projectName")}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Reference Number</p>
                <p className="font-medium">{watch("referenceNumber")}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Date Issued</p>
                <p>{watch("dateIssued")}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">CE Type</p>
                <p>{watch("ceType")}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Issued By</p>
                <p>{watch("issuedBy")}</p>
                <p className="text-sm text-gray-500">{watch("role")}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Raised To</p>
                <p>{watch("raisedTo")}</p>
              </div>
            </div>
            
            <AnimationWrapper type="fadeIn" delay={0.6} className="mb-6">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-bold mb-2">Compensation Event</h2>
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Clause {watch("relevantClause")}
                </div>
              </div>
              <div className="border-l-4 border-blue-500 pl-4 py-1">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{watch("eventDescription")}</p>
              </div>
            </AnimationWrapper>
            
            <AnimationWrapper type="fadeIn" delay={0.7} className="mb-6">
              <h3 className="text-md font-bold mb-2">Proposed Effect</h3>
              <p className="text-sm whitespace-pre-wrap">{watch("proposedEffect")}</p>
            </AnimationWrapper>
            
            {(watch("estimatedCost") || watch("estimatedTimeEffect")) && (
              <AnimationWrapper type="fadeIn" delay={0.8} className="mb-6 grid grid-cols-2 gap-6">
                {watch("estimatedCost") && (
                  <div>
                    <h3 className="text-md font-bold mb-2">Estimated Cost Effect</h3>
                    <p className="text-sm">{watch("estimatedCost")}</p>
                  </div>
                )}
                
                {watch("estimatedTimeEffect") && (
                  <div>
                    <h3 className="text-md font-bold mb-2">Estimated Time Effect</h3>
                    <p className="text-sm">{watch("estimatedTimeEffect")}</p>
                  </div>
                )}
              </AnimationWrapper>
            )}
            
            {watch("quotationRequired") && (
              <AnimationWrapper type="fadeIn" delay={0.9} className="mb-6 p-4 bg-blue-50 rounded-md">
                <h3 className="text-md font-bold mb-2">Quotation Request (Clause 62.1)</h3>
                <p className="text-sm">
                  A quotation is requested {watch("quotationDeadline") && `by ${watch("quotationDeadline")}`}
                  {!watch("quotationDeadline") && " by the response period stated in the contract"}
                </p>
              </AnimationWrapper>
            )}
            
            <AnimationWrapper type="fadeIn" delay={1.0} className="mt-12 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <p className="text-sm font-medium mb-8">Issued by:</p>
                  <div className="border-b border-black mb-2" />
                  <p className="text-sm">{watch("issuedBy")}</p>
                  <p className="text-sm text-gray-500">{watch("role")}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-8">Acknowledged by:</p>
                  <div className="border-b border-black mb-2" />
                  <p className="text-sm">{watch("raisedTo")}</p>
                </div>
              </div>
            </AnimationWrapper>
            
            <AnimationWrapper type="fadeIn" delay={1.1} className="mt-12 text-xs text-gray-500">
              <p>
                Note: This Compensation Event Notice is issued in accordance with Clause 61.3 of the NEC4 Contract.
                The Project Manager must respond to this notice within the period stated in the contract.
              </p>
            </AnimationWrapper>
          </div>
        </div>
      )}
    </div>
  );
}