import { useState } from "react";
import { useProject } from "@/contexts/project-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2 } from "lucide-react";

export default function ProjectManagerInstructions() {
  const { projectId, currentProject } = useProject();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    reference: "",
    title: "",
    description: "",
    clauseReference: "",
    instruction: "",
    responseDeadline: "",
    priority: "Normal",
  });
  
  // Listen for AI form population events
  useState(() => {
    const handleFormPopulation = (event: CustomEvent) => {
      const data = event.detail.formData;
      if (data) {
        setFormData({
          ...formData,
          ...data
        });
        
        toast({
          title: "Form populated by AI",
          description: "The form fields have been populated based on project context",
        });
      }
    };

    window.addEventListener('ai-form-populated', handleFormPopulation as EventListener);
    
    return () => {
      window.removeEventListener('ai-form-populated', handleFormPopulation as EventListener);
    };
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API submission
    setTimeout(() => {
      toast({
        title: "Instruction issued",
        description: `PMI ${formData.reference} has been issued successfully.`,
      });
      setIsSubmitting(false);
      
      // Reset form
      setFormData({
        reference: "",
        title: "",
        description: "",
        clauseReference: "",
        instruction: "",
        responseDeadline: "",
        priority: "Normal",
      });
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Project Manager's Instructions</h1>
        <p className="text-gray-500">
          {currentProject 
            ? `Issue formal instructions to the Contractor on ${currentProject.name}` 
            : "Issue formal instructions to the Contractor"}
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>New Project Manager's Instruction</CardTitle>
          <CardDescription>
            Use this form to issue a formal NEC4 instruction to the Contractor.
            Instructions must reference the appropriate NEC4 contract clause.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference">Reference Number</Label>
                <Input
                  id="reference"
                  name="reference"
                  placeholder="PMI-001"
                  value={formData.reference}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clauseReference">NEC4 Clause Reference</Label>
                <Input
                  id="clauseReference"
                  name="clauseReference"
                  placeholder="e.g. 14.3"
                  value={formData.clauseReference}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Brief title of the instruction"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Provide context for this instruction"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="instruction">Formal Instruction</Label>
              <Textarea
                id="instruction"
                name="instruction"
                placeholder="The Project Manager hereby instructs the Contractor to..."
                value={formData.instruction}
                onChange={handleInputChange}
                rows={5}
                className="font-medium"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responseDeadline">Response Deadline</Label>
                <Input
                  id="responseDeadline"
                  name="responseDeadline"
                  type="date"
                  value={formData.responseDeadline}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => handleSelectChange("priority", value)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button 
              variant="outline"
              type="button"
              onClick={() => setFormData({
                reference: "",
                title: "",
                description: "",
                clauseReference: "",
                instruction: "",
                responseDeadline: "",
                priority: "Normal",
              })}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Issuing Instruction...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Issue Instruction
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}