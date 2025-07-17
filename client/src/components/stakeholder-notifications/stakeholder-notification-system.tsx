import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Mail, Users, Clock, CheckCircle, AlertTriangle, Send } from 'lucide-react';

interface StakeholderGroup {
  id: string;
  name: string;
  members: string[];
  notificationPrefs: {
    email: boolean;
    sms: boolean;
    dashboard: boolean;
  };
  priority: 'high' | 'medium' | 'low';
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  urgency: 'urgent' | 'normal' | 'low';
}

interface StakeholderNotificationSystemProps {
  approvalReference?: string;
  documentType?: string;
  programmeChanges?: any;
}

export default function StakeholderNotificationSystem({ 
  approvalReference, 
  documentType = 'Programme Revision',
  programmeChanges 
}: StakeholderNotificationSystemProps) {
  const { toast } = useToast();
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock stakeholder groups - in production, this would come from your database
  const stakeholderGroups: StakeholderGroup[] = [
    {
      id: 'client_team',
      name: 'Client Team',
      members: ['client.pm@example.com', 'client.commercial@example.com'],
      notificationPrefs: { email: true, sms: false, dashboard: true },
      priority: 'high'
    },
    {
      id: 'project_team',
      name: 'Project Team',
      members: ['project.manager@company.com', 'site.engineer@company.com'],
      notificationPrefs: { email: true, sms: true, dashboard: true },
      priority: 'high'
    },
    {
      id: 'commercial_team',
      name: 'Commercial Team',
      members: ['commercial.manager@company.com', 'quantity.surveyor@company.com'],
      notificationPrefs: { email: true, sms: false, dashboard: true },
      priority: 'medium'
    },
    {
      id: 'subcontractors',
      name: 'Subcontractors',
      members: ['groundworks@subcontractor.com', 'steelwork@subcontractor.com'],
      notificationPrefs: { email: true, sms: false, dashboard: false },
      priority: 'medium'
    },
    {
      id: 'senior_management',
      name: 'Senior Management',
      members: ['director@company.com', 'operations.manager@company.com'],
      notificationPrefs: { email: true, sms: true, dashboard: true },
      priority: 'high'
    }
  ];

  const notificationTemplates: NotificationTemplate[] = [
    {
      id: 'programme_revision',
      name: 'Programme Revision Notice',
      subject: 'Programme Revision - {PROJECT_NAME} - {APPROVAL_REF}',
      body: `Dear Stakeholder,

Please be advised that a programme revision has been approved for {PROJECT_NAME}.

Revision Details:
- Approval Reference: {APPROVAL_REF}
- Impact: {TIME_IMPACT} days extension
- Cost Impact: £{COST_IMPACT}
- Critical Path: {CRITICAL_PATH_AFFECTED}

The revised programme document is attached for your review.

Key Changes:
{CHANGE_SUMMARY}

Next Steps:
- Please review the attached programme revision
- Update your internal schedules accordingly
- Contact the project team if you have any questions

Best regards,
Project Management Team`,
      urgency: 'normal'
    },
    {
      id: 'urgent_delay',
      name: 'Urgent Programme Delay',
      subject: 'URGENT: Programme Delay - {PROJECT_NAME}',
      body: `URGENT NOTICE

A significant programme delay has been approved for {PROJECT_NAME}.

Impact Summary:
- Delay: {TIME_IMPACT} days
- Cost: £{COST_IMPACT}
- Critical Path: AFFECTED

Immediate action required - please contact the project team urgently.

{CHANGE_SUMMARY}`,
      urgency: 'urgent'
    },
    {
      id: 'milestone_impact',
      name: 'Milestone Impact Notice',
      subject: 'Milestone Impact - {PROJECT_NAME}',
      body: `Milestone Impact Notice

Key milestones have been affected by the approved programme revision:

{MILESTONE_CHANGES}

Please update your planning accordingly.

{CHANGE_SUMMARY}`,
      urgency: 'normal'
    }
  ];

  // Auto-select relevant groups based on the change type
  useEffect(() => {
    if (programmeChanges?.impact?.affectsCriticalPath) {
      setSelectedGroups(['client_team', 'project_team', 'senior_management']);
    } else {
      setSelectedGroups(['project_team', 'commercial_team']);
    }
    
    // Auto-select appropriate template
    if (programmeChanges?.impact?.delayDays > 5) {
      setSelectedTemplate('urgent_delay');
    } else {
      setSelectedTemplate('programme_revision');
    }
  }, [programmeChanges]);

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const generateNotificationContent = () => {
    const template = notificationTemplates.find(t => t.id === selectedTemplate);
    if (!template) return { subject: '', body: '' };

    const replacements = {
      '{PROJECT_NAME}': 'Northern Gateway Project',
      '{APPROVAL_REF}': approvalReference || 'CE_001',
      '{TIME_IMPACT}': programmeChanges?.impact?.delayDays || '2',
      '{COST_IMPACT}': programmeChanges?.impact?.cost?.toLocaleString() || '12,500',
      '{CRITICAL_PATH_AFFECTED}': programmeChanges?.impact?.affectsCriticalPath ? 'YES' : 'NO',
      '{CHANGE_SUMMARY}': programmeChanges?.description || 'Programme revised due to approved compensation event',
      '{MILESTONE_CHANGES}': 'Phase 2 Foundation completion: +2 days\nSteel frame delivery: +1 day'
    };

    let subject = template.subject;
    let body = template.body;

    Object.entries(replacements).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(key, 'g'), value);
      body = body.replace(new RegExp(key, 'g'), value);
    });

    return { subject, body };
  };

  const sendNotifications = async () => {
    setIsLoading(true);
    try {
      const { subject, body } = generateNotificationContent();
      const finalMessage = customMessage || body;

      const response = await fetch('/api/stakeholder-notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stakeholderGroups: selectedGroups,
          subject,
          message: finalMessage,
          approvalReference,
          documentType,
          urgency: notificationTemplates.find(t => t.id === selectedTemplate)?.urgency || 'normal'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Notifications Sent",
          description: `Successfully notified ${result.recipientCount} stakeholders across ${selectedGroups.length} groups`,
        });
      } else {
        throw new Error('Failed to send notifications');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalRecipients = () => {
    return selectedGroups.reduce((total, groupId) => {
      const group = stakeholderGroups.find(g => g.id === groupId);
      return total + (group?.members.length || 0);
    }, 0);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Stakeholder Notifications
          </CardTitle>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Document: {documentType}
            </div>
            {approvalReference && (
              <div className="flex items-center">
                <Badge variant="outline">{approvalReference}</Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stakeholder Groups Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">Select Stakeholder Groups</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stakeholderGroups.map((group) => (
                <div
                  key={group.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedGroups.includes(group.id)
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleGroupToggle(group.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedGroups.includes(group.id)}
                      onChange={() => handleGroupToggle(group.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{group.name}</span>
                        <Badge variant={group.priority === 'high' ? 'destructive' : 'secondary'}>
                          {group.priority}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {group.members.length} members
                      </div>
                      <div className="flex space-x-2 mt-2">
                        {group.notificationPrefs.email && (
                          <Badge variant="outline" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                        )}
                        {group.notificationPrefs.sms && (
                          <Badge variant="outline" className="text-xs">SMS</Badge>
                        )}
                        {group.notificationPrefs.dashboard && (
                          <Badge variant="outline" className="text-xs">Dashboard</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Template Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">Notification Template</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {notificationTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === template.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={selectedTemplate === template.id}
                      onChange={() => setSelectedTemplate(template.id)}
                      className="text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{template.name}</div>
                      <Badge 
                        variant={template.urgency === 'urgent' ? 'destructive' : 'secondary'}
                        className="mt-1"
                      >
                        {template.urgency}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Preview/Customization */}
          {selectedTemplate && (
            <div>
              <Label className="text-base font-medium mb-3 block">Message Preview</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <Input
                    value={generateNotificationContent().subject}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Message Body</Label>
                  <Textarea
                    value={customMessage || generateNotificationContent().body}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                    placeholder="Customize the message or use the template..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Send Notifications */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedGroups.length > 0 ? (
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {getTotalRecipients()} recipients across {selectedGroups.length} groups
                  </span>
                </div>
              ) : (
                <span>No groups selected</span>
              )}
            </div>
            <Button
              onClick={sendNotifications}
              disabled={selectedGroups.length === 0 || !selectedTemplate || isLoading}
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{isLoading ? 'Sending...' : 'Send Notifications'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}