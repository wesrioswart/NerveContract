import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, AlertCircle, Info, ChevronDown, Check, Save, Printer, Download, XCircle, Upload } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import html2pdf from 'html2pdf.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimationWrapper } from "@/components/ui/animation-wrapper";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// We'll replace this with a manual project selection approach since we don't have project context
// import { useProjectContext } from "@/contexts/project-context";

// Define the schema for our form validation
const formSchema = z.object({
  // Basic Information
  reportNumber: z.string().min(1, { message: 'Report number is required' }),
  reportTitle: z.string().min(1, { message: 'Report title is required' }),
  reportingPeriod: z.object({
    from: z.date(),
    to: z.date(),
  }),
  reportDate: z.date(),
  contractReference: z.string().min(1, { message: 'Contract reference is required' }),
  
  // Reporter Details
  reporterPosition: z.enum(['Contractor', 'Project Manager', 'Supervisor', 'Quantity Surveyor', 'Employer', 'Other']),
  reporterName: z.string().min(1, { message: 'Your name is required' }),
  
  // Project Details
  contractName: z.string().min(1, { message: 'Contract name is required' }),
  employerName: z.string().min(1, { message: 'Employer name is required' }),
  contractorName: z.string().min(1, { message: 'Contractor name is required' }),
  projectManagerName: z.string().min(1, { message: 'Project Manager name is required' }),
  supervisorName: z.string().optional(),
  
  // NEC4 Progress Metrics
  // Clause 31.2 - Programme
  currentAcceptedProgramme: z.string().min(1, { message: 'Current accepted programme is required' }),
  programmeRevisionNumber: z.string(),
  programmeAcceptanceDate: z.date(),
  
  // Clause 30 - Starting, Completion & Key Dates
  startDate: z.date(),
  completionDate: z.date(),
  forecastCompletionDate: z.date(),
  delayStatus: z.enum(['on-track', 'at-risk', 'delayed']),
  
  // Overall Progress Assessment
  overallProgress: z.number().min(0).max(100),
  progressSummary: z.string().min(10, { message: 'Progress summary is required' }),
  progressAgainstProgramme: z.enum(['ahead', 'on-schedule', 'behind']),
  
  // Key Areas Progress (Clause 11.2(1) - identified parts)
  progressBySection: z.array(z.object({
    section: z.string(),
    planned: z.number().min(0).max(100),
    actual: z.number().min(0).max(100),
    status: z.enum(['completed', 'on-track', 'at-risk', 'delayed']),
    notes: z.string().optional(),
  })).optional(),
  
  // Early Warnings (Clause 15)
  earlyWarningsSummary: z.string().optional(),
  earlyWarningsCount: z.number().min(0),
  
  // Compensation Events (Clause 60.1)
  compensationEventsSummary: z.string().optional(),
  compensationEventsCount: z.number().min(0),
  notifiedCompensationEventsValue: z.number().optional(),
  implementedCompensationEventsValue: z.number().optional(),
  
  // Key Resource Information (Clause 25 - Working Areas)
  resourceSummary: z.string().optional(),
  resourceStatus: z.enum(['sufficient', 'at-risk', 'insufficient']).optional(),
  
  // Quality Management (Clause 40 - Defects)
  qualitySummary: z.string().optional(),
  nonConformanceCount: z.number().min(0).optional(),
  
  // Health & Safety (Clause 27 - Health and Safety)
  healthAndSafetySummary: z.string().optional(),
  accidentsThisPeriod: z.number().min(0).optional(),
  
  // Financial Status Summary
  contractSum: z.number().optional(),
  currentForecastFinalAmount: z.number().optional(),
  amountCertifiedToDate: z.number().optional(),
  
  // Next Period
  nextPeriodFocus: z.string().min(10, { message: 'Focus areas for next period are required' }),
  nextPeriodRisks: z.string().optional(),
  
  // Contractor Statement (Clause 31.2)
  contractorStatement: z.string().optional(),
  
  // Project Manager Statement (Clause 31.3)
  projectManagerStatement: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProgressReportTemplate() {
  // Use static data for template demonstration instead of live queries
  const [view, setView] = useState<'form' | 'preview'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const todayFormatted = format(new Date(), "dd/MM/yyyy");
  
  // Use static template data
  const project = {
    id: 1,
    name: "Westfield Development Project",
    contractReference: "NEC4-2023-001",
    clientName: "Westfield Corporation",
    contractorName: "ABC Construction Ltd",
    startDate: new Date("2023-01-10"),
    completionDate: new Date("2024-12-15"),
    contractValue: 15000000
  };
  
  // Static data for demo
  const compensationEvents = [
    { id: 1, status: "Notified", reference: "CE-001", title: "Site access delay", estimatedValue: 25000 },
    { id: 2, status: "Quotation Due", reference: "CE-002", title: "Ground conditions variance", estimatedValue: 15000 },
    { id: 3, status: "Implemented", reference: "CE-003", title: "Additional drainage works", estimatedValue: 32000 }
  ];
  
  const earlyWarnings = [
    { id: 1, status: "Open", reference: "EW-001", description: "Potential supply chain delay", mitigationPlan: "Sourcing alternative suppliers" },
    { id: 2, status: "Open", reference: "EW-002", description: "Weather impact on foundation works", mitigationPlan: "Adjusting programme sequence" }
  ];
  
  const nonConformanceReports = [
    { id: 1, status: "Open", reference: "NCR-001", description: "Concrete strength below specification", location: "Block A foundations" }
  ];
  
  const programmeMilestones = [
    { id: 1, status: "Completed", name: "Site mobilization" },
    { id: 2, status: "Completed", name: "Foundations complete - Block A" },
    { id: 3, status: "In Progress", name: "Structural frame - Block A" },
    { id: 4, status: "Not Started", name: "Roof installation - Block A" },
    { id: 5, status: "Not Started", name: "External envelope - Block A" }
  ];
  
  // Calculate derived values
  const openCEsCount = compensationEvents.filter(ce => ce.status !== 'Accepted' && ce.status !== 'Rejected').length;
  const openEWsCount = earlyWarnings.filter(ew => ew.status === 'Open').length;
  const openNCRsCount = nonConformanceReports.filter(ncr => ncr.status === 'Open').length;
  const completedMilestonesCount = programmeMilestones.filter(m => m.status === 'Completed').length;
  const totalMilestonesCount = programmeMilestones.length;
  const milestonesProgress = totalMilestonesCount > 0 ? (completedMilestonesCount / totalMilestonesCount) * 100 : 0;
  
  // Set up the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportNumber: `PR-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-001`,
      reportTitle: project?.name ? `Progress Report - ${project.name}` : 'Progress Report',
      reportingPeriod: {
        from: new Date(new Date().setDate(new Date().getDate() - 28)), // Last 28 days
        to: new Date(),
      },
      reportDate: new Date(),
      contractReference: project?.contractReference || '',
      
      // Reporter details
      reporterPosition: 'Contractor',
      reporterName: '',
      
      contractName: project?.name || '',
      employerName: project?.clientName || '',
      contractorName: project?.contractorName || '',
      projectManagerName: '',
      supervisorName: '',
      
      currentAcceptedProgramme: 'REV001',
      programmeRevisionNumber: 'REV001',
      programmeAcceptanceDate: new Date(),
      
      startDate: project?.startDate ? new Date(project.startDate) : new Date(),
      completionDate: project?.completionDate ? new Date(project.completionDate) : new Date(new Date().setMonth(new Date().getMonth() + 12)),
      forecastCompletionDate: project?.completionDate ? new Date(project.completionDate) : new Date(new Date().setMonth(new Date().getMonth() + 12)),
      delayStatus: 'on-track',
      
      overallProgress: Math.round(milestonesProgress),
      progressSummary: '',
      progressAgainstProgramme: 'on-schedule',
      
      progressBySection: [
        { section: 'Preliminaries', planned: 80, actual: 75, status: 'on-track', notes: '' },
        { section: 'Foundations', planned: 60, actual: 55, status: 'on-track', notes: '' },
        { section: 'Superstructure', planned: 40, actual: 30, status: 'at-risk', notes: '' },
        { section: 'Envelope', planned: 20, actual: 10, status: 'on-track', notes: '' },
        { section: 'Internal Finishes', planned: 10, actual: 5, status: 'on-track', notes: '' },
      ],
      
      earlyWarningsSummary: '',
      earlyWarningsCount: openEWsCount,
      
      compensationEventsSummary: '',
      compensationEventsCount: openCEsCount,
      notifiedCompensationEventsValue: 0,
      implementedCompensationEventsValue: 0,
      
      resourceSummary: '',
      resourceStatus: 'sufficient',
      
      qualitySummary: '',
      nonConformanceCount: openNCRsCount,
      
      healthAndSafetySummary: '',
      accidentsThisPeriod: 0,
      
      contractSum: project?.contractValue || 0,
      currentForecastFinalAmount: project?.contractValue || 0,
      amountCertifiedToDate: 0,
      
      nextPeriodFocus: '',
      nextPeriodRisks: '',
      
      contractorStatement: '',
      projectManagerStatement: '',
    },
  });
  
  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    
    // Here we would typically submit to the server
    // For now, we'll just mock the success response
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmissionComplete(true);
      toast({
        title: "Progress Report Submitted",
        description: `Progress Report ${values.reportNumber} has been successfully submitted.`,
        variant: "default",
      });
    }, 1500);
  };
  
  // Handle saving draft
  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your progress report draft has been saved.",
      variant: "default",
    });
  };
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  // Handle download PDF
  const handleDownloadPDF = () => {
    const element = document.getElementById('progress-report-preview');
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: `Progress-Report-${form.getValues().reportNumber}.pdf`,
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
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'on-track':
      case 'sufficient':
        return 'bg-green-500 text-white';
      case 'at-risk':
        return 'bg-amber-500 text-white';
      case 'delayed':
      case 'insufficient':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  // Get progress indication
  const getProgressIndication = (progress: number) => {
    if (progress >= 90) return { color: 'bg-green-200', text: 'Substantially Complete' };
    if (progress >= 75) return { color: 'bg-green-100', text: 'Good Progress' };
    if (progress >= 50) return { color: 'bg-amber-100', text: 'Moderate Progress' };
    if (progress >= 25) return { color: 'bg-amber-100', text: 'Limited Progress' };
    return { color: 'bg-red-100', text: 'Early Stages' };
  };
  
  // Form components
  const FormView = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <AnimationWrapper type="fadeIn" className="grid grid-cols-1 gap-6">
          {/* Report Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Basic Report Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="reportNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Number</FormLabel>
                    <FormControl>
                      <Input placeholder="PR-2023-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reportTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Progress Report" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                name="reportingPeriod.from"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Reporting Period From</FormLabel>
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
                name="reportingPeriod.to"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Reporting Period To</FormLabel>
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
                name="contractReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="Contract reference" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Reporter Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Reporter Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reporterPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Contractor">Contractor</SelectItem>
                        <SelectItem value="Project Manager">Project Manager</SelectItem>
                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                        <SelectItem value="Quantity Surveyor">Quantity Surveyor</SelectItem>
                        <SelectItem value="Employer">Employer</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Your position in the NEC4 contract hierarchy
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reporterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your full name as the person completing this report
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contractName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Contract name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="employerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employer</FormLabel>
                    <FormControl>
                      <Input placeholder="Employer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contractorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contractor</FormLabel>
                    <FormControl>
                      <Input placeholder="Contractor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="projectManagerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Manager</FormLabel>
                    <FormControl>
                      <Input placeholder="Project Manager name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="supervisorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supervisor</FormLabel>
                    <FormControl>
                      <Input placeholder="Supervisor name (if applicable)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Programme Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Programme Details (NEC4 Clause 31.2)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="currentAcceptedProgramme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Accepted Programme</FormLabel>
                    <FormControl>
                      <Input placeholder="REV001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="programmeRevisionNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Programme Revision Number</FormLabel>
                    <FormControl>
                      <Input placeholder="REV001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="programmeAcceptanceDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Programme Acceptance Date</FormLabel>
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
            </CardContent>
          </Card>
          
          {/* Key Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Key Dates (NEC4 Clause 30)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
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
                name="completionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Completion Date</FormLabel>
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
                name="forecastCompletionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Forecast Completion Date</FormLabel>
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
                name="delayStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delay Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="on-track">On Track</SelectItem>
                        <SelectItem value="at-risk">At Risk</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Progress Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="overallProgress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Progress (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Enter % complete"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="progressAgainstProgramme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progress Against Programme</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ahead">Ahead of Schedule</SelectItem>
                          <SelectItem value="on-schedule">On Schedule</SelectItem>
                          <SelectItem value="behind">Behind Schedule</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="progressSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter overall progress summary"
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a summary of the overall progress achieved during this reporting period, referencing the Accepted Programme.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Progress By Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Progress by Section (NEC4 Clause 11.2(1) - Identified Parts)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section/Activity</TableHead>
                      <TableHead className="w-[120px]">Planned %</TableHead>
                      <TableHead className="w-[120px]">Actual %</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.watch('progressBySection')?.map((section, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            placeholder="Section name"
                            value={section.section}
                            onChange={(e) => {
                              const updatedSections = [...form.watch('progressBySection') || []];
                              updatedSections[index].section = e.target.value;
                              form.setValue('progressBySection', updatedSections);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Planned %"
                            value={section.planned}
                            onChange={(e) => {
                              const updatedSections = [...form.watch('progressBySection') || []];
                              updatedSections[index].planned = parseInt(e.target.value) || 0;
                              form.setValue('progressBySection', updatedSections);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Actual %"
                            value={section.actual}
                            onChange={(e) => {
                              const updatedSections = [...form.watch('progressBySection') || []];
                              updatedSections[index].actual = parseInt(e.target.value) || 0;
                              form.setValue('progressBySection', updatedSections);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={section.status}
                            onValueChange={(value) => {
                              const updatedSections = [...form.watch('progressBySection') || []];
                              updatedSections[index].status = value as any;
                              form.setValue('progressBySection', updatedSections);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="on-track">On Track</SelectItem>
                              <SelectItem value="at-risk">At Risk</SelectItem>
                              <SelectItem value="delayed">Delayed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Notes"
                            value={section.notes || ''}
                            onChange={(e) => {
                              const updatedSections = [...form.watch('progressBySection') || []];
                              updatedSections[index].notes = e.target.value;
                              form.setValue('progressBySection', updatedSections);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => {
                  const currentSections = form.watch('progressBySection') || [];
                  form.setValue('progressBySection', [
                    ...currentSections,
                    { section: '', planned: 0, actual: 0, status: 'on-track', notes: '' }
                  ]);
                }}
              >
                Add Section
              </Button>
            </CardContent>
          </Card>
          
          {/* Early Warnings and CEs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Early Warnings (Clause 15)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="earlyWarningsCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Open Early Warnings</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Number of early warnings"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="earlyWarningsSummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Early Warnings Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter summary of key early warnings"
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Summarize key early warnings that have been raised during this period.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  Compensation Events (Clause 60.1)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="compensationEventsCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Open Compensation Events</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Number of events"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="notifiedCompensationEventsValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notified CEs Value (£)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Value in GBP"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="implementedCompensationEventsValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Implemented CEs Value (£)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Value in GBP"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="compensationEventsSummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compensation Events Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter summary of key compensation events"
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Summarize key compensation events that have been raised during this period.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Resources, Quality, and Health & Safety */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Resources (Clause 25)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="resourceStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sufficient">Sufficient</SelectItem>
                          <SelectItem value="at-risk">At Risk</SelectItem>
                          <SelectItem value="insufficient">Insufficient</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="resourceSummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter resource summary"
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Summarize resource status and any issues.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Quality (Clause 40)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nonConformanceCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Non-Conformance Count</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Number of NCRs"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="qualitySummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter quality summary"
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Summarize quality issues and NCRs.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Health & Safety (Clause 27)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="accidentsThisPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accidents This Period</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Number of accidents"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="healthAndSafetySummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Health & Safety Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter health & safety summary"
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Summarize health & safety performance and issues.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Financial Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Financial Status Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="contractSum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Contract Sum (£)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Value in GBP"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currentForecastFinalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Forecast Final Amount (£)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Value in GBP"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amountCertifiedToDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Certified to Date (£)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Value in GBP"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Next Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Next Period Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="nextPeriodFocus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Focus Areas for Next Period</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter focus areas for next period"
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      List the main activities planned for the next reporting period in accordance with the Accepted Programme.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="nextPeriodRisks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Potential Risks for Next Period</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter potential risks for next period"
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Highlight any potential issues or risks that may impact the next period.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Statements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Contractor and Project Manager Statements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contractorStatement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contractor Statement (Clause 31.2)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter contractor statement"
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Contractor's statement regarding progress against the Accepted Programme.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="projectManagerStatement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Manager Statement (Clause 31.3)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter Project Manager statement"
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Project Manager's statement in response to the Contractor's progress report.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Form Actions */}
          <div className="flex justify-between gap-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleSaveDraft}>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button type="button" variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button type="button" variant="outline" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setView('preview')}>
                Preview
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </div>
          </div>
        </AnimationWrapper>
      </form>
    </Form>
  );
  
  // Preview components
  const PreviewView = () => {
    const watchedValues = form.watch();
    
    return (
      <div id="progress-report-preview" className="space-y-8">
        {/* Preview Controls */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Report Preview</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setView('form')}>
              Back to Form
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
        
        {/* Report Header */}
        <div className="bg-primary/5 p-6 rounded-lg border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{watchedValues.reportTitle}</h1>
              <div className="text-sm text-gray-500 mt-1">
                Report Number: {watchedValues.reportNumber}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Report Date: {watchedValues.reportDate ? format(watchedValues.reportDate, 'dd MMMM yyyy') : ''}</div>
              <div className="text-sm text-gray-500">
                Reporting Period: {watchedValues.reportingPeriod.from ? format(watchedValues.reportingPeriod.from, 'dd MMM yyyy') : ''} to {watchedValues.reportingPeriod.to ? format(watchedValues.reportingPeriod.to, 'dd MMM yyyy') : ''}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <div className="text-sm font-medium text-gray-500">Contract:</div>
              <div>{watchedValues.contractName}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Contractor:</div>
              <div>{watchedValues.contractorName}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Employer:</div>
              <div>{watchedValues.employerName}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Project Manager:</div>
              <div>{watchedValues.projectManagerName}</div>
            </div>
          </div>
          
          <div className="mt-4 p-2 bg-blue-50 rounded-md border border-blue-100">
            <div className="text-sm font-medium text-blue-800">Report Prepared By:</div>
            <div className="flex justify-between items-center">
              <div className="font-medium">{watchedValues.reporterName}</div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{watchedValues.reporterPosition}</div>
            </div>
          </div>
        </div>
        
        {/* Overall Progress */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Overall Progress Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Progress Complete</div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{watchedValues.overallProgress}%</div>
                <Badge className={getStatusColor(watchedValues.delayStatus)}>
                  {watchedValues.delayStatus === 'on-track' ? 'On Track' : 
                   watchedValues.delayStatus === 'at-risk' ? 'At Risk' : 'Delayed'}
                </Badge>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Status Against Programme</div>
              <div className="text-lg font-medium">
                {watchedValues.progressAgainstProgramme === 'ahead' ? 'Ahead of Schedule' : 
                 watchedValues.progressAgainstProgramme === 'on-schedule' ? 'On Schedule' : 'Behind Schedule'}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Completion</div>
              <div className="text-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Planned:</span> 
                  <span>{watchedValues.completionDate ? format(watchedValues.completionDate, 'dd MMM yyyy') : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Forecast:</span> 
                  <span>{watchedValues.forecastCompletionDate ? format(watchedValues.forecastCompletionDate, 'dd MMM yyyy') : ''}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Progress Summary</h3>
            <p className="whitespace-pre-line">{watchedValues.progressSummary}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Programme</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Current Accepted Programme:</div>
                <div>{watchedValues.currentAcceptedProgramme}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Revision:</div>
                <div>{watchedValues.programmeRevisionNumber}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Accepted:</div>
                <div>{watchedValues.programmeAcceptanceDate ? format(watchedValues.programmeAcceptanceDate, 'dd MMM yyyy') : ''}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress by Section */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Progress by Section (NEC4 Clause 11.2(1))</h2>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section/Activity</TableHead>
                  <TableHead>Planned %</TableHead>
                  <TableHead>Actual %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watchedValues.progressBySection?.map((section, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{section.section}</TableCell>
                    <TableCell>{section.planned}%</TableCell>
                    <TableCell>{section.actual}%</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(section.status)}>
                        {section.status === 'completed' ? 'Completed' : 
                         section.status === 'on-track' ? 'On Track' : 
                         section.status === 'at-risk' ? 'At Risk' : 'Delayed'}
                      </Badge>
                    </TableCell>
                    <TableCell>{section.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* EWs, CEs and Issues */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Early Warnings (Clause 15)</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">Open Early Warnings:</div>
                <div className="font-medium">{watchedValues.earlyWarningsCount}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Summary:</div>
                <p className="whitespace-pre-line">{watchedValues.earlyWarningsSummary}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Compensation Events (Clause 60.1)</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">Open Compensation Events:</div>
                <div className="font-medium">{watchedValues.compensationEventsCount}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Notified Value:</div>
                  <div className="font-medium">£{watchedValues.notifiedCompensationEventsValue?.toLocaleString() || '0'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Implemented Value:</div>
                  <div className="font-medium">£{watchedValues.implementedCompensationEventsValue?.toLocaleString() || '0'}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Summary:</div>
                <p className="whitespace-pre-line">{watchedValues.compensationEventsSummary}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Resources, Quality and H&S */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Resources (Clause 25)</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">Status:</div>
                <Badge className={getStatusColor(watchedValues.resourceStatus || 'sufficient')}>
                  {watchedValues.resourceStatus === 'sufficient' ? 'Sufficient' : 
                   watchedValues.resourceStatus === 'at-risk' ? 'At Risk' : 'Insufficient'}
                </Badge>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Summary:</div>
                <p className="whitespace-pre-line">{watchedValues.resourceSummary}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Quality (Clause 40)</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">Non-Conformances:</div>
                <div className="font-medium">{watchedValues.nonConformanceCount}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Summary:</div>
                <p className="whitespace-pre-line">{watchedValues.qualitySummary}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Health & Safety (Clause 27)</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">Accidents this period:</div>
                <div className="font-medium">{watchedValues.accidentsThisPeriod}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Summary:</div>
                <p className="whitespace-pre-line">{watchedValues.healthAndSafetySummary}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Financial Status */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Financial Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500 mb-1">Original Contract Sum</div>
              <div className="text-xl font-bold">£{watchedValues.contractSum?.toLocaleString() || '0'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 mb-1">Forecast Final Amount</div>
              <div className="text-xl font-bold">£{watchedValues.currentForecastFinalAmount?.toLocaleString() || '0'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 mb-1">Amount Certified to Date</div>
              <div className="text-xl font-bold">£{watchedValues.amountCertifiedToDate?.toLocaleString() || '0'}</div>
            </div>
          </div>
        </div>
        
        {/* Next Period */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Next Period</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Focus Areas</h3>
              <p className="whitespace-pre-line">{watchedValues.nextPeriodFocus}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Potential Risks</h3>
              <p className="whitespace-pre-line">{watchedValues.nextPeriodRisks}</p>
            </div>
          </div>
        </div>
        
        {/* Statements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Contractor Statement (Clause 31.2)</h2>
            <p className="whitespace-pre-line">{watchedValues.contractorStatement}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="text-xl font-bold mb-4">Project Manager Statement (Clause 31.3)</h2>
            <p className="whitespace-pre-line">{watchedValues.projectManagerStatement}</p>
          </div>
        </div>
        
        {/* Signatures */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Signatures</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-3">Prepared by: {watchedValues.contractorName}</div>
              <div className="h-20 border-b border-dashed"></div>
              <div className="text-sm text-gray-500 mt-2">Date: ____________________</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-500 mb-3">Reviewed by Project Manager: {watchedValues.projectManagerName}</div>
              <div className="h-20 border-b border-dashed"></div>
              <div className="text-sm text-gray-500 mt-2">Date: ____________________</div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Main render
  return (
    <div className="max-w-full mx-auto">
      {submissionComplete ? (
        <div className="text-center p-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Progress Report Submitted</h2>
          <p className="text-gray-600 mb-6">
            Your progress report has been successfully submitted.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button onClick={() => {
              setSubmissionComplete(false);
              form.reset();
            }}>
              Create New Report
            </Button>
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