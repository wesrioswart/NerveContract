import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, Calendar, Check, AlertCircle, Info, 
  Camera, Upload, BarChart, Wrench, Truck, User, Clock, 
  FileText, Plus, Trash, CloudUpload, CalendarCheck,
  Save, Download
} from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import html2pdf from 'html2pdf.js';
import { AnimationWrapper } from "@/components/ui/animation-wrapper";
import { AnimatedButton } from "@/components/ui/animated-button";

// Define Photo schema
const photoSchema = z.object({
  id: z.string(),
  caption: z.string().optional(),
  tags: z.array(z.string()).optional(),
  base64: z.string().optional(), // For previewing uploaded photos
  fileName: z.string().optional(),
});

// Define Team Member schema
const teamMemberSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  role: z.string().min(1, { message: 'Role is required' }),
  hours: z.number().min(0, { message: 'Hours must be non-negative' }),
  company: z.string().optional(),
  isSubcontractor: z.boolean().default(false),
});

// Define Plant & Equipment schema
const plantItemSchema = z.object({
  description: z.string().min(1, { message: 'Description is required' }),
  quantity: z.number().min(1, { message: 'Quantity must be at least 1' }),
  hours: z.number().min(0, { message: 'Hours must be non-negative' }),
});

// Define Materials schema
const materialItemSchema = z.object({
  description: z.string().min(1, { message: 'Description is required' }),
  quantity: z.number().min(0, { message: 'Quantity must be non-negative' }),
  unit: z.string().min(1, { message: 'Unit is required' }),
});

// Define Completed Task schema
const completedTaskSchema = z.object({
  description: z.string().min(1, { message: 'Description is required' }),
  section: z.string().min(1, { message: 'Section is required' }),
  quantity: z.number().min(0, { message: 'Quantity must be non-negative' }),
  unit: z.string().min(1, { message: 'Unit is required' }),
  plannedTaskId: z.string().optional(), // To link with planned tasks/programme
});

// Define In-Progress Task schema
const inProgressTaskSchema = z.object({
  description: z.string().min(1, { message: 'Description is required' }),
  section: z.string().min(1, { message: 'Section is required' }),
  percentComplete: z.number().min(0).max(99, { message: 'Must be between 0-99%' }), // 100% would be completed
  expectedCompletion: z.date().optional(),
  blockers: z.string().optional(),
});

// Define Delay schema
const delaySchema = z.object({
  description: z.string().min(1, { message: 'Description is required' }),
  reason: z.string().min(1, { message: 'Reason is required' }),
  impactHours: z.number().min(0, { message: 'Impact hours must be non-negative' }),
  affectedTasks: z.array(z.string()).optional(),
  potentialCE: z.boolean().default(false),
});

// Define Issue schema
const issueSchema = z.object({
  description: z.string().min(1, { message: 'Description is required' }),
  category: z.enum(['Quality', 'Safety', 'Design', 'Access', 'Weather', 'Resources', 'Other']),
  status: z.enum(['Open', 'In Progress', 'Escalated', 'Resolved']),
  requiresEscalation: z.boolean().default(false),
  suggestedAction: z.string().optional(),
});

// Define the form schema
const formSchema = z.object({
  // Basic Information
  reportDate: z.date({
    required_error: "Report date is required",
  }),
  projectId: z.number(),
  projectName: z.string().min(1, { message: 'Project name is required' }),
  contractReference: z.string().min(1, { message: 'Contract reference is required' }),
  
  // Reporter Details
  reporterName: z.string().min(1, { message: 'Reporter name is required' }),
  reporterRole: z.string().min(1, { message: 'Reporter role is required' }),
  
  // Weather Conditions
  weatherConditions: z.string().min(1, { message: 'Weather conditions are required' }),
  temperatureMin: z.number().optional(),
  temperatureMax: z.number().optional(),
  weatherImpact: z.enum(['None', 'Minor', 'Moderate', 'Severe']).default('None'),
  
  // Site Conditions
  siteConditions: z.string().min(1, { message: 'Site conditions are required' }),
  
  // Labour
  teamMembers: z.array(teamMemberSchema).default([]),
  totalLabourHours: z.number().min(0, { message: 'Total labour hours must be non-negative' }),
  
  // Plant & Equipment
  plant: z.array(plantItemSchema).default([]),
  
  // Materials
  materials: z.array(materialItemSchema).default([]),
  
  // Completed Tasks
  completedTasks: z.array(completedTaskSchema).default([]),
  
  // In-Progress Tasks
  inProgressTasks: z.array(inProgressTaskSchema).default([]),
  
  // Delays
  delays: z.array(delaySchema).default([]),
  
  // Photos
  photos: z.array(photoSchema).default([]),
  
  // Issues
  issues: z.array(issueSchema).default([]),
  
  // General Notes
  generalNotes: z.string().optional(),
  
  // AI Extraction Field (for NLP inputs)
  aiExtractedText: z.string().optional(),
});

// Derive TypeScript type from schema
type FormValues = z.infer<typeof formSchema>;

export default function DailySiteReportTemplate() {
  const [view, setView] = useState<'form' | 'preview'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [isUsingAI, setIsUsingAI] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Mock project data
  const project = {
    id: 1,
    name: "Westfield Development Project",
    contractReference: "NEC4-2023-001",
    clientName: "Westfield Corporation",
    contractorName: "ABC Construction Ltd",
    sections: [
      "Groundworks", 
      "Foundations", 
      "Superstructure", 
      "M&E", 
      "Fit-Out", 
      "External Works"
    ]
  };
  
  // Set up the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportDate: new Date(),
      projectId: project.id,
      projectName: project.name,
      contractReference: project.contractReference,
      reporterName: '',
      reporterRole: '',
      weatherConditions: '',
      temperatureMin: undefined,
      temperatureMax: undefined,
      weatherImpact: 'None',
      siteConditions: '',
      teamMembers: [],
      totalLabourHours: 0,
      plant: [],
      materials: [],
      completedTasks: [],
      inProgressTasks: [],
      delays: [],
      photos: [],
      issues: [],
      generalNotes: '',
      aiExtractedText: '',
    },
  });
  
  // Watch form values for calculations and conditional rendering
  const formValues = form.watch();
  
  // Handle AI text extraction
  const handleAIExtraction = async () => {
    const aiText = form.getValues('aiExtractedText');
    
    if (!aiText || aiText.trim() === '') {
      toast({
        title: "Error",
        description: "Please enter some text for AI extraction",
        variant: "destructive",
      });
      return;
    }
    
    setAiProcessing(true);
    
    // Here we would call the AI service to process the text
    // For now, we'll just simulate a delay and auto-fill some example data
    
    toast({
      title: "Processing with AI",
      description: "Analyzing your site diary text...",
    });
    
    setTimeout(() => {
      // Simulate AI extraction results
      const newValues = {
        weatherConditions: "Sunny with occasional cloud cover",
        temperatureMin: 15,
        temperatureMax: 22,
        weatherImpact: "None" as const,
        siteConditions: "Ground conditions dry and suitable for all works",
        teamMembers: [
          { name: "John Smith", role: "Foreman", hours: 8 },
          { name: "David Lee", role: "Groundworker", hours: 8 },
          { name: "Sarah Wilson", role: "Electrician", hours: 6 },
        ],
        totalLabourHours: 22,
        plant: [
          { description: "Excavator 5T", quantity: 1, hours: 6 },
          { description: "Dumper 3T", quantity: 1, hours: 4 },
        ],
        materials: [
          { description: "Concrete C30", quantity: 15, unit: "m³" },
          { description: "Rebar A393", quantity: 50, unit: "kg" },
        ],
        completedTasks: [
          { description: "Foundation excavation - Zone A", section: "Groundworks", quantity: 45, unit: "m³" }
        ],
        inProgressTasks: [
          { 
            description: "Foundation rebar installation - Zone A", 
            section: "Foundations", 
            percentComplete: 65, 
            expectedCompletion: new Date(Date.now() + 86400000), // tomorrow
            blockers: ""
          }
        ],
        delays: [],
        issues: [],
      };
      
      // Update form with extracted values
      Object.entries(newValues).forEach(([key, value]) => {
        // @ts-ignore - dynamic form updates
        form.setValue(key, value);
      });
      
      // Extract any potential issues from the text
      if (aiText.toLowerCase().includes("delay") || aiText.toLowerCase().includes("problem")) {
        form.setValue('issues', [
          { 
            description: "Potential delivery delay detected in diary text", 
            category: "Resources" as const, 
            status: "Open" as const, 
            requiresEscalation: true,
            suggestedAction: "Review material delivery schedule" 
          }
        ]);
      }
      
      setAiProcessing(false);
      setIsUsingAI(true);
      
      toast({
        title: "AI Processing Complete",
        description: "Your site diary has been analyzed and form fields populated. Please review and edit as needed.",
      });
    }, 2000);
  };
  
  // Calculate total hours from team members
  const calculateTotalLabourHours = () => {
    return formValues.teamMembers.reduce((total, member) => total + member.hours, 0);
  };
  
  // Calculate and display subcontractor information
  const getSubcontractorInfo = () => {
    const subcontractors = formValues.teamMembers.filter(member => member.isSubcontractor && member.company);
    const uniqueCompanies = [...new Set(subcontractors.map(sub => sub.company))];
    
    return {
      count: subcontractors.length,
      uniqueCompanies: uniqueCompanies.filter(Boolean),
      allSubcontractors: subcontractors
    };
  };
  
  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    
    // Calculate accurate total labour hours before submission
    if (values.teamMembers.length > 0) {
      values.totalLabourHours = calculateTotalLabourHours();
    }
    
    // Here we would typically submit to the server
    // For now, we'll just mock the success response
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionComplete(true);
      toast({
        title: "Daily Site Report Submitted",
        description: `Your daily site report for ${format(values.reportDate, "dd MMMM yyyy")} has been successfully submitted.`,
        variant: "default",
      });
      
      // Trigger AI analysis toast to illustrate the follow-up AI processing
      setTimeout(() => {
        toast({
          title: "AI Risk Analysis Complete",
          description: "The AI has analyzed your report and updated the project risk profile. View the Executive Dashboard for details.",
          variant: "default",
        });
      }, 1500);
    }, 1500);
  };
  
  // Handle saving draft
  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your daily site report draft has been saved.",
      variant: "default",
    });
  };
  
  // Handle download PDF
  const handleDownloadPDF = () => {
    const element = document.getElementById('daily-report-preview');
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: `Daily-Site-Report-${format(formValues.reportDate, "yyyy-MM-dd")}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    toast({
      title: "Generating PDF",
      description: "Your PDF is being generated, please wait...",
    });
    
    html2pdf().set(opt).from(element).save().then(() => {
      toast({
        title: "PDF Generated",
        description: "Your PDF has been downloaded successfully.",
      });
    });
  };
  
  // Handle adding a new team member
  const handleAddTeamMember = () => {
    const currentMembers = form.getValues('teamMembers');
    form.setValue('teamMembers', [
      ...currentMembers,
      { name: '', role: '', hours: 0 }
    ]);
  };
  
  // Handle removing a team member
  const handleRemoveTeamMember = (index: number) => {
    const currentMembers = form.getValues('teamMembers');
    form.setValue('teamMembers', currentMembers.filter((_, i) => i !== index));
  };
  
  // Handle adding a new plant item
  const handleAddPlantItem = () => {
    const currentPlant = form.getValues('plant');
    form.setValue('plant', [
      ...currentPlant,
      { description: '', quantity: 1, hours: 0 }
    ]);
  };
  
  // Handle removing a plant item
  const handleRemovePlantItem = (index: number) => {
    const currentPlant = form.getValues('plant');
    form.setValue('plant', currentPlant.filter((_, i) => i !== index));
  };
  
  // Handle adding a new material item
  const handleAddMaterialItem = () => {
    const currentMaterials = form.getValues('materials');
    form.setValue('materials', [
      ...currentMaterials,
      { description: '', quantity: 0, unit: '' }
    ]);
  };
  
  // Handle removing a material item
  const handleRemoveMaterialItem = (index: number) => {
    const currentMaterials = form.getValues('materials');
    form.setValue('materials', currentMaterials.filter((_, i) => i !== index));
  };
  
  // Handle adding a new completed task
  const handleAddCompletedTask = () => {
    const currentTasks = form.getValues('completedTasks');
    form.setValue('completedTasks', [
      ...currentTasks,
      { description: '', section: project.sections[0], quantity: 0, unit: '' }
    ]);
  };
  
  // Handle removing a completed task
  const handleRemoveCompletedTask = (index: number) => {
    const currentTasks = form.getValues('completedTasks');
    form.setValue('completedTasks', currentTasks.filter((_, i) => i !== index));
  };
  
  // Handle adding a new in-progress task
  const handleAddInProgressTask = () => {
    const currentTasks = form.getValues('inProgressTasks');
    form.setValue('inProgressTasks', [
      ...currentTasks,
      { 
        description: '', 
        section: project.sections[0], 
        percentComplete: 0, 
        expectedCompletion: new Date(Date.now() + 86400000), // tomorrow
        blockers: ''
      }
    ]);
  };
  
  // Handle removing an in-progress task
  const handleRemoveInProgressTask = (index: number) => {
    const currentTasks = form.getValues('inProgressTasks');
    form.setValue('inProgressTasks', currentTasks.filter((_, i) => i !== index));
  };
  
  // Handle adding a new delay
  const handleAddDelay = () => {
    const currentDelays = form.getValues('delays');
    form.setValue('delays', [
      ...currentDelays,
      { description: '', reason: '', impactHours: 0, affectedTasks: [], potentialCE: false }
    ]);
  };
  
  // Handle removing a delay
  const handleRemoveDelay = (index: number) => {
    const currentDelays = form.getValues('delays');
    form.setValue('delays', currentDelays.filter((_, i) => i !== index));
  };
  
  // Handle adding a new issue
  const handleAddIssue = () => {
    const currentIssues = form.getValues('issues');
    form.setValue('issues', [
      ...currentIssues,
      { 
        description: '', 
        category: 'Other' as const, 
        status: 'Open' as const, 
        requiresEscalation: false,
        suggestedAction: '' 
      }
    ]);
  };
  
  // Handle removing an issue
  const handleRemoveIssue = (index: number) => {
    const currentIssues = form.getValues('issues');
    form.setValue('issues', currentIssues.filter((_, i) => i !== index));
  };
  
  // Handle file upload for photos
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const files = Array.from(event.target.files);
    const currentPhotos = form.getValues('photos');
    
    // Process each file
    files.forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (!e.target || !e.target.result) return;
        
        const newPhoto = {
          id: `photo_${Date.now()}_${currentPhotos.length + 1}`,
          fileName: file.name,
          caption: file.name,
          tags: [],
          base64: e.target.result.toString(),
        };
        
        form.setValue('photos', [...currentPhotos, newPhoto]);
      };
      
      reader.readAsDataURL(file);
    });
  };
  
  // Handle removing a photo
  const handleRemovePhoto = (photoId: string) => {
    const currentPhotos = form.getValues('photos');
    form.setValue('photos', currentPhotos.filter(photo => photo.id !== photoId));
  };
  
  // Form component
  const FormView = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* AI Text Extraction Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Quick Input with AI
            </CardTitle>
            <CardDescription>
              Paste your site diary text and let AI extract key information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="aiExtractedText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Diary Text</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Paste your site diary text here for AI to extract information... e.g., Today we had 3 workers on site. Weather was sunny, 18°C. Completed foundation excavation in Zone A (45m³). Started rebar installation, about 65% complete. Received concrete delivery."
                        className="min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Paste free-form text from your site diary and the AI will extract structured information
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="button"
                onClick={handleAIExtraction}
                disabled={aiProcessing}
                className="w-full"
              >
                {aiProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Extract Information with AI
                  </>
                )}
              </Button>
              
              {isUsingAI && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    AI has extracted information. Please review and edit the fields below as needed.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="reportDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Report Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="projectName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <FormControl>
                    <Input disabled {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contractReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Reference</FormLabel>
                  <FormControl>
                    <Input disabled {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reporterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporter Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reporterRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporter Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Your role" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Site Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Site Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="weatherConditions"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Weather Conditions</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Sunny, cloudy, rainy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="temperatureMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Temp (°C)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Min °C"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="temperatureMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Temp (°C)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Max °C"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weatherImpact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weather Impact on Works</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select impact level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Minor">Minor</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="siteConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Conditions</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dry, muddy, flooded" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Labour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Labour
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Team Members on Site</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTeamMember}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Team Member
              </Button>
            </div>
            
            {formValues.teamMembers.length === 0 && (
              <p className="text-sm text-gray-500 italic">No team members added yet.</p>
            )}
            
            {formValues.teamMembers.map((member, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end border-b pb-3">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`teamMembers.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`teamMembers.${index}.role`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Role</FormLabel>
                        <FormControl>
                          <Input placeholder="Role" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name={`teamMembers.${index}.company`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Company name" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`teamMembers.${index}.isSubcontractor`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 mt-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-xs !mt-0">Subcontractor</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="md:col-span-1 flex items-end gap-2">
                  <div className="flex-grow">
                    <FormField
                      control={form.control}
                      name={`teamMembers.${index}.hours`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Hours</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Hours"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => handleRemoveTeamMember(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center pt-2">
              <p className="text-sm font-medium">Total Labour Hours:</p>
              <p className="text-sm font-bold">{calculateTotalLabourHours()} hours</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Plant & Equipment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Plant & Equipment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Plant & Equipment on Site</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPlantItem}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Plant Item
              </Button>
            </div>
            
            {formValues.plant.length === 0 && (
              <p className="text-sm text-gray-500 italic">No plant items added yet.</p>
            )}
            
            {formValues.plant.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end border-b pb-3">
                <div className="md:col-span-4">
                  <FormField
                    control={form.control}
                    name={`plant.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Description</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Excavator 5T" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="md:col-span-1">
                  <FormField
                    control={form.control}
                    name={`plant.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Qty</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Qty"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="md:col-span-1">
                  <FormField
                    control={form.control}
                    name={`plant.${index}.hours`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Hours</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Hours"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => handleRemovePlantItem(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Materials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Materials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Materials Delivered/Used</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMaterialItem}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Material
              </Button>
            </div>
            
            {formValues.materials.length === 0 && (
              <p className="text-sm text-gray-500 italic">No materials added yet.</p>
            )}
            
            {formValues.materials.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end border-b pb-3">
                <div className="md:col-span-4">
                  <FormField
                    control={form.control}
                    name={`materials.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Description</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Concrete C30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="md:col-span-1">
                  <FormField
                    control={form.control}
                    name={`materials.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Qty</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Qty"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="md:col-span-1">
                  <FormField
                    control={form.control}
                    name={`materials.${index}.unit`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Unit</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., m³" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => handleRemoveMaterialItem(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Work Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              Work Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Completed Tasks */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Completed Tasks</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCompletedTask}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Completed Task
                </Button>
              </div>
              
              {formValues.completedTasks.length === 0 && (
                <p className="text-sm text-gray-500 italic">No completed tasks added yet.</p>
              )}
              
              {formValues.completedTasks.map((task, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-10 gap-4 items-end border-b pb-3">
                  <div className="md:col-span-5">
                    <FormField
                      control={form.control}
                      name={`completedTasks.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Task description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`completedTasks.${index}.section`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Section</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select section" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {project.sections.map((section) => (
                                <SelectItem key={section} value={section}>{section}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-1">
                    <FormField
                      control={form.control}
                      name={`completedTasks.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Qty</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Qty"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-1">
                    <FormField
                      control={form.control}
                      name={`completedTasks.${index}.unit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Unit</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., m²" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => handleRemoveCompletedTask(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Separator />
            
            {/* In-Progress Tasks */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">In-Progress Tasks</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddInProgressTask}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add In-Progress Task
                </Button>
              </div>
              
              {formValues.inProgressTasks.length === 0 && (
                <p className="text-sm text-gray-500 italic">No in-progress tasks added yet.</p>
              )}
              
              {formValues.inProgressTasks.map((task, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-10 gap-4 items-end border-b pb-3">
                  <div className="md:col-span-4">
                    <FormField
                      control={form.control}
                      name={`inProgressTasks.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Task description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`inProgressTasks.${index}.section`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Section</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select section" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {project.sections.map((section) => (
                                <SelectItem key={section} value={section}>{section}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-1">
                    <FormField
                      control={form.control}
                      name={`inProgressTasks.${index}.percentComplete`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">% Complete</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="%"
                              {...field}
                              min={0}
                              max={99}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                if (value < 0) field.onChange(0);
                                else if (value > 99) field.onChange(99);
                                else field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`inProgressTasks.${index}.expectedCompletion`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Expected Completion</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal text-xs",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => handleRemoveInProgressTask(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Delays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Delays & Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Delays */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Delays</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDelay}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Delay
                </Button>
              </div>
              
              {formValues.delays.length === 0 && (
                <p className="text-sm text-gray-500 italic">No delays recorded for today.</p>
              )}
              
              {formValues.delays.map((delay, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-10 gap-4 items-end border-b pb-3">
                  <div className="md:col-span-4">
                    <FormField
                      control={form.control}
                      name={`delays.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Delay description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name={`delays.${index}.reason`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Reason</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Weather, Materials delivery" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-1">
                    <FormField
                      control={form.control}
                      name={`delays.${index}.impactHours`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Impact (hrs)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Hours"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-1">
                    <FormField
                      control={form.control}
                      name={`delays.${index}.potentialCE`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Potential CE?</FormLabel>
                          <div className="flex items-center pt-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                              />
                            </FormControl>
                            <span className="ml-2 text-xs text-gray-600">Yes</span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => handleRemoveDelay(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Separator />
            
            {/* Issues */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Issues</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddIssue}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Issue
                </Button>
              </div>
              
              {formValues.issues.length === 0 && (
                <p className="text-sm text-gray-500 italic">No issues recorded for today.</p>
              )}
              
              {formValues.issues.map((issue, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-10 gap-4 items-end border-b pb-3">
                  <div className="md:col-span-4">
                    <FormField
                      control={form.control}
                      name={`issues.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Issue description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`issues.${index}.category`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Quality">Quality</SelectItem>
                              <SelectItem value="Safety">Safety</SelectItem>
                              <SelectItem value="Design">Design</SelectItem>
                              <SelectItem value="Access">Access</SelectItem>
                              <SelectItem value="Weather">Weather</SelectItem>
                              <SelectItem value="Resources">Resources</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`issues.${index}.status`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Escalated">Escalated</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="md:col-span-1">
                    <FormField
                      control={form.control}
                      name={`issues.${index}.requiresEscalation`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Escalate?</FormLabel>
                          <div className="flex items-center pt-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                              />
                            </FormControl>
                            <span className="ml-2 text-xs text-gray-600">Yes</span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => handleRemoveIssue(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Site Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Site Photos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center w-full">
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <CloudUpload className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB each)</p>
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
            
            {formValues.photos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {formValues.photos.map((photo) => (
                  <div 
                    key={photo.id} 
                    className="relative border rounded-md overflow-hidden group"
                  >
                    <div className="aspect-video overflow-hidden bg-gray-100">
                      {photo.base64 && (
                        <img 
                          src={photo.base64} 
                          alt={photo.caption || 'Site photo'} 
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </div>
                    <div className="p-2">
                      <FormField
                        control={form.control}
                        name={`photos.${formValues.photos.findIndex(p => p.id === photo.id)}.caption`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Caption</FormLabel>
                            <FormControl>
                              <Input placeholder="Photo caption" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemovePhoto(photo.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* General Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              General Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="generalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="Any other observations, comments or notes about today's activities..." 
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        {/* Form Actions */}
        <div className="flex justify-between pt-6 border-t">
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            
            {view === 'preview' && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDownloadPDF}
                disabled={isSubmitting}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {view === 'form' && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setView('preview')}
                disabled={isSubmitting}
              >
                Preview
              </Button>
            )}
            
            {view === 'preview' && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setView('form')}
                disabled={isSubmitting}
              >
                Edit
              </Button>
            )}
            
            {view === 'form' && (
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Report
              </Button>
            )}
            
            {view === 'preview' && (
              <Button 
                onClick={form.handleSubmit(handleSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Report
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
  
  // Preview component
  const PreviewView = () => {
    const values = form.getValues();
    
    return (
      <div id="daily-report-preview" className="bg-white border border-gray-200 rounded-md shadow-sm p-6 space-y-8">
        {/* Header */}
        <div className="text-center border-b pb-4">
          <h1 className="text-3xl font-bold mb-2">Daily Site Report</h1>
          <p className="text-gray-500">Date: {format(values.reportDate, "dd MMMM yyyy")}</p>
          <p className="text-gray-500">Project: {values.projectName}</p>
          <p className="text-gray-500">Contract Reference: {values.contractReference}</p>
        </div>
        
        {/* Reporter Details */}
        <div className="bg-blue-50 p-4 border border-blue-200 rounded-md">
          <h3 className="text-md font-semibold text-blue-800 mb-2">Report Prepared By:</h3>
          <div className="grid grid-cols-2 gap-2">
            <p><span className="font-medium">Name:</span> {values.reporterName}</p>
            <p><span className="font-medium">Role:</span> {values.reporterRole}</p>
          </div>
        </div>
        
        {/* Site Conditions */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">Site Conditions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><span className="font-semibold">Weather:</span> {values.weatherConditions}</p>
              {(values.temperatureMin !== undefined || values.temperatureMax !== undefined) && (
                <p>
                  <span className="font-semibold">Temperature:</span> 
                  {values.temperatureMin !== undefined && ` Min: ${values.temperatureMin}°C`}
                  {values.temperatureMin !== undefined && values.temperatureMax !== undefined && ` - `}
                  {values.temperatureMax !== undefined && `Max: ${values.temperatureMax}°C`}
                </p>
              )}
              <p>
                <span className="font-semibold">Weather Impact:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  values.weatherImpact === 'None' ? 'bg-green-100 text-green-800' : 
                  values.weatherImpact === 'Minor' ? 'bg-blue-100 text-blue-800' : 
                  values.weatherImpact === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {values.weatherImpact}
                </span>
              </p>
            </div>
            <div>
              <p><span className="font-semibold">Site Conditions:</span> {values.siteConditions}</p>
            </div>
          </div>
        </div>
        
        {/* Labour */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">Labour</h3>
          {values.teamMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {values.teamMembers.map((member, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.hours}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">Total Hours:</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{calculateTotalLabourHours()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No labour recorded for today.</p>
          )}
        </div>
        
        {/* Plant & Equipment */}
        {values.plant.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-3 border-b pb-2">Plant & Equipment</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {values.plant.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Materials */}
        {values.materials.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-3 border-b pb-2">Materials</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {values.materials.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Work Progress */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">Work Progress</h3>
          
          {/* Completed Tasks */}
          {values.completedTasks.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Completed Tasks</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {values.completedTasks.map((task, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.section}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.quantity} {task.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* In-Progress Tasks */}
          {values.inProgressTasks.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">In-Progress Tasks</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Complete</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Completion</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {values.inProgressTasks.map((task, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.section}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.percentComplete}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.expectedCompletion ? format(task.expectedCompletion, "dd MMM yyyy") : 'Not specified'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {values.completedTasks.length === 0 && values.inProgressTasks.length === 0 && (
            <p className="text-gray-500 italic">No tasks recorded for today.</p>
          )}
        </div>
        
        {/* Delays & Issues */}
        {(values.delays.length > 0 || values.issues.length > 0) && (
          <div>
            <h3 className="text-xl font-bold mb-3 border-b pb-2">Delays & Issues</h3>
            
            {/* Delays */}
            {values.delays.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Delays</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact (hrs)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potential CE</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {values.delays.map((delay, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{delay.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{delay.reason}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{delay.impactHours}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {delay.potentialCE ? 
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Yes</Badge> : 
                              <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">No</Badge>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Issues */}
            {values.issues.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Issues</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requires Escalation</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {values.issues.map((issue, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{issue.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issue.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Badge className={`${
                              issue.status === 'Open' ? 'bg-red-100 text-red-800' :
                              issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              issue.status === 'Escalated' ? 'bg-amber-100 text-amber-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {issue.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {issue.requiresEscalation ? 
                              <Badge className="bg-red-100 text-red-800">Yes</Badge> : 
                              <Badge className="bg-gray-100 text-gray-800">No</Badge>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Photos */}
        {values.photos.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-3 border-b pb-2">Site Photos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {values.photos.map((photo) => (
                <div key={photo.id} className="border rounded-md overflow-hidden">
                  <div className="aspect-video overflow-hidden bg-gray-100">
                    {photo.base64 && (
                      <img 
                        src={photo.base64} 
                        alt={photo.caption || 'Site photo'} 
                        className="w-full h-full object-cover" 
                      />
                    )}
                  </div>
                  {photo.caption && (
                    <div className="p-2 bg-gray-50">
                      <p className="text-sm font-medium">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* General Notes */}
        {values.generalNotes && (
          <div>
            <h3 className="text-xl font-bold mb-3 border-b pb-2">General Notes</h3>
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="whitespace-pre-line">{values.generalNotes}</p>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="border-t pt-4 text-sm text-gray-500 text-center">
          <p>Daily Site Report - {values.projectName}</p>
          <p>Generated on {format(new Date(), "dd MMMM yyyy")}</p>
        </div>
      </div>
    );
  };
  
  // Page Layout
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Site Report</h1>
          <p className="text-gray-500">Record daily site activities, progress, issues, and resource usage</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setView(view === 'form' ? 'preview' : 'form')}
            disabled={isSubmitting || submissionComplete}
          >
            {view === 'form' ? 'Preview' : 'Edit'}
          </Button>
        </div>
      </div>
      
      {submissionComplete ? (
        <div className="text-center p-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Daily Report Submitted</h2>
          <p className="text-gray-600 mb-6">
            Your daily site report has been successfully submitted and will be analyzed by the AI.
          </p>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md max-w-md mx-auto mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
              <Info className="h-5 w-5 mr-2" />
              AI Processing
            </h3>
            <p className="text-sm text-blue-700">
              The AI is now analyzing your daily report to update risk profiles, identify potential issues, and provide insights for executive reports.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <AnimatedButton onClick={() => {
              setSubmissionComplete(false);
              form.reset();
            }}>
              Create New Report
            </AnimatedButton>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      ) : (
        view === 'form' ? <FormView /> : <PreviewView />
      )}
    </div>
  );
}