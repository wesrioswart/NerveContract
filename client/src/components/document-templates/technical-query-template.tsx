import React, { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Printer, Save, HelpCircle } from "lucide-react";
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
  discipline: z.string().min(1, "Discipline is required"),
  priority: z.string().min(1, "Priority is required"),
  querySubject: z.string().min(1, "Query subject is required"),
  queryDetails: z.string().min(1, "Query details are required"),
  drawingReferences: z.string().optional(),
  specificationReferences: z.string().optional(),
  otherReferences: z.string().optional(),
  proposedSolution: z.string().optional(),
  responseRequired: z.string().min(1, "Response date is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function TechnicalQueryTemplate() {
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
      role: 'Contractor\'s Design Manager',
      discipline: 'Structural',
      priority: 'Medium',
      responseRequired: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // 7 days from now
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Technical Query Submitted",
        description: `TQ ${data.referenceNumber} has been successfully submitted.`
      });
      
      setIsSubmitting(false);
      setShowPreview(true);
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Error Submitting Query",
        description: "There was a problem submitting your TQ. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your Technical Query draft has been saved successfully.",
      variant: "default"
    });
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    toast({
      title: "PDF Generated",
      description: "Your Technical Query has been generated as a PDF.",
      variant: "default"
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <AnimationWrapper type="fadeIn">
        <div className="border-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <AnimationWrapper as="h2" type="slideIn" className="text-xl font-bold mb-2">
              Technical Query (TQ)
            </AnimationWrapper>
            <AnimationWrapper as="p" type="fadeIn" delay={0.2} className="text-sm text-gray-500">
              Template for submitting technical queries on the NEC4 contract
            </AnimationWrapper>
          </div>
          
          {!showPreview ? (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <HelpCircle className="w-5 h-5 text-purple-500 mr-2" />
                  <h3 className="font-medium">NEC4 Contract Communications</h3>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded text-sm text-purple-800 mb-4">
                  <p>
                    "A communication that has the effect of a certificate, decision, acceptance, notice or notification must be in a form that can be read, copied and recorded. Writing, typing, email and verified electronic data are acceptable."
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
                    placeholder="TQ-XXX"
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
                    <option value="Contractor's Design Manager">Contractor's Design Manager</option>
                    <option value="Contractor's Project Manager">Contractor's Project Manager</option>
                    <option value="Site Engineer">Site Engineer</option>
                    <option value="Design Consultant">Design Consultant</option>
                    <option value="Subcontractor">Subcontractor</option>
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
                    Technical Discipline <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("discipline")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="Structural">Structural</option>
                    <option value="Architectural">Architectural</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Civil">Civil</option>
                    <option value="Geotechnical">Geotechnical</option>
                    <option value="Environmental">Environmental</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.discipline && (
                    <p className="text-red-500 text-xs mt-1">{errors.discipline.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("priority")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="Urgent">Urgent (Response within 48 hours)</option>
                    <option value="High">High (Response within 5 working days)</option>
                    <option value="Medium">Medium (Response within 10 working days)</option>
                    <option value="Low">Low (Response when convenient)</option>
                  </select>
                  {errors.priority && (
                    <p className="text-red-500 text-xs mt-1">{errors.priority.message}</p>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Query Subject <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("querySubject")}
                  placeholder="Brief title of the technical query"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                {errors.querySubject && (
                  <p className="text-red-500 text-xs mt-1">{errors.querySubject.message}</p>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Query Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  {...register("queryDetails")}
                  placeholder="Provide a detailed description of the technical query..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                {errors.queryDetails && (
                  <p className="text-red-500 text-xs mt-1">{errors.queryDetails.message}</p>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Drawing References
                </label>
                <input
                  {...register("drawingReferences")}
                  placeholder="Drawing numbers, revisions, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Specification References
                </label>
                <input
                  {...register("specificationReferences")}
                  placeholder="Specification sections, clauses, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Other References
                </label>
                <input
                  {...register("otherReferences")}
                  placeholder="Other relevant documents"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Proposed Solution (if any)
                </label>
                <textarea
                  rows={3}
                  {...register("proposedSolution")}
                  placeholder="If you have a proposed solution, please describe it here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Response Required By <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("responseRequired")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                {errors.responseRequired && (
                  <p className="text-red-500 text-xs mt-1">{errors.responseRequired.message}</p>
                )}
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
                    className="gap-1 bg-purple-500 hover:bg-purple-600 text-white" 
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
                        <HelpCircle className="w-4 h-4" />
                        Submit Query
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
                    TECHNICAL QUERY
                  </AnimationWrapper>
                  <AnimationWrapper as="p" type="fadeIn" delay={0.5} className="text-sm text-gray-500 mt-1">
                    In accordance with NEC4 Communication Requirements
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
                    <p className="text-sm font-medium text-gray-500">Priority</p>
                    <p>{watch("priority")}</p>
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
                  <h2 className="text-lg font-bold mb-2">{watch("querySubject")}</h2>
                  <p className="text-sm text-gray-500">Technical Discipline: {watch("discipline")}</p>
                  <div className="border-l-4 border-purple-500 pl-4 py-1 mt-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{watch("queryDetails")}</p>
                  </div>
                </AnimationWrapper>
                
                <AnimationWrapper type="fadeIn" delay={0.7} className="mb-6">
                  <h3 className="text-md font-bold mb-2">Document References</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <p className="text-sm font-medium">Drawings:</p>
                      <p className="text-sm">{watch("drawingReferences") || "None specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Specifications:</p>
                      <p className="text-sm">{watch("specificationReferences") || "None specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Other:</p>
                      <p className="text-sm">{watch("otherReferences") || "None specified"}</p>
                    </div>
                  </div>
                </AnimationWrapper>
                
                {watch("proposedSolution") && (
                  <AnimationWrapper type="fadeIn" delay={0.8} className="mb-6">
                    <h3 className="text-md font-bold mb-2">Proposed Solution</h3>
                    <p className="text-sm whitespace-pre-wrap">{watch("proposedSolution")}</p>
                  </AnimationWrapper>
                )}
                
                <AnimationWrapper type="fadeIn" delay={0.9} className="mb-6">
                  <h3 className="text-md font-bold mb-2">Response Required By</h3>
                  <p className="text-sm font-medium text-red-600">{watch("responseRequired")}</p>
                </AnimationWrapper>
                
                <div className="border-t border-gray-200 pt-6 mt-8">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                      <p className="text-sm font-medium mb-2">Response (To be completed by recipient):</p>
                      <div className="h-24 border border-dashed border-gray-300 rounded-md bg-white"></div>
                      <div className="mt-4 grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-medium">Responded by:</p>
                          <p className="mt-6 pt-2 border-b border-gray-300"></p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Date:</p>
                          <p className="mt-6 pt-2 border-b border-gray-300"></p>
                        </div>
                      </div>
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