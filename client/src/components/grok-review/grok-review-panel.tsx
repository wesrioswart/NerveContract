import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface CodeReview {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  technicalDebt: string[];
  securityConcerns: string[];
  performanceIssues: string[];
  architecturalAssessment: string;
  codeQuality: {
    maintainability: number;
    scalability: number;
    testability: number;
    documentation: number;
  };
}

export default function GrokReviewPanel() {
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState<CodeReview | null>(null);
  const [report, setReport] = useState<string>('');
  const [error, setError] = useState<string>('');

  const startReview = async () => {
    setIsReviewing(true);
    setError('');
    setReview(null);
    setReport('');

    try {
      const response = await apiRequest('/api/grok/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.success) {
        setReview(response.review);
        setReport(response.report);
      } else {
        setError(response.error || 'Review failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsReviewing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 6) return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Grok AI Code Review
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of your NEC4 platform codebase using xAI's Grok model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={startReview} 
            disabled={isReviewing}
            className="w-full"
          >
            {isReviewing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing codebase...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Start Code Review
              </>
            )}
          </Button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {review && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Overall Assessment
                <Badge className={getScoreColor(review.overallScore)}>
                  {getScoreIcon(review.overallScore)}
                  {review.overallScore}/10
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{review.codeQuality.maintainability}</div>
                  <div className="text-sm text-gray-600">Maintainability</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{review.codeQuality.scalability}</div>
                  <div className="text-sm text-gray-600">Scalability</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{review.codeQuality.testability}</div>
                  <div className="text-sm text-gray-600">Testability</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{review.codeQuality.documentation}</div>
                  <div className="text-sm text-gray-600">Documentation</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          {review.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {review.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <AlertCircle className="w-5 h-5" />
                  Priority Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Technical Debt */}
          {review.technicalDebt.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertCircle className="w-5 h-5" />
                  Technical Debt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.technicalDebt.map((debt, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{debt}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Security Concerns */}
          {review.securityConcerns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  Security Concerns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.securityConcerns.map((concern, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{concern}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Full Report */}
          {report && (
            <Card>
              <CardHeader>
                <CardTitle>Complete Analysis Report</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-md overflow-x-auto">
                  {report}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}