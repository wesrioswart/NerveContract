import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Printer, Save } from "lucide-react";
import { useProject } from "@/contexts/project-context";
import { apiRequest } from "@/lib/queryClient";
import { AnimationWrapper } from "@/components/ui/animation-wrapper";
import { AnimatedButton } from "@/components/ui/animated-button";

export const PMITemplate = () => {
  const { toast } = useToast();
  const { currentProject } = useProject();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectName: currentProject?.name || '',
    contractName: '',
    contractorName: '',
    clauseReference: '14.3',
    otherClause: '',
    instructionTitle: '',
    instructionDetails: '',
    changeToScope: false,
    changeToKeyDate: false,
    compensationEvent: false,
    noChange: false,
    quotationRequired: '',
    responseDate: '',
    pmName: '',
    pmSignature: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setFormData({ ...formData, [id]: checked });
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, quotationRequired: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, clauseReference: value });
  };
  
  // Update project name when current project changes
  useEffect(() => {
    if (currentProject) {
      setFormData(prev => ({
        ...prev,
        projectName: currentProject.name
      }));
    }
  }, [currentProject]);

  const handleSubmit = async () => {
    if (!formData.instructionTitle || !formData.instructionDetails) {
      toast({
        title: "Missing information",
        description: "Please provide at least the instruction title and details",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real implementation, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "PMI submitted successfully",
        description: "The Project Manager's Instruction has been saved and sent to the contractor",
      });
    } catch (error) {
      toast({
        title: "Failed to submit PMI",
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
  
  const handleSaveDraft = () => {
    toast({
      title: "Draft saved",
      description: "Your PMI draft has been saved successfully."
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <AnimationWrapper type="fadeIn">
        <Card className="border-2">
          <CardHeader className="bg-slate-50 border-b">
            <div className="flex justify-between items-start">
              <AnimationWrapper type="slideIn" delay={0.1}>
                <div>
                  <CardTitle className="text-2xl font-bold">PROJECT MANAGER'S INSTRUCTION (PMI)</CardTitle>
                  <CardDescription>In accordance with NEC4 Engineering and Construction Contract</CardDescription>
                </div>
              </AnimationWrapper>
              <AnimationWrapper type="fadeIn" delay={0.2}>
                <div className="text-right">
                  <p className="font-semibold">PMI No: <span className="font-normal">PMI-00001</span></p>
                  <p className="font-semibold">Date: <span className="font-normal">{new Date().toLocaleDateString()}</span></p>
                  <p className="font-semibold">Contract Ref: <span className="font-normal">NEC4-2023-001</span></p>
                </div>
              </AnimationWrapper>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <AnimationWrapper type="fadeIn" delay={0.3}>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="projectName" className="font-semibold">Project Name</Label>
                  <Input 
                    id="projectName" 
                    placeholder="Enter project name" 
                    value={formData.projectName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="contractName" className="font-semibold">Contract Name</Label>
                  <Input 
                    id="contractName" 
                    placeholder="Enter contract name" 
                    value={formData.contractName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </AnimationWrapper>

            <AnimationWrapper type="fadeIn" delay={0.4}>
              <div>
                <Label htmlFor="contractorName" className="font-semibold">Contractor</Label>
                <Input 
                  id="contractorName" 
                  placeholder="Enter contractor name" 
                  value={formData.contractorName}
                  onChange={handleInputChange}
                />
              </div>
            </AnimationWrapper>

            <AnimationWrapper type="fadeIn" delay={0.5}>
              <div>
                <Label htmlFor="clauseReference" className="font-semibold">Reference Clause(s)</Label>
                <Select 
                  value={formData.clauseReference}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger id="clauseReference">
                    <SelectValue placeholder="Select clause" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14.3">Clause 14.3 - Changes to Scope</SelectItem>
                    <SelectItem value="27.3">Clause 27.3 - Instruction to Contractor</SelectItem>
                    <SelectItem value="31.3">Clause 31.3 - Programme Revision</SelectItem>
                    <SelectItem value="13.3">Clause 13.3 - Communications</SelectItem>
                    <SelectItem value="other">Other (specify below)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AnimationWrapper>

            <AnimationWrapper type="fadeIn" delay={0.6}>
              <div>
                <Label htmlFor="otherClause" className="font-semibold">Other Clause Reference (if applicable)</Label>
                <Input 
                  id="otherClause" 
                  placeholder="Enter clause reference" 
                  disabled={formData.clauseReference !== 'other'}
                  value={formData.otherClause}
                  onChange={handleInputChange}
                />
              </div>
            </AnimationWrapper>

            <AnimationWrapper type="fadeIn" delay={0.7}>
              <div>
                <Label htmlFor="instructionTitle" className="font-semibold">Instruction Title</Label>
                <Input 
                  id="instructionTitle" 
                  placeholder="Enter a descriptive title for this instruction" 
                  value={formData.instructionTitle}
                  onChange={handleInputChange}
                />
              </div>
            </AnimationWrapper>

            <AnimationWrapper type="fadeIn" delay={0.8}>
              <div>
                <Label htmlFor="instructionDetails" className="font-semibold">Instruction Details</Label>
                <Textarea 
                  id="instructionDetails" 
                  placeholder="Provide a clear, detailed description of the instruction" 
                  className="min-h-[150px]"
                  value={formData.instructionDetails}
                  onChange={handleInputChange}
                />
              </div>
            </AnimationWrapper>

            <AnimationWrapper type="fadeIn" delay={0.9}>
              <div>
                <Label className="font-semibold">This Instruction Results In:</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="changeToScope" 
                      checked={formData.changeToScope}
                      onChange={handleCheckboxChange}
                    />
                    <Label htmlFor="changeToScope">Change to the Scope (Cl. 14.3)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="changeToKeyDate" 
                      checked={formData.changeToKeyDate}
                      onChange={handleCheckboxChange}
                    />
                    <Label htmlFor="changeToKeyDate">Change to Key Date (Cl. 14.3)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="compensationEvent" 
                      checked={formData.compensationEvent}
                      onChange={handleCheckboxChange}
                    />
                    <Label htmlFor="compensationEvent">Compensation Event (Cl. 60.1(1))</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="noChange" 
                      checked={formData.noChange}
                      onChange={handleCheckboxChange}
                    />
                    <Label htmlFor="noChange">No change to Prices or Time</Label>
                  </div>
                </div>
              </div>
            </AnimationWrapper>

            <AnimationWrapper type="fadeIn" delay={1.0}>
              <div>
                <Label htmlFor="quotationRequired" className="font-semibold">Quotation Required:</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="quotation" 
                      id="quotation-yes" 
                      value="yes" 
                      checked={formData.quotationRequired === 'yes'}
                      onChange={handleRadioChange}
                    />
                    <Label htmlFor="quotation-yes">Yes - Submit within 3 weeks (Cl. 62.3)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name="quotation" 
                      id="quotation-no" 
                      value="no" 
                      checked={formData.quotationRequired === 'no'}
                      onChange={handleRadioChange}
                    />
                    <Label htmlFor="quotation-no">No</Label>
                  </div>
                </div>
              </div>
            </AnimationWrapper>

            <AnimationWrapper type="fadeIn" delay={1.1}>
              <div>
                <Label htmlFor="responseDate" className="font-semibold">Contractor Response Required By:</Label>
                <Input 
                  type="date" 
                  id="responseDate" 
                  value={formData.responseDate}
                  onChange={handleInputChange}
                />
              </div>
            </AnimationWrapper>

            <AnimationWrapper type="fadeIn" delay={1.2}>
              <div className="border-t pt-4">
                <p className="font-semibold mb-2">Project Manager</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pmName">Name</Label>
                    <Input 
                      id="pmName" 
                      placeholder="Project Manager name" 
                      value={formData.pmName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pmSignature">Signature</Label>
                    <Input 
                      id="pmSignature" 
                      placeholder="Electronic signature or typed name" 
                      value={formData.pmSignature}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </AnimationWrapper>

            <AnimationWrapper type="fadeIn" delay={1.3}>
              <div className="p-4 bg-gray-50 rounded-md text-sm">
                <p className="font-semibold mb-2">Confirmation of Receipt (To be completed by the Contractor)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="receipt-name">Name</Label>
                    <Input id="receipt-name" placeholder="Contractor representative name" disabled />
                  </div>
                  <div>
                    <Label htmlFor="receipt-date">Date</Label>
                    <Input id="receipt-date" type="date" disabled />
                  </div>
                </div>
              </div>
            </AnimationWrapper>

            <AnimationWrapper type="fadeIn" delay={1.4}>
              <div className="p-4 bg-slate-100 rounded-md text-sm">
                <p className="font-semibold">Notes:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>This instruction is issued under the NEC4 Engineering and Construction Contract.</li>
                  <li>Instructions are only valid when issued by the Project Manager (or delegated authority) in accordance with Clauses 13.1 and 14.3.</li>
                  <li>The Contractor is required to acknowledge receipt of this instruction.</li>
                  <li>If this instruction causes a compensation event, please follow the procedures outlined in Clause 61.3 onwards.</li>
                  <li>If the Contractor believes this instruction constitutes a compensation event but is not marked as such, notify the Project Manager within 8 weeks (Clause 61.3).</li>
                </ol>
              </div>
            </AnimationWrapper>
          </CardContent>
          
          <CardFooter className="flex justify-between space-x-2 border-t pt-4">
            <AnimationWrapper type="slideIn" delay={1.5}>
              <div className="flex space-x-2">
                <AnimatedButton 
                  type="button" 
                  onClick={handleSaveDraft}
                  variant="outline" 
                  className="gap-1 bg-white" 
                  animation="subtle"
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </AnimatedButton>
                
                <AnimatedButton 
                  onClick={handleSubmit} 
                  className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                  animation="bounce"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Submit PMI
                    </>
                  )}
                </AnimatedButton>
              </div>
            </AnimationWrapper>
            
            <AnimationWrapper type="fadeIn" delay={1.6}>
              <div className="flex space-x-2">
                <AnimatedButton 
                  variant="outline" 
                  onClick={handlePrint} 
                  className="gap-1 bg-white" 
                  animation="subtle"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </AnimatedButton>
                
                <AnimatedButton 
                  onClick={handleDownload} 
                  className="gap-1 bg-teal-600 hover:bg-teal-700 text-white" 
                  animation="subtle"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </AnimatedButton>
              </div>
            </AnimationWrapper>
          </CardFooter>
        </Card>
      </AnimationWrapper>
    </div>
  );
};

export default PMITemplate;