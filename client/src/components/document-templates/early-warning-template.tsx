import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimationWrapper } from "@/components/ui/animation-wrapper";
import { AlertCircle, Download, Printer, Save, Loader2 } from "lucide-react";
import { useProject } from "@/contexts/project-context";
import { useToast } from "@/hooks/use-toast";

// Form schema for Early Warning
const formSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  dateIssued: z.string().min(1, "Date is required"),
  issuedBy: z.string().min(1, "Issued by is required"),
  role: z.string().min(1, "Role is required"),
  raisedTo: z.string().min(1, "Raised to is required"),
  subjectMatter: z.string().min(1, "Subject matter is required"),
  description: z.string().min(1, "Description is required"),
  potentialImpact: z.string().min(1, "Potential impact is required"),
  proposedMitigation: z.string().min(1, "Proposed mitigation is required"),
  meetingRequested: z.boolean().default(false),
  proposedMeetingDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EarlyWarningTemplate() {
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
      referenceNumber: "EW-" + Math.floor(Math.random() * 900 + 100), // Generate a random number for demo
      dateIssued: new Date().toISOString().split("T")[0],
      issuedBy: "John Smith",
      role: "Contractor's Project Manager",
      raisedTo: "Jane Cooper",
      subjectMatter: "Potential delay due to material shortage",
      description: "",
      potentialImpact: "",
      proposedMitigation: "",
      meetingRequested: false,
      proposedMeetingDate: "",
    },
  });
  
  const meetingRequested = watch("meetingRequested");
  
  // Update project name when current project changes
  useEffect(() => {
    if (currentProject) {
      setValue("projectName", currentProject.name);
    }
  }, [currentProject, setValue]);
  
  const onSubmit = async (data: FormValues) => {
    if (!data.description || !data.potentialImpact || !data.proposedMitigation) {
      toast({
        title: "Missing information",
        description: "Please provide all required information for the Early Warning Notice",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // In a real implementation, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "Early Warning submitted successfully",
        description: "The Early Warning Notice has been saved and sent to the appropriate parties",
      });
      
      // Show preview after saving
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Failed to submit Early Warning",
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
          Early Warning Notice
        </AnimationWrapper>
        <AnimationWrapper as="p" type="fadeIn" delay={0.2} className="text-sm text-gray-500">
          Template for issuing Early Warnings under NEC4 Clause 15.1
        </AnimationWrapper>
      </div>
      
      {!showPreview ? (
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
              <h3 className="font-medium">NEC4 Contract Clause 15.1</h3>
            </div>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded text-sm text-amber-800 mb-4">
              <p>
                "The Contractor and the Project Manager give an early warning by notifying 
                the other as soon as either becomes aware of any matter which could increase the total
                of the Prices, delay Completion, delay meeting a Key Date, or impair the performance 
                of the works in use."
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
                placeholder="EW-XXX"
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
              Subject Matter <span className="text-red-500">*</span>
            </label>
            <input
              {...register("subjectMatter")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            {errors.subjectMatter && (
              <p className="text-red-500 text-xs mt-1">{errors.subjectMatter.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Description of Early Warning Matter <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              {...register("description")}
              placeholder="Describe the matter that could affect time, cost, or quality..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Potential Impact on Project <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              {...register("potentialImpact")}
              placeholder="Describe how this matter might impact cost, completion date, or performance..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            {errors.potentialImpact && (
              <p className="text-red-500 text-xs mt-1">{errors.potentialImpact.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Proposed Mitigation Actions <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              {...register("proposedMitigation")}
              placeholder="Describe proposed actions to avoid or reduce the impact..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            {errors.proposedMitigation && (
              <p className="text-red-500 text-xs mt-1">{errors.proposedMitigation.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="meetingRequested"
                {...register("meetingRequested")}
                className="h-4 w-4 border-gray-300 rounded"
              />
              <label htmlFor="meetingRequested" className="ml-2 block text-sm text-gray-900">
                Risk Reduction Meeting Requested (per Clause 15.2)
              </label>
            </div>
            
            {meetingRequested && (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-1">
                  Proposed Meeting Date
                </label>
                <input
                  type="date"
                  {...register("proposedMeetingDate")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            )}
          </div>
          
          <AnimationWrapper type="fadeIn" delay={0.3} className="flex justify-end mt-8 space-x-3">
            <AnimatedButton 
              type="button" 
              variant="outline" 
              className="gap-1" 
              animation="subtle"
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4" />
              Save Draft
            </AnimatedButton>
            <AnimatedButton 
              type="submit" 
              className="bg-amber-500 hover:bg-amber-600 text-white gap-1" 
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
                  <AlertCircle className="w-4 h-4" />
                  Generate Notice
                </>
              )}
            </AnimatedButton>
          </AnimationWrapper>
        </form>
      ) : (
        <div>
          <AnimationWrapper type="fadeIn" delay={0.2} className="p-6 border-b border-gray-200 text-right space-x-2 print:hidden">
            <AnimatedButton variant="outline" size="sm" onClick={handlePrint} className="gap-1" animation="subtle">
              <Printer className="w-4 h-4" />
              Print
            </AnimatedButton>
            <AnimatedButton variant="outline" size="sm" onClick={handleDownload} className="gap-1" animation="subtle">
              <Download className="w-4 h-4" />
              Download PDF
            </AnimatedButton>
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(false)}
              animation="subtle"
            >
              Edit
            </AnimatedButton>
          </AnimationWrapper>
          
          <div className="p-8 max-w-4xl mx-auto">
            <AnimationWrapper type="fadeIn" delay={0.3} className="text-center mb-8">
              <AnimationWrapper as="h1" type="scale" delay={0.4} className="text-2xl font-bold">
                EARLY WARNING NOTICE
              </AnimationWrapper>
              <AnimationWrapper as="p" type="fadeIn" delay={0.5} className="text-sm text-gray-500 mt-1">
                In accordance with Clause 15.1 of the NEC4 Contract
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
              <h2 className="text-lg font-bold mb-2">{watch("subjectMatter")}</h2>
              <div className="border-l-4 border-amber-500 pl-4 py-1">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{watch("description")}</p>
              </div>
            </AnimationWrapper>
            
            <AnimationWrapper type="fadeIn" delay={0.7} className="mb-6">
              <h3 className="text-md font-bold mb-2">Potential Impact on Project</h3>
              <p className="text-sm whitespace-pre-wrap">{watch("potentialImpact")}</p>
            </AnimationWrapper>
            
            <AnimationWrapper type="fadeIn" delay={0.8} className="mb-6">
              <h3 className="text-md font-bold mb-2">Proposed Mitigation Actions</h3>
              <p className="text-sm whitespace-pre-wrap">{watch("proposedMitigation")}</p>
            </AnimationWrapper>
            
            {watch("meetingRequested") && (
              <AnimationWrapper type="fadeIn" delay={0.9} className="mb-6 p-4 bg-amber-50 rounded-md">
                <h3 className="text-md font-bold mb-2">Risk Reduction Meeting (Clause 15.2)</h3>
                <p className="text-sm">
                  A risk reduction meeting is requested {watch("proposedMeetingDate") && `on ${watch("proposedMeetingDate")}`}
                  {!watch("proposedMeetingDate") && " at a date to be agreed"}
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
                Note: This Early Warning is issued in accordance with Clause 15.1 of the NEC4 Contract, 
                which requires notification of any matter that could affect time, cost, or quality.
              </p>
            </AnimationWrapper>
          </div>
        </div>
      )}
    </div>
  );
}