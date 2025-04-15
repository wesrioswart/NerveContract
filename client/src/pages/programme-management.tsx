import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CalendarClock, 
  Calendar, 
  Clock, 
  AlertCircle, 
  FileUp, 
  Check, 
  X, 
  Info, 
  BarChart,
  Upload,
  RefreshCw,
  GanttChart,
  Pencil,
  MessageSquare
} from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GanttChartComponent from '@/components/programme/gantt-chart-component';
import AnnotationInterface from '@/components/programme/annotation-interface';

// Define interface for projects
interface Project {
  id: number;
  name: string;
  description?: string;
  client?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

// Define interface for programme milestones
interface ProgrammeMilestone {
  id: number;
  projectId: number;
  name: string;
  plannedDate: string;
  forecastDate?: string;
  actualDate?: string;
  status: 'Not Started' | 'At Risk' | 'On Track' | 'Delayed' | 'Completed';
  isKeyDate: boolean;
  affectsCompletionDate: boolean;
  description?: string;
}

// Define interface for programme analysis results
interface ProgrammeAnalysis {
  issuesFound: {
    severity: 'low' | 'medium' | 'high';
    description: string;
    nec4Clause?: string;
    recommendation: string;
  }[];
  metrics: {
    critical_path_tasks: number;
    float_less_than_5days: number;
    totalDuration: number;
    completionDateChange?: number;
  };
}

const ProgrammeManagement = () => {
  console.log("Programme Management component rendering");
  
  const { id: projectIdParam } = useParams();
  const projectId = projectIdParam ? parseInt(projectIdParam) : 1;
  const { toast } = useToast();
  
  console.log("Project ID:", projectId);
  
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [programmeAnalysis, setProgrammeAnalysis] = useState<ProgrammeAnalysis | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(projectId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch all projects for the dropdown
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    refetchOnWindowFocus: false
  });
  
  // Fetch programme milestones
  const { 
    data: milestones = [], 
    isLoading: milestonesLoading,
    isError: milestonesError
  } = useQuery<ProgrammeMilestone[]>({
    queryKey: [`/api/projects/${projectId}/programme-milestones`],
    refetchOnWindowFocus: false
  });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  // File upload mutation
  const fileUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', selectedProjectId.toString());
      
      // Simulate progress for demo purposes
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.floor(Math.random() * 10) + 1;
          if (progress > 100) progress = 100;
          setUploadProgress(progress);
          if (progress >= 100) clearInterval(interval);
        }, 300);
        return () => clearInterval(interval);
      };
      
      const cleanup = simulateProgress();
      
      try {
        const response = await apiRequest('POST', '/api/programme/upload', formData as FormData, true);
        cleanup();
        return response.json();
      } catch (error) {
        cleanup();
        throw error;
      }
    },
    onSuccess: (data) => {
      setShowUploadSuccess(true);
      setProgrammeAnalysis(data.analysis);
      setTimeout(() => setShowUploadSuccess(false), 3000);
      setUploadProgress(0);
      setFile(null);
      
      // Invalidate milestones query to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/programme-milestones`] });
      
      // Also invalidate the current project's milestones if different
      if (selectedProjectId !== projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/programme-milestones`] });
      }
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      setUploadProgress(0);
      
      // Check for specific error responses
      if (error.status === 413) {
        toast({
          title: "File Too Large",
          description: "The programme file exceeds the maximum allowed size of 50MB.",
          variant: "destructive"
        });
      } else {
        // Generic error message
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload programme file. Please try again.",
          variant: "destructive"
        });
      }
    }
  });
  
  // Handle project selection change
  const handleProjectChange = (value: string) => {
    setSelectedProjectId(parseInt(value));
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!file) return;
    
    try {
      await fileUploadMutation.mutateAsync(file);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };
  
  // Analyze programme mutation
  const analyzeProgrammeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/programme/analyze', { projectId }).then(res => res.json());
    },
    onSuccess: (data) => {
      setProgrammeAnalysis(data.analysis);
    }
  });
  
  // Categorize milestones
  console.log("Milestones data received:", milestones);
  
  // Check for any data issues
  const validMilestones = Array.isArray(milestones) ? milestones.filter(m => m && typeof m === 'object') : [];
  console.log("Valid milestones:", validMilestones);
  
  const keyDateMilestones = validMilestones.filter((m: ProgrammeMilestone) => m.isKeyDate);
  const regularMilestones = validMilestones.filter((m: ProgrammeMilestone) => !m.isKeyDate);
  
  // Status badge color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'On Track': return 'bg-blue-100 text-blue-800';
      case 'At Risk': return 'bg-yellow-100 text-yellow-800';
      case 'Delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get severity class for issues
  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 border-red-200 bg-red-50';
      case 'medium': return 'text-amber-600 border-amber-200 bg-amber-50';
      case 'low': return 'text-blue-600 border-blue-200 bg-blue-50';
      default: return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };
  
  const handleDownloadProgramme = () => {
    // In a full implementation, this would download the current programme file
    alert("This would download the current programme file");
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Programme Management</h1>
        <Button
          onClick={handleDownloadProgramme}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download Programme
        </Button>
      </div>
      <p className="text-gray-600 mb-6">
        Manage and analyze your project programme in line with NEC4 requirements
      </p>
      
      <Tabs defaultValue="overview" className="w-full mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <BarChart className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="milestones">
            <Calendar className="w-4 h-4 mr-2" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload Programme
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <GanttChart className="w-4 h-4 mr-2" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="annotations">
            <Pencil className="w-4 h-4 mr-2" />
            Annotations
          </TabsTrigger>
        </TabsList>
        
        {/* Programme Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Programme Status</CardTitle>
                <CardDescription>
                  Current status of the project programme
                </CardDescription>
              </CardHeader>
              <CardContent>
                {milestonesLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : milestonesError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Could not load programme data. Please try again.
                    </AlertDescription>
                  </Alert>
                ) : milestones.length === 0 ? (
                  <div className="text-center py-8">
                    <FileUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-500">No Programme Data</h3>
                    <p className="text-gray-500 mt-1">
                      Upload a programme file to get started
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => document.getElementById('programme-tab-upload')?.click()}
                    >
                      Upload Programme
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Overall Progress</span>
                          <span className="text-sm font-medium">
                            {Math.round(
                              (milestones.filter((m: ProgrammeMilestone) => m.status === 'Completed').length / 
                              milestones.length) * 100
                            )}%
                          </span>
                        </div>
                        <Progress 
                          value={
                            (milestones.filter((m: ProgrammeMilestone) => m.status === 'Completed').length / 
                            milestones.length) * 100
                          } 
                          className="h-2" 
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <Clock className="text-blue-500 mr-2 h-5 w-5" />
                            <span className="text-sm font-medium text-blue-600">On Track</span>
                          </div>
                          <p className="text-2xl font-bold mt-1">
                            {milestones.filter((m: ProgrammeMilestone) => m.status === 'On Track').length}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Milestones
                          </p>
                        </div>
                        
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <AlertCircle className="text-red-500 mr-2 h-5 w-5" />
                            <span className="text-sm font-medium text-red-600">Delayed</span>
                          </div>
                          <p className="text-2xl font-bold mt-1">
                            {milestones.filter((m: ProgrammeMilestone) => 
                              m.status === 'Delayed' || m.status === 'At Risk'
                            ).length}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            Milestones
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Upcoming Key Dates</h4>
                        <div className="space-y-2">
                          {keyDateMilestones
                            .filter((m: ProgrammeMilestone) => m.status !== 'Completed' && m.plannedDate)
                            .sort((a: ProgrammeMilestone, b: ProgrammeMilestone) => {
                              if (!a.plannedDate) return 1;
                              if (!b.plannedDate) return -1;
                              return new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime();
                            })
                            .slice(0, 3)
                            .map((milestone: ProgrammeMilestone) => (
                              <div key={milestone.id} className="flex justify-between items-center">
                                <div>
                                  <span className="text-sm font-medium">{milestone.name}</span>
                                  <Badge 
                                    variant="outline" 
                                    className={`ml-2 ${getStatusColor(milestone.status)}`}
                                  >
                                    {milestone.status}
                                  </Badge>
                                </div>
                                <span className="text-sm">
                                  {milestone.plannedDate ? formatDate(milestone.plannedDate, 'dd MMM yyyy') : 'N/A'}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full mt-4" 
                      variant="outline"
                      onClick={() => analyzeProgrammeMutation.mutate()}
                      disabled={analyzeProgrammeMutation.isPending}
                    >
                      {analyzeProgrammeMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <GanttChart className="mr-2 h-4 w-4" />
                          Analyze Programme
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Programme Insights</CardTitle>
                <CardDescription>
                  AI-powered analysis of your programme
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!programmeAnalysis ? (
                  <div className="text-center py-8">
                    <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-500">No Analysis Available</h3>
                    <p className="text-gray-500 mt-1">
                      Run an analysis to get insights on your programme
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => analyzeProgrammeMutation.mutate()}
                      disabled={analyzeProgrammeMutation.isPending || milestones.length === 0}
                    >
                      {analyzeProgrammeMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <GanttChart className="mr-2 h-4 w-4" />
                          Analyze Programme
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs text-gray-500">Critical Path Tasks</p>
                        <p className="text-xl font-bold">{programmeAnalysis.metrics?.critical_path_tasks || 0}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs text-gray-500">Tasks with Low Float</p>
                        <p className="text-xl font-bold">{programmeAnalysis.metrics?.float_less_than_5days || 0}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Critical Issues</h4>
                      <div className="space-y-2">
                        {!programmeAnalysis.issuesFound || programmeAnalysis.issuesFound.length === 0 ? (
                          <div className="bg-green-50 p-3 rounded-md flex items-center">
                            <Check className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-sm text-green-700">No critical issues found</span>
                          </div>
                        ) : (
                          programmeAnalysis.issuesFound
                            .sort((a, b) => {
                              const severityOrder = { high: 0, medium: 1, low: 2 };
                              return severityOrder[a.severity] - severityOrder[b.severity];
                            })
                            .slice(0, 3)
                            .map((issue, index) => (
                              <div 
                                key={index} 
                                className={`p-3 rounded-md border ${getSeverityClass(issue.severity)}`}
                              >
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">{issue.description}</span>
                                  {issue.nec4Clause && (
                                    <Badge variant="outline" className="ml-2">
                                      Clause {issue.nec4Clause}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs mt-1">{issue.recommendation}</p>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Programme Milestones */}
        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>Programme Milestones</CardTitle>
              <CardDescription>
                Key milestones and dates from your project programme
              </CardDescription>
            </CardHeader>
            <CardContent>
              {milestonesLoading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : milestones.length === 0 ? (
                <div className="text-center py-8">
                  <FileUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-500">No Programme Data</h3>
                  <p className="text-gray-500 mt-1">
                    Upload a programme file to get started
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => document.getElementById('programme-tab-upload')?.click()}
                  >
                    Upload Programme
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Key Dates Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <CalendarClock className="w-5 h-5 mr-2 text-primary" />
                      Key Dates
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Planned Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Forecast Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Affects Completion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {keyDateMilestones.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                                No key dates found
                              </td>
                            </tr>
                          ) : (
                            keyDateMilestones.map((milestone: ProgrammeMilestone) => (
                              <tr key={milestone.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm">{milestone.name}</td>
                                <td className="px-4 py-3 text-sm">
                                  {milestone.plannedDate ? formatDate(milestone.plannedDate, 'dd MMM yyyy') : 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {milestone.forecastDate
                                    ? formatDate(milestone.forecastDate, 'dd MMM yyyy')
                                    : '—'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <Badge 
                                    variant="outline" 
                                    className={getStatusColor(milestone.status)}
                                  >
                                    {milestone.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {milestone.affectsCompletionDate ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <X className="w-5 h-5 text-red-500" />
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Regular Milestones Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-primary" />
                      Regular Milestones
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Planned Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Forecast Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regularMilestones.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                                No regular milestones found
                              </td>
                            </tr>
                          ) : (
                            regularMilestones.map((milestone: ProgrammeMilestone) => (
                              <tr key={milestone.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm">{milestone.name}</td>
                                <td className="px-4 py-3 text-sm">
                                  {milestone.plannedDate ? formatDate(milestone.plannedDate, 'dd MMM yyyy') : 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {milestone.forecastDate 
                                    ? formatDate(milestone.forecastDate, 'dd MMM yyyy')
                                    : '—'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <Badge 
                                    variant="outline" 
                                    className={getStatusColor(milestone.status)}
                                  >
                                    {milestone.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {milestone.description || '—'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Upload Programme Tab */}
        <TabsContent value="upload" id="programme-tab-upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Programme</CardTitle>
              <CardDescription>
                Upload your MS Project or Primavera file for analysis and NEC4 compliance checking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {file ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <Check className="h-8 w-8 text-green-500" />
                      </div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-900">
                          Drop your programme file here or click to browse
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Supported formats: .mpp, .xer, .xml, .xlsx, .xls (Max 50MB)
                        </p>
                      </div>
                      <input
                        id="programme-file"
                        name="programme-file"
                        type="file"
                        accept=".mpp,.xer,.xml,.xlsx,.xls"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Browse Files
                      </Button>
                    </>
                  )}
                </div>
                
                {file && (
                  <>
                    <div className="my-4">
                      <label className="text-sm font-medium mb-2 block">
                        Select Project for this Programme
                      </label>
                      <Select 
                        value={selectedProjectId.toString()} 
                        onValueChange={handleProjectChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Select which project this programme should be associated with
                      </p>
                    </div>
                  
                    {uploadProgress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}
                    
                    <Button
                      className="w-full mt-4"
                      onClick={handleUpload}
                      disabled={fileUploadMutation.isPending || uploadProgress > 0}
                    >
                      {fileUploadMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Programme
                        </>
                      )}
                    </Button>
                  </>
                )}
                
                {showUploadSuccess && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                      Programme file uploaded and processed successfully.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
                  <h4 className="font-medium flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    NEC4 Programme Requirements
                  </h4>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-blue-700">
                    <li>Shows the starting date, Key Dates and Completion Date</li>
                    <li>Shows the order and timing of operations</li>
                    <li>Identifies float and time risk allowances</li>
                    <li>Shows resource usage and dependency on Employer</li>
                    <li>Identifies critical path and dates when Plant and Materials are required</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Programme Analysis Tab */}
        <TabsContent value="analysis">
          <div className="space-y-6">
            {/* Gantt Chart Section */}
            <GanttChartComponent 
              milestones={milestones} 
              programmeAnalysis={programmeAnalysis}
            />
            
            {/* Analysis Details */}
            <Card>
              <CardHeader>
                <CardTitle>Programme Analysis</CardTitle>
                <CardDescription>
                  AI-powered analysis of your programme in line with NEC4 requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!programmeAnalysis ? (
                  <div className="text-center py-8">
                    <GanttChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-500">No Analysis Available</h3>
                    <p className="text-gray-500 mt-1">
                      Upload a programme and run an analysis to get insights
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => analyzeProgrammeMutation.mutate()}
                      disabled={analyzeProgrammeMutation.isPending || milestones.length === 0}
                    >
                      {analyzeProgrammeMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <GanttChart className="mr-2 h-4 w-4" />
                          Run Analysis
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Programme Metrics */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Programme Metrics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Total Duration</p>
                          <p className="text-2xl font-bold">{programmeAnalysis.metrics.totalDuration} days</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Critical Path Tasks</p>
                          <p className="text-2xl font-bold">{programmeAnalysis.metrics.critical_path_tasks}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Low Float Tasks</p>
                          <p className="text-2xl font-bold">{programmeAnalysis.metrics.float_less_than_5days}</p>
                          <p className="text-xs text-gray-500">Tasks with less than 5 days float</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* NEC4 Compliance Issues */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        NEC4 Compliance & Issues
                      </h3>
                      
                      {!programmeAnalysis.issuesFound || programmeAnalysis.issuesFound.length === 0 ? (
                        <Alert className="bg-green-50 text-green-800 border-green-200">
                          <Check className="h-4 w-4" />
                          <AlertTitle>No Issues Found</AlertTitle>
                          <AlertDescription>
                            Your programme appears to be compliant with NEC4 requirements.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-4">
                          {programmeAnalysis.issuesFound && programmeAnalysis.issuesFound.map((issue, index) => (
                            <div 
                              key={index} 
                              className={`p-4 rounded-md border ${getSeverityClass(issue.severity)}`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium text-sm flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    {issue.description}
                                  </h4>
                                  <p className="text-sm mt-1">{issue.recommendation}</p>
                                </div>
                                {issue.nec4Clause && (
                                  <Badge variant="outline">
                                    Clause {issue.nec4Clause}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {programmeAnalysis.metrics?.completionDateChange && (
                      <Alert 
                        className={
                          programmeAnalysis.metrics?.completionDateChange > 0
                            ? "bg-red-50 text-red-800 border-red-200"
                            : "bg-green-50 text-green-800 border-green-200"
                        }
                      >
                        {programmeAnalysis.metrics?.completionDateChange > 0 ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        <AlertTitle>
                          {programmeAnalysis.metrics?.completionDateChange > 0
                            ? "Completion Date at Risk"
                            : "Completion Date Ahead of Schedule"}
                        </AlertTitle>
                        <AlertDescription>
                          {programmeAnalysis.metrics?.completionDateChange > 0
                            ? `Current forecast shows the Completion Date is delayed by ${programmeAnalysis.metrics?.completionDateChange} days.`
                            : `Current forecast shows the Completion Date is ${Math.abs(programmeAnalysis.metrics?.completionDateChange || 0)} days ahead of schedule.`}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Programme Annotations Tab */}
        <TabsContent value="annotations">
          <div className="space-y-6">
            {/* Annotations Interface */}
            {milestones.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-md border-gray-300">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-500">No Programme Data</h3>
                <p className="text-gray-500 mt-1">
                  Upload a programme file to start adding annotations
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => document.getElementById('programme-tab-upload')?.click()}
                >
                  Upload Programme
                </Button>
              </div>
            ) : (
              <AnnotationInterface 
                programmeId={selectedProjectId} 
                taskData={[
                  // Sample task data (would be replaced with real data from GanttChart component)
                  { id: "task-1", name: "Site Preparation" },
                  { id: "task-2", name: "Foundation Works" },
                  { id: "task-3", name: "Ground Floor Structure" },
                  { id: "task-4", name: "Upper Floors Structure" },
                  { id: "task-5", name: "Roof Structure" },
                  { id: "task-6", name: "Building Envelope" },
                  { id: "task-7", name: "MEP Installation" },
                  { id: "task-8", name: "Internal Finishes" },
                  { id: "task-9", name: "Testing & Commissioning" },
                  { id: "task-10", name: "Project Completion" },
                ]}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ProgrammeManagement;