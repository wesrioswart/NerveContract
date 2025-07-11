import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, CheckCircle, AlertCircle, FileText, Code, Database, Settings, Zap, TrendingUp } from 'lucide-react';

export default function GrokDemo() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const startDemo = () => {
    setIsAnalyzing(true);
    setShowResults(false);
    setAnalysisProgress(0);

    // Simulate analysis progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          setShowResults(true);
        }
        return newProgress;
      });
    }, 300);
  };

  const analysisSteps = [
    { name: 'Scanning Files', desc: '53 files (587KB)', icon: FileText },
    { name: 'Analyzing AI Agents', desc: '5 specialized agents', icon: Brain },
    { name: 'Reviewing Frontend', desc: 'React + TypeScript', icon: Code },
    { name: 'Checking Database', desc: 'Schema & Performance', icon: Database },
    { name: 'Security Assessment', desc: 'Vulnerabilities & Best Practices', icon: Settings },
    { name: 'Generating Report', desc: 'Comprehensive Analysis', icon: TrendingUp }
  ];

  const mockResults = {
    overallScore: 8.5,
    codeQuality: {
      maintainability: 8.2,
      scalability: 8.8,
      testability: 6.5,
      documentation: 7.8
    },
    strengths: [
      'Comprehensive AI agent architecture with clear domain separation',
      'Consistent TypeScript implementation across frontend and backend',
      'Well-structured database schema with proper relationships',
      'Robust security implementation with input validation and rate limiting',
      'Efficient React component architecture with proper state management'
    ],
    recommendations: [
      'Add comprehensive unit test coverage for AI agents and utilities',
      'Implement database query optimization for better performance',
      'Add React error boundaries for improved user experience',
      'Create OpenAPI documentation for REST endpoints',
      'Implement performance monitoring and logging'
    ],
    technicalDebt: [
      'Limited test coverage across critical business logic',
      'Some database queries could benefit from better indexing',
      'Error handling patterns could be more consistent',
      'API documentation needs improvement'
    ],
    securityConcerns: [
      'Ensure all user inputs are properly sanitized',
      'Add rate limiting to sensitive endpoints',
      'Implement proper session management'
    ]
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Grok AI Code Review System</h1>
        <p className="text-gray-600">Comprehensive analysis of your NEC4 contract management platform</p>
      </div>

      {/* Demo Trigger */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Brain className="w-6 h-6" />
            How Grok Reviews Your Code
          </CardTitle>
          <CardDescription>
            See how xAI's Grok model analyzes your entire codebase for quality, security, and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={startDemo} 
            disabled={isAnalyzing}
            size="lg"
            className="w-full max-w-md"
          >
            {isAnalyzing ? 'Analyzing...' : 'Start Demo Review'}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis in Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={analysisProgress} className="w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = analysisProgress >= (index + 1) * 16.67;
                const isCompleted = analysisProgress > (index + 1) * 16.67;
                
                return (
                  <div 
                    key={step.name}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isCompleted ? 'bg-green-50 border-green-200' : 
                      isActive ? 'bg-blue-50 border-blue-200' : 
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      isCompleted ? 'text-green-600' : 
                      isActive ? 'text-blue-600' : 
                      'text-gray-400'
                    }`} />
                    <div>
                      <div className="font-medium text-sm">{step.name}</div>
                      <div className="text-xs text-gray-500">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {showResults && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Overall Assessment
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {mockResults.overallScore}/10
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{mockResults.codeQuality.maintainability}</div>
                  <div className="text-sm text-gray-600">Maintainability</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{mockResults.codeQuality.scalability}</div>
                  <div className="text-sm text-gray-600">Scalability</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{mockResults.codeQuality.testability}</div>
                  <div className="text-sm text-gray-600">Testability</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{mockResults.codeQuality.documentation}</div>
                  <div className="text-sm text-gray-600">Documentation</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {mockResults.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Zap className="w-5 h-5" />
                  Priority Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {mockResults.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Technical Debt */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertCircle className="w-5 h-5" />
                  Technical Debt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {mockResults.technicalDebt.map((debt, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{debt}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  Security Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {mockResults.securityConcerns.map((concern, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{concern}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* What This Means */}
          <Card>
            <CardHeader>
              <CardTitle>What This Analysis Means</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Code Quality</h4>
                  <p className="text-sm text-blue-800">
                    Your NEC4 platform demonstrates strong architectural patterns and consistent implementation across all components.
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Business Impact</h4>
                  <p className="text-sm text-green-800">
                    The AI agent architecture effectively handles complex contract management workflows with proper domain separation.
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Next Steps</h4>
                  <p className="text-sm text-purple-800">
                    Focus on test coverage and performance optimization to achieve production-ready quality standards.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}