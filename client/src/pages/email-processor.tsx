import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailConfiguration from '@/components/email/email-configuration';
import { AnimationWrapper } from '@/components/ui/animation-wrapper';
import { Inbox, Server, FileUp, AlertTriangle, Mail, MailCheck, Truck, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function EmailProcessorPage() {
  return (
    <div className="container mx-auto py-6">
      <AnimationWrapper as="h1" type="slideIn" className="text-3xl font-bold mb-2">
        Email Document Processor
      </AnimationWrapper>
      
      <AnimationWrapper type="fadeIn" delay={0.1}>
        <p className="text-gray-500 mb-6">
          Monitor and process contract documents sent to a dedicated email address
        </p>
      </AnimationWrapper>
      
      <AnimationWrapper type="fadeIn" delay={0.2}>
        <Tabs defaultValue="configuration" className="w-full">
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Email Configuration
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Processor Overview
            </TabsTrigger>
            <TabsTrigger value="instructions" className="flex items-center gap-2">
              <FileUp className="h-4 w-4" />
              How to Use
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Equipment Emails
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="configuration">
            <EmailConfiguration />
          </TabsContent>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Overview cards for the email processor */}
              <AnimationWrapper type="fadeIn" delay={0.1}>
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium">Document Detection</h3>
                  </div>
                  <p className="text-gray-600 mb-2">
                    The system automatically identifies document types based on email content and file extensions.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-500">
                    <li>Compensation Events (CE)</li>
                    <li>Early Warnings (EW)</li>
                    <li>Programme Updates (.mpp, .xml)</li>
                    <li>Technical Queries (TQ)</li>
                    <li>Non-Conformance Reports (NCR)</li>
                    <li>Equipment Hire Requests (HIRE)</li>
                    <li>Equipment Off-Hire Requests (OFFHIRE)</li>
                    <li>Equipment Delivery Confirmations (DELIVERY)</li>
                  </ul>
                </div>
              </AnimationWrapper>
              
              <AnimationWrapper type="fadeIn" delay={0.2}>
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <MailCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium">Processing Workflow</h3>
                  </div>
                  <p className="text-gray-600 mb-2">
                    How the system processes incoming documents.
                  </p>
                  <ol className="list-decimal list-inside text-sm text-gray-500">
                    <li>Connect to IMAP server</li>
                    <li>Fetch new unread messages</li>
                    <li>Parse email content and attachments</li>
                    <li>Identify document types</li>
                    <li>Extract key data</li>
                    <li>Save to document storage</li>
                    <li>Create record in database</li>
                  </ol>
                </div>
              </AnimationWrapper>
              
              <AnimationWrapper type="fadeIn" delay={0.3}>
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-amber-100 rounded-full">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-medium">Data Protection</h3>
                  </div>
                  <p className="text-gray-600 mb-2">
                    GDPR compliance and data protection measures.
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-500">
                    <li>Secure SSL/TLS connections</li>
                    <li>Minimal data extraction policy</li>
                    <li>Automatic data retention limits</li>
                    <li>Access controls and audit logging</li>
                    <li>Right to access, rectify, and erase</li>
                  </ul>
                </div>
              </AnimationWrapper>
            </div>
          </TabsContent>
          
          <TabsContent value="instructions">
            <AnimationWrapper type="fadeIn">
              <div className="bg-white rounded-lg shadow-sm border p-6 max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">How to Use the Email Processor</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Step 1: Configure Email Connection</h3>
                    <p className="text-gray-600">
                      Set up a dedicated email account for document processing, then configure the connection 
                      in the Email Configuration tab. Use app-specific passwords when available 
                      for enhanced security.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Step 2: Document Submission Guidelines</h3>
                    <p className="text-gray-600 mb-2">
                      Instruct project participants to include specific keywords in email subjects:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 pl-4">
                      <li><strong>Compensation Events:</strong> Include "CE:" or "Compensation Event" in subject</li>
                      <li><strong>Early Warnings:</strong> Include "EW:" or "Early Warning" in subject</li>
                      <li><strong>Programme Updates:</strong> Include "Programme" or attach .mpp/.xml files</li>
                      <li><strong>Technical Queries:</strong> Include "TQ:" or "Technical Query" in subject</li>
                      <li><strong>NCRs:</strong> Include "NCR:" or "Non-Conformance" in subject</li>
                      <li><strong>Equipment Hire:</strong> Include "HIRE:" for new equipment hire requests</li>
                      <li><strong>Equipment Off-Hire:</strong> Include "OFFHIRE:" for equipment return requests</li>
                      <li><strong>Equipment Delivery:</strong> Include "DELIVERY:" for delivery confirmations</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Step 3: Project References</h3>
                    <p className="text-gray-600 mb-4">
                      For automatic project assignment, instruct senders to include project references 
                      in the email subject using the format:
                    </p>
                    <div className="bg-gray-100 p-3 rounded text-gray-700 font-mono mb-2">
                      Subject: EW: Safety concern at site entrance - Project: ABC123
                    </div>
                    <p className="text-gray-600 mb-1">
                      Equipment-related emails follow the same format:
                    </p>
                    <div className="bg-gray-100 p-3 rounded text-gray-700 font-mono">
                      Subject: OFFHIRE: Excavator XC300 for return - Project: ABC123 - Equipment ID: EQP-1234
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Step 4: Processing Schedule</h3>
                    <p className="text-gray-600">
                      You can process emails on-demand by clicking the "Process New Emails" button. 
                      For regular automatic processing, set up a scheduled task using your server's 
                      cron system or task scheduler to call the API endpoint at appropriate intervals.
                    </p>
                  </div>
                </div>
              </div>
            </AnimationWrapper>
          </TabsContent>
          
          <TabsContent value="equipment">
            <EquipmentEmailProcessor />
          </TabsContent>
        </Tabs>
      </AnimationWrapper>
    </div>
  );
}

function EquipmentEmailProcessor() {
  const { toast } = useToast();
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  
  // Process emails mutation
  const processEmailsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/email/process'),
    onSuccess: () => {
      setProcessingStatus('success');
      toast({
        title: 'Equipment Emails Processed',
        description: 'Successfully processed equipment-related emails.',
      });
    },
    onError: (error) => {
      setProcessingStatus('error');
      toast({
        title: 'Processing Failed',
        description: `Failed to process emails: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleProcessEmails = () => {
    setProcessingStatus('processing');
    processEmailsMutation.mutate();
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Equipment Email Processing
          </CardTitle>
          <CardDescription>
            Process equipment hire, off-hire, and delivery confirmation emails
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Equipment Email Format</h3>
              <p className="text-blue-700 mb-2">
                To ensure proper processing, equipment-related emails must follow these subject line formats:
              </p>
              
              <div className="space-y-3 mt-3">
                <div className="bg-white p-3 rounded border border-blue-100">
                  <h4 className="font-medium text-blue-900">New Equipment Hire Request:</h4>
                  <code className="block text-sm bg-gray-50 p-2 rounded mt-1">
                    HIRE: [Equipment Type] Request - Project: [Project Code]
                  </code>
                  <p className="text-sm text-gray-600 mt-1">
                    Example: "HIRE: Excavator 20T Request - Project: ABC123"
                  </p>
                </div>
                
                <div className="bg-white p-3 rounded border border-blue-100">
                  <h4 className="font-medium text-blue-900">Equipment Off-Hire Request:</h4>
                  <code className="block text-sm bg-gray-50 p-2 rounded mt-1">
                    OFFHIRE: [Equipment Type] for return - Project: [Project Code] - Equipment ID: [ID]
                  </code>
                  <p className="text-sm text-gray-600 mt-1">
                    Example: "OFFHIRE: Excavator 20T for return - Project: ABC123 - Equipment ID: EQP-1234"
                  </p>
                </div>
                
                <div className="bg-white p-3 rounded border border-blue-100">
                  <h4 className="font-medium text-blue-900">Equipment Delivery Confirmation:</h4>
                  <code className="block text-sm bg-gray-50 p-2 rounded mt-1">
                    DELIVERY: [Equipment Type] confirmation - Project: [Project Code] - Equipment ID: [ID]
                  </code>
                  <p className="text-sm text-gray-600 mt-1">
                    Example: "DELIVERY: Scaffold materials confirmation - Project: ABC123 - Equipment ID: EQP-5678"
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Integration with Equipment Hire System</h3>
              <p className="text-amber-700">
                When equipment-related emails are processed, the system automatically:
              </p>
              <ul className="list-disc list-inside text-amber-700 mt-2">
                <li>Creates hire request records for new equipment requests</li>
                <li>Initiates off-hire processes for return requests</li>
                <li>Updates delivery status for equipment received on site</li>
                <li>Sends confirmation emails to suppliers</li>
                <li>Notifies relevant project team members</li>
              </ul>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full"
            size="lg"
            onClick={handleProcessEmails}
            disabled={processEmailsMutation.isPending}
          >
            {processEmailsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Equipment Emails...
              </>
            ) : (
              <>
                <Truck className="mr-2 h-5 w-5" />
                Process Equipment Emails
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Status Log</CardTitle>
          <CardDescription>Recent email processing activity</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {processingStatus === 'success' && (
              <div className="p-3 bg-green-50 text-green-700 rounded-md border border-green-200">
                <div className="flex items-center gap-2">
                  <MailCheck className="h-4 w-4" />
                  <span className="font-medium">Processing Completed</span>
                </div>
                <p className="mt-1 text-sm">
                  Equipment emails were successfully processed. Check the equipment hire system for new requests.
                </p>
                <p className="text-xs text-green-600 mt-2">
                  {new Date().toLocaleString()}
                </p>
              </div>
            )}
            
            {processingStatus === 'error' && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Processing Failed</span>
                </div>
                <p className="mt-1 text-sm">
                  Failed to process equipment emails. Please check the server logs for details.
                </p>
                <p className="text-xs text-red-600 mt-2">
                  {new Date().toLocaleString()}
                </p>
              </div>
            )}
            
            {processingStatus === 'processing' && (
              <div className="p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Processing in Progress</span>
                </div>
                <p className="mt-1 text-sm">
                  Currently processing equipment-related emails...
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  {new Date().toLocaleString()}
                </p>
              </div>
            )}
            
            {!processingStatus && (
              <div className="p-3 bg-gray-50 text-gray-500 rounded-md border border-gray-200">
                <p className="text-center italic">
                  No recent activity
                </p>
                <p className="text-center text-sm mt-1">
                  Click "Process Equipment Emails" to check for new equipment-related emails
                </p>
              </div>
            )}
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Processing Steps:</h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Connect to email server</li>
                <li>Identify equipment emails by subject keywords</li>
                <li>Extract project and equipment references</li>
                <li>Process hire/off-hire requests</li>
                <li>Update equipment hire database</li>
                <li>Send confirmation emails</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}