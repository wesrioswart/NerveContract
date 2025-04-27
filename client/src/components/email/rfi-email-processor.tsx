import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Clock, AlertCircle, HelpCircle, Mail, CheckCircle2, XCircle, Info, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AnimationWrapper } from '@/components/ui/animation-wrapper';

export function RfiEmailProcessor() {
  const { toast } = useToast();
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingHistory, setProcessingHistory] = useState<Array<{
    timestamp: Date;
    status: string;
    count?: number;
    errorMessage?: string;
  }>>([]);
  
  // Test mode state
  const [testMode, setTestMode] = useState(true);
  const [testEmail, setTestEmail] = useState({
    from: 'supplier@example.com',
    subject: 'RFI: Foundation detail clarification - Project: ABC123',
    body: 'We need clarification on the foundation details for Area B. Please provide additional information on the required depth and reinforcement specifications.',
    projectRef: 'ABC123',
  });
  
  // State for detailed processing results
  const [processingResults, setProcessingResults] = useState<any>(null);
  
  // Process emails mutation
  const processEmailsMutation = useMutation({
    mutationFn: async (testModeData?: any) => {
      const endpoint = '/api/email/process' + (testMode ? '/test' : '');
      const response = await apiRequest('POST', endpoint, testModeData || {});
      return await response.json();
    },
    onSuccess: (data) => {
      setProcessingStatus('success');
      
      // Extract the count from the response
      const processedCount = data?.processedCount || 0;
      
      // Store the detailed processing results
      setProcessingResults(data);
      
      // Add to processing history
      setProcessingHistory(prev => [
        { 
          timestamp: new Date(), 
          status: 'success',
          count: processedCount
        },
        ...prev
      ]);
      
      toast({
        title: "RFI Email Processing Complete",
        description: `Successfully processed ${processedCount} emails.`,
      });
    },
    onError: (error: Error) => {
      setProcessingStatus('error');
      setErrorMessage(error.message);
      
      // Add to processing history
      setProcessingHistory(prev => [
        { 
          timestamp: new Date(), 
          status: 'error',
          errorMessage: error.message
        },
        ...prev
      ]);
      
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Reset status after a delay
      setTimeout(() => {
        setProcessingStatus(null);
        setErrorMessage(null);
      }, 5000);
    }
  });
  
  const handleProcessEmails = () => {
    setProcessingStatus('processing');
    
    if (testMode) {
      const testData = {
        email: {
          ...testEmail,
          type: 'RFI'
        }
      };
      processEmailsMutation.mutate(testData);
    } else {
      processEmailsMutation.mutate();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main RFI Processing Panel */}
        <div className="w-full lg:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                RFI Email Processor
              </CardTitle>
              <CardDescription>
                Process incoming Request for Information emails and create RFI records automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="instructions">
                <TabsList className="mb-4">
                  <TabsTrigger value="instructions">Instructions</TabsTrigger>
                  <TabsTrigger value="test">Test Mode</TabsTrigger>
                  <TabsTrigger value="logs">Processing Logs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="instructions">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">RFI Email Formatting Guidelines</h3>
                      <p className="text-gray-500 mt-1 mb-3">
                        For automatic RFI processing, emails should follow these formatting rules:
                      </p>
                      
                      <div className="bg-gray-50 border rounded-md p-4 mb-4">
                        <h4 className="font-medium">Subject Line Format:</h4>
                        <div className="bg-white border p-2 my-2 font-mono text-sm">
                          RFI: [Brief Description] - Project: [Project Reference]
                        </div>
                        <p className="text-sm text-gray-600">
                          Example: <span className="font-medium">RFI: Foundation detail clarification - Project: ABC123</span>
                        </p>
                      </div>
                      
                      <Accordion type="multiple" className="w-full">
                        <AccordionItem value="validation">
                          <AccordionTrigger className="text-base">
                            Validation Rules
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                              <li>Subject must start with "RFI:" prefix</li>
                              <li>Project reference must be included in format "Project: [REF]"</li>
                              <li>Emails without proper formatting will be skipped</li>
                              <li>Duplicate references will be flagged for review</li>
                              <li>Response period is automatically calculated based on project settings</li>
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="content">
                          <AccordionTrigger className="text-base">
                            Email Content Guidelines
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                              <li>Main question or request should be clearly stated in the first paragraph</li>
                              <li>Include all relevant context and details needed to respond</li>
                              <li>Attachments like drawings or specifications should be referenced in the email body</li>
                              <li>If related to a specific location, include coordinates or clear reference points</li>
                              <li>If the RFI might lead to a Compensation Event, note this in the email body</li>
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex gap-3">
                      <div className="mt-1 flex-shrink-0">
                        <Info className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-amber-800">Important Note</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          RFIs processed through email are automatically assigned the "Open" status
                          with a standard response period based on project settings. The CE Status
                          is set to "Under Review" by default. You can update these and other details
                          in the RFI Management page after processing.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="test">
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex gap-3 mb-4">
                      <div className="mt-1 flex-shrink-0">
                        <Info className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-800">Test Mode</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Use this mode to test RFI email processing without connecting to an email server.
                          Create a sample RFI email to see how it would be processed.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">From Email</label>
                        <Input 
                          value={testEmail.from}
                          onChange={(e) => setTestEmail({...testEmail, from: e.target.value})}
                          placeholder="supplier@example.com"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Subject Line</label>
                        <Input 
                          value={testEmail.subject}
                          onChange={(e) => setTestEmail({...testEmail, subject: e.target.value})}
                          placeholder="RFI: Brief description - Project: ABC123"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Email Body</label>
                        <Textarea 
                          value={testEmail.body}
                          onChange={(e) => setTestEmail({...testEmail, body: e.target.value})}
                          placeholder="Describe the requested information..."
                          rows={5}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Project Reference</label>
                        <Select 
                          value={testEmail.projectRef} 
                          onValueChange={(value) => setTestEmail({...testEmail, projectRef: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ABC123">ABC123 - Westfield Development</SelectItem>
                            <SelectItem value="XYZ456">XYZ456 - Northside Complex</SelectItem>
                            <SelectItem value="DEF789">DEF789 - Riverside Expansion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          onClick={handleProcessEmails}
                          disabled={processingStatus === 'processing'}
                          className="w-full"
                        >
                          {processingStatus === 'processing' ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing Test Email...
                            </>
                          ) : (
                            <>Process Test RFI Email</>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {processingResults && (
                      <Card className="mt-4">
                        <CardHeader className="py-3">
                          <CardTitle className="text-base">Processing Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm border-b pb-2">
                              <span className="font-medium">Status:</span>
                              <span>{
                                processingResults.success ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Success</Badge>
                                ) : (
                                  <Badge variant="destructive">Failed</Badge>
                                )
                              }</span>
                            </div>
                            
                            {processingResults.rfis && processingResults.rfis.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm border-b pb-2">
                                  <span className="font-medium">RFI Created:</span>
                                  <span>{processingResults.rfis.length}</span>
                                </div>
                                
                                <div className="space-y-2">
                                  <span className="text-sm font-medium">Details:</span>
                                  {processingResults.rfis.map((rfi: any, idx: number) => (
                                    <div key={idx} className="bg-gray-50 p-3 rounded-md text-sm">
                                      <div><span className="font-medium">Reference:</span> {rfi.reference}</div>
                                      <div><span className="font-medium">Title:</span> {rfi.title}</div>
                                      <div><span className="font-medium">Response Due:</span> {new Date(rfi.plannedResponseDate).toLocaleDateString()}</div>
                                      <div><span className="font-medium">Status:</span> {rfi.status}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {processingResults.errors && processingResults.errors.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-sm font-medium">Errors:</span>
                                {processingResults.errors.map((error: string, idx: number) => (
                                  <div key={idx} className="bg-red-50 p-3 rounded-md text-sm text-red-800">
                                    {error}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="logs">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Processing History</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setProcessingHistory([])}
                        disabled={processingHistory.length === 0}
                      >
                        Clear History
                      </Button>
                    </div>
                    
                    {processingHistory.length === 0 ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center text-gray-500">
                        <HelpCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No processing history yet</p>
                        <p className="text-sm">Process some RFI emails to see the history</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {processingHistory.map((entry, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-md border flex items-start gap-3 ${entry.status === 'success' 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'}`}
                          >
                            {entry.status === 'success' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className={`font-medium ${entry.status === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                  {entry.status === 'success' ? 'Success' : 'Failed'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {entry.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                              {entry.status === 'success' ? (
                                <p className="text-sm text-green-700">
                                  Processed {entry.count} {entry.count === 1 ? 'email' : 'emails'}
                                </p>
                              ) : (
                                <p className="text-sm text-red-700">
                                  {entry.errorMessage || 'Unknown error'}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center">
                <div className="mr-2">
                  {processingStatus === 'processing' && (
                    <Badge variant="outline" className="bg-blue-50">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Processing
                    </Badge>
                  )}
                  {processingStatus === 'success' && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  )}
                  {processingStatus === 'error' && (
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                  )}
                </div>
                {errorMessage && (
                  <span className="text-sm text-red-600">{errorMessage}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center mr-2">
                  <input 
                    type="checkbox" 
                    id="test-mode" 
                    checked={testMode}
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="test-mode" className="text-sm">Test Mode</label>
                </div>
                
                <Button 
                  onClick={handleProcessEmails}
                  disabled={processingStatus === 'processing'}
                >
                  {processingStatus === 'processing' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Process RFI Emails
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Sidebar: Quick References & Tips */}
        <div className="w-full lg:w-1/3 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Example RFI Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 rounded-md border text-sm">
                <div className="mb-2">
                  <span className="font-semibold">From:</span> supplier@example.com
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Subject:</span> RFI: Foundation detail clarification - Project: ABC123
                </div>
                <div>
                  <span className="font-semibold">Body:</span>
                  <p className="mt-1">
                    We need clarification on the foundation details for Area B. 
                    Please provide additional information on the required depth 
                    and reinforcement specifications.
                  </p>
                  <p className="mt-2">
                    The current drawings show inconsistencies between section A-A 
                    and the foundation schedule.
                  </p>
                  <p className="mt-2">
                    This information is needed by Friday to avoid delays.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">RFI Workflow</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li className="pb-2 border-b border-gray-100">
                  <span className="font-medium">Receive</span>: Email arrives with "RFI:" prefix
                </li>
                <li className="pb-2 border-b border-gray-100">
                  <span className="font-medium">Process</span>: System extracts project reference and content
                </li>
                <li className="pb-2 border-b border-gray-100">
                  <span className="font-medium">Create</span>: RFI record is created with "Open" status
                </li>
                <li className="pb-2 border-b border-gray-100">
                  <span className="font-medium">Manage</span>: Access RFI in RFI Management section
                </li>
                <li>
                  <span className="font-medium">Respond</span>: Update status when information is provided
                </li>
              </ol>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Response period is calculated based on standard project settings</span>
                </li>
                <li className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Check for duplicate RFIs before processing</span>
                </li>
                <li className="flex gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>After processing, manage RFIs in the dedicated RFI Management page</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}