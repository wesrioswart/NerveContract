import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, DollarSign, AlertOctagon, HelpCircle, Receipt, BarChart2, Calendar } from 'lucide-react';
import { AnimationWrapper } from '@/components/ui/animation-wrapper';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedButton } from '@/components/ui/animated-button';

// Template components
import PMITemplate from '@/components/document-templates/pmi-template';
import EarlyWarningTemplate from '@/components/document-templates/early-warning-template';
import CompensationEventTemplate from '@/components/document-templates/compensation-event-template';
import CompensationEventQuotationTemplate from '@/components/document-templates/compensation-event-quotation-template';
import NCRTemplate from '@/components/document-templates/ncr-template';
import TechnicalQueryTemplate from '@/components/document-templates/technical-query-template';
import PaymentApplicationTemplate from '@/components/document-templates/payment-application-template';
import ProgressReportTemplate from '@/components/document-templates/progress-report-template-tabs';
import DailySiteReportTemplate from '@/components/document-templates/daily-site-report-template';

export default function TemplatesPage() {
  const [location] = useLocation();
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  
  // Check for template parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const templateParam = urlParams.get('template');
    if (templateParam) {
      setActiveTemplate(templateParam);
    }
  }, [location]);
  
  // Template options for the dropdown
  const templateOptions = [
    { value: 'daily-site-report', label: 'Daily Site Report', icon: Calendar },
    { value: 'progress-report', label: 'Progress Report', icon: BarChart2 },
    { value: 'pmi', label: 'Project Manager\'s Instruction (PMI)', icon: FileText },
    { value: 'early-warning', label: 'Early Warning Notice', icon: AlertTriangle },
    { value: 'compensation-event', label: 'Compensation Event', icon: DollarSign },
    { value: 'compensation-event-quotation', label: 'Compensation Event Quotation', icon: DollarSign },
    { value: 'ncr', label: 'Non-Conformance Report', icon: AlertOctagon },
    { value: 'technical-query', label: 'Technical Query', icon: HelpCircle },
    { value: 'payment-application', label: 'Payment Application', icon: Receipt },
  ];
  
  // Function to render the selected template
  const renderTemplate = () => {
    switch (activeTemplate) {
      case 'pmi':
        return <PMITemplate />;
      case 'early-warning':
        return <EarlyWarningTemplate />;
      case 'compensation-event':
        return <CompensationEventTemplate />;
      case 'compensation-event-quotation':
        return <CompensationEventQuotationTemplate />;
      case 'ncr':
        return <NCRTemplate />;
      case 'technical-query':
        return <TechnicalQueryTemplate />;
      case 'payment-application':
        return <PaymentApplicationTemplate />;
      case 'progress-report':
        return <ProgressReportTemplate />;
      case 'daily-site-report':
        return <DailySiteReportTemplate />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Select a template from the dropdown above to get started.</p>
          </div>
        );
    }
  };
  
  return (
    <div className="container mx-auto py-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <AnimationWrapper as="h1" type="slideIn" className="text-3xl font-bold">
            NEC4 Document Templates
          </AnimationWrapper>
          <p className="text-gray-600 mt-2">Create and manage professional NEC4 contract documents</p>
        </div>
        
        {/* Quick Template Selector */}
        <div className="flex flex-col sm:flex-row gap-3 items-start lg:items-center">
          <Select value={activeTemplate || ""} onValueChange={setActiveTemplate}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Select a template to get started" />
            </SelectTrigger>
            <SelectContent>
              {templateOptions.map((template) => {
                const IconComponent = template.icon;
                return (
                  <SelectItem key={template.value} value={template.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {template.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {activeTemplate && (
            <Button 
              variant="outline" 
              onClick={() => setActiveTemplate(null)}
              className="whitespace-nowrap"
            >
              View All Templates
            </Button>
          )}
        </div>
      </div>
      
      {/* Show selected template or template grid */}
      {activeTemplate ? (
        <div className="w-full">
          {renderTemplate()}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
          {/* Template Card - PMI */}
          <AnimatedCard animation="hover" index={0}>
            <CardHeader>
              <CardTitle>Project Manager's Instruction (PMI)</CardTitle>
              <CardDescription>
                Template for issuing formal PMIs in accordance with NEC4 Clause 14.3
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Use this template to issue instructions to the Contractor. The system will automatically 
                check compliance with NEC4 procedures and generate appropriate reference numbers.
              </p>
            </CardContent>
            <CardFooter>
              <AnimatedButton 
                onClick={() => setActiveTemplate('pmi')}
                className="w-full"
                animation="default"
              >
                Create PMI
              </AnimatedButton>
            </CardFooter>
          </AnimatedCard>

          {/* Template Card - Early Warning */}
          <AnimatedCard animation="hover" index={1}>
            <CardHeader>
              <CardTitle>Early Warning Notice</CardTitle>
              <CardDescription>
                NEC4 Clause 15.1 Early Warning notification template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Create early warning notices for matters that could increase costs, delay completion, 
                or impair performance. AI will assess risk levels and suggest mitigation strategies.
              </p>
            </CardContent>
            <CardFooter>
              <AnimatedButton 
                onClick={() => setActiveTemplate('early-warning')}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                animation="default"
              >
                Create Early Warning
              </AnimatedButton>
            </CardFooter>
          </AnimatedCard>

          {/* Template Card - Compensation Event */}
          <AnimatedCard animation="hover" index={2}>
            <CardHeader>
              <CardTitle>Compensation Event</CardTitle>
              <CardDescription>
                NEC4 Clause 60-65 Compensation Event notification and assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Record and assess compensation events with automatic cost and time impact calculations. 
                Includes built-in NEC4 clause compliance checking and quotation generation.
              </p>
            </CardContent>
            <CardFooter>
              <AnimatedButton 
                onClick={() => setActiveTemplate('compensation-event')}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                animation="default"
              >
                Create Compensation Event
              </AnimatedButton>
            </CardFooter>
          </AnimatedCard>

          {/* Template Card - NCR */}
          <AnimatedCard animation="hover" index={3}>
            <CardHeader>
              <CardTitle>Non-Conformance Report</CardTitle>
              <CardDescription>
                Quality management and defect tracking template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Document quality issues, defects, and non-conformances. Track corrective actions 
                and resolution status with automatic stakeholder notifications.
              </p>
            </CardContent>
            <CardFooter>
              <AnimatedButton 
                onClick={() => setActiveTemplate('ncr')}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
                animation="default"
              >
                Create NCR
              </AnimatedButton>
            </CardFooter>
          </AnimatedCard>

          {/* Template Card - Technical Query */}
          <AnimatedCard animation="hover" index={4}>
            <CardHeader>
              <CardTitle>Technical Query</CardTitle>
              <CardDescription>
                Request for Information (RFI) and technical clarification template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Submit technical queries and requests for clarification. AI will suggest similar 
                previous queries and auto-route to appropriate technical specialists.
              </p>
            </CardContent>
            <CardFooter>
              <AnimatedButton 
                onClick={() => setActiveTemplate('technical-query')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                animation="default"
              >
                Create Technical Query
              </AnimatedButton>
            </CardFooter>
          </AnimatedCard>

          {/* Template Card - Payment Application */}
          <AnimatedCard animation="hover" index={5}>
            <CardHeader>
              <CardTitle>Payment Application</CardTitle>
              <CardDescription>
                NEC4 payment certificate and application template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Generate payment applications and certificates with automatic value calculations, 
                retention handling, and compliance with NEC4 payment procedures.
              </p>
            </CardContent>
            <CardFooter>
              <AnimatedButton 
                onClick={() => setActiveTemplate('payment-application')}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                animation="default"
              >
                Create Payment Application
              </AnimatedButton>
            </CardFooter>
          </AnimatedCard>

          {/* Template Card - Progress Report */}
          <AnimatedCard animation="hover" index={6}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Progress Report</CardTitle>
                <BarChart2 className="text-indigo-500 w-5 h-5" />
              </div>
              <CardDescription>
                Template for comprehensive project progress reporting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Create detailed progress reports with schedule analysis, cost tracking, risk assessment, 
                and executive summaries. AI-powered insights and trend analysis included.
              </p>
            </CardContent>
            <CardFooter>
              <AnimatedButton 
                onClick={() => setActiveTemplate('progress-report')}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                animation="default"
              >
                Create Progress Report
              </AnimatedButton>
            </CardFooter>
          </AnimatedCard>

          {/* Template Card - Daily Site Report */}
          <AnimatedCard animation="hover" index={7}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daily Site Report</CardTitle>
                <Calendar className="text-cyan-500 w-5 h-5" />
              </div>
              <CardDescription>
                Template for recording daily site activities and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Use this template to record daily site activities, labor, plant, materials, progress, 
                and issues. The AI will analyze reports to identify risks and update executive dashboards.
              </p>
            </CardContent>
            <CardFooter>
              <AnimatedButton 
                onClick={() => setActiveTemplate('daily-site-report')}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                animation="default"
              >
                Create Daily Site Report
              </AnimatedButton>
            </CardFooter>
          </AnimatedCard>
        </div>
      )}
    </div>
  );
}