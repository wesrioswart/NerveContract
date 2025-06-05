import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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

  const emailTemplates = [
    {
      type: 'Equipment Hire',
      from: 'supplier@acme-plant.com',
      subject: 'HIRE: Mini Excavator - Project: WDP-2024 - Equipment ID: EQP-5678',
      body: 'We request hire of:\n- 1x Mini Excavator (3-ton)\n- Hire period: 15/01/2025 to 30/01/2025\n- Delivery to: Westfield Site, W12 7GF\n- Operator required: Yes\n- Contact: Site Manager on 07123 456789\n\nPlease confirm availability and daily rate.'
    },
    {
      type: 'RFI',
      from: 'engineer@contractor.com',
      subject: 'RFI: Concrete specification query - Project: WDP-2024',
      body: 'Reference: Drawing WDP-STR-001 Rev C\n\nQuery: The drawing shows C35/45 concrete for ground beams, but specification clause 3.2.1 references C30/37. Please clarify which grade is required.\n\nResponse required by: 20/01/2025\nProgramme impact: 2-day delay if not resolved by above date\n\nPlease provide written confirmation of correct concrete grade.'
    },
    {
      type: 'Compensation Event',
      from: 'pm@maincontractor.com',
      subject: 'CE: Unforeseen ground conditions - Project: WDP-2024',
      body: 'Compensation Event Notification\nReference: CE-042\nNEC4 Clause: 60.1(12)\n\nEvent: Contaminated soil discovered in foundation area B requiring specialist removal and disposal.\n\nImpact:\n- Time: 5 working days delay\n- Cost: £15,000 additional for specialist contractor\n- Programme: Affects critical path activities\n\nSupporting evidence attached. Request Project Manager assessment.'
    }
  ];

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
          {/* Quick Templates */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Quick Templates</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {emailTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setEmailData({
                    from: template.from,
                    subject: template.subject,
                    body: template.body
                  })}
                  className="justify-start"
                >
                  <Badge variant="secondary" className="mr-2 text-xs">
                    {template.type}
                  </Badge>
                  Use Template
                </Button>
              ))}
            </div>
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