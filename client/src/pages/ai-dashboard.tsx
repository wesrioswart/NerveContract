import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Clock, Activity, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ApprovalRequest {
  id: string;
  projectId: number;
  changeType: string;
  title: string;
  description: string;
  impact: {
    delayDays: number;
    affectsCriticalPath: boolean;
    cost: number;
    confidence: number;
  };
  nec4Compliance: {
    isValid: boolean;
    clause: string;
    reason: string;
  };
  autoApproved: boolean;
  approvalRequired: boolean;
  requestedAt: string;
  status: string;
}

interface DashboardMetrics {
  totalEventsProcessed: number;
  pendingApprovals: number;
  autoAppliedUpdates: number;
  complianceRate: number;
  averageProcessingTime: number;
  timeSavedToday: number;
}

export default function AIDashboard() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Mock data for demonstration - in production, this would come from your API
  const mockMetrics: DashboardMetrics = {
    totalEventsProcessed: 12,
    pendingApprovals: 3,
    autoAppliedUpdates: 8,
    complianceRate: 98,
    averageProcessingTime: 23,
    timeSavedToday: 6.5
  };

  const mockApprovals: ApprovalRequest[] = [
    {
      id: "CE_001",
      projectId: 1,
      changeType: "compensation_event",
      title: "Foundation Excavation Delay",
      description: "Unexpected rock found during excavation requiring mechanical breaking",
      impact: {
        delayDays: 3,
        affectsCriticalPath: true,
        cost: 15000,
        confidence: 0.85
      },
      nec4Compliance: {
        isValid: true,
        clause: "60.1(12)",
        reason: "Physical conditions clause applies"
      },
      autoApproved: false,
      approvalRequired: true,
      requestedAt: new Date().toISOString(),
      status: "pending"
    },
    {
      id: "CE_002",
      projectId: 1,
      changeType: "compensation_event",
      title: "Steel Delivery Delay",
      description: "Supplier reported 1-day delay in steel frame delivery",
      impact: {
        delayDays: 1,
        affectsCriticalPath: false,
        cost: 2000,
        confidence: 0.92
      },
      nec4Compliance: {
        isValid: true,
        clause: "60.1(14)",
        reason: "Supplier default clause applies"
      },
      autoApproved: false,
      approvalRequired: true,
      requestedAt: new Date().toISOString(),
      status: "pending"
    },
    {
      id: "EW_001",
      projectId: 1,
      changeType: "early_warning",
      title: "Weather Warning - Heavy Rain",
      description: "Met Office forecast shows 3 days of heavy rain starting tomorrow",
      impact: {
        delayDays: 0,
        affectsCriticalPath: false,
        cost: 0,
        confidence: 0.78
      },
      nec4Compliance: {
        isValid: true,
        clause: "16.1",
        reason: "Early warning notification clause"
      },
      autoApproved: false,
      approvalRequired: false,
      requestedAt: new Date().toISOString(),
      status: "pending"
    }
  ];

  const handleApproval = async (approvalId: string, approved: boolean) => {
    try {
      // In production, this would call your approval API
      toast({
        title: approved ? "Change Approved" : "Change Rejected",
        description: `Schedule update ${approved ? 'approved and being implemented' : 'rejected - no changes made'}`,
        variant: approved ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process approval",
        variant: "destructive",
      });
    }
  };

  const getImpactColor = (impact: ApprovalRequest['impact']) => {
    if (impact.affectsCriticalPath) return "text-red-600";
    if (impact.delayDays > 1) return "text-amber-600";
    return "text-green-600";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">Rejected</Badge>;
      case "auto_approved":
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">Auto-Approved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">🤖 AI Schedule Manager Dashboard</h1>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Demo Ready:</strong> This dashboard demonstrates automated programme changes triggered by compensation events and early warnings, with intelligent approval workflows - a major competitive advantage for the investor demo.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">AI Agent Active</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Events Processed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{mockMetrics.totalEventsProcessed}</p>
            <p className="text-xs text-gray-500">+3 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{mockMetrics.pendingApprovals}</p>
            <p className="text-xs text-gray-500">Awaiting your decision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Auto-Applied Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{mockMetrics.autoAppliedUpdates}</p>
            <p className="text-xs text-gray-500">No approval needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Time Saved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{mockMetrics.timeSavedToday}h</p>
            <p className="text-xs text-gray-500">vs manual processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">NEC4 Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-green-600">{mockMetrics.complianceRate}%</p>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500">All events validated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Average Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-blue-600">{mockMetrics.averageProcessingTime}s</p>
              <TrendingDown className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500">Analysis to recommendation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Schedule Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-green-600">94%</p>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500">Prediction accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Agent Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Schedule Monitor</span>
                  </div>
                  <span className="text-sm text-green-600">Active - Last check: 2 minutes ago</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">NEC4 Compliance Checker</span>
                  </div>
                  <span className="text-sm text-green-600">Active - Processing events</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">MS Project Integration</span>
                  </div>
                  <span className="text-sm text-green-600">Connected - Ready for updates</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                Pending Approvals ({mockApprovals.filter(a => a.status === 'pending').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockApprovals.filter(approval => approval.status === 'pending').map(approval => (
                  <div key={approval.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{approval.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{approval.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(approval.status)}
                        <Badge variant="outline" className="text-xs">
                          {approval.changeType.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Impact: </span>
                        <span className={getImpactColor(approval.impact)}>
                          {approval.impact.delayDays > 0 ? `+${approval.impact.delayDays} days` : 'No delay'}
                          {approval.impact.affectsCriticalPath && ' (Critical Path)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Cost: </span>
                        <span className="font-medium">£{approval.impact.cost.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Confidence: </span>
                        <span className="font-medium">{(approval.impact.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500">NEC4 Clause:</span>
                        <Badge variant="outline" className="text-xs">
                          {approval.nec4Compliance.clause}
                        </Badge>
                        <span className={approval.nec4Compliance.isValid ? 'text-green-600' : 'text-red-600'}>
                          {approval.nec4Compliance.isValid ? 'Valid' : 'Invalid'}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleApproval(approval.id, false)}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleApproval(approval.id, true)}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Weather delay automatically processed</p>
                    <p className="text-xs text-gray-500">Auto-approved: 1 day delay, non-critical - 2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Schedule analysis completed</p>
                    <p className="text-xs text-gray-500">Analyzed 47 activities, updated 3 dependencies - 5 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Foundation delay requires approval</p>
                    <p className="text-xs text-gray-500">3 days impact on critical path - 8 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}