import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailConfiguration from '@/components/email/email-configuration';
import { AnimationWrapper } from '@/components/ui/animation-wrapper';
import { Inbox, Server, FileUp, AlertTriangle, Mail, MailCheck } from 'lucide-react';

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
        </Tabs>
      </AnimationWrapper>
    </div>
  );
}