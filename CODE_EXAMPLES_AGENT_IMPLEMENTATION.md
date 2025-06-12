# NEC4 Platform - Agent Implementation Code Examples

## Email Intake Agent - Complete Implementation

### Core Email Processing Component
**File: `client/src/components/email/simple-email-demo.tsx`**

```typescript
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Mail, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface ProcessedResult {
  classification: {
    type: string;
    confidence: number;
    suggestedTemplate: string;
  };
  extractedData: {
    projectReference?: string;
    contractReference?: string;
    documentType?: string;
    urgency?: string;
    estimatedValue?: number;
    description?: string;
  };
  suggestedActions: string[];
}

export default function SimpleEmailDemo() {
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [attachments, setAttachments] = useState<Array<{name: string, content: string}>>([]);
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);
  const [processing, setProcessing] = useState(false);

  // NEC4 Document Templates
  const nec4Templates = [
    { value: "compensation_event", label: "Compensation Event Notification" },
    { value: "early_warning", label: "Early Warning Notice" },
    { value: "payment_certificate", label: "Payment Certificate" },
    { value: "programme_submission", label: "Programme Submission" },
    { value: "non_conformance", label: "Non-Conformance Report" },
    { value: "variation_instruction", label: "Variation Instruction" },
    { value: "project_manager_instruction", label: "Project Manager Instruction" },
    { value: "contractor_submission", label: "Contractor Submission" }
  ];

  // AI-powered email processing
  const processEmail = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/email/process-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          body: emailBody,
          from: fromEmail,
          selectedTemplate,
          attachments: attachments.map(att => ({
            filename: att.name,
            content: att.content
          }))
        })
      });

      if (!response.ok) throw new Error('Processing failed');
      
      const result = await response.json();
      setProcessedResult(result);
    } catch (error) {
      console.error('Email processing failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setAttachments(prev => [...prev, { 
            name: file.name, 
            content: content.split(',')[1] // Remove data:application/pdf;base64, prefix
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Intake & Processing
          </CardTitle>
          <CardDescription>
            AI-powered email classification and NEC4 document processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">From Email</label>
              <Input
                placeholder="sender@contractor.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">NEC4 Document Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type..." />
                </SelectTrigger>
                <SelectContent>
                  {nec4Templates.map(template => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email Subject</label>
            <Input
              placeholder="RE: Compensation Event CE-015 - Unforeseen Ground Conditions"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email Content</label>
            <Textarea
              placeholder="Email body content..."
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={6}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Attachments</label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-indigo-600 hover:text-indigo-500"
                  >
                    Upload files
                  </label>
                  <p className="text-gray-500">or drag and drop</p>
                </div>
              </div>
              {attachments.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium">Attached Files:</h4>
                  <ul className="mt-2 space-y-1">
                    {attachments.map((file, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4" />
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={processEmail} 
            disabled={processing || !emailSubject || !emailBody}
            className="w-full"
          >
            {processing ? 'Processing...' : 'Process Email with AI'}
          </Button>
        </CardContent>
      </Card>

      {/* Processing Results */}
      {processedResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              AI Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Classification Results */}
            <div>
              <h4 className="font-medium mb-2">Email Classification</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {processedResult.classification.type}
                </Badge>
                <span className="text-sm text-gray-600">
                  Confidence: {Math.round(processedResult.classification.confidence * 100)}%
                </span>
              </div>
              {processedResult.classification.suggestedTemplate && (
                <p className="text-sm text-blue-600 mt-1">
                  Suggested Template: {processedResult.classification.suggestedTemplate}
                </p>
              )}
            </div>

            {/* Extracted Data */}
            <div>
              <h4 className="font-medium mb-2">Extracted Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {Object.entries(processedResult.extractedData).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Actions */}
            <div>
              <h4 className="font-medium mb-2">Suggested Actions</h4>
              <ul className="space-y-1">
                {processedResult.suggestedActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

## Commercial Agent - Compensation Events Management

### Compensation Events Component
**File: `client/src/pages/compensation-events.tsx`**

```typescript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, DollarSign, FileText, AlertTriangle } from "lucide-react";
import { useProject } from "@/contexts/project-context";
import { format } from "date-fns";

interface CompensationEvent {
  id: number;
  projectId: number;
  reference: string;
  title: string;
  description: string;
  clauseReference: string;
  estimatedValue: number;
  actualValue: number;
  status: string;
  raisedBy: number;
  raisedAt: string;
  responseDeadline: string;
  implementedDate?: string;
}

export default function CompensationEvents() {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newCE, setNewCE] = useState({
    title: '',
    description: '',
    clauseReference: '',
    estimatedValue: '',
    status: 'Notification'
  });

  // Fetch compensation events for current project
  const { data: compensationEvents, isLoading } = useQuery({
    queryKey: ['/api/projects', currentProject?.id, 'compensation-events'],
    enabled: !!currentProject?.id,
  });

  // Create compensation event mutation
  const createCEMutation = useMutation({
    mutationFn: async (ceData: any) => {
      const response = await fetch('/api/compensation-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ceData,
          projectId: currentProject?.id,
          raisedBy: 1, // Current user
          raisedAt: new Date().toISOString(),
          responseDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/projects', currentProject?.id, 'compensation-events']
      });
      setIsCreating(false);
      setNewCE({
        title: '',
        description: '',
        clauseReference: '',
        estimatedValue: '',
        status: 'Notification'
      });
    },
  });

  const handleCreateCE = () => {
    createCEMutation.mutate({
      ...newCE,
      estimatedValue: parseInt(newCE.estimatedValue) || 0,
      reference: `CE-${String(Date.now()).slice(-3)}`
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Notification': return 'default';
      case 'Quotation Due': return 'secondary';
      case 'Under Review': return 'outline';
      case 'Accepted': return 'default';
      case 'Implemented': return 'default';
      default: return 'secondary';
    }
  };

  const getUrgencyLevel = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 3) return { level: 'high', color: 'text-red-600', icon: AlertTriangle };
    if (days <= 7) return { level: 'medium', color: 'text-orange-600', icon: Clock };
    return { level: 'low', color: 'text-green-600', icon: Calendar };
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading compensation events...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Compensation Events</h1>
          <p className="text-gray-600">Manage NEC4 compensation events and variations</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          Create New CE
        </Button>
      </div>

      {/* Create CE Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Compensation Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  placeholder="Brief description of the event"
                  value={newCE.title}
                  onChange={(e) => setNewCE({...newCE, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">NEC4 Clause Reference</label>
                <Select value={newCE.clauseReference} onValueChange={(value) => setNewCE({...newCE, clauseReference: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select clause..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60.1(1)">60.1(1) - Change to the Works Information</SelectItem>
                    <SelectItem value="60.1(2)">60.1(2) - Change to a condition of contract</SelectItem>
                    <SelectItem value="60.1(12)">60.1(12) - Physical conditions</SelectItem>
                    <SelectItem value="60.1(13)">60.1(13) - Weather conditions</SelectItem>
                    <SelectItem value="60.1(19)">60.1(19) - Breach of contract by the Employer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                placeholder="Detailed description of the compensation event..."
                value={newCE.description}
                onChange={(e) => setNewCE({...newCE, description: e.target.value})}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Estimated Value (£)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newCE.estimatedValue}
                  onChange={(e) => setNewCE({...newCE, estimatedValue: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select value={newCE.status} onValueChange={(value) => setNewCE({...newCE, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Notification">Notification</SelectItem>
                    <SelectItem value="Quotation Due">Quotation Due</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateCE} disabled={createCEMutation.isPending}>
                {createCEMutation.isPending ? 'Creating...' : 'Create CE'}
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compensation Events List */}
      <div className="grid gap-4">
        {compensationEvents?.map((ce: CompensationEvent) => {
          const urgency = getUrgencyLevel(ce.responseDeadline);
          const UrgencyIcon = urgency.icon;
          
          return (
            <Card key={ce.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{ce.reference}</h3>
                      <Badge variant={getStatusBadgeVariant(ce.status)}>
                        {ce.status}
                      </Badge>
                    </div>
                    <h4 className="text-md font-medium text-gray-900 mb-1">{ce.title}</h4>
                    <p className="text-sm text-gray-600">{ce.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-2xl font-bold">
                      <DollarSign className="w-5 h-5" />
                      £{ce.estimatedValue?.toLocaleString() || 0}
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${urgency.color}`}>
                      <UrgencyIcon className="w-4 h-4" />
                      Due: {format(new Date(ce.responseDeadline), 'MMM dd')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>Clause: {ce.clauseReference}</span>
                    <span>Raised: {format(new Date(ce.raisedAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Update Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {compensationEvents?.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Compensation Events</h3>
            <p className="text-gray-600 mb-4">Create your first compensation event to get started.</p>
            <Button onClick={() => setIsCreating(true)}>
              Create Compensation Event
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

## Procurement Agent - Equipment Hire Management

### Equipment Hire Implementation
**File: `client/src/pages/equipment-hire.tsx`**

```typescript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, Calendar, DollarSign, MapPin, AlertTriangle } from "lucide-react";
import { useProject } from "@/contexts/project-context";

interface EquipmentHire {
  id: number;
  projectId: number;
  equipmentType: string;
  supplier: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  status: string;
  specifications: any;
}

export default function EquipmentHire() {
  const { currentProject } = useProject();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Fetch equipment hire data
  const { data: equipment, isLoading } = useQuery({
    queryKey: ['/api/projects', currentProject?.id, 'equipment-hire'],
    enabled: !!currentProject?.id,
  });

  // Equipment categories for filtering
  const equipmentTypes = [
    'All Equipment',
    'Excavators',
    'Dumpers',
    'Cranes',
    'Concrete Equipment',
    'Site Accommodation',
    'Access Equipment',
    'Compaction Equipment'
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'available': { variant: 'default', color: 'bg-green-100 text-green-800' },
      'hired': { variant: 'secondary', color: 'bg-blue-100 text-blue-800' },
      'maintenance': { variant: 'outline', color: 'bg-orange-100 text-orange-800' },
      'unavailable': { variant: 'destructive', color: 'bg-red-100 text-red-800' }
    };
    return variants[status] || variants['available'];
  };

  const filteredEquipment = equipment?.filter((item: EquipmentHire) => {
    const typeMatch = selectedType === 'all' || item.equipmentType.toLowerCase().includes(selectedType.toLowerCase());
    const statusMatch = selectedStatus === 'all' || item.status === selectedStatus;
    return typeMatch && statusMatch;
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading equipment hire data...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Equipment Hire Management</h1>
          <p className="text-gray-600">Manage construction equipment and plant hire</p>
        </div>
        <Button>
          Request Equipment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium mb-1">Equipment Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Equipment</SelectItem>
                  <SelectItem value="excavators">Excavators</SelectItem>
                  <SelectItem value="dumpers">Dumpers</SelectItem>
                  <SelectItem value="cranes">Cranes</SelectItem>
                  <SelectItem value="concrete">Concrete Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="hired">Currently Hired</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment?.map((item: EquipmentHire) => {
          const statusInfo = getStatusBadge(item.status);
          
          return (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{item.equipmentType}</CardTitle>
                  </div>
                  <Badge className={statusInfo.color}>
                    {item.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 font-medium">{item.supplier}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Pricing Information */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      £{item.dailyRate}
                    </div>
                    <div className="text-xs text-gray-500">per day</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      £{item.weeklyRate}
                    </div>
                    <div className="text-xs text-gray-500">per week</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      £{item.monthlyRate}
                    </div>
                    <div className="text-xs text-gray-500">per month</div>
                  </div>
                </div>

                {/* Specifications */}
                {item.specifications && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Specifications</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(item.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">{key}:</span>
                          <span className="font-medium">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {item.status === 'available' ? (
                    <Button className="flex-1" size="sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      Book Now
                    </Button>
                  ) : item.status === 'hired' ? (
                    <Button variant="outline" className="flex-1" size="sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      Track Location
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1" size="sm" disabled>
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Unavailable
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </div>

                {/* Cost Analysis */}
                {item.status === 'hired' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 font-medium">Current Hire</span>
                      <span className="text-blue-900 font-bold">
                        £{(item.weeklyRate * 2).toLocaleString()}/fortnight
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {equipment?.filter((e: EquipmentHire) => e.status === 'available').length || 0}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {equipment?.filter((e: EquipmentHire) => e.status === 'hired').length || 0}
            </div>
            <div className="text-sm text-gray-600">Currently Hired</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {equipment?.filter((e: EquipmentHire) => e.status === 'maintenance').length || 0}
            </div>
            <div className="text-sm text-gray-600">In Maintenance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              £{equipment?.reduce((total: number, e: EquipmentHire) => 
                e.status === 'hired' ? total + e.weeklyRate : total, 0)?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">Weekly Hire Cost</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

This code demonstrates the practical implementation of the specialized AI agents with real NEC4 contract management functionality, including email processing, compensation events management, and equipment hire tracking.