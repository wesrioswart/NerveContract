import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Brain } from 'lucide-react';
import { useAIStrategy } from '@/contexts/ai-strategy-context';

interface AIErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  fallbackModel: string | null;
  retryCount: number;
}

interface AIErrorBoundaryProps {
  children: React.ReactNode;
  fallbackStrategy?: 'retry' | 'fallback' | 'degraded';
  maxRetries?: number;
}

export class AIErrorBoundary extends React.Component<AIErrorBoundaryProps, AIErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: AIErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      fallbackModel: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AIErrorBoundaryState> {
    // Analyze error to determine fallback strategy
    const fallbackModel = AIErrorBoundary.determineFallback(error);
    
    return {
      hasError: true,
      error,
      fallbackModel
    };
  }

  static determineFallback(error: Error): string | null {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('claude') || errorMessage.includes('anthropic')) {
      return 'gpt4o'; // Fallback to GPT-4o if Claude fails
    }
    
    if (errorMessage.includes('grok') || errorMessage.includes('xai')) {
      return 'claude'; // Fallback to Claude if Grok fails
    }
    
    if (errorMessage.includes('openai') || errorMessage.includes('gpt')) {
      return 'claude'; // Fallback to Claude if GPT fails
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      return 'hybrid'; // Switch to hybrid mode to distribute load
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return 'retry'; // Network issues should retry
    }
    
    return null;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AI Error Boundary caught an error:', error, errorInfo);
    
    // Track error for performance monitoring
    if (this.props.children && typeof this.props.children === 'object') {
      // Extract component name for tracking
      const componentName = (this.props.children as any).type?.name || 'Unknown';
      this.trackAIError(error, componentName);
    }
    
    // Auto-retry for certain error types
    if (this.shouldAutoRetry(error) && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry();
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return errorMessage.includes('timeout') || 
           errorMessage.includes('network') || 
           errorMessage.includes('temporary');
  }

  private scheduleRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    // Exponential backoff: 1s, 2s, 4s, 8s...
    const delay = Math.pow(2, this.state.retryCount) * 1000;
    
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1
      }));
    }, delay);
  };

  private trackAIError = (error: Error, componentName: string) => {
    // Send error tracking data
    fetch('/api/ai/error-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        component: componentName,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      })
    }).catch(console.error);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0
    });
  };

  private handleFallback = () => {
    // Implement fallback strategy
    if (this.state.fallbackModel) {
      // This would typically trigger a context update
      // For now, we'll just retry with the fallback
      this.handleRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, fallbackModel, retryCount } = this.state;
      const maxRetries = this.props.maxRetries || 3;
      
      return (
        <Alert className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <strong>AI Service Temporarily Unavailable</strong>
                <p className="text-sm text-gray-600 mt-1">
                  {error?.message || 'An unexpected error occurred with the AI service.'}
                </p>
              </div>
              
              {fallbackModel && fallbackModel !== 'retry' && (
                <div className="text-sm">
                  <Brain className="h-4 w-4 inline mr-1" />
                  Switching to {fallbackModel.toUpperCase()} model...
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={this.handleRetry}
                  size="sm"
                  variant="outline"
                  disabled={retryCount >= maxRetries}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry {retryCount > 0 && `(${retryCount}/${maxRetries})`}
                </Button>
                
                {fallbackModel && fallbackModel !== 'retry' && (
                  <Button 
                    onClick={this.handleFallback}
                    size="sm"
                    variant="default"
                  >
                    Use {fallbackModel.toUpperCase()}
                  </Button>
                )}
              </div>
              
              {retryCount >= maxRetries && (
                <div className="text-sm text-red-600">
                  Maximum retry attempts reached. Please try again later or contact support.
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useAIErrorHandler() {
  const { trackModelPerformance } = useAIStrategy();
  
  return {
    handleAIError: (error: Error, model: string) => {
      trackModelPerformance(model, 0, false);
      console.error(`AI Error in ${model}:`, error);
    },
    
    handleAISuccess: (model: string, duration: number) => {
      trackModelPerformance(model, duration, true);
    }
  };
}