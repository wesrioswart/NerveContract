import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bot, Clock, CheckCircle, Activity, DollarSign, Truck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AgentAlert {
  id: string;
  agentType: 'email-intake' | 'contract-control' | 'operational' | 'commercial' | 'procurement';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionRequired: boolean;
  relatedEntity: {
    type: string;
    id: string | number;
    reference?: string;
  };
  timestamp: Date;
  projectId: number;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface AgentAlertsProps {
  alerts: AgentAlert[];
  projectId: number;
}

export default function AgentAlerts({ alerts, projectId }: AgentAlertsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const triggerDemoMutation = useMutation({
    mutationFn: async (scenarioType: string) => {
      const response = await apiRequest("POST", "/api/agent/trigger-demo", {
        scenarioType,
        projectId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Demo Scenario Triggered",
        description: "Agent processing initiated. Alerts will appear shortly.",
      });
      // Refresh alerts
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/agent-alerts`] });
    },
    onError: (error: any) => {
      toast({
        title: "Demo Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'operational': return <Activity className="h-4 w-4" />;
      case 'commercial': return <DollarSign className="h-4 w-4" />;
      case 'procurement': return <Truck className="h-4 w-4" />;
      case 'contract-control': return <AlertTriangle className="h-4 w-4" />;
      case 'email-intake': return <Bot className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatAgentName = (agentType: string) => {
    switch (agentType) {
      case 'email-intake': return 'Email Intake Agent';
      case 'contract-control': return 'Contract Control Agent';
      case 'operational': return 'Operational Agent';
      case 'commercial': return 'Commercial Agent';
      case 'procurement': return 'Procurement Agent';
      default: return agentType;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            AI Agent Alerts
            {alerts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => triggerDemoMutation.mutate('archaeological-delay')}
              disabled={triggerDemoMutation.isPending}
            >
              Demo: Archaeological Delay
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => triggerDemoMutation.mutate('equipment-cost-validation')}
              disabled={triggerDemoMutation.isPending}
            >
              Demo: Equipment Cost
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time alerts from specialist AI agents monitoring contract performance
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active alerts from AI agents</p>
            <p className="text-sm mt-1">Try the demo scenarios above to see agent communications</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                {getAgentIcon(alert.agentType)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {formatAgentName(alert.agentType)}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getSeverityColor(alert.severity)}`}
                  >
                    {alert.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(alert.timestamp)}
                  </span>
                </div>
                
                <h4 className="font-medium text-sm mb-1">
                  {alert.title}
                </h4>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {alert.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {alert.relatedEntity.reference && (
                      <span>Ref: {alert.relatedEntity.reference}</span>
                    )}
                    <span>Type: {alert.relatedEntity.type}</span>
                  </div>
                  
                  {alert.actionRequired && alert.status === 'active' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      Take Action
                    </Button>
                  )}
                  
                  {alert.status === 'acknowledged' && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Acknowledged
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}