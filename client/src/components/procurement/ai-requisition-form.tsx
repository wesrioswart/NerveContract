import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2, Send, Clipboard, FileText } from "lucide-react";

interface AIRequisitionFormProps {
  onSubmit?: (data: any) => void;
  className?: string;
}

// Mock nominal codes for demonstration
const nominalCodes = [
  { code: "5399", description: "OTHER SITE CONSUMABLES" },
  { code: "5402", description: "PLANT HIRE" },
  { code: "5100", description: "CONCRETE" },
  { code: "6250", description: "SUBCONTRACTORS" },
  { code: "5475", description: "PPE & SAFETY EQUIPMENT" },
  { code: "5525", description: "TOOLS & EQUIPMENT" },
];

// Mock suppliers
const supplierOptions = [
  { id: 1, name: "Thurrock Engineering" },
  { id: 2, name: "City Materials Ltd" },
  { id: 3, name: "FastTrack Equipment Hire" },
  { id: 4, name: "SafeGuard PPE Solutions" },
  { id: 5, name: "Concrete Express" },
];

// Mock projects
const projectOptions = [
  { id: 1, name: "C-121 Corys Waste Facility" },
  { id: 2, name: "C-130 Littlebrook Demolition" },
  { id: 3, name: "C-145 Westfield Development" },
];

const AIRequisitionForm: React.FC<AIRequisitionFormProps> = ({ 
  onSubmit, 
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState("standard");
  const [aiInputText, setAiInputText] = useState("");
  const [processingAI, setProcessingAI] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    projectId: "",
    nominalCode: "",
    classification: "",
    description: "",
    deliveryMethod: "delivery",
    hireDuration: "",
    estimatedCost: "",
    supplierId: "",
    contactDetails: "",
    deliveryDate: "",
    deliveryAddress: "Site address",
  });

  // AI processed example
  const processedExample = {
    projectId: "1",
    nominalCode: "5402",
    classification: "PLANT HIRE",
    description: "Hire of 1 x 13T excavator for groundworks at Corys site entrance, including operator and fuel.",
    deliveryMethod: "delivery",
    hireDuration: "2 weeks",
    estimatedCost: "3450.00",
    supplierId: "3",
    contactDetails: "David Williams <d.williams@fasttrackequipment.com>",
    deliveryDate: "15/05/2025",
    deliveryAddress: "Corys Waste Facility, Darent Industrial Park, Erith, DA8 1QN",
  };

  // Process AI input
  const processAIInput = async () => {
    if (!aiInputText.trim()) return;
    
    setProcessingAI(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      setProcessingAI(false);
      setFormData(processedExample);
    }, 1500);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl">Create Requisition</CardTitle>
        <CardDescription>
          Add a new procurement requisition for approval
        </CardDescription>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="standard">Standard Form</TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Wand2 className="h-3.5 w-3.5" />
              AI Assistant
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        <TabsContent value="standard" className="mt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Project</Label>
                <Select 
                  name="projectId"
                  value={formData.projectId} 
                  onValueChange={(value) => handleSelectChange("projectId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectOptions.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nominalCode">Nominal Code</Label>
                <Select 
                  name="nominalCode"
                  value={formData.nominalCode} 
                  onValueChange={(value) => handleSelectChange("nominalCode", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a nominal code" />
                  </SelectTrigger>
                  <SelectContent>
                    {nominalCodes.map((code) => (
                      <SelectItem key={code.code} value={code.code}>
                        {code.code} - {code.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier</Label>
                <Select 
                  name="supplierId"
                  value={formData.supplierId} 
                  onValueChange={(value) => handleSelectChange("supplierId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierOptions.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryMethod">Delivery Method</Label>
                <Select 
                  name="deliveryMethod"
                  value={formData.deliveryMethod} 
                  onValueChange={(value) => handleSelectChange("deliveryMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Delivery to Site</SelectItem>
                    <SelectItem value="collection">Collection from Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Item Description</Label>
                <Textarea 
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description of required items"
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hireDuration">Hire Duration (if applicable)</Label>
                <Input 
                  id="hireDuration"
                  name="hireDuration"
                  value={formData.hireDuration}
                  onChange={handleChange}
                  placeholder="e.g. 2 weeks or N/A"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost (£)</Label>
                <Input 
                  id="estimatedCost"
                  name="estimatedCost"
                  value={formData.estimatedCost}
                  onChange={handleChange}
                  placeholder="Amount excluding VAT"
                  type="number"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input 
                  id="deliveryDate"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <Input 
                  id="deliveryAddress"
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  placeholder="Site address"
                />
              </div>
            </div>
            
            <div className="pt-4 flex justify-end space-x-3">
              <Button type="button" variant="outline">Save Draft</Button>
              <Button type="submit">Submit Requisition</Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="ai" className="mt-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aiInput">
                Paste email, message or describe what you need
              </Label>
              <Textarea 
                id="aiInput"
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder="E.g. 'Need 13T excavator for Corys site entrance groundworks, 2 weeks from 15 May, approx £3450+VAT from FastTrack, deliver to Darent Industrial Park, Erith site'"
                className="min-h-[120px]"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={processAIInput} 
                disabled={processingAI || !aiInputText.trim()} 
                className="flex items-center gap-2"
              >
                {processingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Process with AI
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.readText().then(text => {
                    setAiInputText(text);
                  }).catch(err => {
                    console.error('Failed to read clipboard contents: ', err);
                  });
                }}
                className="flex items-center gap-2"
              >
                <Clipboard className="h-4 w-4" />
                Paste from Clipboard
              </Button>
            </div>
            
            {processingAI && (
              <div className="py-8 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-center text-muted-foreground">
                  Analyzing requisition details...
                </p>
              </div>
            )}
            
            {!processingAI && Object.values(formData).some(value => value) && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  AI-Extracted Requisition
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-sm font-medium">Project</p>
                    <p className="text-sm text-muted-foreground">
                      {projectOptions.find(p => p.id.toString() === formData.projectId)?.name || "Not specified"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Nominal Code</p>
                    <p className="text-sm text-muted-foreground">
                      {formData.nominalCode ? `${formData.nominalCode} - ${nominalCodes.find(n => n.code === formData.nominalCode)?.description}` : "Not specified"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">{formData.description || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Supplier</p>
                    <p className="text-sm text-muted-foreground">
                      {supplierOptions.find(s => s.id.toString() === formData.supplierId)?.name || "Not specified"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Delivery Date</p>
                    <p className="text-sm text-muted-foreground">{formData.deliveryDate || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Estimated Cost</p>
                    <p className="text-sm text-muted-foreground">
                      {formData.estimatedCost ? `£${formData.estimatedCost}` : "Not specified"}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setFormData({
                    projectId: "",
                    nominalCode: "",
                    classification: "",
                    description: "",
                    deliveryMethod: "delivery",
                    hireDuration: "",
                    estimatedCost: "",
                    supplierId: "",
                    contactDetails: "",
                    deliveryDate: "",
                    deliveryAddress: "Site address",
                  })}>
                    Reset
                  </Button>
                  <Button type="button" onClick={handleSubmit}>Submit Requisition</Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </CardContent>
    </Card>
  );
};

export default AIRequisitionForm;