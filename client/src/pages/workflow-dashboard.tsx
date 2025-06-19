import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Square, 
  RefreshCw, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Clock,
  Settings,
  TrendingUp,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentStatus {
  name: string;
  status: 'idle' | 'running' | 'error' | 'disabled';
  lastRun: string;
  nextRun: string;
  errorCount: number;
  performance: {
    averageRunTime: number;
    successRate: number;
    itemsProcessed: number;
  };
}

interface WorkflowMetrics {
  totalEventsProcessed: number;
  agentCoordinations: number;
  averageResponseTime: number;
  errorRate: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

interface WorkflowStatus {
  systemStatus: string;
  systemHealth: string;
  agentStatuses: Record<string, AgentStatus>;
  metrics: WorkflowMetrics;
  timestamp: string;
}

export default function WorkflowDashboard() {
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkflowStatus();
    const interval = setInterval(fetchWorkflowStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchWorkflowStatus = async () => {
    try {
      const response = await fetch('/api/workflows/status');
      const result = await response.json();
      
      if (result.success) {
        setWorkflowStatus(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to fetch workflow status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workflow status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startOrchestrator = async () => {
    setTriggering('start');
    try {
      const response = await fetch('/api/workflows/start', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Master Orchestrator started successfully"
        });
        await fetchWorkflowStatus();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start orchestrator",
        variant: "destructive"
      });
    } finally {
      setTriggering(null);
    }
  };

  const stopOrchestrator = async () => {
    setTriggering('stop');
    try {
      const response = await fetch('/api/workflows/stop', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Master Orchestrator stopped successfully"
        });
        await fetchWorkflowStatus();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop orchestrator",
        variant: "destructive"
      });
    } finally {
      setTriggering(null);
    }
  };

  const runComprehensiveWorkflow = async () => {
    setTriggering('comprehensive');
    try {
      const response = await fetch('/api/workflows/run-comprehensive', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Comprehensive workflow triggered"
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger comprehensive workflow",
        variant: "destructive"
      });
    } finally {
      setTriggering(null);
    }
  };

  const triggerAgent = async (agentName: string) => {
    setTriggering(agentName);
    try {
      const response = await fetch(`/api/workflows/agents/${agentName}/trigger`, { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `${agentName} agent triggered successfully`
        });
        await fetchWorkflowStatus();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to trigger ${agentName} agent`,
        variant: "destructive"
      });
    } finally {
      setTriggering(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-green-500 animate-pulse" />;
      case 'idle':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'disabled':
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'idle':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      case 'disabled':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatAgentName = (name: string) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading workflow status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Workflows</h1>
          <p className="text-muted-foreground">
            Monitor and control the AI agent orchestration system
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={fetchWorkflowStatus}
            variant="outline"
            size="sm"
            disabled={!!triggering}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${workflowStatus?.systemStatus === 'running' ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div className="text-2xl font-bold capitalize">
                {workflowStatus?.systemStatus || 'Unknown'}
              </div>
            </div>
            <p className={`text-xs ${getHealthColor(workflowStatus?.systemHealth || 'unknown')}`}>
              Health: {workflowStatus?.systemHealth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Processed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflowStatus?.metrics.totalEventsProcessed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {workflowStatus?.metrics.agentCoordinations || 0} coordinations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(workflowStatus?.metrics.averageResponseTime || 0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(workflowStatus?.metrics.errorRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              System reliability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Orchestrator Control
          </CardTitle>
          <CardDescription>
            Start, stop, and manage the master orchestrator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={startOrchestrator}
              disabled={workflowStatus?.systemStatus === 'running' || triggering === 'start'}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {triggering === 'start' ? 'Starting...' : 'Start Orchestrator'}
            </Button>
            
            <Button
              onClick={stopOrchestrator}
              disabled={workflowStatus?.systemStatus !== 'running' || triggering === 'stop'}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              {triggering === 'stop' ? 'Stopping...' : 'Stop Orchestrator'}
            </Button>
            
            <Button
              onClick={runComprehensiveWorkflow}
              disabled={workflowStatus?.systemStatus !== 'running' || triggering === 'comprehensive'}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {triggering === 'comprehensive' ? 'Running...' : 'Run Comprehensive'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agent Status */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agent Status</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflowStatus && Object.entries(workflowStatus.agentStatuses).map(([name, agent]) => (
              <Card key={name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {formatAgentName(name)}
                  </CardTitle>
                  {getStatusIcon(agent.status)}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={agent.status === 'running' ? 'default' : 
                                  agent.status === 'idle' ? 'secondary' :
                                  agent.status === 'error' ? 'destructive' : 'outline'}>
                      {agent.status}
                    </Badge>
                    <Button
                      onClick={() => triggerAgent(name)}
                      disabled={!!triggering || agent.status === 'disabled'}
                      size="sm"
                      variant="outline"
                    >
                      {triggering === name ? 'Running...' : 'Trigger'}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span className="ml-2 font-medium">
                        {agent.performance.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={agent.performance.successRate} className="h-2" />
                  </div>
                  
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-muted-foreground">Processed:</span>
                      <span className="ml-2">{agent.performance.itemsProcessed}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Errors:</span>
                      <span className="ml-2">{agent.errorCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Run:</span>
                      <span className="ml-2">
                        {new Date(agent.lastRun).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Detailed performance statistics for each agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {workflowStatus && Object.entries(workflowStatus.agentStatuses).map(([name, agent]) => (
                    <div key={name} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{formatAgentName(name)}</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Items Processed</span>
                          <div className="font-medium">{agent.performance.itemsProcessed}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success Rate</span>
                          <div className="font-medium">{agent.performance.successRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Run Time</span>
                          <div className="font-medium">{Math.round(agent.performance.averageRunTime)}ms</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Error Count</span>
                          <div className="font-medium">{agent.errorCount}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Progress value={agent.performance.successRate} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}