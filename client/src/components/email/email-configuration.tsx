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
import { Loader2, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

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
    mutationFn: () => apiRequest('GET', '/api/email/test-connection'),
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
    mutationFn: () => apiRequest('POST', '/api/email/process'),
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
    mutationFn: () => apiRequest('POST', '/api/email/enable-mock-mode'),
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