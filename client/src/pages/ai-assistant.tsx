import ChatInterface from "@/components/ai-assistant/chat-interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Search, RefreshCw, ChartBar, ChevronDown, ChevronRight, Filter, Clock, User, AlertTriangle, Building, Target, FileText, ExternalLink } from "lucide-react";

export default function AIAssistant() {
  // For MVP, we'll assume project ID 1
  const projectId = 1;
  const [currentProjectId, setCurrentProjectId] = useState(1);
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
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Analysis request failed');
      }
      
      // Validate response format
      if (!result.issues || !result.recommendations || 
          !Array.isArray(result.issues) || !Array.isArray(result.recommendations)) {
        throw new Error('Invalid response format from the server');
      }
      
      setDocumentAnalysis(result);
    } catch (error: unknown) {
      console.error("Error analyzing document:", error);
      let errorMessage = "An unexpected error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setDocumentAnalysis({
        issues: ["An error occurred during document analysis: " + errorMessage],
        recommendations: ["Please try again or contact support if the problem persists"]
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
          <ClauseLibrary />
        </TabsContent>
      </Tabs>
    </>
  );
}

// NEC4 Clause Library Data Structure
const NEC4_CLAUSE_LIBRARY = {
  "Core Clauses": {
    "Actions": {
      clauses: {
        "10.1": {
          text: "The Employer, the Contractor, the Project Manager and the Supervisor act as stated in this contract.",
          explanation: "Defines the roles and responsibilities of each party to the contract.",
          actionableBy: "All parties",
          timeframe: "Throughout the contract",
          relatedClauses: ["10.2", "10.3"]
        }
      }
    },
    "Early Warning": {
      clauses: {
        "15.1": {
          text: "The Contractor and the Project Manager give an early warning by notifying the other as soon as either becomes aware of any matter which could increase the total of the Prices, delay Completion, delay meeting a Key Date or impair the performance of the works in use.",
          explanation: "Both parties must notify each other as soon as they become aware of any issue that could affect cost, time, or quality.",
          actionableBy: "Both Contractor and Project Manager",
          timeframe: "As soon as becoming aware of the matter",
          riskTrigger: "Failing to raise early warnings may affect later compensation event assessments",
          relatedClauses: ["15.2", "15.3", "61.5", "36"]
        },
        "15.2": {
          text: "The Contractor or the Project Manager may instruct the other to attend an early warning meeting.",
          explanation: "Either party can call a meeting to discuss early warnings.",
          actionableBy: "Both Contractor and Project Manager",
          timeframe: "After an early warning has been notified",
          relatedClauses: ["15.1", "15.3"]
        },
        "15.3": {
          text: "At an early warning meeting, those who attend co-operate in making and considering proposals about how the effect of each matter which has been notified as an early warning can be avoided or reduced.",
          explanation: "Early warning meetings are collaborative sessions to find solutions to notified issues.",
          actionableBy: "All meeting attendees",
          timeframe: "During the early warning meeting",
          relatedClauses: ["15.1", "15.2", "63.7"]
        }
      }
    },
    "Programme": {
      clauses: {
        "31.2": {
          text: "The Contractor shows on each programme which he submits for acceptance the information which the Scope requires the Contractor to show on a programme submitted for acceptance, the starting date, possession dates, access dates, Key Dates, Completion Date, planned Completion, the order and timing of the operations which the Contractor plans to do in order to Provide the Works...",
          explanation: "Defines the required content of the Contractor's programme submittals.",
          actionableBy: "Contractor",
          timeframe: "Within 8 weeks of receiving request for programme",
          relatedClauses: ["31.1", "31.3", "32.1", "36"]
        },
        "32.1": {
          text: "The Contractor submits a revised programme to the Project Manager for acceptance within the period for reply after the Project Manager has instructed the Contractor to submit a revised programme or the Contractor has notified the Project Manager of a compensation event.",
          explanation: "Requires the Contractor to submit revised programmes when instructed or after compensation events.",
          actionableBy: "Contractor",
          timeframe: "Within the period for reply after instruction or CE notification",
          relatedClauses: ["31.2", "61.1", "63.5", "36"]
        }
      }
    },
    "Compensation Events": {
      clauses: {
        "60.1": {
          text: "The following are compensation events...",
          explanation: "This clause lists all the situations that qualify as compensation events under the contract.",
          actionableBy: "Project Manager/Contractor",
          timeframe: "Varies by event type",
          relatedClauses: ["61.1", "61.3", "63.1", "11.2(29)"]
        },
        "61.3": {
          text: "The Contractor notifies the Project Manager of an event which has happened or which is expected to happen as a compensation event if the Contractor believes that the event is a compensation event and the Project Manager has not notified the event to the Contractor.",
          explanation: "This requires the Contractor to notify the Project Manager of any events they consider to be compensation events if the Project Manager hasn't already notified them about it.",
          actionableBy: "Contractor",
          timeframe: "As soon as becoming aware of the event",
          relatedClauses: ["60.1", "61.4", "61.5", "15.1"]
        },
        "61.4": {
          text: "If the Contractor does not notify a compensation event within eight weeks of becoming aware that the event has happened, the Prices, the Completion Date or a Key Date are not changed unless the Project Manager should have notified the event to the Contractor but did not.",
          explanation: "The Contractor must notify a compensation event within 8 weeks of becoming aware of it, otherwise they lose the right to claim unless the Project Manager should have notified it but didn't.",
          actionableBy: "Contractor",
          timeframe: "Within 8 weeks of becoming aware of the event",
          riskTrigger: "Exceeding the 8-week notification period leads to loss of entitlement",
          relatedClauses: ["61.3", "60.1", "61.1", "15.1"]
        }
      }
    }
  },
  "Main Option Clauses": {
    "Option A: Priced contract with activity schedule": {
      clauses: {
        "A11.2": {
          text: "The Contractor is paid for each activity in the activity schedule at the price stated for the activity when the activity is completed.",
          explanation: "Payment is made upon completion of activities at the prices stated in the activity schedule.",
          actionableBy: "Project Manager",
          timeframe: "Upon completion of activities",
          relatedClauses: ["A50.2", "A63.1"]
        }
      }
    },
    "Option B: Priced contract with bill of quantities": {
      clauses: {
        "B11.2": {
          text: "The Contractor is paid for the quantity of work done for each item in the bill of quantities at the rate and lump sums stated for the item.",
          explanation: "Payment is based on quantities of work done at the rates stated in the bill of quantities.",
          actionableBy: "Project Manager",
          timeframe: "Based on work done",
          relatedClauses: ["B50.2", "B63.1"]
        }
      }
    },
    "Option C: Target contract with activity schedule": {
      clauses: {
        "C11.2": {
          text: "The Contractor is paid the Defined Cost which the Project Manager forecasts will be incurred in carrying out the work included in a completed activity plus the Fee.",
          explanation: "Payment is based on defined cost plus fee for completed activities.",
          actionableBy: "Project Manager",
          timeframe: "Upon completion of activities",
          relatedClauses: ["C50.2", "C63.1"]
        }
      }
    },
    "Option E: Cost reimbursable contract": {
      clauses: {
        "E11.2": {
          text: "The Contractor is paid the Defined Cost plus the Fee.",
          explanation: "Under Option E, the Contractor is reimbursed for all actual defined costs incurred plus a fee. This requires detailed cost substantiation and record keeping.",
          actionableBy: "Project Manager",
          timeframe: "As costs are incurred",
          riskTrigger: "Poor cost records or inadequate substantiation can lead to payment disputes",
          relatedClauses: ["E50.2", "E63.1", "11.2(23)"]
        },
        "E30.3": {
          text: "The Contractor submits accounts to the Project Manager in the form stated in the Scope.",
          explanation: "Regular submission of detailed cost accounts is mandatory under Option E contracts.",
          actionableBy: "Contractor",
          timeframe: "As stated in the Scope (typically monthly)",
          riskTrigger: "Late or inadequate account submissions can delay payments",
          relatedClauses: ["E50.2", "50.1"]
        }
      }
    }
  },
  "Secondary Option Clauses": {
    "X1: Price adjustment for inflation": {
      clauses: {
        "X1.1": {
          text: "The Price for Work Done to Date is adjusted for inflation using the formula stated in the Contract Data.",
          explanation: "Allows for price adjustments based on inflation using a specified formula.",
          actionableBy: "Project Manager",
          timeframe: "At assessment dates",
          relatedClauses: ["50.2", "51.1"]
        }
      }
    },
    "X2: Changes in the law": {
      clauses: {
        "X2.1": {
          text: "A change in the law of the country in which the Site is located is a compensation event if it occurs after the Contract Date.",
          explanation: "Changes in law after contract date are compensation events.",
          actionableBy: "Project Manager/Contractor",
          timeframe: "After the change occurs",
          relatedClauses: ["60.1", "61.1"]
        }
      }
    },
    "X7: Delay damages": {
      clauses: {
        "X7.1": {
          text: "The Contractor pays delay damages at the rate stated in the Contract Data from the Completion Date for each day until the earlier of Completion and the date on which the Employer takes over the works.",
          explanation: "Sets out the delay damages payable by the Contractor for late completion.",
          actionableBy: "Contractor",
          timeframe: "From Completion Date until actual completion",
          riskTrigger: "Delay damages accrue daily from the contractual completion date",
          relatedClauses: ["30.2", "35.2", "80.1"]
        }
      }
    }
  },
  "Project Z-Clauses": {
    "Custom Contract Amendments": {
      clauses: {
        "Z1.1": {
          text: "Additional health and safety requirements specific to this project shall be as detailed in Schedule Z1 and take precedence over standard health and safety provisions.",
          explanation: "Project-specific health and safety requirements that override standard provisions.",
          actionableBy: "Both Contractor and Project Manager",
          timeframe: "Throughout the project",
          riskTrigger: "Non-compliance with Z-clause health and safety requirements may result in contract termination",
          relatedClauses: ["19.1", "27.1"],
          isProjectSpecific: true
        },
        "Z2.3": {
          text: "For this project, the definition of 'Completion' is modified to include achievement of BREEAM Excellent rating and commissioning certificate from the M&E consultant.",
          explanation: "Modified completion criteria specific to this project including environmental standards.",
          actionableBy: "Contractor",
          timeframe: "Before claiming completion",
          riskTrigger: "Completion cannot be achieved without BREEAM certification and M&E commissioning",
          relatedClauses: ["30.2", "11.2(2)"],
          isProjectSpecific: true
        }
      }
    }
  }
};

// Project data structure
const PROJECTS = {
  1: {
    name: "Westfield Development Project",
    contractRef: "NEC4-2024-001",
    client: "Westfield Development Corporation",
    mainOption: "C", // Target contract with activity schedule
    secondaryOptions: ["X1", "X2", "X7"], // Price adjustment, changes in law, delay damages
    zClauses: ["Z1.1", "Z2.3"] // Custom amendments
  },
  2: {
    name: "Northern Gateway Interchange",
    contractRef: "NEC4-2025-002", 
    client: "National Infrastructure Agency",
    mainOption: "E", // Cost reimbursable contract
    secondaryOptions: ["X2", "X9", "X15", "X18"], // Changes in law, transfer of rights, contractor's design, limitation of liability
    zClauses: ["Z1.1", "Z2.1"] // Custom amendments
  }
};

// Get project options based on current project ID
const getProjectOptions = (projectId: number) => {
  return PROJECTS[projectId as keyof typeof PROJECTS];
};

// Clause Library Component
function ClauseLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [highlightedClause, setHighlightedClause] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "Core Clauses": true,
    "Main Option Clauses": PROJECT_OPTIONS.mainOption ? true : false, // Auto-expand if project has main option
    "Secondary Option Clauses": PROJECT_OPTIONS.secondaryOptions.length > 0 ? true : false,
    "Project Z-Clauses": PROJECT_OPTIONS.zClauses.length > 0 ? true : false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const navigateToClause = (clauseNumber: string) => {
    setHighlightedClause(clauseNumber);
    // Find which section contains this clause and expand it
    Object.entries(NEC4_CLAUSE_LIBRARY).forEach(([sectionName, sectionData]) => {
      Object.entries(sectionData).forEach(([subsectionName, subsectionData]: [string, any]) => {
        if (subsectionData.clauses && subsectionData.clauses[clauseNumber]) {
          setExpandedSections(prev => ({ ...prev, [sectionName]: true }));
        }
      });
    });
    // Scroll to clause after a brief delay
    setTimeout(() => {
      const element = document.getElementById(`clause-${clauseNumber}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
        part
    );
  };

  const isProjectRelevantOption = (optionName: string) => {
    if (optionName.includes(`Option ${PROJECT_OPTIONS.mainOption}:`)) return true;
    return PROJECT_OPTIONS.secondaryOptions.some(option => 
      optionName.includes(`${option}:`)
    );
  };

  const filterClauses = (clauses: any, searchTerm: string, filter: string) => {
    if (!searchTerm && filter === "all") return clauses;
    
    const filtered: any = {};
    Object.entries(clauses).forEach(([clauseNumber, clauseInfo]: [string, any]) => {
      const matchesSearch = !searchTerm || 
        clauseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clauseInfo.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clauseInfo.explanation.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filter === "all" || 
        (filter === "contractor" && clauseInfo.actionableBy?.includes("Contractor")) ||
        (filter === "pm" && clauseInfo.actionableBy?.includes("Project Manager")) ||
        (filter === "time-critical" && clauseInfo.riskTrigger);
      
      if (matchesSearch && matchesFilter) {
        filtered[clauseNumber] = clauseInfo;
      }
    });
    
    return filtered;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          NEC4 Clause Library
        </CardTitle>
        <CardDescription>
          Browse NEC4 contract clauses organized by contract sections with filtering and search capabilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Project Context Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Project Context: Westfield Development Project</h4>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline" className="bg-white">
                Main Option: {PROJECT_OPTIONS.mainOption} (Target Contract)
              </Badge>
              {PROJECT_OPTIONS.secondaryOptions.map(option => (
                <Badge key={option} variant="outline" className="bg-white">
                  Secondary: {option}
                </Badge>
              ))}
              {PROJECT_OPTIONS.zClauses.length > 0 && (
                <Badge variant="outline" className="bg-white">
                  Z-Clauses: {PROJECT_OPTIONS.zClauses.length} custom amendments
                </Badge>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search clauses (e.g. '61.3', 'compensation event', 'early warning')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clauses</SelectItem>
                  <SelectItem value="contractor">Contractor Actions</SelectItem>
                  <SelectItem value="pm">Project Manager Actions</SelectItem>
                  <SelectItem value="time-critical">Time-Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clause Sections */}
          <ScrollArea className="h-[600px] w-full">
            <div className="space-y-4">
              {Object.entries(NEC4_CLAUSE_LIBRARY).map(([sectionName, sectionData]) => {
                const isProjectRelevant = sectionName === "Project Z-Clauses" || 
                  (sectionName === "Main Option Clauses" && Object.keys(sectionData).some(isProjectRelevantOption)) ||
                  (sectionName === "Secondary Option Clauses" && Object.keys(sectionData).some(isProjectRelevantOption));
                
                return (
                  <div key={sectionName} className={`border rounded-lg ${isProjectRelevant ? 'border-blue-300 bg-blue-25' : ''}`}>
                    <Collapsible 
                      open={expandedSections[sectionName]} 
                      onOpenChange={() => toggleSection(sectionName)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className={`flex items-center justify-between p-4 hover:bg-gray-100 cursor-pointer ${
                          isProjectRelevant ? 'bg-blue-50' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{sectionName}</h3>
                            {isProjectRelevant && (
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                <Target className="h-3 w-3 mr-1" />
                                Project Relevant
                              </Badge>
                            )}
                          </div>
                          {expandedSections[sectionName] ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 space-y-4">
                          {Object.entries(sectionData).map(([subsectionName, subsectionData]: [string, any]) => {
                            const isSubsectionRelevant = isProjectRelevantOption(subsectionName);
                            return (
                              <div key={subsectionName} className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-medium border-b pb-1 ${
                                    isSubsectionRelevant ? 'text-blue-700 border-blue-200' : 'text-gray-700 border-gray-200'
                                  }`}>
                                    {subsectionName}
                                  </h4>
                                  {isSubsectionRelevant && (
                                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <div className="space-y-3">
                                  {Object.entries(filterClauses(subsectionData.clauses, searchTerm, selectedFilter))
                                    .map(([clauseNumber, clauseInfo]: [string, any]) => (
                                    <div 
                                      key={clauseNumber} 
                                      id={`clause-${clauseNumber}`}
                                      className={`border rounded-lg p-4 hover:bg-gray-50 transition-all ${
                                        highlightedClause === clauseNumber ? 'ring-2 ring-blue-500 bg-blue-50' : 
                                        clauseInfo.isProjectSpecific ? 'border-purple-300 bg-purple-25' : 'border-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <h5 className="text-lg font-semibold text-gray-900">
                                            Clause {clauseNumber}
                                          </h5>
                                          {clauseInfo.isProjectSpecific && (
                                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">
                                              <FileText className="h-3 w-3 mr-1" />
                                              Z-Clause
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex gap-2">
                                          {clauseInfo.riskTrigger && (
                                            <Badge variant="destructive" className="text-xs">
                                              <AlertTriangle className="h-3 w-3 mr-1" />
                                              Time Critical
                                            </Badge>
                                          )}
                                          {clauseInfo.actionableBy && (
                                            <Badge variant="outline" className="text-xs">
                                              <User className="h-3 w-3 mr-1" />
                                              {clauseInfo.actionableBy}
                                            </Badge>
                                          )}
                                          {clauseInfo.timeframe && (
                                            <Badge variant="secondary" className="text-xs">
                                              <Clock className="h-3 w-3 mr-1" />
                                              {clauseInfo.timeframe}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-3">
                                        <div className={`border-l-4 pl-4 py-2 ${
                                          clauseInfo.isProjectSpecific ? 'border-purple-500 bg-purple-50' : 'border-blue-500 bg-blue-50'
                                        }`}>
                                          <p className="text-sm font-mono text-gray-800">
                                            {highlightText(clauseInfo.text, searchTerm)}
                                          </p>
                                        </div>
                                        
                                        <div className="bg-gray-50 p-3 rounded">
                                          <p className="text-sm text-gray-700">
                                            <strong>Practical Meaning:</strong> {highlightText(clauseInfo.explanation, searchTerm)}
                                          </p>
                                        </div>
                                        
                                        {clauseInfo.riskTrigger && (
                                          <div className="bg-red-50 border border-red-200 p-3 rounded">
                                            <p className="text-sm text-red-800">
                                              <strong>Risk Alert:</strong> {clauseInfo.riskTrigger}
                                            </p>
                                          </div>
                                        )}
                                        
                                        {clauseInfo.relatedClauses && clauseInfo.relatedClauses.length > 0 && (
                                          <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span className="font-medium">Related Clauses:</span>
                                            <div className="flex gap-1 flex-wrap">
                                              {clauseInfo.relatedClauses.map((relatedClause: string) => (
                                                <button
                                                  key={relatedClause}
                                                  onClick={() => navigateToClause(relatedClause)}
                                                  className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                                                >
                                                  <ExternalLink className="h-3 w-3 inline mr-1" />
                                                  {relatedClause}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
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
