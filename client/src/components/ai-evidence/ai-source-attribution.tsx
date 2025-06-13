import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Brain, FileText, Mail, ExternalLink, Shield, CheckCircle } from "lucide-react";

interface AISourceAttributionProps {
  aiGenerated?: boolean;
  confidenceScore?: number;
  sourceEmailId?: string;
  sourceDocumentPath?: string;
  reasoningEvidence?: any;
  clauseJustification?: any;
  triggerCriteria?: any;
  riskIndicators?: any;
  impactAnalysis?: any;
  similarHistoricalCases?: any;
}

export function AISourceAttribution({
  aiGenerated = false,
  confidenceScore,
  sourceEmailId,
  sourceDocumentPath,
  reasoningEvidence,
  clauseJustification,
  triggerCriteria,
  riskIndicators,
  impactAnalysis,
  similarHistoricalCases
}: AISourceAttributionProps) {
  if (!aiGenerated) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Manually created by project team</span>
      </div>
    );
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return "High Confidence";
    if (score >= 0.6) return "Medium Confidence";
    return "Low Confidence";
  };

  return (
    <div className="space-y-4">
      {/* AI Generated Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">AI-Generated Analysis</span>
          <Badge variant="secondary" className="text-xs">
            Augmented Intelligence
          </Badge>
        </div>
        
        {confidenceScore && (
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${getConfidenceColor(confidenceScore)}`}>
              {getConfidenceLabel(confidenceScore)}
            </span>
            <Progress 
              value={confidenceScore * 100} 
              className="w-16 h-2" 
            />
            <span className="text-xs text-muted-foreground">
              {Math.round(confidenceScore * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Source Links */}
      <div className="flex flex-wrap gap-2">
        {sourceEmailId && (
          <Button variant="outline" size="sm" className="h-8">
            <Mail className="h-3 w-3 mr-1" />
            View Source Email
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        )}
        
        {sourceDocumentPath && (
          <Button variant="outline" size="sm" className="h-8">
            <FileText className="h-3 w-3 mr-1" />
            View Source Document
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      {/* Detailed Evidence Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            <AlertTriangle className="h-4 w-4 mr-1" />
            View AI Analysis Evidence
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI Analysis Evidence & Reasoning
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Confidence and Reasoning */}
            {reasoningEvidence && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    AI Reasoning Process
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reasoningEvidence.keyFactors && (
                    <div>
                      <h4 className="font-medium mb-2">Key Factors Identified:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {reasoningEvidence.keyFactors.map((factor: string, index: number) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {reasoningEvidence.analysisMethod && (
                    <div>
                      <h4 className="font-medium mb-2">Analysis Method:</h4>
                      <p className="text-sm text-muted-foreground">{reasoningEvidence.analysisMethod}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* NEC4 Clause Justification */}
            {clauseJustification && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">NEC4 Clause Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {clauseJustification.primaryClause && (
                    <div>
                      <h4 className="font-medium">Primary Clause Reference:</h4>
                      <Badge variant="outline" className="mt-1">
                        {clauseJustification.primaryClause}
                      </Badge>
                      <p className="text-sm mt-2">{clauseJustification.primaryReasoning}</p>
                    </div>
                  )}
                  
                  {clauseJustification.supportingClauses && (
                    <div>
                      <h4 className="font-medium mb-2">Supporting Clauses:</h4>
                      <div className="flex flex-wrap gap-2">
                        {clauseJustification.supportingClauses.map((clause: string, index: number) => (
                          <Badge key={index} variant="secondary">{clause}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Trigger Criteria */}
            {triggerCriteria && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detection Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {triggerCriteria.thresholds && (
                      <div>
                        <h4 className="font-medium">Thresholds Exceeded:</h4>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {triggerCriteria.thresholds.map((threshold: string, index: number) => (
                            <li key={index}>{threshold}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {triggerCriteria.patterns && (
                      <div>
                        <h4 className="font-medium">Pattern Matches:</h4>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {triggerCriteria.patterns.map((pattern: string, index: number) => (
                            <li key={index}>{pattern}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risk Indicators (for Early Warnings) */}
            {riskIndicators && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {riskIndicators.riskLevel && (
                    <div>
                      <Badge 
                        variant={riskIndicators.riskLevel === 'High' ? 'destructive' : 
                               riskIndicators.riskLevel === 'Medium' ? 'default' : 'secondary'}
                      >
                        {riskIndicators.riskLevel} Risk
                      </Badge>
                    </div>
                  )}
                  
                  {riskIndicators.factors && (
                    <div>
                      <h4 className="font-medium mb-2">Risk Factors:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {riskIndicators.factors.map((factor: string, index: number) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Impact Analysis */}
            {impactAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Impact Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {impactAnalysis.timeImpact && (
                    <div>
                      <h4 className="font-medium">Schedule Impact:</h4>
                      <p className="text-sm">{impactAnalysis.timeImpact}</p>
                    </div>
                  )}
                  
                  {impactAnalysis.costImpact && (
                    <div>
                      <h4 className="font-medium">Cost Impact:</h4>
                      <p className="text-sm">{impactAnalysis.costImpact}</p>
                    </div>
                  )}
                  
                  {impactAnalysis.qualityImpact && (
                    <div>
                      <h4 className="font-medium">Quality Impact:</h4>
                      <p className="text-sm">{impactAnalysis.qualityImpact}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Similar Historical Cases */}
            {similarHistoricalCases && similarHistoricalCases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Similar Historical Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {similarHistoricalCases.map((case_: any, index: number) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-3">
                        <h4 className="font-medium text-sm">{case_.project}</h4>
                        <p className="text-xs text-muted-foreground">{case_.description}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Similarity: {Math.round(case_.similarity * 100)}%
                          </Badge>
                          {case_.outcome && (
                            <Badge variant="secondary" className="text-xs">
                              {case_.outcome}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
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