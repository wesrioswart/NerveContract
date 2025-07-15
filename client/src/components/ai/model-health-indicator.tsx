import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Code, Zap, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { useAIStrategy } from '@/contexts/ai-strategy-context';
import { cn } from '@/lib/utils';

export function ModelHealthIndicator({ compact = false }: { compact?: boolean }) {
  const { modelHealth, activeModels } = useAIStrategy();

  const getModelIcon = (model: string) => {
    switch (model) {
      case 'grok': return <Brain className="h-4 w-4" />;
      case 'claude': return <Code className="h-4 w-4" />;
      case 'gpt4o': return <Zap className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'down': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'down': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthScore = () => {
    const totalModels = Object.keys(modelHealth).length;
    const healthyModels = Object.values(modelHealth).filter(h => h.status === 'healthy').length;
    const degradedModels = Object.values(modelHealth).filter(h => h.status === 'degraded').length;
    
    return Math.round(((healthyModels * 100) + (degradedModels * 50)) / totalModels);
  };

  const averageLatency = () => {
    const latencies = Object.values(modelHealth).map(h => h.latency).filter(l => l > 0);
    return latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {Object.entries(modelHealth).map(([model, health]) => (
            <div key={model} className="flex items-center gap-1">
              {getModelIcon(model)}
              {getStatusIcon(health.status)}
            </div>
          ))}
        </div>
        <Badge variant="outline" className="text-xs">
          {getHealthScore()}% healthy
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Model Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Overall Health</div>
            <div className="flex items-center gap-2">
              <Progress value={getHealthScore()} className="flex-1" />
              <span className="text-sm">{getHealthScore()}%</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium">Avg Latency</div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{averageLatency()}ms</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(modelHealth).map(([model, health]) => (
            <div key={model} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getModelIcon(model)}
                <div>
                  <div className="font-medium capitalize">{model}</div>
                  <div className="text-sm text-gray-500">
                    {health.latency > 0 ? `${health.latency}ms` : 'No data'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {health.errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {health.errorCount} errors
                  </Badge>
                )}
                <Badge className={cn("text-xs", getStatusColor(health.status))}>
                  {health.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {Object.values(modelHealth).some(h => h.status !== 'healthy') && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {Object.values(modelHealth).filter(h => h.status === 'down').length > 0 ? (
                'Some models are down. Automatically switching to healthy alternatives.'
              ) : (
                'Some models are running slowly. Performance may be degraded.'
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500">
          Active Models: {activeModels.map(m => m.toUpperCase()).join(', ')}
          <br />
          Last Updated: {new Date().toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}