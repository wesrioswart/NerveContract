import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AnimatedButton } from '@/components/ui/animated-button';
import { AnimationWrapper } from '@/components/ui/animation-wrapper';
import { 
  Loader2, Mail, ShieldCheck, ArrowRight, Plus, FileText, Send, 
  Save, BookMarked, Terminal, Trash, Play, Code, AlertCircle,
  Check, X, PenTool 
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Schema for email configuration
const emailConfigSchema = z.object({
  user: z.string().min(1, { message: 'Email username is required' }),
  password: z.string().min(1, { message: 'Email password is required' }),
  host: z.string().min(1, { message: 'IMAP host is required' }),
  port: z.coerce.number().int().min(1, { message: 'Port must be a valid number' }),
  tls: z.boolean().default(true),
  rejectUnauthorized: z.boolean().default(false),
  markSeen: z.boolean().default(true),
});

type EmailConfigFormValues = z.infer<typeof emailConfigSchema>;

function CustomMockEmailCreator() {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [emailType, setEmailType] = useState<string>('');
  const [savedScenarios, setSavedScenarios] = useState<Array<{
    name: string;
    subject: string;
    content: string;
    type: string;
  }>>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [processingResults, setProcessingResults] = useState<any>(null);
  
  // Add mock email mutation
  const addMockEmailMutation = useMutation({
    mutationFn: async (data: { subject: string; content: string; type?: string }) => {
      const response = await apiRequest('POST', '/api/email/add-mock-email', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Test Email Added',
        description: 'Custom test email has been added successfully.',
      });
      // Clear form fields
      setSubject('');
      setContent('');
    },
    onError: (error) => {
      toast({
        title: 'Failed to Add Test Email',
        description: `Error: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Process test email mutation with results
  const processTestEmailMutation = useMutation({
    mutationFn: async (data: { subject: string; content: string; type?: string }) => {
      // First add the mock email
      await apiRequest('POST', '/api/email/add-mock-email', data);
      // Then process emails
      const response = await apiRequest('POST', '/api/email/process');
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Test Email Processed',
        description: `Successfully processed the test email.`,
      });
      setProcessingResults(data);
    },
    onError: (error) => {
      toast({
        title: 'Processing Failed',
        description: `Failed to process test email: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleAddMockEmail = () => {
    if (!subject.trim() || !content.trim()) {
      toast({
        title: 'Invalid Input',
        description: 'Please provide both subject and content for the test email.',
        variant: 'destructive',
      });
      return;
    }
    
    addMockEmailMutation.mutate({
      subject,
      content,
      type: emailType === 'none' ? undefined : emailType
    });
  };
  
  const handleSaveScenario = () => {
    if (!scenarioName.trim() || !subject.trim() || !content.trim()) {
      toast({
        title: 'Invalid Input',
        description: 'Please provide a name, subject, and content for the scenario.',
        variant: 'destructive',
      });
      return;
    }
    
    const newScenario = {
      name: scenarioName,
      subject,
      content,
      type: emailType
    };
    
    setSavedScenarios([...savedScenarios, newScenario]);
    setScenarioName('');
    setShowSaveForm(false);
    
    toast({
      title: 'Scenario Saved',
      description: `Test scenario "${scenarioName}" has been saved for future use.`
    });
  };
  
  const loadScenario = (scenario: typeof savedScenarios[0]) => {
    setSubject(scenario.subject);
    setContent(scenario.content);
    setEmailType(scenario.type);
    
    toast({
      title: 'Scenario Loaded',
      description: `Test scenario "${scenario.name}" has been loaded.`
    });
  };
  
  const deleteScenario = (index: number) => {
    const newScenarios = [...savedScenarios];
    const removedName = newScenarios[index].name;
    newScenarios.splice(index, 1);
    setSavedScenarios(newScenarios);
    
    toast({
      title: 'Scenario Deleted',
      description: `Test scenario "${removedName}" has been removed.`
    });
  };
  
  const handleTestEmail = () => {
    if (!subject.trim() || !content.trim()) {
      toast({
        title: 'Invalid Input',
        description: 'Please provide both subject and content for the test email.',
        variant: 'destructive',
      });
      return;
    }
    
    processTestEmailMutation.mutate({
      subject,
      content,
      type: emailType === 'none' ? undefined : emailType
    });
  };
  
  // Generate a formatted subject line based on the email type for preview
  const getFormattedSubjectPreview = () => {
    if (!subject) return 'Subject preview will appear here';
    
    if (emailType === 'none' || !emailType) {
      return subject;
    }
    
    // Check if the subject already has the type prefix
    if (subject.startsWith(`${emailType}:`)) {
      return subject;
    }
    
    return `${emailType}: ${subject}`;
  };
  
  return (
    <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-100">
      <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Create Custom Test Email
      </h3>
      
      {/* Subject line preview */}
      {subject && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
          <div className="text-xs font-medium text-blue-500 mb-1">Email Subject Preview:</div>
          <div className="font-medium text-gray-800">{getFormattedSubjectPreview()}</div>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label htmlFor="mock-subject" className="block text-sm font-medium text-blue-700 mb-1">
              Email Subject
            </label>
            <Input
              id="mock-subject"
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-white"
            />
          </div>
          
          <div>
            <label htmlFor="mock-type" className="block text-sm font-medium text-blue-700 mb-1">
              Email Type
            </label>
            <Select
              value={emailType}
              onValueChange={setEmailType}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="HIRE">HIRE</SelectItem>
                <SelectItem value="OFFHIRE">OFFHIRE</SelectItem>
                <SelectItem value="DELIVERY">DELIVERY</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <label htmlFor="mock-content" className="block text-sm font-medium text-blue-700 mb-1">
            Email Content
          </label>
          <Textarea
            id="mock-content"
            placeholder="Enter email content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="bg-white"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <Button
            type="button"
            variant="default"
            onClick={handleAddMockEmail}
            disabled={addMockEmailMutation.isPending || !subject.trim() || !content.trim()}
            className="w-full"
          >
            {addMockEmailMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Test Email...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Test Email
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestEmail}
            disabled={processTestEmailMutation.isPending || !subject.trim() || !content.trim()}
            className="w-full"
          >
            {processTestEmailMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Test & Process Now
              </>
            )}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => setShowSaveForm(true)}
                disabled={!subject.trim() || !content.trim()}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Scenario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Save Test Scenario</DialogTitle>
                <DialogDescription>
                  Give this test scenario a name to save it for future use.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <label htmlFor="scenario-name" className="block text-sm font-medium mb-1">
                    Scenario Name
                  </label>
                  <Input
                    id="scenario-name"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="e.g., Equipment Hire Request"
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">Preview:</div>
                  <div className="rounded-md bg-muted p-3">
                    <div className="text-sm font-medium">{getFormattedSubjectPreview()}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {content.length > 60 ? content.substring(0, 60) + '...' : content}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setShowSaveForm(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSaveScenario}
                  disabled={!scenarioName.trim()}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Saved scenarios */}
      {savedScenarios.length > 0 && (
        <div className="mt-6">
          <Accordion type="single" collapsible className="bg-white rounded-lg border border-blue-200">
            <AccordionItem value="saved-scenarios">
              <AccordionTrigger className="px-4 py-2 text-blue-700 hover:text-blue-900">
                <div className="flex items-center gap-2">
                  <BookMarked className="h-4 w-4" />
                  <span>Saved Test Scenarios ({savedScenarios.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-2">
                <div className="space-y-2">
                  {savedScenarios.map((scenario, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{scenario.name}</div>
                        <div className="text-xs text-gray-600 truncate max-w-full">
                          {scenario.type && scenario.type !== 'none' ? `[${scenario.type}] ` : ''}
                          {scenario.subject}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => loadScenario(scenario)}
                          className="h-8 px-2"
                        >
                          <PenTool className="h-4 w-4" />
                          <span className="sr-only">Load</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteScenario(index)}
                          className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
      
      {/* Processing results */}
      {processingResults && (
        <div className="mt-6">
          <Accordion type="single" collapsible className="bg-white rounded-lg border border-green-200">
            <AccordionItem value="processing-results">
              <AccordionTrigger className="px-4 py-2 text-green-700 hover:text-green-900">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  <span>Processing Results</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-md">
                      <div className="text-sm font-medium text-green-800 mb-1">Processed:</div>
                      <div className="text-2xl font-bold text-green-700">
                        {processingResults.processedCount || 0} emails
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-md">
                      <div className="text-sm font-medium text-blue-800 mb-1">Matched Rules:</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {processingResults.matchedRules || 0} rules
                      </div>
                    </div>
                  </div>
                  
                  {processingResults.details && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Details:</h4>
                      <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
                        <pre className="text-xs text-gray-800">
                          {JSON.stringify(processingResults.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-600">
          <strong>Tip:</strong> For equipment-related emails, either select a type or include "HIRE:", "OFFHIRE:", or "DELIVERY:" in the subject.
          For project reference, use the format "Project: ABC123" in the subject.
        </p>
      </div>
    </div>
  );
}

export default function EmailConfiguration() {
  const [configSuccess, setConfigSuccess] = useState(false);
  const { toast } = useToast();
  
  // Form setup with zod validation
  const form = useForm<EmailConfigFormValues>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      user: '',
      password: '',
      host: '',
      port: 993, // Default IMAP SSL port
      tls: true,
      rejectUnauthorized: false,
      markSeen: true,
    },
  });
  
  // Initialize email service mutation
  const initializeMutation = useMutation({
    mutationFn: (data: EmailConfigFormValues) => {
      // Transform form data to match API expectations
      const apiData = {
        ...data,
        tlsOptions: {
          rejectUnauthorized: data.rejectUnauthorized,
        },
      };
      
      // Remove the flattened property
      const finalApiData: any = apiData;
      delete finalApiData.rejectUnauthorized;
      
      return apiRequest('POST', '/api/email/initialize', finalApiData);
    },
    onSuccess: () => {
      toast({
        title: 'Email Configuration Saved',
        description: 'Email service has been configured successfully.',
      });
      setConfigSuccess(true);
    },
    onError: (error) => {
      toast({
        title: 'Configuration Failed',
        description: `Failed to configure email service: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/email/test-connection');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Connection Successful',
        description: 'Successfully connected to the email server.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Connection Failed',
        description: `Failed to connect to email server: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Process emails mutation
  const processEmailsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/email/process');
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Emails Processed',
        description: `Successfully processed ${data.processedCount} emails.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Processing Failed',
        description: `Failed to process emails: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Enable mock mode mutation
  const enableMockModeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/email/enable-mock-mode');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Mock Mode Enabled',
        description: 'Email service is now in mock mode for testing.',
      });
      setConfigSuccess(true);
    },
    onError: (error) => {
      toast({
        title: 'Failed to Enable Mock Mode',
        description: `Error: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: EmailConfigFormValues) => {
    initializeMutation.mutate(data);
  };
  
  const canTestConnection = configSuccess || form.formState.isSubmitSuccessful;
  
  return (
    <AnimationWrapper type="fadeIn">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <AnimationWrapper type="slideIn" delay={0.1}>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
          </AnimationWrapper>
          <CardDescription>
            Configure the email service to automatically process contract documents via email
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimationWrapper type="fadeIn" delay={0.2}>
                  <FormField
                    control={form.control}
                    name="user"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Email Address
                          <InfoTooltip text="The email address that will receive equipment requests and documentation. This should be a dedicated address used only for system processing." />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          The email address to monitor for documents
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AnimationWrapper>
                
                <AnimationWrapper type="fadeIn" delay={0.3}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Password
                          <InfoTooltip text="Password for the email account. For security, consider using an app-specific password if your email provider supports it." />
                        </FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          App-specific password recommended
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AnimationWrapper>
                
                <AnimationWrapper type="fadeIn" delay={0.4}>
                  <FormField
                    control={form.control}
                    name="host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          IMAP Host
                          <InfoTooltip text="The incoming mail server address from your email provider (e.g., imap.gmail.com for Gmail or outlook.office365.com for Microsoft)." />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="imap.example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          IMAP server address for your email provider
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AnimationWrapper>
                
                <AnimationWrapper type="fadeIn" delay={0.5}>
                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Port
                          <InfoTooltip text="The connection port for your email server. Common values are 993 for secure IMAP (IMAPS) or 143 for standard IMAP." />
                        </FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="993" {...field} />
                        </FormControl>
                        <FormDescription>
                          Default: 993 (IMAPS), 143 (IMAP)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AnimationWrapper>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnimationWrapper type="fadeIn" delay={0.6}>
                  <FormField
                    control={form.control}
                    name="tls"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center">
                            Use TLS
                            <InfoTooltip text="Enables Transport Layer Security encryption for secure communication with the email server. Recommended for all connections." />
                          </FormLabel>
                          <FormDescription>
                            Enable secure TLS connection
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AnimationWrapper>
                
                <AnimationWrapper type="fadeIn" delay={0.7}>
                  <FormField
                    control={form.control}
                    name="rejectUnauthorized"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center">
                            Verify SSL
                            <InfoTooltip text="Verifies SSL certificates from the email server. Disable only in testing environments with self-signed certificates." />
                          </FormLabel>
                          <FormDescription>
                            Verify SSL certificates
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AnimationWrapper>
                
                <AnimationWrapper type="fadeIn" delay={0.8}>
                  <FormField
                    control={form.control}
                    name="markSeen"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center">
                            Mark as Read
                            <InfoTooltip text="Automatically marks emails as read after processing. Helps prevent duplicate processing if enabled." />
                          </FormLabel>
                          <FormDescription>
                            Mark processed emails as read
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </AnimationWrapper>
              </div>
              
              <AnimationWrapper type="fadeIn" delay={0.9}>
                <div className="flex items-center gap-2">
                  <AnimatedButton 
                    type="submit" 
                    animation="default"
                    disabled={initializeMutation.isPending}
                    className="w-full"
                  >
                    {initializeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Save Configuration
                      </>
                    )}
                  </AnimatedButton>
                </div>
              </AnimationWrapper>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex flex-wrap gap-4">
          <AnimatedButton
            variant="outline"
            animation="subtle"
            disabled={!canTestConnection || testConnectionMutation.isPending}
            onClick={() => testConnectionMutation.mutate()}
            className="flex-1"
          >
            {testConnectionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <div className="flex items-center">
                Test Connection
                <InfoTooltip text="Tests connectivity to the email server with the provided credentials without processing any emails." />
              </div>
            )}
          </AnimatedButton>
          
          <AnimatedButton
            variant="outline"
            animation="subtle"
            disabled={!canTestConnection || processEmailsMutation.isPending}
            onClick={() => processEmailsMutation.mutate()}
            className="flex-1"
          >
            {processEmailsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <div className="flex items-center">
                Process New Emails
                <InfoTooltip text="Immediately checks for and processes any new unread emails that match equipment formats." />
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            )}
          </AnimatedButton>

          <div className="w-full md:w-auto">
            <AnimatedButton
              variant="secondary"
              animation="subtle"
              disabled={enableMockModeMutation.isPending}
              onClick={() => enableMockModeMutation.mutate()}
              className="w-full"
            >
              {enableMockModeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling Mock Mode...
                </>
              ) : (
                <div className="flex items-center">
                  Enable Test Mode
                  <InfoTooltip text="Enables mock mode with test emails for development and testing. No real email credentials needed." />
                </div>
              )}
            </AnimatedButton>
          </div>
        </CardFooter>
      </Card>
      
      <Card className="mb-6 mt-8">
        <CardHeader>
          <CardTitle>Test Mode</CardTitle>
          <CardDescription>
            Enable test mode to process mock emails without real server connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Test mode allows you to verify the email processing functionality without setting up 
            an actual email server connection. When enabled, the system will process predefined 
            test emails related to equipment hire.
          </p>
          
          <div className="flex items-center w-full gap-4 mb-6">
            <AnimatedButton 
              disabled={enableMockModeMutation.isPending}
              onClick={() => enableMockModeMutation.mutate()}
              className="w-full"
            >
              {enableMockModeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling Test Mode...
                </>
              ) : (
                <div className="flex items-center">
                  Enable Test Mode
                  <InfoTooltip text="Enables mock mode with test emails for development and testing. No real email credentials needed." />
                </div>
              )}
            </AnimatedButton>
            
            <AnimatedButton
              variant="outline"
              animation="subtle"
              disabled={processEmailsMutation.isPending}
              onClick={() => processEmailsMutation.mutate()}
              className="w-full"
            >
              {processEmailsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <div className="flex items-center">
                  Process Test Emails
                  <InfoTooltip text="Processes any test emails available in the system." />
                </div>
              )}
            </AnimatedButton>
          </div>
          
          <Separator className="my-4" />
          <CustomMockEmailCreator />
        </CardContent>
      </Card>
    
      <div className="mt-8 p-4 rounded-lg bg-amber-50 border border-amber-200">
        <h3 className="text-lg font-medium text-amber-800 mb-2">GDPR Compliance Notice</h3>
        <p className="text-amber-700">
          The email parser processes emails containing project documents. It automatically stores 
          and categorizes attachments and extracts data from emails and documents. All processing 
          follows GDPR principles; data is only used for contract management purposes, stored 
          securely, and only retained for the necessary period. Users maintain rights to access, 
          rectify, and erase their data.
        </p>
      </div>
    </AnimationWrapper>
  );
}