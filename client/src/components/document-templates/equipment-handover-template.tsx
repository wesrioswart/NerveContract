import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CalendarIcon, Download, FileText, Truck, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export default function EquipmentHandoverTemplate() {
  const [formData, setFormData] = useState({
    projectName: "",
    contractNumber: "",
    equipmentType: "",
    equipmentModel: "",
    serialNumber: "",
    supplierName: "",
    deliveryDate: null as Date | null,
    handoverDate: null as Date | null,
    hireStartDate: null as Date | null,
    hireEndDate: null as Date | null,
    operatorName: "",
    operatorLicense: "",
    locationOnSite: "",
    workingCondition: "",
    safetyChecks: {
      visualInspection: false,
      operationalTest: false,
      safetyDevices: false,
      documentation: false,
      training: false
    },
    defects: "",
    additionalNotes: "",
    receivedBy: "",
    handedOverBy: "",
    witnessName: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: string, date: Date | null) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      safetyChecks: { ...prev.safetyChecks, [field]: checked }
    }));
  };

  const generateDocument = () => {
    console.log("Generating Equipment Handover Certificate...");
  };

  const allChecksComplete = Object.values(formData.safetyChecks).every(check => check);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Equipment Handover Certificate</h2>
          <p className="text-gray-600">NEC4 Equipment Hire & Safety Compliance Documentation</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          NEC4 Equipment Hire
        </Badge>
      </div>

      <Card className="border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-800 flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Equipment Handover Protocol
          </CardTitle>
          <CardDescription className="text-blue-700">
            This certificate documents the safe handover of equipment in accordance with NEC4 contract requirements and HSE regulations. All safety checks must be completed before equipment operation.
          </CardDescription>
        </CardHeader>
      </Card>

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
              <Label htmlFor="locationOnSite">Location on Site</Label>
              <Input
                id="locationOnSite"
                value={formData.locationOnSite}
                onChange={(e) => handleInputChange("locationOnSite", e.target.value)}
                placeholder="Compound A, Grid Reference: TL 123 456"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="equipmentType">Equipment Type</Label>
              <Select value={formData.equipmentType} onValueChange={(value) => handleInputChange("equipmentType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excavator">Excavator</SelectItem>
                  <SelectItem value="crane">Mobile Crane</SelectItem>
                  <SelectItem value="dumper">Dumper Truck</SelectItem>
                  <SelectItem value="roller">Road Roller</SelectItem>
                  <SelectItem value="generator">Generator</SelectItem>
                  <SelectItem value="pump">Water Pump</SelectItem>
                  <SelectItem value="compressor">Air Compressor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="equipmentModel">Equipment Model</Label>
              <Input
                id="equipmentModel"
                value={formData.equipmentModel}
                onChange={(e) => handleInputChange("equipmentModel", e.target.value)}
                placeholder="CAT 320D2 L"
              />
            </div>
            <div>
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                placeholder="HZY12345"
              />
            </div>
            <div>
              <Label htmlFor="supplierName">Supplier/Hire Company</Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                onChange={(e) => handleInputChange("supplierName", e.target.value)}
                placeholder="ABC Plant Hire Ltd"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hire Period & Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deliveryDate ? format(formData.deliveryDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.deliveryDate}
                    onSelect={(date) => handleDateChange("deliveryDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="hireStartDate">Hire Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.hireStartDate ? format(formData.hireStartDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.hireStartDate}
                    onSelect={(date) => handleDateChange("hireStartDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="hireEndDate">Hire End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.hireEndDate ? format(formData.hireEndDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.hireEndDate}
                    onSelect={(date) => handleDateChange("hireEndDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operator Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="operatorName">Operator Name</Label>
              <Input
                id="operatorName"
                value={formData.operatorName}
                onChange={(e) => handleInputChange("operatorName", e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div>
              <Label htmlFor="operatorLicense">License/Certification</Label>
              <Input
                id="operatorLicense"
                value={formData.operatorLicense}
                onChange={(e) => handleInputChange("operatorLicense", e.target.value)}
                placeholder="CPCS A02 (Crawler Crane above 10 tonnes)"
              />
            </div>
            <div>
              <Label htmlFor="workingCondition">Working Condition Assessment</Label>
              <Select value={formData.workingCondition} onValueChange={(value) => handleInputChange("workingCondition", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="satisfactory">Satisfactory</SelectItem>
                  <SelectItem value="poor">Poor - Requires Attention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={`border-2 ${allChecksComplete ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            {allChecksComplete ? (
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="mr-2 h-5 w-5 text-amber-600" />
            )}
            Safety Inspection Checklist
          </CardTitle>
          <CardDescription>
            All safety checks must be completed before equipment handover. This ensures compliance with HSE regulations and NEC4 contract requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="visualInspection"
                  checked={formData.safetyChecks.visualInspection}
                  onCheckedChange={(checked) => handleCheckboxChange("visualInspection", checked)}
                />
                <Label htmlFor="visualInspection" className="text-sm">
                  Visual inspection completed (exterior damage, leaks, wear)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="operationalTest"
                  checked={formData.safetyChecks.operationalTest}
                  onCheckedChange={(checked) => handleCheckboxChange("operationalTest", checked)}
                />
                <Label htmlFor="operationalTest" className="text-sm">
                  Operational test completed (controls, hydraulics, engine)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="safetyDevices"
                  checked={formData.safetyChecks.safetyDevices}
                  onCheckedChange={(checked) => handleCheckboxChange("safetyDevices", checked)}
                />
                <Label htmlFor="safetyDevices" className="text-sm">
                  Safety devices tested (alarms, lights, guards)
                </Label>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="documentation"
                  checked={formData.safetyChecks.documentation}
                  onCheckedChange={(checked) => handleCheckboxChange("documentation", checked)}
                />
                <Label htmlFor="documentation" className="text-sm">
                  Documentation provided (manual, certificates, insurance)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="training"
                  checked={formData.safetyChecks.training}
                  onCheckedChange={(checked) => handleCheckboxChange("training", checked)}
                />
                <Label htmlFor="training" className="text-sm">
                  Operator training/briefing completed
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Defects & Additional Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="defects">Defects or Issues Noted</Label>
            <Textarea
              id="defects"
              value={formData.defects}
              onChange={(e) => handleInputChange("defects", e.target.value)}
              placeholder="List any defects, damage, or issues observed during handover. If none, write 'None noted'."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes}
              onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
              placeholder="Any additional observations, special instructions, or requirements."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Handover Signatures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="handedOverBy">Handed Over By (Supplier)</Label>
              <Input
                id="handedOverBy"
                value={formData.handedOverBy}
                onChange={(e) => handleInputChange("handedOverBy", e.target.value)}
                placeholder="Mike Johnson - ABC Plant Hire"
              />
            </div>
            <div>
              <Label htmlFor="receivedBy">Received By (Contractor)</Label>
              <Input
                id="receivedBy"
                value={formData.receivedBy}
                onChange={(e) => handleInputChange("receivedBy", e.target.value)}
                placeholder="Sarah Wilson - Site Agent"
              />
            </div>
            <div>
              <Label htmlFor="witnessName">Witness (Optional)</Label>
              <Input
                id="witnessName"
                value={formData.witnessName}
                onChange={(e) => handleInputChange("witnessName", e.target.value)}
                placeholder="Jane Cooper - Project Manager"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-4">
        <Button 
          onClick={generateDocument} 
          className="flex-1"
          disabled={!allChecksComplete}
        >
          <Download className="mr-2 h-4 w-4" />
          Generate Certificate
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <FileText className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {!allChecksComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start space-x-3">
          <AlertCircle className="text-amber-500 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Safety Checks Required</p>
            <p className="text-sm text-amber-700 mt-1">
              Complete all safety inspection items before generating the handover certificate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}