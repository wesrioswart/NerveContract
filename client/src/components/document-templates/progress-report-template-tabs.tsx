import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Calendar, Check, AlertCircle, Info, ChevronDown, 
  Save, Printer, Download, XCircle, Upload, BarChart
} from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import html2pdf from 'html2pdf.js';
import { AnimationWrapper } from "@/components/ui/animation-wrapper";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const todayFormatted = format(new Date(), "dd/MM/yyyy");
  
  // Static project data
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
  
  // Watch form fields
  const formValues = form.watch();
  
  // Handle form scroll positioning
  useEffect(() => {
    const handleTabChange = (tab: string) => {
      // When tab changes, scroll to the top of the form container
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    
    handleTabChange(activeTab);
  }, [activeTab]);
  
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
  
  // Form content for each tab
  const BasicInformationTab = () => (
    <div className="space-y-6">
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
    </div>
  );
  
  const ProjectDetailsTab = () => (
    <div className="space-y-6">
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
            <BarChart className="h-5 w-5 text-primary" />
            Programme Details (Clause 31.2)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currentAcceptedProgramme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Accepted Programme</FormLabel>
                <FormControl>
                  <Input placeholder="Programme reference" {...field} />
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
                  <Input placeholder="Revision number" {...field} />
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
                      <SelectValue placeholder="Select delay status" />
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
    </div>
  );
  
  const ProgressTab = () => (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="overallProgress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overall Progress (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    {...field} 
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (isNaN(value)) {
                        field.onChange(0);
                      } else if (value < 0) {
                        field.onChange(0);
                      } else if (value > 100) {
                        field.onChange(100);
                      } else {
                        field.onChange(value);
                      }
                    }}
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
                      <SelectValue placeholder="Select progress status" />
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
          
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="progressSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide a summary of progress achieved during this reporting period..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the overall progress achieved during this reporting period
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Progress By Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            Progress By Section
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formValues.progressBySection?.map((section, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <FormField
                  control={form.control}
                  name={`progressBySection.${index}.section`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`progressBySection.${index}.planned`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned % Complete</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value)) {
                              field.onChange(0);
                            } else if (value < 0) {
                              field.onChange(0);
                            } else if (value > 100) {
                              field.onChange(100);
                            } else {
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`progressBySection.${index}.actual`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual % Complete</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value)) {
                              field.onChange(0);
                            } else if (value < 0) {
                              field.onChange(0);
                            } else if (value > 100) {
                              field.onChange(100);
                            } else {
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`progressBySection.${index}.status`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on-track">On Track</SelectItem>
                          <SelectItem value="at-risk">At Risk</SelectItem>
                          <SelectItem value="delayed">Delayed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="col-span-1 md:col-span-4">
                  <FormField
                    control={form.control}
                    name={`progressBySection.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional notes..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  const IssuesTab = () => (
    <div className="space-y-6">
      {/* Early Warnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Early Warnings (Clause 15)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="earlyWarningsCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Open Early Warnings</FormLabel>
                <FormControl>
                  <Input type="number" {...field} 
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (isNaN(value)) {
                        field.onChange(0);
                      } else if (value < 0) {
                        field.onChange(0);
                      } else {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="earlyWarningsSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Early Warnings Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Summarize the current early warnings and their status..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Compensation Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Compensation Events (Clause 60.1)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="compensationEventsCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Open Compensation Events</FormLabel>
                <FormControl>
                  <Input type="number" {...field} 
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (isNaN(value)) {
                        field.onChange(0);
                      } else if (value < 0) {
                        field.onChange(0);
                      } else {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="notifiedCompensationEventsValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value of Notified Compensation Events</FormLabel>
                <FormControl>
                  <Input type="number" {...field} 
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value)) {
                        field.onChange(0);
                      } else {
                        field.onChange(value);
                      }
                    }}
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
                <FormLabel>Value of Implemented Compensation Events</FormLabel>
                <FormControl>
                  <Input type="number" {...field} 
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value)) {
                        field.onChange(0);
                      } else {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="compensationEventsSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compensation Events Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Summarize the current compensation events and their status..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Resources and Quality */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Resources and Quality
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="resourceStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resource Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource status" />
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
            name="nonConformanceCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Open Non-Conformances</FormLabel>
                <FormControl>
                  <Input type="number" {...field} 
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (isNaN(value)) {
                        field.onChange(0);
                      } else if (value < 0) {
                        field.onChange(0);
                      } else {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="resourceSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Summarize the resource status..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="qualitySummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Summarize the quality status and any defects..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Health and Safety */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Health and Safety (Clause 27)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accidentsThisPeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accidents This Period</FormLabel>
                <FormControl>
                  <Input type="number" {...field} 
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (isNaN(value)) {
                        field.onChange(0);
                      } else if (value < 0) {
                        field.onChange(0);
                      } else {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="healthAndSafetySummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Health and Safety Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Summarize the health and safety status..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  const SummaryTab = () => (
    <div className="space-y-6">
      {/* Financial Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Financial Status
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="contractSum"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Sum</FormLabel>
                <FormControl>
                  <Input type="number" {...field} 
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value)) {
                        field.onChange(0);
                      } else {
                        field.onChange(value);
                      }
                    }}
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
                <FormLabel>Current Forecast Final Amount</FormLabel>
                <FormControl>
                  <Input type="number" {...field} 
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value)) {
                        field.onChange(0);
                      } else {
                        field.onChange(value);
                      }
                    }}
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
                <FormLabel>Amount Certified To Date</FormLabel>
                <FormControl>
                  <Input type="number" {...field} 
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value)) {
                        field.onChange(0);
                      } else {
                        field.onChange(value);
                      }
                    }}
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
            <ChevronDown className="h-5 w-5 text-primary" />
            Next Period
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="nextPeriodFocus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Focus Areas for Next Period</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the key focus areas for the next reporting period..." 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="nextPeriodRisks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Risks for Next Period</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe any anticipated risks for the next reporting period..." 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
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
            NEC4 Statements
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="contractorStatement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contractor Statement (Clause 31.2)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Contractor's statement..." 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  The Contractor's statement for continued compliance with the Accepted Programme
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
                    placeholder="Project Manager's statement..." 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  The Project Manager's statement regarding acceptance of the progress report
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
  
  const PreviewView = () => {
    const formValues = form.getValues();
    const progressIndication = getProgressIndication(formValues.overallProgress);
    
    return (
      <div id="progress-report-preview" className="print:bg-white p-6 space-y-8 bg-white border border-gray-200 rounded-md shadow-sm">
        <div className="text-center border-b pb-4">
          <h1 className="text-3xl font-bold mb-2">{formValues.reportTitle}</h1>
          <h2 className="text-xl">NEC4 Progress Report</h2>
          <p className="text-gray-500">Report No: {formValues.reportNumber}</p>
          <p className="text-gray-500">Date: {formValues.reportDate ? format(formValues.reportDate, "dd MMMM yyyy") : todayFormatted}</p>
        </div>
        
        {/* Reporter Details */}
        <div className="bg-blue-50 p-4 border border-blue-200 rounded-md">
          <h3 className="text-md font-semibold text-blue-800 mb-2">Report Prepared By:</h3>
          <div className="grid grid-cols-2 gap-2">
            <p><span className="font-medium">Position:</span> {formValues.reporterPosition}</p>
            <p><span className="font-medium">Name:</span> {formValues.reporterName}</p>
          </div>
        </div>
        
        {/* Project Details */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">Project Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p><span className="font-semibold">Contract Name:</span> {formValues.contractName}</p>
            <p><span className="font-semibold">Contract Reference:</span> {formValues.contractReference}</p>
            <p><span className="font-semibold">Employer:</span> {formValues.employerName}</p>
            <p><span className="font-semibold">Contractor:</span> {formValues.contractorName}</p>
            <p><span className="font-semibold">Project Manager:</span> {formValues.projectManagerName}</p>
            {formValues.supervisorName && (
              <p><span className="font-semibold">Supervisor:</span> {formValues.supervisorName}</p>
            )}
          </div>
        </div>
        
        {/* Reporting Period */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">Reporting Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p>
              <span className="font-semibold">From:</span> {
                formValues.reportingPeriod.from 
                  ? format(formValues.reportingPeriod.from, "dd MMMM yyyy") 
                  : 'Not specified'
              }
            </p>
            <p>
              <span className="font-semibold">To:</span> {
                formValues.reportingPeriod.to 
                  ? format(formValues.reportingPeriod.to, "dd MMMM yyyy") 
                  : 'Not specified'
              }
            </p>
          </div>
        </div>
        
        {/* Programme Status */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">Programme Status (NEC4 Clause 31.2)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p><span className="font-semibold">Current Accepted Programme:</span> {formValues.currentAcceptedProgramme}</p>
            <p><span className="font-semibold">Revision:</span> {formValues.programmeRevisionNumber}</p>
            <p>
              <span className="font-semibold">Programme Acceptance Date:</span> {
                formValues.programmeAcceptanceDate 
                  ? format(formValues.programmeAcceptanceDate, "dd MMMM yyyy") 
                  : 'Not specified'
              }
            </p>
            <p>
              <span className="font-semibold">Start Date:</span> {
                formValues.startDate 
                  ? format(formValues.startDate, "dd MMMM yyyy") 
                  : 'Not specified'
              }
            </p>
            <p>
              <span className="font-semibold">Completion Date:</span> {
                formValues.completionDate 
                  ? format(formValues.completionDate, "dd MMMM yyyy") 
                  : 'Not specified'
              }
            </p>
            <p>
              <span className="font-semibold">Forecast Completion Date:</span> {
                formValues.forecastCompletionDate 
                  ? format(formValues.forecastCompletionDate, "dd MMMM yyyy") 
                  : 'Not specified'
              }
            </p>
            <p>
              <span className="font-semibold">Delay Status:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${getStatusColor(formValues.delayStatus)}`}>
                {formValues.delayStatus === 'on-track' ? 'On Track' : 
                 formValues.delayStatus === 'at-risk' ? 'At Risk' : 'Delayed'}
              </span>
            </p>
          </div>
        </div>
        
        {/* Overall Progress */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">Overall Progress</h3>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {formValues.overallProgress}% Complete
              </span>
              <span className={`px-2 py-1 rounded-md text-sm ${progressIndication.color}`}>
                {progressIndication.text}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-primary h-4 rounded-full" 
                style={{ width: `${formValues.overallProgress}%` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            <p>
              <span className="font-semibold">Progress Against Programme:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                formValues.progressAgainstProgramme === 'ahead' ? 'bg-green-500 text-white' : 
                formValues.progressAgainstProgramme === 'on-schedule' ? 'bg-blue-500 text-white' : 
                'bg-amber-500 text-white'
              }`}>
                {formValues.progressAgainstProgramme === 'ahead' ? 'Ahead of Schedule' : 
                 formValues.progressAgainstProgramme === 'on-schedule' ? 'On Schedule' : 
                 'Behind Schedule'}
              </span>
            </p>
          </div>
          
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Progress Summary:</h4>
            <p className="text-gray-700 whitespace-pre-line">{formValues.progressSummary}</p>
          </div>
        </div>
        
        {/* Progress By Section */}
        {formValues.progressBySection && formValues.progressBySection.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-3 border-b pb-2">Progress By Section</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Planned %
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actual %
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formValues.progressBySection.map((section, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {section.section}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {section.planned}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {section.actual}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-md text-sm ${getStatusColor(section.status)}`}>
                          {section.status === 'completed' ? 'Completed' : 
                           section.status === 'on-track' ? 'On Track' : 
                           section.status === 'at-risk' ? 'At Risk' : 'Delayed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Early Warnings */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">Early Warnings (NEC4 Clause 15)</h3>
          <p className="mb-2"><span className="font-semibold">Open Early Warnings:</span> {formValues.earlyWarningsCount}</p>
          {formValues.earlyWarningsSummary && (
            <div className="mt-2">
              <h4 className="font-semibold mb-2">Summary:</h4>
              <p className="text-gray-700 whitespace-pre-line">{formValues.earlyWarningsSummary}</p>
            </div>
          )}
        </div>
        
        {/* Compensation Events */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">Compensation Events (NEC4 Clause 60.1)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <p><span className="font-semibold">Open Compensation Events:</span> {formValues.compensationEventsCount}</p>
            <p><span className="font-semibold">Notified CE Value:</span> £{formValues.notifiedCompensationEventsValue?.toLocaleString() || 0}</p>
            <p><span className="font-semibold">Implemented CE Value:</span> £{formValues.implementedCompensationEventsValue?.toLocaleString() || 0}</p>
          </div>
          {formValues.compensationEventsSummary && (
            <div className="mt-2">
              <h4 className="font-semibold mb-2">Summary:</h4>
              <p className="text-gray-700 whitespace-pre-line">{formValues.compensationEventsSummary}</p>
            </div>
          )}
        </div>
        
        {/* Resources and Quality */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">Resources and Quality</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {formValues.resourceStatus && (
              <p>
                <span className="font-semibold">Resource Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${getStatusColor(formValues.resourceStatus)}`}>
                  {formValues.resourceStatus === 'sufficient' ? 'Sufficient' : 
                   formValues.resourceStatus === 'at-risk' ? 'At Risk' : 'Insufficient'}
                </span>
              </p>
            )}
            <p><span className="font-semibold">Open Non-Conformances:</span> {formValues.nonConformanceCount || 0}</p>
          </div>
          
          {formValues.resourceSummary && (
            <div className="mt-2">
              <h4 className="font-semibold mb-2">Resource Summary:</h4>
              <p className="text-gray-700 whitespace-pre-line">{formValues.resourceSummary}</p>
            </div>
          )}
          
          {formValues.qualitySummary && (
            <div className="mt-2">
              <h4 className="font-semibold mb-2">Quality Summary:</h4>
              <p className="text-gray-700 whitespace-pre-line">{formValues.qualitySummary}</p>
            </div>
          )}
        </div>
        
        {/* Health and Safety */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">Health and Safety (NEC4 Clause 27)</h3>
          <p className="mb-2"><span className="font-semibold">Accidents This Period:</span> {formValues.accidentsThisPeriod || 0}</p>
          
          {formValues.healthAndSafetySummary && (
            <div className="mt-2">
              <h4 className="font-semibold mb-2">Health and Safety Summary:</h4>
              <p className="text-gray-700 whitespace-pre-line">{formValues.healthAndSafetySummary}</p>
            </div>
          )}
        </div>
        
        {/* Financial Status */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">Financial Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <p><span className="font-semibold">Contract Sum:</span> £{formValues.contractSum?.toLocaleString() || 0}</p>
            <p><span className="font-semibold">Forecast Final Amount:</span> £{formValues.currentForecastFinalAmount?.toLocaleString() || 0}</p>
            <p><span className="font-semibold">Amount Certified To Date:</span> £{formValues.amountCertifiedToDate?.toLocaleString() || 0}</p>
          </div>
        </div>
        
        {/* Next Period */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">Next Period</h3>
          
          <div className="mt-2">
            <h4 className="font-semibold mb-2">Focus Areas for Next Period:</h4>
            <p className="text-gray-700 whitespace-pre-line">{formValues.nextPeriodFocus}</p>
          </div>
          
          {formValues.nextPeriodRisks && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Risks for Next Period:</h4>
              <p className="text-gray-700 whitespace-pre-line">{formValues.nextPeriodRisks}</p>
            </div>
          )}
        </div>
        
        {/* NEC4 Statements */}
        <div>
          <h3 className="text-xl font-bold mb-3 border-b pb-2">NEC4 Statements</h3>
          
          {formValues.contractorStatement && (
            <div className="mt-2 mb-4">
              <h4 className="font-semibold mb-2">Contractor Statement (Clause 31.2):</h4>
              <div className="bg-gray-50 p-4 border border-gray-200 rounded-md">
                <p className="text-gray-700 whitespace-pre-line">{formValues.contractorStatement}</p>
              </div>
            </div>
          )}
          
          {formValues.projectManagerStatement && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Project Manager Statement (Clause 31.3):</h4>
              <div className="bg-gray-50 p-4 border border-gray-200 rounded-md">
                <p className="text-gray-700 whitespace-pre-line">{formValues.projectManagerStatement}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t pt-4 text-sm text-gray-500 text-center">
          <p>NEC4 Contract - Progress Report {formValues.reportNumber}</p>
          <p>Generated on {format(new Date(), "dd MMMM yyyy")}</p>
        </div>
      </div>
    );
  };
  
  // Form view with tabs
  const FormView = () => (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="project">Project Details</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="issues">Issues & Events</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <BasicInformationTab />
          </TabsContent>
          
          <TabsContent value="project">
            <ProjectDetailsTab />
          </TabsContent>
          
          <TabsContent value="progress">
            <ProgressTab />
          </TabsContent>
          
          <TabsContent value="issues">
            <IssuesTab />
          </TabsContent>
          
          <TabsContent value="summary">
            <SummaryTab />
          </TabsContent>
        </Tabs>
        
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
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePrint}
              disabled={isSubmitting}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
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
  
  // Page Layout
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progress Report</h1>
          <p className="text-gray-500">Create a formal progress report in accordance with NEC4 Clause 31.2</p>
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