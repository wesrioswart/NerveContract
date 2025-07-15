import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Brain, Code, Zap, ChevronRight, Clock, CheckCircle, AlertCircle, Users, Layers, GitBranch, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIStrategy } from '@/contexts/ai-strategy-context';
import { ModelHealthIndicator } from '@/components/ai/model-health-indicator';
import { AIErrorBoundary } from '@/components/ai/ai-error-boundary';

interface SuperModelResponse {
  result: string;
  confidence: number;
  modelsUsed: string[];
  consensusReached: boolean;
  individualResponses: {
    model: string;
    response: string;
    confidence: number;
    processingTime: number;
  }[];
  fusionReasoning: string;
  totalProcessingTime: number;
}

interface SuperModelRequest {
  task: string;
  content: string;
  context?: string;
  requireConsensus?: boolean;
  useParallelProcessing?: boolean;
  fusionStrategy?: 'voting' | 'weighted' | 'sequential' | 'hybrid';
}

export function SuperModelDemo() {
  const [request, setRequest] = useState<SuperModelRequest>({
    task: '',
    content: '',
    context: '',
    requireConsensus: false,
    useParallelProcessing: true,
    fusionStrategy: 'weighted'
  });
  
  const [response, setResponse] = useState<SuperModelResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track model performance (placeholder implementation)
  const trackModelPerformance = (model: string, duration: number, success: boolean) => {
    // This would normally send metrics to analytics
    console.log(`Model ${model} performance: ${duration}ms, success: ${success}`);
  };
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Safely get AI strategy context
  let aiStrategy = null;
  try {
    aiStrategy = useAIStrategy();
  } catch (error) {
    console.warn('AI Strategy context not available:', error);
  }

  // Auto-configure strategy based on AI Strategy Context
  useEffect(() => {
    if (aiStrategy?.getOptimalStrategy) {
      try {
        const strategy = aiStrategy.getOptimalStrategy('/super-model-demo');
        setRequest(prev => ({
          ...prev,
          fusionStrategy: strategy.fusionStrategy,
          requireConsensus: strategy.requireConsensus,
          useParallelProcessing: strategy.preferredModels.length > 1
        }));
      } catch (error) {
        console.warn('Failed to get optimal strategy:', error);
      }
    }
  }, [aiStrategy]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setError(null);

    try {
      const text = await file.text();
      setRequest(prev => ({
        ...prev,
        content: text,
        task: prev.task || `Analyze ${file.name}`,
        context: prev.context || `File: ${file.name} (${file.type})`
      }));
    } catch (err) {
      setError('Failed to read file. Please try again.');
      setUploadedFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const startTime = Date.now();

    try {
      const res = await fetch('/api/super-model/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!res.ok) {
        throw new Error('Super Model processing failed');
      }

      const data = await res.json();
      setResponse(data.data);
      
      // Track successful performance
      const duration = Date.now() - startTime;
      data.data.modelsUsed?.forEach((model: string) => {
        trackModelPerformance(model, duration, true);
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Track failed performance
      const duration = Date.now() - startTime;
      ['grok', 'claude', 'gpt4o'].forEach(model => {
        trackModelPerformance(model, duration, false);
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getModelIcon = (model: string) => {
    switch (model) {
      case 'grok-3':
        return <Brain className="h-4 w-4" />;
      case 'claude-3.5-sonnet':
        return <Code className="h-4 w-4" />;
      case 'gpt-4o':
        return <Zap className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getModelColor = (model: string) => {
    switch (model) {
      case 'grok-3':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'claude-3.5-sonnet':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'gpt-4o':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exampleRequests = [
    {
      task: 'Complex Contract Analysis',
      content: 'Analyze this NEC4 compensation event for legal compliance, financial impact, and technical feasibility: CE-003 requires additional steel reinforcement due to design changes. Estimated cost: £89,000. Time extension: 21 days. Affects critical path activities A-15 through A-22.',
      fusionStrategy: 'hybrid',
      useParallelProcessing: true
    },
    {
      task: 'Code Review with Multi-Perspective Analysis',
      content: 'Review this React component for performance, security, and maintainability issues: const UserDashboard = ({ userId }) => { const [data, setData] = useState(null); useEffect(() => { fetch(`/api/users/${userId}`).then(res => res.json()).then(setData); }, []); return <div>{data?.name}</div>; };',
      fusionStrategy: 'sequential',
      useParallelProcessing: false
    },
    {
      task: 'Strategic Decision Making',
      content: 'Our construction project is 3 weeks behind schedule. Option A: Overtime costs £150k, recovers 2 weeks. Option B: Additional resources cost £200k, recovers 3 weeks. Option C: Renegotiate timeline, saves £50k but delays completion by 4 weeks. Consider financial impact, client relations, and future opportunities.',
      fusionStrategy: 'weighted',
      useParallelProcessing: true
    }
  ];

  const loadExample = (example: typeof exampleRequests[0]) => {
    setRequest({
      ...request,
      task: example.task,
      content: example.content,
      fusionStrategy: example.fusionStrategy as any,
      useParallelProcessing: example.useParallelProcessing
    });
  };

  return (
    <AIErrorBoundary fallbackStrategy="fallback" maxRetries={3}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-6 w-6" />
              Super Model AI Demo
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Combine all three AI models (Grok 3, Claude 3.5 Sonnet, GPT-4o) for enhanced capabilities
            </p>
          </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="border-dashed border-purple-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">Grok 3</h3>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Complex reasoning, mathematical analysis, strategic thinking
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Claude 3.5 Sonnet</h3>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Technical precision, code analysis, structured thinking
                </p>
              </CardContent>
            </Card>

            <Card className="border-dashed border-green-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">GPT-4o</h3>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Fast processing, clear communication, practical solutions
                </p>
              </CardContent>
            </Card>
          </div>

          <ModelHealthIndicator />

          <Tabs defaultValue="request" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="request" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="task">Task Description</Label>
                  <Input
                    id="task"
                    placeholder="e.g., Analyze contract compliance and financial impact"
                    value={request.task}
                    onChange={(e) => setRequest({...request, task: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content to Process</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste your contract text, code, or analysis request here..."
                    className="min-h-[120px]"
                    value={request.content}
                    onChange={(e) => setRequest({...request, content: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="document-upload">Upload Document</Label>
                  <input
                    type="file"
                    id="document-upload"
                    accept=".pdf,.doc,.docx,.txt,.md,.json"
                    onChange={handleFileUpload}
                    className="w-full p-2 border rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports: PDF, Word, Text, Markdown, and JSON files (max 10MB)
                  </p>
                  {uploadedFile && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{uploadedFile.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(uploadedFile.size / 1024).toFixed(1)}KB
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="context">Context (Optional)</Label>
                  <Input
                    id="context"
                    placeholder="e.g., NEC4 contract, React application, strategic planning"
                    value={request.context}
                    onChange={(e) => setRequest({...request, context: e.target.value})}
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Processing with {request.useParallelProcessing ? 'All Models' : 'Sequential Models'}...
                    </>
                  ) : (
                    <>
                      <Layers className="mr-2 h-4 w-4" />
                      Process with Super Model
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              <div className="space-y-4">
                {exampleRequests.map((example, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-gray-50" onClick={() => loadExample(example)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{example.task}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{example.fusionStrategy}</Badge>
                          <Badge variant="outline">{example.useParallelProcessing ? 'Parallel' : 'Sequential'}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">{example.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="parallel">Parallel Processing</Label>
                    <p className="text-sm text-muted-foreground">Process with all models simultaneously</p>
                  </div>
                  <Switch
                    id="parallel"
                    checked={request.useParallelProcessing}
                    onCheckedChange={(checked) => setRequest({...request, useParallelProcessing: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="consensus">Require Consensus</Label>
                    <p className="text-sm text-muted-foreground">Only accept results when models agree</p>
                  </div>
                  <Switch
                    id="consensus"
                    checked={request.requireConsensus}
                    onCheckedChange={(checked) => setRequest({...request, requireConsensus: checked})}
                  />
                </div>

                <div>
                  <Label htmlFor="fusion">Fusion Strategy</Label>
                  <Select value={request.fusionStrategy} onValueChange={(value) => setRequest({...request, fusionStrategy: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="voting">Voting - Models vote on best response</SelectItem>
                      <SelectItem value="weighted">Weighted - Best model for task gets priority</SelectItem>
                      <SelectItem value="sequential">Sequential - Each model improves the result</SelectItem>
                      <SelectItem value="hybrid">Hybrid - Combines multiple strategies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Super Model Response
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {response.totalProcessingTime}ms
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {response.modelsUsed.length} models
              </span>
              <span className="flex items-center gap-1">
                <GitBranch className="h-4 w-4" />
                {response.consensusReached ? 'Consensus' : 'No consensus'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Combined Result</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{response.result}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Confidence Score</span>
              <div className="flex items-center gap-2">
                <Progress value={response.confidence * 100} className="w-24" />
                <span className="text-sm">{Math.round(response.confidence * 100)}%</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Fusion Reasoning</h4>
              <p className="text-sm text-muted-foreground">{response.fusionReasoning}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Individual Model Responses</h4>
              <div className="space-y-3">
                {response.individualResponses.map((modelResponse, index) => (
                  <Card key={index} className={cn("border", getModelColor(modelResponse.model))}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getModelIcon(modelResponse.model)}
                          <span className="font-medium">{modelResponse.model}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span>{modelResponse.processingTime}ms</span>
                          <Badge variant="outline">{Math.round(modelResponse.confidence * 100)}%</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm whitespace-pre-wrap">{modelResponse.response}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </AIErrorBoundary>
  );
}