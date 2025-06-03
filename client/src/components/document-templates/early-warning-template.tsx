import { useState } from "react";
import { useProject } from "@/contexts/project-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle, FileText, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EarlyWarningTemplateProps {
  isOpen?: boolean;
  onClose?: () => void;
  trigger?: React.ReactNode;
}

export default function EarlyWarningTemplate({ isOpen, onClose, trigger }: EarlyWarningTemplateProps) {
  const { currentProject } = useProject();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    reference: `EW-${currentProject?.name?.includes('Northern Gateway') ? 'NGI' : 'WD'}-${String(Date.now()).slice(-3)}`,
    date: new Date().toISOString().split('T')[0],
    projectName: currentProject?.name || '',
    contractRef: currentProject?.contractReference || '',
    to: 'Project Manager',
    from: 'Jane Cooper - Principal Contractor',
    subject: 'Early Warning Notice - Unforeseen Ground Conditions',
    description: '',
    potentialImpacts: '',
    proposedActions: '',
    meetingRequired: true,
    urgency: 'High'
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a description of the early warning matter.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/early-warnings', {
        projectId: currentProject?.id,
        reference: formData.reference,
        description: formData.description,
        ownerId: 1, // Current user ID
        status: 'Open',
        raisedBy: 1,
        raisedAt: new Date(),
        mitigationPlan: formData.proposedActions,
        meetingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        attachments: null
      });

      queryClient.invalidateQueries({ 
        queryKey: [`/api/projects/${currentProject?.id}/early-warnings`] 
      });

      toast({
        title: "Early Warning Created",
        description: `Early Warning ${formData.reference} has been submitted successfully.`,
      });

      if (onClose) onClose();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to create early warning notice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const templateContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="font-semibold text-blue-900">NEC4 Early Warning Notice</h3>
          <Badge variant="destructive" className="ml-auto">Time Critical</Badge>
        </div>
        <p className="text-sm text-blue-700">
          Clause 15.1 - Both parties must notify early warnings as soon as becoming aware of any matter affecting cost, time, or quality.
        </p>
      </div>

      {/* Project Context */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Project Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reference" className="text-sm font-medium">EW Reference</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="date" className="text-sm font-medium">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="projectName" className="text-sm font-medium">Project Name</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                className="mt-1"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="contractRef" className="text-sm font-medium">Contract Reference</Label>
              <Input
                id="contractRef"
                value={formData.contractRef}
                onChange={(e) => handleInputChange('contractRef', e.target.value)}
                className="mt-1"
                readOnly
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Communication Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="to" className="text-sm font-medium">To</Label>
              <Input
                id="to"
                value={formData.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="from" className="text-sm font-medium">From</Label>
              <Input
                id="from"
                value={formData.from}
                onChange={(e) => handleInputChange('from', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Early Warning Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Early Warning Matter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description of Matter <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the matter that could affect cost, time, or quality..."
              className="mt-1 min-h-[100px]"
            />
          </div>
          <div>
            <Label htmlFor="potentialImpacts" className="text-sm font-medium">Potential Impacts</Label>
            <Textarea
              id="potentialImpacts"
              value={formData.potentialImpacts}
              onChange={(e) => handleInputChange('potentialImpacts', e.target.value)}
              placeholder="Describe potential impacts on cost, programme, or performance..."
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div>
            <Label htmlFor="proposedActions" className="text-sm font-medium">Proposed Mitigation Actions</Label>
            <Textarea
              id="proposedActions"
              value={formData.proposedActions}
              onChange={(e) => handleInputChange('proposedActions', e.target.value)}
              placeholder="Describe proposed actions to avoid or reduce the impact..."
              className="mt-1 min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Meeting will be scheduled within 7 days</span>
        </div>
        <div className="flex gap-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Early Warning
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Early Warning Notice</DialogTitle>
          </DialogHeader>
          {templateContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Early Warning Notice</CardTitle>
      </CardHeader>
      <CardContent>
        {templateContent}
      </CardContent>
    </Card>
  );
}