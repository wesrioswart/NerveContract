import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, CalendarIcon, Download, FileText, Pound, Calculator, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export default function CompensationEventQuotationTemplate() {
  const [formData, setFormData] = useState({
    projectName: "",
    contractNumber: "",
    quotationRef: "",
    quotationDate: null as Date | null,
    compensationEventRef: "",
    contractorName: "",
    description: "",
    // Defined Cost breakdown
    people: "",
    equipment: "",
    plantMaterials: "",
    subcontractors: "",
    workingAreaOverhead: "",
    overheads: "",
    fee: "",
    // Time impact
    timeImpact: "",
    completionDateChange: null as Date | null,
    keyDatesImpact: "",
    // Programme impact
    programmeImpact: "",
    criticalPathImpact: "",
    // Assumptions
    assumptions: "",
    quotationValidity: "",
    // Totals
    totalCost: "",
    timeExtension: "",
    // Submission details
    submittedBy: "",
    submissionDate: null as Date | null,
    approvalStatus: "pending",
    aiConfidenceScore: 0
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: string, date: Date | null) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  // AI Integration - Auto-populate from Commercial Agent analysis
  const loadAIAnalysis = async () => {
    try {
      // This would connect to your Commercial Agent's cost analysis
      const response = await fetch('/api/ai/compensation-event-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compensationEventRef: formData.compensationEventRef })
      });
      
      if (response.ok) {
        const aiData = await response.json();
        setFormData(prev => ({
          ...prev,
          people: aiData.definedCost.people || "",
          equipment: aiData.definedCost.equipment || "",
          plantMaterials: aiData.definedCost.plantMaterials || "",
          timeImpact: aiData.timeImpact || "",
          programmeImpact: aiData.programmeImpact || "",
          totalCost: aiData.totalCost || "",
          aiConfidenceScore: aiData.confidenceScore || 0
        }));
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
    }
  };

  const calculateTotalCost = () => {
    const costs = [
      parseFloat(formData.people) || 0,
      parseFloat(formData.equipment) || 0,
      parseFloat(formData.plantMaterials) || 0,
      parseFloat(formData.subcontractors) || 0,
      parseFloat(formData.workingAreaOverhead) || 0,
      parseFloat(formData.overheads) || 0,
      parseFloat(formData.fee) || 0
    ];
    const total = costs.reduce((sum, cost) => sum + cost, 0);
    setFormData(prev => ({ ...prev, totalCost: total.toFixed(2) }));
  };

  const generateDocument = () => {
    console.log("Generating Compensation Event Quotation...");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compensation Event Quotation</h2>
          <p className="text-gray-600">NEC4 Clause 62.2 - Contractor's Quotation for Compensation Events</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            NEC4 Clause 62.2
          </Badge>
          {formData.aiConfidenceScore > 0 && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              AI Confidence: {formData.aiConfidenceScore}%
            </Badge>
          )}
        </div>
      </div>

      <Card className="border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-800 flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            NEC4 Quotation Requirements
          </CardTitle>
          <CardDescription className="text-blue-700">
            "The Contractor submits a quotation for a compensation event to the Project Manager. The quotation comprises proposed changes to the Prices and any delay to the Completion Date and is in the form of a lump sum or as changes to the Activity Schedule."
          </CardDescription>
        </CardHeader>
      </Card>

      {formData.compensationEventRef && (
        <Card className="border-purple-200">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-purple-800 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              AI Analysis Available
            </CardTitle>
            <CardContent className="pt-4">
              <Button onClick={loadAIAnalysis} variant="outline" className="w-full">
                Load AI Cost Analysis for {formData.compensationEventRef}
              </Button>
            </CardContent>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => handleInputChange("projectName", e.target.value)}
                placeholder="Northern Gateway Infrastructure Project"
              />
            </div>
            <div>
              <Label htmlFor="contractNumber">Contract Number</Label>
              <Input
                id="contractNumber"
                value={formData.contractNumber}
                onChange={(e) => handleInputChange("contractNumber", e.target.value)}
                placeholder="NEC4-ECC-2024-001"
              />
            </div>
            <div>
              <Label htmlFor="contractorName">Contractor Name</Label>
              <Input
                id="contractorName"
                value={formData.contractorName}
                onChange={(e) => handleInputChange("contractorName", e.target.value)}
                placeholder="ABC Construction Limited"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quotation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="quotationRef">Quotation Reference</Label>
              <Input
                id="quotationRef"
                value={formData.quotationRef}
                onChange={(e) => handleInputChange("quotationRef", e.target.value)}
                placeholder="QUO-2024-015"
              />
            </div>
            <div>
              <Label htmlFor="quotationDate">Quotation Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.quotationDate ? format(formData.quotationDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.quotationDate}
                    onSelect={(date) => handleDateChange("quotationDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="compensationEventRef">Related Compensation Event</Label>
              <Input
                id="compensationEventRef"
                value={formData.compensationEventRef}
                onChange={(e) => handleInputChange("compensationEventRef", e.target.value)}
                placeholder="CE-2024-008"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scope of Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Description of Work</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Additional drainage works due to unforeseen ground conditions in Section 3. Includes excavation, pipe installation, and reinstatement as detailed in quotation QUO-2024-015."
              rows={4}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quotedAmount">Quoted Amount (£)</Label>
              <div className="relative">
                <Pound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="quotedAmount"
                  type="number"
                  value={formData.quotedAmount}
                  onChange={(e) => handleInputChange("quotedAmount", e.target.value)}
                  placeholder="25,000"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="acceptedAmount">Accepted Amount (£)</Label>
              <div className="relative">
                <Pound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="acceptedAmount"
                  type="number"
                  value={formData.acceptedAmount}
                  onChange={(e) => handleInputChange("acceptedAmount", e.target.value)}
                  placeholder="25,000"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Implementation & Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="implementationDate">Implementation Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.implementationDate ? format(formData.implementationDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.implementationDate}
                    onSelect={(date) => handleDateChange("implementationDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="acceptanceDate">Acceptance Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.acceptanceDate ? format(formData.acceptanceDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.acceptanceDate}
                    onSelect={(date) => handleDateChange("acceptanceDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectManager">Project Manager</Label>
              <Input
                id="projectManager"
                value={formData.projectManager}
                onChange={(e) => handleInputChange("projectManager", e.target.value)}
                placeholder="Jane Cooper"
              />
            </div>
            <div>
              <Label htmlFor="approvalAuthority">Approval Authority</Label>
              <Select value={formData.approvalAuthority} onValueChange={(value) => handleInputChange("approvalAuthority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select approval authority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project-manager">Project Manager (up to £75,000)</SelectItem>
                  <SelectItem value="commercial-manager">Commercial Manager (up to £100,000)</SelectItem>
                  <SelectItem value="director">Director (up to £250,000)</SelectItem>
                  <SelectItem value="board">Board Approval (above £250,000)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="additionalConditions">Additional Conditions or Notes</Label>
            <Textarea
              id="additionalConditions"
              value={formData.additionalConditions}
              onChange={(e) => handleInputChange("additionalConditions", e.target.value)}
              placeholder="Implementation subject to completion of current foundation works. Contractor to provide updated programme showing integration with existing works."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-4">
        <Button onClick={generateDocument} className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Generate Document
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <FileText className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
    </div>
  );
}