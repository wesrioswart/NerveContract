import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Code, 
  Calculator, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Target,
  Zap,
  Play,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GrokTestResult {
  testName: string;
  category: 'code' | 'reasoning' | 'logic';
  input: string;
  output: string;
  model: string;
  confidence: number;
  processingTime: number;
  score: number;
  analysis: string;
}

interface TestSummary {
  totalTests: number;
  averageScore: number;
  modelDistribution: Record<string, number>;
  averageProcessingTime: number;
  categoryScores: Record<string, number>;
}

interface TestResults {
  codeResults: GrokTestResult[];
  reasoningResults: GrokTestResult[];
  logicResults: GrokTestResult[];
  summary: TestSummary;
}

export function GrokTestSuite() {
  const [results, setResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'code' | 'reasoning' | 'logic' | null>(null);

  const runAllTests = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/grok-tests/run-all-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Test failed: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const runCategoryTests = async (category: 'code' | 'reasoning' | 'logic') => {
    setIsLoading(true);
    setError(null);
    setActiveCategory(category);

    try {
      const response = await fetch(`/api/grok-tests/run-tests/${category}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Test failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Update results with category-specific data
      setResults(prev => {
        if (!prev) {
          return {
            codeResults: category === 'code' ? data.data : [],
            reasoningResults: category === 'reasoning' ? data.data : [],
            logicResults: category === 'logic' ? data.data : [],
            summary: {
              totalTests: data.data.length,
              averageScore: data.data.reduce((sum: number, r: GrokTestResult) => sum + r.score, 0) / data.data.length,
              modelDistribution: data.data.reduce((acc: Record<string, number>, r: GrokTestResult) => {
                acc[r.model] = (acc[r.model] || 0) + 1;
                return acc;
              }, {}),
              averageProcessingTime: data.data.reduce((sum: number, r: GrokTestResult) => sum + r.processingTime, 0) / data.data.length,
              categoryScores: { [category]: data.data.reduce((sum: number, r: GrokTestResult) => sum + r.score, 0) / data.data.length }
            }
          };
        }
        
        return {
          ...prev,
          [`${category}Results`]: data.data,
          summary: {
            ...prev.summary,
            categoryScores: {
              ...prev.summary.categoryScores,
              [category]: data.data.reduce((sum: number, r: GrokTestResult) => sum + r.score, 0) / data.data.length
            }
          }
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setActiveCategory(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
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

  const renderTestResult = (result: GrokTestResult) => (
    <Card key={result.testName} className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{result.testName}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", getModelColor(result.model))}>
              {getModelIcon(result.model)}
              <span className="ml-1">{result.model}</span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {result.processingTime}ms
            </Badge>
            <Badge variant="outline" className={cn("text-xs font-bold", getScoreColor(result.score))}>
              {result.score}/10
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Analysis:</h4>
            <p className="text-sm text-muted-foreground">{result.analysis}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Input:</h4>
            <div className="bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap">{result.input.substring(0, 300)}...</pre>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Output:</h4>
            <div className="bg-muted p-3 rounded-md max-h-40 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{result.output}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>Score: {result.score}/10</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Grok AI Testing Suite
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive testing of Grok's code analysis, reasoning, and logic capabilities
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button 
              onClick={runAllTests} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isLoading ? 'Running All Tests...' : 'Run All Tests'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => runCategoryTests('code')} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              {isLoading && activeCategory === 'code' ? 'Testing...' : 'Code Tests'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => runCategoryTests('reasoning')} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              {isLoading && activeCategory === 'reasoning' ? 'Testing...' : 'Reasoning Tests'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => runCategoryTests('logic')} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              {isLoading && activeCategory === 'logic' ? 'Testing...' : 'Logic Tests'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error: {error}
          </AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Test Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{results.summary.totalTests}</div>
                  <div className="text-sm text-muted-foreground">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className={cn("text-2xl font-bold", getScoreColor(results.summary.averageScore))}>
                    {results.summary.averageScore.toFixed(1)}/10
                  </div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{results.summary.averageProcessingTime.toFixed(0)}ms</div>
                  <div className="text-sm text-muted-foreground">Avg Processing Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Object.entries(results.summary.modelDistribution).map(([model, count]) => (
                      <Badge key={model} className={cn("text-xs mr-1", getModelColor(model))}>
                        {model}: {count}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">Model Distribution</div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <h4 className="font-semibold">Category Scores:</h4>
                {Object.entries(results.summary.categoryScores).map(([category, score]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="capitalize">{category}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={score * 10} className="w-32" />
                      <span className={cn("font-bold", getScoreColor(score))}>{score.toFixed(1)}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="code" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Code Tests ({results.codeResults.length})
              </TabsTrigger>
              <TabsTrigger value="reasoning" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Reasoning Tests ({results.reasoningResults.length})
              </TabsTrigger>
              <TabsTrigger value="logic" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Logic Tests ({results.logicResults.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="code" className="space-y-4">
              <div className="grid gap-4">
                {results.codeResults.map(renderTestResult)}
              </div>
            </TabsContent>
            
            <TabsContent value="reasoning" className="space-y-4">
              <div className="grid gap-4">
                {results.reasoningResults.map(renderTestResult)}
              </div>
            </TabsContent>
            
            <TabsContent value="logic" className="space-y-4">
              <div className="grid gap-4">
                {results.logicResults.map(renderTestResult)}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}