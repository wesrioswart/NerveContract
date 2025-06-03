import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useProject } from '@/contexts/project-context';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Upload, 
  FileSpreadsheet, 
  Wand2, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Download,
  Eye,
  Clock,
  Building
} from 'lucide-react';
import { AnimationWrapper } from '@/components/ui/animation-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

interface TeamMember {
  id?: number;
  name: string;
  role: string;
  company: string;
  isSubcontractor: boolean;
  hours: number;
  rate?: number;
  skills?: string[];
}

interface ResourceAllocation {
  id?: number;
  projectId: number;
  periodName: string;
  weekCommencing: string;
  teamMembers: TeamMember[];
  totalLabourHours: number;
  extractedFrom?: string;
  extractionConfidence?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function ResourceAllocationPage() {
  const { currentProject } = useProject();
  const { toast } = useToast();
  const [uploadDialog, setUploadDialog] = useState(false);
  const [extractedData, setExtractedData] = useState<ResourceAllocation | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentAllocation, setCurrentAllocation] = useState<ResourceAllocation>({
    projectId: currentProject?.id || 0,
    periodName: '',
    weekCommencing: '',
    teamMembers: [],
    totalLabourHours: 0
  });

  // Fetch existing resource allocations
  const { data: allocations = [], isLoading } = useQuery({
    queryKey: ['/api/resource-allocations', currentProject?.id],
    queryFn: async () => {
      if (!currentProject) return [];
      const response = await fetch(`/api/projects/${currentProject.id}/resource-allocations`);
      if (!response.ok) throw new Error('Failed to fetch resource allocations');
      return response.json();
    },
    enabled: !!currentProject,
  });

  // Handle file upload and AI extraction
  const extractMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', currentProject?.id.toString() || '');
      
      const response = await fetch('/api/resource-allocation/extract', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to extract resource data');
      return response.json();
    },
    onSuccess: (data) => {
      setExtractedData(data);
      toast({
        title: "Extraction Complete",
        description: `Successfully extracted ${data.teamMembers.length} team members`,
      });
    },
    onError: (error) => {
      toast({
        title: "Extraction Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save resource allocation
  const saveMutation = useMutation({
    mutationFn: async (allocation: ResourceAllocation) => {
      const response = await fetch('/api/resource-allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocation),
      });
      
      if (!response.ok) throw new Error('Failed to save resource allocation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resource-allocations', currentProject?.id] });
      setUploadDialog(false);
      setExtractedData(null);
      setCurrentAllocation({
        projectId: currentProject?.id || 0,
        periodName: '',
        weekCommencing: '',
        teamMembers: [],
        totalLabourHours: 0
      });
      toast({
        title: "Success",
        description: "Resource allocation saved successfully",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsExtracting(true);
    
    try {
      await extractMutation.mutateAsync(file);
    } finally {
      setIsExtracting(false);
    }
  };

  const addTeamMember = () => {
    const newMember: TeamMember = {
      name: '',
      role: '',
      company: '',
      isSubcontractor: false,
      hours: 0,
    };
    
    if (extractedData) {
      setExtractedData({
        ...extractedData,
        teamMembers: [...extractedData.teamMembers, newMember]
      });
    } else {
      setCurrentAllocation({
        ...currentAllocation,
        teamMembers: [...currentAllocation.teamMembers, newMember]
      });
    }
  };

  const removeTeamMember = (index: number) => {
    if (extractedData) {
      const newMembers = extractedData.teamMembers.filter((_, i) => i !== index);
      setExtractedData({
        ...extractedData,
        teamMembers: newMembers,
        totalLabourHours: newMembers.reduce((sum, member) => sum + member.hours, 0)
      });
    } else {
      const newMembers = currentAllocation.teamMembers.filter((_, i) => i !== index);
      setCurrentAllocation({
        ...currentAllocation,
        teamMembers: newMembers,
        totalLabourHours: newMembers.reduce((sum, member) => sum + member.hours, 0)
      });
    }
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: any) => {
    const allocation = extractedData || currentAllocation;
    const newMembers = [...allocation.teamMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    
    const totalHours = newMembers.reduce((sum, member) => sum + (member.hours || 0), 0);
    
    if (extractedData) {
      setExtractedData({
        ...extractedData,
        teamMembers: newMembers,
        totalLabourHours: totalHours
      });
    } else {
      setCurrentAllocation({
        ...currentAllocation,
        teamMembers: newMembers,
        totalLabourHours: totalHours
      });
    }
  };

  const confirmExtraction = () => {
    if (extractedData) {
      saveMutation.mutate(extractedData);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <AnimationWrapper as="h1" type="slideIn" className="text-3xl font-bold mb-2 flex items-center gap-2">
        <Users className="h-7 w-7" />
        Resource Allocation
      </AnimationWrapper>
      
      <AnimationWrapper type="fadeIn" delay={0.1}>
        <p className="text-gray-500 mb-6">
          Manage team resource allocation with AI-powered extraction from spreadsheets and documents
        </p>
      </AnimationWrapper>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload & Extract
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Resource Allocation Document</DialogTitle>
              <DialogDescription>
                Upload an Excel spreadsheet or PDF containing resource allocation data. Our AI will extract and structure the information.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="upload" className="w-full">
              <TabsList>
                <TabsTrigger value="upload">Upload File</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                {extractedData && <TabsTrigger value="review">Review Extracted</TabsTrigger>}
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <Label htmlFor="file-upload" className="text-lg font-medium cursor-pointer">
                    Drop your file here or click to browse
                  </Label>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports Excel (.xlsx), CSV, and PDF files
                  </p>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="outline" className="mt-4" onClick={() => document.getElementById('file-upload')?.click()}>
                    Choose File
                  </Button>
                </div>

                {selectedFile && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <Badge variant="outline">{(selectedFile.size / 1024).toFixed(1)} KB</Badge>
                    </div>
                  </div>
                )}

                {isExtracting && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-5 w-5 text-amber-600 animate-spin" />
                      <span>AI is extracting resource allocation data...</span>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="period-name">Period Name</Label>
                    <Input
                      id="period-name"
                      value={currentAllocation.periodName}
                      onChange={(e) => setCurrentAllocation({...currentAllocation, periodName: e.target.value})}
                      placeholder="e.g., Week 23"
                    />
                  </div>
                  <div>
                    <Label htmlFor="week-commencing">Week Commencing</Label>
                    <Input
                      id="week-commencing"
                      type="date"
                      value={currentAllocation.weekCommencing}
                      onChange={(e) => setCurrentAllocation({...currentAllocation, weekCommencing: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Team Members</h4>
                    <Button variant="outline" size="sm" onClick={addTeamMember}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Member
                    </Button>
                  </div>

                  {currentAllocation.teamMembers.map((member, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-6 gap-3 items-end">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={member.name}
                              onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                              placeholder="Full name"
                            />
                          </div>
                          <div>
                            <Label>Role</Label>
                            <Input
                              value={member.role}
                              onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                              placeholder="Job role"
                            />
                          </div>
                          <div>
                            <Label>Company</Label>
                            <Input
                              value={member.company}
                              onChange={(e) => updateTeamMember(index, 'company', e.target.value)}
                              placeholder="Company name"
                            />
                          </div>
                          <div>
                            <Label>Hours</Label>
                            <Input
                              type="number"
                              value={member.hours}
                              onChange={(e) => updateTeamMember(index, 'hours', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={member.isSubcontractor}
                              onCheckedChange={(checked) => updateTeamMember(index, 'isSubcontractor', checked)}
                            />
                            <Label className="text-sm">Subcontractor</Label>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTeamMember(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Labour Hours:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {currentAllocation.totalLabourHours} hours
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {extractedData && (
                <TabsContent value="review" className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">
                        Successfully extracted {extractedData.teamMembers.length} team members
                      </span>
                      {extractedData.extractionConfidence && (
                        <Badge variant="outline">
                          {Math.round(extractedData.extractionConfidence * 100)}% confidence
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="extracted-period">Period Name</Label>
                      <Input
                        id="extracted-period"
                        value={extractedData.periodName}
                        onChange={(e) => setExtractedData({...extractedData, periodName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="extracted-week">Week Commencing</Label>
                      <Input
                        id="extracted-week"
                        type="date"
                        value={extractedData.weekCommencing}
                        onChange={(e) => setExtractedData({...extractedData, weekCommencing: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Extracted Team Members</h4>
                    {extractedData.teamMembers.map((member, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-6 gap-3 items-end">
                            <div>
                              <Label>Name</Label>
                              <Input
                                value={member.name}
                                onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Role</Label>
                              <Input
                                value={member.role}
                                onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Company</Label>
                              <Input
                                value={member.company}
                                onChange={(e) => updateTeamMember(index, 'company', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Hours</Label>
                              <Input
                                type="number"
                                value={member.hours}
                                onChange={(e) => updateTeamMember(index, 'hours', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={member.isSubcontractor}
                                onCheckedChange={(checked) => updateTeamMember(index, 'isSubcontractor', checked)}
                              />
                              <Label className="text-sm">Subcontractor</Label>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTeamMember(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Labour Hours:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {extractedData.totalLabourHours} hours
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialog(false)}>
                Cancel
              </Button>
              {extractedData ? (
                <Button onClick={confirmExtraction} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Confirm & Save'}
                </Button>
              ) : (
                <Button 
                  onClick={() => saveMutation.mutate(currentAllocation)}
                  disabled={saveMutation.isPending || currentAllocation.teamMembers.length === 0}
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Allocation'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Template
        </Button>
      </div>

      {/* Existing Allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {allocations.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Resource Allocations</h3>
              <p className="text-gray-500 mb-4">
                Start by uploading a resource allocation document or create one manually
              </p>
              <Button onClick={() => setUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Allocation
              </Button>
            </CardContent>
          </Card>
        ) : (
          allocations.map((allocation: ResourceAllocation) => (
            <Card key={allocation.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{allocation.periodName}</span>
                  <Badge variant="outline">
                    {allocation.teamMembers.length} members
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Week: {new Date(allocation.weekCommencing).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {allocation.totalLabourHours} hours
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allocation.teamMembers.slice(0, 3).map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.role}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{member.hours}h</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          {member.isSubcontractor && <Building className="h-3 w-3" />}
                          {member.company}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {allocation.teamMembers.length > 3 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      + {allocation.teamMembers.length - 3} more members
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}