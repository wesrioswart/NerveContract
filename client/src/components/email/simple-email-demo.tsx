import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, FileText, Truck, HelpCircle, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function SimpleEmailDemo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailData, setEmailData] = useState({
    from: 'supplier@example.com',
    subject: 'HIRE: Mini Excavator - Project: WDP-2024 - Equipment ID: EQP-5678',
    body: 'We request hire of 1x Mini Excavator (3-ton) for 15/01/2025 to 30/01/2025\nDelivery to: Westfield Site, W12 7GF\nContact: Site Manager'
  });

  const processEmailMutation = useMutation({
    mutationFn: async (data: typeof emailData) => {
      const response = await apiRequest('POST', '/api/email/process-demo', {
        emails: [data]
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Email Processed Successfully',
        description: `Created ${data.recordsCreated || 1} new project record(s)`,
      });
      
      // Refresh relevant data
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-hires'] });
    },
    onError: (error) => {
      toast({
        title: 'Processing Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const nec4DocumentTemplates = [
    {
      id: 'equipment-hire',
      type: 'Equipment Hire Request',
      category: 'Plant & Equipment',
      icon: Truck,
      nec4Reference: 'Clause 70.1 - Equipment',
      from: 'supplier@acme-plant.com',
      subject: 'HIRE: Mini Excavator - Project: WDP-2024 - Equipment ID: EQP-5678',
      body: `Equipment Hire Request

Project: Westfield Development Project (WDP-2024)
NEC4 Contract Reference: WDP/NEC4/2024

EQUIPMENT DETAILS:
- Type: Mini Excavator (3-ton)
- Model: CAT 305.5E2 CR
- Asset Reference: EQP-5678
- Operator Required: Yes (CPCS Certified)

HIRE PERIOD:
- Start Date: 15/01/2025
- End Date: 30/01/2025
- Working Hours: 08:00 - 17:00 (Mon-Fri)

DELIVERY DETAILS:
- Site Address: Westfield Development, W12 7GF
- Contact: Site Manager - 07123 456789
- Access Requirements: 3.5m height restriction

COMMERCIAL:
- Daily Rate: £150.00 + VAT
- Delivery/Collection: £75.00 each way
- Fuel: Client responsibility

Please confirm availability and provide hire agreement as per NEC4 Clause 70.1.

Kind regards,
Plant Hire Team`
    },
    {
      id: 'rfi-technical',
      type: 'Request for Information (RFI)',
      category: 'Technical Query',
      icon: HelpCircle,
      nec4Reference: 'Clause 17.1 - Ambiguities/Inconsistencies',
      from: 'engineer@contractor.com',
      subject: 'RFI-024: Concrete specification clarification - WDP-2024',
      body: `Request for Information

Project: Westfield Development Project (WDP-2024)
RFI Reference: RFI-024
NEC4 Contract Reference: WDP/NEC4/2024
Date: ${new Date().toLocaleDateString('en-GB')}

QUERY DETAILS:
Reference Documents: 
- Drawing: WDP-STR-001 Rev C
- Specification: Section 3.2.1

DESCRIPTION:
An inconsistency has been identified between the structural drawings and specification regarding concrete grade for ground beams.

SPECIFIC ISSUE:
- Drawing WDP-STR-001 Rev C shows: C35/45 concrete
- Specification Clause 3.2.1 states: C30/37 concrete

CLARIFICATION REQUIRED:
Which concrete grade should be used for ground beam construction in grid lines A-D?

PROGRAMME IMPACT:
- Response Required By: 20/01/2025
- Potential Delay: 2 working days if not resolved
- Affects Critical Path: Yes

Please provide written confirmation as per NEC4 Clause 17.1.

Submitted by: Senior Engineer
Company: Main Contractor Ltd`
    },
    {
      id: 'compensation-event',
      type: 'Compensation Event',
      category: 'NEC4 Event',
      icon: AlertTriangle,
      nec4Reference: 'Clause 60.1(12) - Physical Conditions',
      from: 'pm@maincontractor.com',
      subject: 'CE-042: Unforeseen ground conditions - WDP-2024',
      body: `Compensation Event Notification

Project: Westfield Development Project (WDP-2024)
CE Reference: CE-042
NEC4 Contract Reference: WDP/NEC4/2024
Notification Date: ${new Date().toLocaleDateString('en-GB')}

NEC4 CLAUSE: 60.1(12) - Physical conditions encountered which an experienced contractor would have judged at contract date to have such a small chance of occurring that it would have been unreasonable to have allowed for them.

EVENT DESCRIPTION:
Contaminated soil discovered in foundation excavation area B (Grid 3-6) requiring specialist removal and disposal.

DETAILS:
- Location: Foundation Area B (Chainage 125-145m)
- Contamination Type: Hydrocarbon contamination
- Depth: 0.5m - 2.1m below ground level
- Volume: Approximately 45m³

IMPACT ASSESSMENT:
Time Impact:
- Additional time required: 5 working days
- Critical path affected: Yes
- Programme recovery measures: Weekend working proposed

Cost Impact:
- Specialist contractor mobilization: £8,500
- Contaminated soil removal: £4,200
- Testing and certification: £1,800
- Weekend premium rates: £500
Total Estimated Cost: £15,000

SUPPORTING EVIDENCE:
- Site investigation report (attached)
- Photographic record (attached)
- Specialist contractor quotation (attached)

This event could not have been reasonably foreseen from the site investigation data available at contract award.

Request Project Manager assessment as per NEC4 Clause 61.3.

Submitted by: Project Manager
Date: ${new Date().toLocaleDateString('en-GB')}`
    },
    {
      id: 'early-warning',
      type: 'Early Warning Notice',
      category: 'Risk Management',
      icon: AlertCircle,
      nec4Reference: 'Clause 16.1 - Early Warning',
      from: 'supervisor@contractor.com',
      subject: 'EW-018: Weather delay risk - WDP-2024',
      body: `Early Warning Notice

Project: Westfield Development Project (WDP-2024)
EW Reference: EW-018
NEC4 Contract Reference: WDP/NEC4/2024
Date: ${new Date().toLocaleDateString('en-GB')}

NEC4 CLAUSE: 16.1 - Early Warning procedure

MATTER GIVING RISE TO WARNING:
Extended period of adverse weather conditions forecast which may impact concrete operations and external works.

RISK DESCRIPTION:
Met Office forecast indicates:
- Heavy rainfall: 15-20mm daily for next 7 days
- Temperature: Below 5°C overnight
- Wind speeds: 25-30mph gusts

POTENTIAL IMPACTS:
Programme Risk:
- Concrete pours may be delayed/cancelled
- External works suspension likely
- Crane operations restricted

Quality Risk:
- Concrete curing conditions compromised
- Surface water management issues
- Material protection requirements

Cost Risk:
- Additional temporary works
- Extended programme costs
- Material protection measures

PROPOSED MITIGATION:
1. Reschedule concrete operations to early next week
2. Implement enhanced weather protection
3. Increase site drainage capacity
4. Review programme recovery options

EARLY WARNING MEETING:
Requested within 2 days as per Clause 16.2 to discuss mitigation strategies.

Issued by: Site Supervisor
Company: Main Contractor Ltd`
    }
  ];

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Processing Demo
          </CardTitle>
          <CardDescription>
            Test the email processing system with sample contract documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* NEC4 Document Template Selector */}
          <div>
            <Label className="text-sm font-medium mb-2 block">NEC4 Document Templates</Label>
            <Select value={selectedTemplate} onValueChange={(value) => {
              setSelectedTemplate(value);
              const template = nec4DocumentTemplates.find(t => t.id === value);
              if (template) {
                setEmailData({
                  from: template.from,
                  subject: template.subject,
                  body: template.body
                });
              }
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a NEC4 document template..." />
              </SelectTrigger>
              <SelectContent>
                {nec4DocumentTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{template.type}</span>
                          <span className="text-xs text-muted-foreground">{template.nec4Reference}</span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {selectedTemplate && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {nec4DocumentTemplates.find(t => t.id === selectedTemplate)?.type}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {nec4DocumentTemplates.find(t => t.id === selectedTemplate)?.category}
                  </Badge>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {nec4DocumentTemplates.find(t => t.id === selectedTemplate)?.nec4Reference}
                </p>
              </div>
            )}
          </div>

          {/* Email Details */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                value={emailData.from}
                onChange={(e) => setEmailData(prev => ({ ...prev, from: e.target.value }))}
                placeholder="sender@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject line"
              />
            </div>
            
            <div>
              <Label htmlFor="body">Email Content</Label>
              <Textarea
                id="body"
                value={emailData.body}
                onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Email body content"
                rows={6}
              />
            </div>
          </div>

          <Button
            onClick={() => processEmailMutation.mutate(emailData)}
            disabled={processEmailMutation.isPending}
            className="w-full"
          >
            {processEmailMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Email...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Process Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Equipment Hire:</strong> Subject must include "HIRE:" followed by equipment type and project reference
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>RFI:</strong> Subject must include "RFI:" followed by query description and project reference
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Compensation Events:</strong> Subject must include "CE:" followed by event description
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>System Response:</strong> Creates appropriate records in your project management system automatically
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}