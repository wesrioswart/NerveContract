import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, CalendarIcon, Download, FileText, PoundSterling, Calculator, Clock, AlertCircle, CheckCircle } from "lucide-react";
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

  // Auto-calculate total when cost fields change
  useEffect(() => {
    calculateTotalCost();
  }, [formData.people, formData.equipment, formData.plantMaterials, formData.subcontractors, formData.workingAreaOverhead, formData.overheads, formData.fee]);

  const generateDocument = () => {
    console.log("Generating Compensation Event Quotation...");
  };

  const submitForApproval = async () => {
    try {
      const response = await fetch('/api/approval-workflow/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'compensation-event-quotation',
          data: formData,
          value: parseFloat(formData.totalCost) || 0
        })
      });
      
      if (response.ok) {
        setFormData(prev => ({ ...prev, approvalStatus: 'submitted' }));
      }
    } catch (error) {
      console.error('Approval submission failed:', error);
    }
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
                placeholder="QUO-CE-2024-015"
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
              <Label htmlFor="compensationEventRef">Compensation Event Reference</Label>
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
          <CardTitle>Compensation Event Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="description">Description of Event and Proposed Changes</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Additional drainage works required due to unforeseen ground conditions in Section 3. Includes excavation, pipe installation, and reinstatement. Event triggered by discovery of underground utilities not shown on drawings."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Defined Cost Breakdown
          </CardTitle>
          <CardDescription>
            NEC4 Clause 11.2(23) - Breakdown of costs in accordance with the Schedule of Cost Components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="people">People (£)</Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="people"
                  type="number"
                  value={formData.people}
                  onChange={(e) => handleInputChange("people", e.target.value)}
                  placeholder="15,000"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="equipment">Equipment (£)</Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="equipment"
                  type="number"
                  value={formData.equipment}
                  onChange={(e) => handleInputChange("equipment", e.target.value)}
                  placeholder="8,500"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="plantMaterials">Plant and Materials (£)</Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="plantMaterials"
                  type="number"
                  value={formData.plantMaterials}
                  onChange={(e) => handleInputChange("plantMaterials", e.target.value)}
                  placeholder="12,000"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="subcontractors">Subcontractors (£)</Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="subcontractors"
                  type="number"
                  value={formData.subcontractors}
                  onChange={(e) => handleInputChange("subcontractors", e.target.value)}
                  placeholder="5,000"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="workingAreaOverhead">Working Area Overhead (£)</Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="workingAreaOverhead"
                  type="number"
                  value={formData.workingAreaOverhead}
                  onChange={(e) => handleInputChange("workingAreaOverhead", e.target.value)}
                  placeholder="3,200"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="overheads">Overheads (£)</Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="overheads"
                  type="number"
                  value={formData.overheads}
                  onChange={(e) => handleInputChange("overheads", e.target.value)}
                  placeholder="2,800"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="fee">Fee (£)</Label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="fee"
                  type="number"
                  value={formData.fee}
                  onChange={(e) => handleInputChange("fee", e.target.value)}
                  placeholder="4,500"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Label className="text-lg font-semibold">Total Cost (£)</Label>
              <div className="text-2xl font-bold text-blue-600">
                £{formData.totalCost || "0.00"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Time Impact Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="timeImpact">Time Impact Description</Label>
            <Textarea
              id="timeImpact"
              value={formData.timeImpact}
              onChange={(e) => handleInputChange("timeImpact", e.target.value)}
              placeholder="3 days delay to Activity 1050 (Foundation Works) affecting the critical path. Delay due to additional excavation and utility diversions."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="completionDateChange">Proposed Completion Date Change</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.completionDateChange ? format(formData.completionDateChange, "PPP") : "Select new date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.completionDateChange}
                    onSelect={(date) => handleDateChange("completionDateChange", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="timeExtension">Time Extension (days)</Label>
              <Input
                id="timeExtension"
                type="number"
                value={formData.timeExtension}
                onChange={(e) => handleInputChange("timeExtension", e.target.value)}
                placeholder="3"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="keyDatesImpact">Key Dates Impact</Label>
            <Textarea
              id="keyDatesImpact"
              value={formData.keyDatesImpact}
              onChange={(e) => handleInputChange("keyDatesImpact", e.target.value)}
              placeholder="No impact on Key Date 1 (Section 2 Completion). Key Date 2 (Drainage System Testing) delayed by 3 days."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programme Impact & Assumptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="programmeImpact">Programme Impact Analysis</Label>
            <Textarea
              id="programmeImpact"
              value={formData.programmeImpact}
              onChange={(e) => handleInputChange("programmeImpact", e.target.value)}
              placeholder="Critical path analysis shows 3-day delay to overall programme. Float available in subsequent activities allows for partial recovery. No impact on sectional completion dates."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="assumptions">Key Assumptions</Label>
            <Textarea
              id="assumptions"
              value={formData.assumptions}
              onChange={(e) => handleInputChange("assumptions", e.target.value)}
              placeholder="1. Weather conditions remain favourable during extended period. 2. Utilities diversion completed within 48 hours. 3. No further unforeseen conditions encountered. 4. Access to site maintained throughout."
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="quotationValidity">Quotation Validity Period</Label>
            <Select value={formData.quotationValidity} onValueChange={(value) => handleInputChange("quotationValidity", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select validity period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7-days">7 days</SelectItem>
                <SelectItem value="14-days">14 days</SelectItem>
                <SelectItem value="21-days">21 days</SelectItem>
                <SelectItem value="28-days">28 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="submittedBy">Submitted By</Label>
              <Input
                id="submittedBy"
                value={formData.submittedBy}
                onChange={(e) => handleInputChange("submittedBy", e.target.value)}
                placeholder="John Smith - Site Manager"
              />
            </div>
            <div>
              <Label htmlFor="submissionDate">Submission Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.submissionDate ? format(formData.submissionDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.submissionDate}
                    onSelect={(date) => handleDateChange("submissionDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-4">
        <Button onClick={generateDocument} variant="outline" className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Generate Document
        </Button>
        <Button onClick={submitForApproval} className="flex-1">
          {formData.approvalStatus === 'submitted' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submitted for Approval
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Submit for Approval
            </>
          )}
        </Button>
      </div>

      {formData.approvalStatus === 'submitted' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Quotation submitted for approval. Value: £{formData.totalCost}
              </span>
            </div>
            <p className="text-sm text-green-700 mt-2">
              This quotation has been routed to the appropriate authority based on the total value and will be processed through the approval workflow.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}