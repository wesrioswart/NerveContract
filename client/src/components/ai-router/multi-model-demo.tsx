import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Code, Zap, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIResponse {
  result: string;
  model: string;
  confidence: number;
  reasoning?: string;
  processingTime: number;
}

interface AIRequest {
  task: string;
  content: string;
  context?: string;
  priority?: 'speed' | 'quality' | 'reasoning';
  complexity?: 'simple' | 'medium' | 'complex';
  type?: 'code' | 'analysis' | 'chat' | 'document' | 'calculation';
}

export function MultiModelDemo() {
  const [request, setRequest] = useState<AIRequest>({
    task: '',
    content: '',
    context: '',
    priority: 'speed',
    complexity: 'medium',
    type: 'analysis'
  });
  
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<{ model: string; reasoning: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/ai/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!res.ok) {
        throw new Error('AI routing failed');
      }

      const data = await res.json();
      setResponse(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendation = async () => {
    try {
      const res = await fetch('/api/ai/recommend-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: request.task,
          type: request.type,
          complexity: request.complexity,
          priority: request.priority
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendation(data.data);
      }
    } catch (err) {
      console.error('Failed to get recommendation:', err);
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
        return 'bg-purple-100 text-purple-800';
      case 'claude-3.5-sonnet':
        return 'bg-blue-100 text-blue-800';
      case 'gpt-4o':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exampleRequests = [
    {
      task: 'Analyze compensation event',
      content: 'CE-001: Additional excavation required due to unforeseen ground conditions. Estimated cost: £125,000. Time extension: 14 days.',
      type: 'calculation',
      complexity: 'complex',
      priority: 'reasoning'
    },
    {
      task: 'Review agent code',
      content: 'async function processContract(data) { const result = await ai.analyze(data); return result; }',
      type: 'code',
      complexity: 'medium',
      priority: 'quality'
    },
    {
      task: 'Quick contract query',
      content: 'What is the time limit for submitting a compensation event under NEC4?',
      type: 'chat',
      complexity: 'simple',
      priority: 'speed'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Multi-Model AI Router Demo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test intelligent routing between Grok 3, Claude 3.5 Sonnet, and GPT-4o based on task requirements
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">Grok 3</h3>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Complex reasoning, mathematical analysis, deep contract interpretation
                </p>
                <div className="mt-2 space-y-1">
                  <Badge variant="outline" className="text-xs">1M token context</Badge>
                  <Badge variant="outline" className="text-xs">92.7% MMLU</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Claude 3.5 Sonnet</h3>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Code review, technical documentation, implementation quality
                </p>
                <div className="mt-2 space-y-1">
                  <Badge variant="outline" className="text-xs">93.7% HumanEval</Badge>
                  <Badge variant="outline" className="text-xs">200K context</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">GPT-4o</h3>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  Fast responses, reliable performance, general queries
                </p>
                <div className="mt-2 space-y-1">
                  <Badge variant="outline" className="text-xs">88 tokens/sec</Badge>
                  <Badge variant="outline" className="text-xs">$0.01/1M tokens</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold">Request Configuration</h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="task">Task Description</Label>
                  <Input
                    id="task"
                    placeholder="e.g., Analyze compensation event"
                    value={request.task}
                    onChange={(e) => setRequest({ ...request, task: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter the content to analyze..."
                    value={request.content}
                    onChange={(e) => setRequest({ ...request, content: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={request.type} onValueChange={(value) => setRequest({ ...request, type: value as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analysis">Analysis</SelectItem>
                        <SelectItem value="code">Code</SelectItem>
                        <SelectItem value="chat">Chat</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="calculation">Calculation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="complexity">Complexity</Label>
                    <Select value={request.complexity} onValueChange={(value) => setRequest({ ...request, complexity: value as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="complex">Complex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={request.priority} onValueChange={(value) => setRequest({ ...request, priority: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="speed">Speed</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="reasoning">Reasoning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="context">Context (Optional)</Label>
                  <Input
                    id="context"
                    placeholder="Additional context..."
                    value={request.context}
                    onChange={(e) => setRequest({ ...request, context: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={isLoading || !request.task || !request.content}>
                  {isLoading ? 'Processing...' : 'Submit Request'}
                </Button>
                <Button variant="outline" onClick={getRecommendation} disabled={!request.task}>
                  Get Recommendation
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Example Requests</h3>
              <div className="space-y-2">
                {exampleRequests.map((example, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => setRequest({ ...request, ...example })}>
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{example.task}</p>
                      <p className="text-xs text-muted-foreground truncate">{example.content}</p>
                      <div className="flex gap-1 mt-2">
                        <Badge variant="secondary" className="text-xs">{example.type}</Badge>
                        <Badge variant="outline" className="text-xs">{example.complexity}</Badge>
                        <Badge variant="outline" className="text-xs">{example.priority}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {recommendation && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Recommended Model:</strong> {recommendation.model}
                <br />
                <span className="text-sm text-muted-foreground">{recommendation.reasoning}</span>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error: {error}
              </AlertDescription>
            </Alert>
          )}

          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getModelIcon(response.model)}
                    AI Response
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", getModelColor(response.model))}>
                      {response.model}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {response.processingTime}ms
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {(response.confidence * 100).toFixed(1)}% confidence
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Result:</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{response.result}</p>
                    </div>
                  </div>
                  
                  {response.reasoning && (
                    <div>
                      <h4 className="font-semibold mb-2">Model Selection Reasoning:</h4>
                      <p className="text-sm text-muted-foreground">{response.reasoning}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}