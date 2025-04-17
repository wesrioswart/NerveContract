import React, { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Printer, Save, AlertOctagon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProject } from "@/contexts/project-context";
import { AnimationWrapper } from "@/components/ui/animation-wrapper";
import { AnimatedButton } from "@/components/ui/animated-button";
import { animatedToast } from "@/components/ui/animated-toast";

// Define the form schema
const formSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  dateIssued: z.string().min(1, "Date is required"),
  issuedBy: z.string().min(1, "Issuer name is required"),
  role: z.string().min(1, "Role is required"),
  raisedTo: z.string().min(1, "Recipient is required"),
  workArea: z.string().min(1, "Work area is required"),
  ncrType: z.string().min(1, "NCR type is required"),
  nonConformanceDetails: z.string().min(1, "Non-conformance details are required"),
  referenceDocuments: z.string().optional(),
  immediateAction: z.string().min(1, "Immediate action is required"),
  rootCauseAnalysis: z.string().optional(),
  correctiveAction: z.string().min(1, "Corrective action is required"),
  preventiveAction: z.string().optional(),
  requiredCompletion: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NCRTemplate() {
  const { toast } = useToast();
  const { currentProject } = useProject();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: currentProject?.name || '',
      dateIssued: new Date().toISOString().substring(0, 10),
      role: 'Supervisor',
      ncrType: 'Materials',
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Non-Conformance Report Submitted",
        description: `NCR ${data.referenceNumber} has been successfully submitted.`
      });
      
      setIsSubmitting(false);
      setShowPreview(true);
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Error Submitting Report",
        description: "There was a problem submitting your NCR. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your NCR draft has been saved successfully.",
      variant: "default"
    });
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    toast({
      title: "PDF Generated",
      description: "Your NCR has been generated as a PDF.",
      variant: "default"
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <AnimationWrapper type="fadeIn">
        <div className="border-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <AnimationWrapper as="h2" type="slideIn" className="text-xl font-bold mb-2">
              Non-Conformance Report (NCR)
            </AnimationWrapper>
            <AnimationWrapper as="p" type="fadeIn" delay={0.2} className="text-sm text-gray-500">
              Template for documenting non-conformances under NEC4 
            </AnimationWrapper>
          </div>
          
          {!showPreview ? (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <AlertOctagon className="w-5 h-5 text-red-500 mr-2" />
                  <h3 className="font-medium">NEC4 Contract Quality Management</h3>
                </div>
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-800 mb-4">
                  <p>
                    "The Contractor's design which the Works Information requires the Contractor to design, the works, and the working areas must be in accordance with the Works Information."
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
                    placeholder="NCR-XXX"
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
                    <option value="Supervisor">Supervisor</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Quality Manager">Quality Manager</option>
                    <option value="Site Engineer">Site Engineer</option>
                    <option value="Contractor's Representative">Contractor's Representative</option>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Work Area <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("workArea")}
                    placeholder="Specify location or work package"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {errors.workArea && (
                    <p className="text-red-500 text-xs mt-1">{errors.workArea.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    NCR Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("ncrType")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="Materials">Materials</option>
                    <option value="Workmanship">Workmanship</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Testing">Testing</option>
                    <option value="Design">Design</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.ncrType && (
                    <p className="text-red-500 text-xs mt-1">{errors.ncrType.message}</p>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Non-Conformance Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  {...register("nonConformanceDetails")}
                  placeholder="Describe the non-conformance in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                {errors.nonConformanceDetails && (
                  <p className="text-red-500 text-xs mt-1">{errors.nonConformanceDetails.message}</p>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Reference Documents
                </label>
                <input
                  {...register("referenceDocuments")}
                  placeholder="Specifications, drawings, standards, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Immediate Action <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  {...register("immediateAction")}
                  placeholder="Detail any immediate action taken..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                {errors.immediateAction && (
                  <p className="text-red-500 text-xs mt-1">{errors.immediateAction.message}</p>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Root Cause Analysis
                </label>
                <textarea
                  rows={3}
                  {...register("rootCauseAnalysis")}
                  placeholder="Identify the root cause of the non-conformance..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Corrective Action <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  {...register("correctiveAction")}
                  placeholder="Detail the corrective action to be taken..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                {errors.correctiveAction && (
                  <p className="text-red-500 text-xs mt-1">{errors.correctiveAction.message}</p>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Preventive Action
                </label>
                <textarea
                  rows={3}
                  {...register("preventiveAction")}
                  placeholder="Detail measures to prevent recurrence..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Required Completion Date
                </label>
                <input
                  type="date"
                  {...register("requiredCompletion")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <AnimationWrapper type="fadeIn" delay={0.3} className="mt-8">
                <div className="w-full flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <AnimatedButton 
                      type="button" 
                      onClick={handleSaveDraft}
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
                    className="gap-1 bg-red-500 hover:bg-red-600 text-white" 
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
                        <AlertOctagon className="w-4 h-4" />
                        Submit NCR
                      </>
                    )}
                  </AnimatedButton>
                </div>
              </AnimationWrapper>
            </form>
          ) : (
            <div>
              <AnimationWrapper type="fadeIn" delay={0.2} className="p-6 border-b border-gray-200 print:hidden">
                <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                  <AnimatedButton
                    onClick={() => setShowPreview(false)}
                    variant="outline"
                    animation="subtle"
                    className="bg-white w-full sm:w-auto"
                  >
                    Back to Edit
                  </AnimatedButton>
                  
                  <div className="flex flex-wrap gap-2">
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
                    NON-CONFORMANCE REPORT
                  </AnimationWrapper>
                  <AnimationWrapper as="p" type="fadeIn" delay={0.5} className="text-sm text-gray-500 mt-1">
                    In accordance with NEC4 Quality Management Requirements
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
                    <p className="text-sm font-medium text-gray-500">NCR Type</p>
                    <p>{watch("ncrType")}</p>
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
                  <h2 className="text-lg font-bold mb-2">Non-Conformance Details</h2>
                  <div className="border-l-4 border-red-500 pl-4 py-1">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{watch("nonConformanceDetails")}</p>
                  </div>
                </AnimationWrapper>
                
                <AnimationWrapper type="fadeIn" delay={0.7} className="mb-6">
                  <h3 className="text-md font-bold mb-2">Work Area</h3>
                  <p className="text-sm whitespace-pre-wrap">{watch("workArea")}</p>
                </AnimationWrapper>
                
                <AnimationWrapper type="fadeIn" delay={0.8} className="mb-6">
                  <h3 className="text-md font-bold mb-2">Reference Documents</h3>
                  <p className="text-sm whitespace-pre-wrap">{watch("referenceDocuments") || "None specified"}</p>
                </AnimationWrapper>
                
                <AnimationWrapper type="fadeIn" delay={0.9} className="mb-6">
                  <h3 className="text-md font-bold mb-2">Immediate Action</h3>
                  <p className="text-sm whitespace-pre-wrap">{watch("immediateAction")}</p>
                </AnimationWrapper>
                
                {watch("rootCauseAnalysis") && (
                  <AnimationWrapper type="fadeIn" delay={1.0} className="mb-6">
                    <h3 className="text-md font-bold mb-2">Root Cause Analysis</h3>
                    <p className="text-sm whitespace-pre-wrap">{watch("rootCauseAnalysis")}</p>
                  </AnimationWrapper>
                )}
                
                <AnimationWrapper type="fadeIn" delay={1.1} className="mb-6">
                  <h3 className="text-md font-bold mb-2">Corrective Action</h3>
                  <p className="text-sm whitespace-pre-wrap">{watch("correctiveAction")}</p>
                </AnimationWrapper>
                
                {watch("preventiveAction") && (
                  <AnimationWrapper type="fadeIn" delay={1.2} className="mb-6">
                    <h3 className="text-md font-bold mb-2">Preventive Action</h3>
                    <p className="text-sm whitespace-pre-wrap">{watch("preventiveAction")}</p>
                  </AnimationWrapper>
                )}
                
                <AnimationWrapper type="fadeIn" delay={1.3} className="mb-6">
                  <h3 className="text-md font-bold mb-2">Required Completion Date</h3>
                  <p className="text-sm">{watch("requiredCompletion") || "Not specified"}</p>
                </AnimationWrapper>
                
                <div className="border-t border-gray-200 pt-6 mt-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium">Issued by:</p>
                      <p className="mt-6 pt-6 border-t border-gray-300 text-center">{watch("issuedBy")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Accepted by:</p>
                      <p className="mt-6 pt-6 border-t border-gray-300 text-center">[Signature]</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AnimationWrapper>
    </div>
  );
}