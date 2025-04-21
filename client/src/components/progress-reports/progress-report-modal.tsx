import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  reportDate: z.date(),
  reportPeriodStart: z.date(),
  reportPeriodEnd: z.date(),
  overallProgress: z.number().min(0).max(100),
  overallSummary: z.string().min(3, "Summary must be at least 3 characters"),
  statusColor: z.enum(["green", "amber", "red"]),
  sectionProgress: z.array(
    z.object({
      section: z.string(),
      team: z.string(),
      percentComplete: z.number().min(0).max(100),
      issues: z.string(),
      nextWeekFocus: z.string(),
    })
  ).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ProgressReportModal({ isOpen, onClose, projectId }: ProgressReportModalProps) {
  const [activeTab, setActiveTab] = useState("manual");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: `Progress Report - ${format(new Date(), "PP")}`,
      reportDate: new Date(),
      reportPeriodStart: new Date(new Date().setDate(new Date().getDate() - 14)), // 2 weeks ago
      reportPeriodEnd: new Date(),
      overallProgress: 0,
      overallSummary: "",
      statusColor: "amber",
      sectionProgress: [],
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: FormValues & { projectId: number }) => {
      const response = await apiRequest("POST", "/api/progress-reports", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'progress-reports'] });
      toast({
        title: "Progress report created",
        description: "Your progress report has been saved successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating progress report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiRequest("POST", "/api/ai-assistant/generate-progress-report", { projectId });
      return await response.json();
    },
    onSuccess: (data) => {
      // Populate the form with AI-generated data
      form.reset({
        title: data.title,
        reportDate: new Date(data.reportDate),
        reportPeriodStart: new Date(data.reportPeriodStart),
        reportPeriodEnd: new Date(data.reportPeriodEnd),
        overallProgress: data.overallProgress,
        overallSummary: data.overallSummary,
        statusColor: data.statusColor,
        sectionProgress: data.sectionProgress || [],
      });
      setIsGenerating(false);
      toast({
        title: "Report generated",
        description: "AI has generated a report based on project data. Review and submit when ready.",
      });
    },
    onError: (error: Error) => {
      setIsGenerating(false);
      toast({
        title: "Error generating report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    createReportMutation.mutate({
      ...values,
      projectId,
    });
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    generateReportMutation.mutate(projectId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Progress Report</DialogTitle>
          <DialogDescription>
            Generate a comprehensive project progress report with key metrics and AI-insights.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto">AI-Generated</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>
          
          <TabsContent value="auto" className="py-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Let AI analyze your project data to create a comprehensive progress report 
                with insights on overall progress, risks, issues, and recommendations.
              </p>
              
              <Button 
                onClick={handleGenerateReport} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  "Generate AI Progress Report"
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter report title" {...field} />
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
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reportPeriodStart"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Period Start</FormLabel>
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
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
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
                    name="reportPeriodEnd"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Period End</FormLabel>
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
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    name="statusColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={field.value === "green" ? "default" : "outline"}
                                className={cn(
                                  "flex-1 bg-opacity-20",
                                  field.value === "green" && "bg-green-500"
                                )}
                                onClick={() => field.onChange("green")}
                              >
                                <div className="w-4 h-4 mr-2 rounded-full bg-green-500" />
                                On Track
                              </Button>
                              
                              <Button
                                type="button"
                                variant={field.value === "amber" ? "default" : "outline"}
                                className={cn(
                                  "flex-1 bg-opacity-20",
                                  field.value === "amber" && "bg-amber-500"
                                )}
                                onClick={() => field.onChange("amber")}
                              >
                                <div className="w-4 h-4 mr-2 rounded-full bg-amber-500" />
                                At Risk
                              </Button>
                              
                              <Button
                                type="button"
                                variant={field.value === "red" ? "default" : "outline"}
                                className={cn(
                                  "flex-1 bg-opacity-20",
                                  field.value === "red" && "bg-red-500"
                                )}
                                onClick={() => field.onChange("red")}
                              >
                                <div className="w-4 h-4 mr-2 rounded-full bg-red-500" />
                                Delayed
                              </Button>
                            </div>
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="overallSummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a summary of the project progress"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a brief summary of the project status, key achievements, and any issues.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createReportMutation.isPending}
                  >
                    {createReportMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Report"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}