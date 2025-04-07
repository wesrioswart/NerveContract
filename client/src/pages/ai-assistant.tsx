import ChatInterface from "@/components/ai-assistant/chat-interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Search, RefreshCw, ChartBar } from "lucide-react";

export default function AIAssistant() {
  // For MVP, we'll assume project ID 1
  const projectId = 1;
  const userId = 1;
  
  const [documentText, setDocumentText] = useState("");
  const [documentAnalysis, setDocumentAnalysis] = useState<{ issues: string[], recommendations: string[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const handleDocumentAnalysis = async () => {
    if (!documentText.trim()) return;
    
    setIsAnalyzing(true);
    setDocumentAnalysis(null);
    
    try {
      // Call the document analysis API
      const response = await fetch('/api/document/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentText }),
      });
      
      if (!response.ok) {
        throw new Error('Analysis request failed');
      }
      
      const result = await response.json();
      setDocumentAnalysis(result);
    } catch (error) {
      console.error("Error analyzing document:", error);
      setDocumentAnalysis({
        issues: ["An error occurred during document analysis"],
        recommendations: ["Please try again or contact support"]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">AI Contract Assistant</h1>
      
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="chat">Chat Interface</TabsTrigger>
          <TabsTrigger value="document">Document Analysis</TabsTrigger>
          <TabsTrigger value="clauses">Clause Library</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat with NEC4 Assistant</CardTitle>
              <CardDescription>
                Ask questions about NEC4 clauses, get explanations, or assistance with contract management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChatInterface projectId={projectId} userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="document" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Analysis</CardTitle>
              <CardDescription>
                Paste contract text to analyze for potential issues and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={documentText}
                  onChange={(e: any) => setDocumentText(e.target.value)}
                  className="min-h-[200px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Paste contract text here for analysis..."
                />
                
                <Button
                  onClick={handleDocumentAnalysis}
                  disabled={!documentText.trim() || isAnalyzing}
                  className="bg-primary hover:bg-blue-800 text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ChartBar className="w-4 h-4 mr-2" />
                      Analyze Document
                    </>
                  )}
                </Button>
                
                {documentAnalysis && (
                  <div className="mt-4 p-4 border border-gray-200 rounded-md">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Potential Issues</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {documentAnalysis.issues.map((issue, index) => (
                          <li key={index} className="text-sm">{issue}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {documentAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clauses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NEC4 Clause Library</CardTitle>
              <CardDescription>
                Search for specific NEC4 contract clauses and their explanations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex">
                  <Input
                    className="flex-1 rounded-r-none"
                    placeholder="Search for clause (e.g. '61.3' or 'compensation event')"
                  />
                  <Button className="rounded-l-none bg-primary hover:bg-blue-800">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-md">
                    <h3 className="text-md font-semibold mb-2">Clause 61.3</h3>
                    <p className="text-sm font-mono border-l-2 border-primary pl-3 mb-2">
                      The Contractor notifies the Project Manager of an event which has happened or which is expected to happen as a compensation event if the Contractor believes that the event is a compensation event and the Project Manager has not notified the event to the Contractor.
                    </p>
                    <p className="text-sm">
                      This means you must notify the Project Manager of any event you believe to be a compensation event if they haven't already notified you about it.
                    </p>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-md">
                    <h3 className="text-md font-semibold mb-2">Clause 61.4</h3>
                    <p className="text-sm font-mono border-l-2 border-primary pl-3 mb-2">
                      If the Contractor does not notify a compensation event within eight weeks of becoming aware that the event has happened, the Prices, the Completion Date or a Key Date are not changed unless the Project Manager should have notified the event to the Contractor but did not.
                    </p>
                    <p className="text-sm">
                      This sets a time limit of 8 weeks for the Contractor to notify compensation events after becoming aware of them. Failing to do so means no entitlement to additional time or money, unless the Project Manager should have given notification but didn't.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

// Custom Textarea component
function Textarea({ value, onChange, className, placeholder }: any) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
    />
  );
}
