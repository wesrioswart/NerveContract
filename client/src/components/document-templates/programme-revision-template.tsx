import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Clock, FileText, Download, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface ProgrammeRevisionFormData {
  // Programme Details
  programmeRevisionRef: string;
  originalProgrammeRef: string;
  revisionDate: Date | null;
  revisionReason: string;
  
  // Related Documentation
  compensationEventRef: string;
  earlyWarningRef: string;
  approvalReference: string;
  
  // Programme Changes
  originalCompletionDate: Date | null;
  revisedCompletionDate: Date | null;
  timeExtension: string;
  criticalPathImpact: string;
  
  // Key Milestones
  keyMilestoneChanges: string;
  sectionalCompletionImpact: string;
  keyDatesAffected: string;
  
  // Technical Analysis
  aiAnalysisSummary: string;
  criticalPathAnalysis: string;
  resourceReallocation: string;
  
  // Approval & Justification
  approvalJustification: string;
  approvedBy: string;
  approvalDate: Date | null;
  
  // Programme Narrative
  programmeNarrative: string;
  assumptions: string;
  constraints: string;
  
  // Submission Details
  submittedBy: string;
  submissionDate: Date | null;
  clientReference: string;
  
  // AI Integration
  aiConfidenceScore: number;
  approvalStatus: string;
}

export function ProgrammeRevisionTemplate() {
  const [formData, setFormData] = useState<ProgrammeRevisionFormData>({
    programmeRevisionRef: "",
    originalProgrammeRef: "",
    revisionDate: null,
    revisionReason: "",
    compensationEventRef: "",
    earlyWarningRef: "",
    approvalReference: "",
    originalCompletionDate: null,
    revisedCompletionDate: null,
    timeExtension: "",
    criticalPathImpact: "",
    keyMilestoneChanges: "",
    sectionalCompletionImpact: "",
    keyDatesAffected: "",
    aiAnalysisSummary: "",
    criticalPathAnalysis: "",
    resourceReallocation: "",
    approvalJustification: "",
    approvedBy: "",
    approvalDate: null,
    programmeNarrative: "",
    assumptions: "",
    constraints: "",
    submittedBy: "",
    submissionDate: null,
    clientReference: "",
    aiConfidenceScore: 0,
    approvalStatus: "pending"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: string, date: Date | null) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  // AI Integration - Auto-populate from approval dashboard
  const loadApprovalData = async () => {
    try {
      // Connect to your AI approval system
      const response = await fetch('/api/ai-dashboard/programme-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalReference: formData.approvalReference })
      });
      
      if (response.ok) {
        const approvalData = await response.json();
        setFormData(prev => ({
          ...prev,
          aiAnalysisSummary: approvalData.technicalAnalysis || "",
          criticalPathAnalysis: approvalData.criticalPathImpact || "",
          timeExtension: approvalData.timeExtension || "",
          approvalJustification: approvalData.approvalReason || "",
          approvedBy: approvalData.approvedBy || "",
          approvalDate: approvalData.approvalDate ? new Date(approvalData.approvalDate) : null,
          aiConfidenceScore: approvalData.confidenceScore || 0
        }));
      }
    } catch (error) {
      console.error('Failed to load approval data:', error);
    }
  };

  const generateDocument = async () => {
    try {
      const documentHtml = `
        <html>
          <head>
            <title>Programme Revision Notice - ${formData.programmeRevisionRef}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .section { margin: 20px 0; }
              .milestone-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              .milestone-table th, .milestone-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .milestone-table th { background-color: #f2f2f2; }
              .approval-section { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; }
              .signature-section { margin-top: 40px; }
              .ai-analysis { background-color: #e8f4f8; padding: 10px; border-radius: 5px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Programme Revision Notice</h1>
              <p>NEC4 Contract - Formal Programme Update Submission</p>
            </div>
            
            <div class="section">
              <h2>Programme Revision Details</h2>
              <p><strong>Programme Revision Reference:</strong> ${formData.programmeRevisionRef}</p>
              <p><strong>Original Programme Reference:</strong> ${formData.originalProgrammeRef}</p>
              <p><strong>Revision Date:</strong> ${formData.revisionDate ? format(formData.revisionDate, "PPP") : "Not specified"}</p>
              <p><strong>Revision Reason:</strong> ${formData.revisionReason}</p>
            </div>
            
            <div class="section">
              <h2>Related Documentation</h2>
              <p><strong>Compensation Event Reference:</strong> ${formData.compensationEventRef}</p>
              <p><strong>Early Warning Reference:</strong> ${formData.earlyWarningRef}</p>
              <p><strong>Approval Reference:</strong> ${formData.approvalReference}</p>
            </div>
            
            <div class="section">
              <h2>Programme Changes</h2>
              <table class="milestone-table">
                <tr><th>Element</th><th>Original</th><th>Revised</th><th>Change</th></tr>
                <tr>
                  <td>Completion Date</td>
                  <td>${formData.originalCompletionDate ? format(formData.originalCompletionDate, "PPP") : "Not specified"}</td>
                  <td>${formData.revisedCompletionDate ? format(formData.revisedCompletionDate, "PPP") : "Not specified"}</td>
                  <td>${formData.timeExtension} days</td>
                </tr>
              </table>
              <p><strong>Critical Path Impact:</strong> ${formData.criticalPathImpact}</p>
              <p><strong>Key Milestone Changes:</strong> ${formData.keyMilestoneChanges}</p>
              <p><strong>Sectional Completion Impact:</strong> ${formData.sectionalCompletionImpact}</p>
            </div>
            
            <div class="ai-analysis">
              <h2>AI Technical Analysis</h2>
              <p><strong>Analysis Summary:</strong> ${formData.aiAnalysisSummary}</p>
              <p><strong>Critical Path Analysis:</strong> ${formData.criticalPathAnalysis}</p>
              <p><strong>Resource Reallocation:</strong> ${formData.resourceReallocation}</p>
              ${formData.aiConfidenceScore > 0 ? `<p><strong>AI Confidence Score:</strong> ${formData.aiConfidenceScore}%</p>` : ''}
            </div>
            
            <div class="approval-section">
              <h2>Approval & Justification</h2>
              <p><strong>Approval Justification:</strong> ${formData.approvalJustification}</p>
              <p><strong>Approved By:</strong> ${formData.approvedBy}</p>
              <p><strong>Approval Date:</strong> ${formData.approvalDate ? format(formData.approvalDate, "PPP") : "Not specified"}</p>
            </div>
            
            <div class="section">
              <h2>Programme Narrative</h2>
              <p><strong>Programme Narrative:</strong> ${formData.programmeNarrative}</p>
              <p><strong>Key Assumptions:</strong> ${formData.assumptions}</p>
              <p><strong>Constraints:</strong> ${formData.constraints}</p>
            </div>
            
            <div class="signature-section">
              <p><strong>Submitted By:</strong> ${formData.submittedBy}</p>
              <p><strong>Submission Date:</strong> ${formData.submissionDate ? format(formData.submissionDate, "PPP") : "Not specified"}</p>
              <p><strong>Client Reference:</strong> ${formData.clientReference}</p>
            </div>
          </body>
        </html>
      `;
      
      const blob = new Blob([documentHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Programme_Revision_${formData.programmeRevisionRef || 'Draft'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Programme Revision Notice generated successfully!');
    } catch (error) {
      console.error('Document generation failed:', error);
      alert('Failed to generate document. Please try again.');
    }
  };

  const submitForApproval = async () => {
    try {
      const response = await fetch('/api/approval-workflow/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'programme-revision',
          data: formData,
          timeExtension: parseInt(formData.timeExtension) || 0
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
          <h2 className="text-2xl font-bold">Programme Revision Notice</h2>
          <p className="text-gray-600">NEC4 Contract - Formal Programme Update Submission</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            NEC4 Programme
          </Badge>
          {formData.aiConfidenceScore > 0 && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              AI Confidence: {formData.aiConfidenceScore}%
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Programme Revision Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="programmeRevisionRef">Programme Revision Reference</Label>
              <Input
                id="programmeRevisionRef"
                value={formData.programmeRevisionRef}
                onChange={(e) => handleInputChange("programmeRevisionRef", e.target.value)}
                placeholder="PR-2024-001"
              />
            </div>
            <div>
              <Label htmlFor="originalProgrammeRef">Original Programme Reference</Label>
              <Input
                id="originalProgrammeRef"
                value={formData.originalProgrammeRef}
                onChange={(e) => handleInputChange("originalProgrammeRef", e.target.value)}
                placeholder="PROG-WF-2024-REV-3"
              />
            </div>
            <div>
              <Label htmlFor="revisionDate">Revision Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.revisionDate ? format(formData.revisionDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.revisionDate}
                    onSelect={(date) => handleDateChange("revisionDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="revisionReason">Revision Reason</Label>
              <Select value={formData.revisionReason} onValueChange={(value) => handleInputChange("revisionReason", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compensation-event">Compensation Event</SelectItem>
                  <SelectItem value="early-warning">Early Warning Resolution</SelectItem>
                  <SelectItem value="design-change">Design Change</SelectItem>
                  <SelectItem value="weather-delay">Weather Delay</SelectItem>
                  <SelectItem value="resource-optimization">Resource Optimization</SelectItem>
                  <SelectItem value="client-instruction">Client Instruction</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Related Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="compensationEventRef">Compensation Event Reference</Label>
              <Input
                id="compensationEventRef"
                value={formData.compensationEventRef}
                onChange={(e) => handleInputChange("compensationEventRef", e.target.value)}
                placeholder="CE-2024-001"
              />
            </div>
            <div>
              <Label htmlFor="earlyWarningRef">Early Warning Reference</Label>
              <Input
                id="earlyWarningRef"
                value={formData.earlyWarningRef}
                onChange={(e) => handleInputChange("earlyWarningRef", e.target.value)}
                placeholder="EW-2024-005"
              />
            </div>
            <div>
              <Label htmlFor="approvalReference">Approval Reference</Label>
              <div className="flex space-x-2">
                <Input
                  id="approvalReference"
                  value={formData.approvalReference}
                  onChange={(e) => handleInputChange("approvalReference", e.target.value)}
                  placeholder="AI-APP-2024-001"
                />
                <Button variant="outline" size="sm" onClick={loadApprovalData}>
                  Load AI Data
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Programme Changes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="originalCompletionDate">Original Completion Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.originalCompletionDate ? format(formData.originalCompletionDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.originalCompletionDate}
                    onSelect={(date) => handleDateChange("originalCompletionDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="revisedCompletionDate">Revised Completion Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.revisedCompletionDate ? format(formData.revisedCompletionDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.revisedCompletionDate}
                    onSelect={(date) => handleDateChange("revisedCompletionDate", date)}
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
            <Label htmlFor="criticalPathImpact">Critical Path Impact</Label>
            <Textarea
              id="criticalPathImpact"
              value={formData.criticalPathImpact}
              onChange={(e) => handleInputChange("criticalPathImpact", e.target.value)}
              placeholder="3-day delay affects Activity 1050 (Foundation Works) on critical path. Subsequent activities can absorb 1 day through optimization."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="keyMilestoneChanges">Key Milestone Changes</Label>
            <Textarea
              id="keyMilestoneChanges"
              value={formData.keyMilestoneChanges}
              onChange={(e) => handleInputChange("keyMilestoneChanges", e.target.value)}
              placeholder="Milestone M1 (Structural Completion) delayed by 2 days. Milestone M2 (Services Installation) maintains original date through resource acceleration."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-800">
            <AlertTriangle className="mr-2 h-5 w-5" />
            AI Technical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="aiAnalysisSummary">AI Analysis Summary</Label>
            <Textarea
              id="aiAnalysisSummary"
              value={formData.aiAnalysisSummary}
              onChange={(e) => handleInputChange("aiAnalysisSummary", e.target.value)}
              placeholder="AI analysis indicates 97% confidence in 3-day time extension. Critical path analysis shows minimal impact on key milestones through resource optimization."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="criticalPathAnalysis">Critical Path Analysis</Label>
            <Textarea
              id="criticalPathAnalysis"
              value={formData.criticalPathAnalysis}
              onChange={(e) => handleInputChange("criticalPathAnalysis", e.target.value)}
              placeholder="Critical path runs through Foundation Works → Structure → Services. 3-day extension at Foundation level recoverable through parallel working in Services phase."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="resourceReallocation">Resource Reallocation</Label>
            <Textarea
              id="resourceReallocation"
              value={formData.resourceReallocation}
              onChange={(e) => handleInputChange("resourceReallocation", e.target.value)}
              placeholder="Additional excavator allocated to Foundation Works. Services team increased by 2 technicians to maintain programme recovery."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <CheckCircle className="mr-2 h-5 w-5" />
            Approval & Justification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="approvalJustification">Approval Justification</Label>
            <Textarea
              id="approvalJustification"
              value={formData.approvalJustification}
              onChange={(e) => handleInputChange("approvalJustification", e.target.value)}
              placeholder="Programme revision approved based on AI analysis and technical review. Time extension justified by unforeseen ground conditions. Resource optimization plan maintains overall project completion target."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="approvedBy">Approved By</Label>
              <Input
                id="approvedBy"
                value={formData.approvedBy}
                onChange={(e) => handleInputChange("approvedBy", e.target.value)}
                placeholder="Sarah Johnson - Project Manager"
              />
            </div>
            <div>
              <Label htmlFor="approvalDate">Approval Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.approvalDate ? format(formData.approvalDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.approvalDate}
                    onSelect={(date) => handleDateChange("approvalDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programme Narrative</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="programmeNarrative">Programme Narrative</Label>
            <Textarea
              id="programmeNarrative"
              value={formData.programmeNarrative}
              onChange={(e) => handleInputChange("programmeNarrative", e.target.value)}
              placeholder="Revised programme maintains critical milestones through strategic resource allocation. Foundation phase extended by 3 days to accommodate additional excavation requirements. Services phase accelerated through additional resources to maintain overall completion target."
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="assumptions">Key Assumptions</Label>
            <Textarea
              id="assumptions"
              value={formData.assumptions}
              onChange={(e) => handleInputChange("assumptions", e.target.value)}
              placeholder="Weather conditions remain favorable. Additional resources available as planned. No further unforeseen ground conditions. Client approvals obtained within standard timeframes."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="constraints">Constraints</Label>
            <Textarea
              id="constraints"
              value={formData.constraints}
              onChange={(e) => handleInputChange("constraints", e.target.value)}
              placeholder="Site access limited to daylight hours. Planning permission restricts working hours. Utility diversions must be completed before structure work can commence."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="submittedBy">Submitted By</Label>
              <Input
                id="submittedBy"
                value={formData.submittedBy}
                onChange={(e) => handleInputChange("submittedBy", e.target.value)}
                placeholder="John Smith - Planning Manager"
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
            <div>
              <Label htmlFor="clientReference">Client Reference</Label>
              <Input
                id="clientReference"
                value={formData.clientReference}
                onChange={(e) => handleInputChange("clientReference", e.target.value)}
                placeholder="WF-PROG-2024-001"
              />
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
                Programme Revision Notice submitted successfully for client approval
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}