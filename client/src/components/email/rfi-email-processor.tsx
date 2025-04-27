import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MessageSquare,
  Loader2,
  MailCheck,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  
  // State for detailed processing results
  const [processingResults, setProcessingResults] = useState<any>(null);
  
  // Process emails mutation
  const processEmailsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/email/process');
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
        ...prev.slice(0, 4) // Keep only the last 5 entries
      ]);
      
      toast({
        title: 'RFI Emails Processed',
        description: `Successfully processed ${processedCount} RFI-related email${processedCount !== 1 ? 's' : ''}.`,
      });
    },
    onError: (error) => {
      setProcessingStatus('error');
      setErrorMessage(error.message);
      
      // Add to processing history with detailed error info
      setProcessingHistory(prev => [
        { 
          timestamp: new Date(), 
          status: 'error',
          errorMessage: error.message
        },
        ...prev.slice(0, 4)
      ]);
      
      toast({
        title: 'Processing Failed',
        description: `Failed to process RFI emails: ${error.message}`,
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
            <MessageSquare className="h-5 w-5" />
            RFI Email Processing
          </CardTitle>
          <CardDescription>
            Process Requests for Information (RFI) emails
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">RFI Email Format</h3>
              <p className="text-blue-700 mb-2">
                To ensure proper processing, RFI emails must follow this subject line format:
              </p>
              
              <div className="space-y-3 mt-3">
                <div className="bg-white p-3 rounded border border-blue-100">
                  <h4 className="font-medium text-blue-900">Request for Information:</h4>
                  <code className="block text-sm bg-gray-50 p-2 rounded mt-1">
                    RFI: [Brief Description] - Project: [Project Code]
                  </code>
                  <p className="text-sm text-gray-600 mt-1">
                    Example: "RFI: Clarification on foundation details - Project: C-121"
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Integration with RFI Management System</h3>
              <p className="text-amber-700">
                When RFI emails are processed, the system automatically:
              </p>
              <ul className="list-disc list-inside text-amber-700 mt-2">
                <li>Creates RFI records in the database</li>
                <li>Extracts project information and references</li>
                <li>Sets default response periods based on project settings</li>
                <li>Notifies relevant project team members</li>
                <li>Tracks RFI status and response times</li>
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
                Processing RFI Emails...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-5 w-5" />
                Process RFI Emails
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
                  RFI emails were successfully processed. Check the RFI management system for new requests.
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
                  Failed to process RFI emails: {errorMessage || 'Unknown error occurred'}
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
                  Currently processing RFI emails...
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
                  Click "Process RFI Emails" to check for new RFI-related emails
                </p>
              </div>
            )}
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Processing Steps:</h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Connect to email server</li>
                <li>Identify RFI emails by subject keywords</li>
                <li>Extract project references and details</li>
                <li>Create RFI records in the database</li>
                <li>Set default response periods</li>
                <li>Send notifications to team members</li>
              </ol>
            </div>
            
            {/* Show processing history when available */}
            {processingHistory.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Processing History</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {processingHistory.map((entry, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        {entry.status === 'success' 
                          ? <Check className="h-3 w-3 text-green-500" /> 
                          : <X className="h-3 w-3 text-red-500" />}
                        <span>
                          {entry.status === 'success' 
                            ? `Processed ${entry.count} emails` 
                            : entry.errorMessage 
                              ? `Error: ${entry.errorMessage}`
                              : 'Processing failed'}
                        </span>
                      </div>
                      <span>{entry.timestamp.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}