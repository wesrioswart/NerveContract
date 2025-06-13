import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { BookOpen, ExternalLink, FileText, Building, Calendar, AlertCircle } from "lucide-react";

interface SourceCitation {
  type: 'nec4_clause' | 'project_document' | 'email' | 'programme_data' | 'cost_data';
  reference: string;
  section?: string;
  confidence: number;
  relevance: string;
  url?: string;
}

interface ClauseReference {
  clause: string;
  section: string;
  title: string;
  relevance: string;
  excerpt: string;
}

interface ContextData {
  projectType: string;
  contractOption: string;
  relevantDates: string[];
  keyPersonnel: string[];
  recentActivity: string[];
}

interface AIChatCitationsProps {
  sourceCitations?: SourceCitation[];
  clauseReferences?: ClauseReference[];
  contextUsed?: ContextData;
  confidenceLevel?: number;
}

export function AIChatCitations({
  sourceCitations = [],
  clauseReferences = [],
  contextUsed,
  confidenceLevel
}: AIChatCitationsProps) {
  if (!sourceCitations.length && !clauseReferences.length && !contextUsed) {
    return null;
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'nec4_clause': return <BookOpen className="h-3 w-3" />;
      case 'project_document': return <FileText className="h-3 w-3" />;
      case 'email': return <ExternalLink className="h-3 w-3" />;
      case 'programme_data': return <Calendar className="h-3 w-3" />;
      case 'cost_data': return <Building className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'nec4_clause': return 'NEC4 Clause';
      case 'project_document': return 'Project Document';
      case 'email': return 'Email';
      case 'programme_data': return 'Programme Data';
      case 'cost_data': return 'Cost Data';
      default: return 'Source';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500";
    if (score >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="border-t pt-3 mt-3 space-y-3">
      {/* Confidence Indicator */}
      {confidenceLevel && (
        <div className="flex items-center gap-2 text-xs">
          <AlertCircle className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Response Confidence:</span>
          <Progress value={confidenceLevel * 100} className="w-16 h-1" />
          <span className="text-muted-foreground">{Math.round(confidenceLevel * 100)}%</span>
        </div>
      )}

      {/* Quick Source References */}
      <div className="flex flex-wrap gap-1">
        {clauseReferences.slice(0, 3).map((clause, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {clause.clause}
          </Badge>
        ))}
        
        {sourceCitations.slice(0, 3).map((source, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {getSourceIcon(source.type)}
            <span className="ml-1">{source.reference}</span>
          </Badge>
        ))}
        
        {(clauseReferences.length > 3 || sourceCitations.length > 3) && (
          <Badge variant="outline" className="text-xs">
            +{(clauseReferences.length + sourceCitations.length) - 6} more
          </Badge>
        )}
      </div>

      {/* Detailed Sources Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
            View All Sources & Context
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Response Sources & Evidence</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* NEC4 Clause References */}
            {clauseReferences.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    NEC4 Contract Clauses Referenced
                  </h3>
                  
                  <div className="space-y-3">
                    {clauseReferences.map((clause, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{clause.clause}</Badge>
                          <span className="text-sm font-medium">{clause.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{clause.relevance}</p>
                        <div className="bg-muted p-2 rounded text-xs italic">
                          "{clause.excerpt}"
                        </div>
                        {clause.section && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Section: {clause.section}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Source Citations */}
            {sourceCitations.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Supporting Data Sources
                  </h3>
                  
                  <div className="space-y-3">
                    {sourceCitations.map((source, index) => (
                      <div key={index} className="flex items-center justify-between border rounded p-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getSourceIcon(source.type)}
                            <span className="text-sm font-medium">{source.reference}</span>
                            <Badge variant="secondary" className="text-xs">
                              {getSourceTypeLabel(source.type)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{source.relevance}</p>
                          {source.section && (
                            <p className="text-xs text-muted-foreground">
                              Section: {source.section}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className={`w-2 h-2 rounded-full ${getConfidenceColor(source.confidence)}`} />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(source.confidence * 100)}%
                            </span>
                          </div>
                          
                          {source.url && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Context Used */}
            {contextUsed && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Project Context Applied
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Contract Details</h4>
                      <p className="text-xs text-muted-foreground">Type: {contextUsed.projectType}</p>
                      <p className="text-xs text-muted-foreground">Option: {contextUsed.contractOption}</p>
                    </div>
                    
                    {contextUsed.relevantDates.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Key Dates</h4>
                        {contextUsed.relevantDates.slice(0, 3).map((date, index) => (
                          <p key={index} className="text-xs text-muted-foreground">{date}</p>
                        ))}
                      </div>
                    )}
                    
                    {contextUsed.keyPersonnel.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Key Personnel</h4>
                        {contextUsed.keyPersonnel.slice(0, 3).map((person, index) => (
                          <p key={index} className="text-xs text-muted-foreground">{person}</p>
                        ))}
                      </div>
                    )}
                    
                    {contextUsed.recentActivity.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Recent Activity</h4>
                        {contextUsed.recentActivity.slice(0, 2).map((activity, index) => (
                          <p key={index} className="text-xs text-muted-foreground">{activity}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}