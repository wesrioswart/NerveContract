import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, DollarSign, AlertOctagon, HelpCircle, Receipt, BarChart2 } from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { AnimationWrapper } from "@/components/ui/animation-wrapper";
import { animatedToast } from "@/components/ui/animated-toast";
import { useToast } from "@/hooks/use-toast";
import PMITemplate from '@/components/document-templates/pmi-template';
import EarlyWarningTemplate from '@/components/document-templates/early-warning-template';
import CompensationEventTemplate from '@/components/document-templates/compensation-event-template';
import NCRTemplate from '@/components/document-templates/ncr-template';
import TechnicalQueryTemplate from '@/components/document-templates/technical-query-template';
import PaymentApplicationTemplate from '@/components/document-templates/payment-application-template';
import ProgressReportTemplate from '@/components/document-templates/progress-report-template-tabs';

export default function TemplatesPage() {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  
  // Function to render the selected template
  const renderTemplate = () => {
    switch (activeTemplate) {
      case 'pmi':
        return <PMITemplate />;
      case 'early-warning':
        return <EarlyWarningTemplate />;
      case 'compensation-event':
        return <CompensationEventTemplate />;
      case 'ncr':
        return <NCRTemplate />;
      case 'technical-query':
        return <TechnicalQueryTemplate />;
      case 'payment-application':
        return <PaymentApplicationTemplate />;
      case 'progress-report':
        return <ProgressReportTemplate />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-2xl font-semibold mb-2">Select a Template</h3>
            <p className="text-gray-500">Choose a template from the list to view and use</p>
          </div>
        );
    }
  };
  
  return (
    <div className="container mx-auto py-6 w-full">
      <AnimationWrapper as="h1" type="slideIn" className="text-3xl font-bold mb-6">
        NEC4 Document Templates
      </AnimationWrapper>
      
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
              Use this template to formally instruct the Contractor to implement changes to the Scope
              or Key Dates as permitted under Clause 14.3 of the NEC4 contract.
            </p>
          </CardContent>
          <CardFooter>
            <AnimatedButton 
              onClick={() => setActiveTemplate('pmi')}
              className="w-full"
              animation="default"
            >
              View Template
            </AnimatedButton>
          </CardFooter>
        </AnimatedCard>
        
        {/* Template Card - Early Warning */}
        <AnimatedCard animation="hover" index={1} className="border-2 border-amber-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Early Warning Notice</CardTitle>
              <AlertTriangle className="text-amber-500 w-5 h-5" />
            </div>
            <CardDescription>
              Template for issuing Early Warnings under NEC4 Clause 15.1
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Use this template to notify potential issues that could increase costs, delay completion,
              or impair the performance of the works, as required by Clause 15.1.
            </p>
          </CardContent>
          <CardFooter>
            <AnimatedButton 
              onClick={() => setActiveTemplate('early-warning')}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              animation="bounce"
            >
              Create Early Warning
            </AnimatedButton>
          </CardFooter>
        </AnimatedCard>
        
        {/* Template Card - Compensation Event */}
        <AnimatedCard animation="hover" index={2} className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Compensation Event Notice</CardTitle>
              <DollarSign className="text-blue-500 w-5 h-5" />
            </div>
            <CardDescription>
              Template for notifying Compensation Events under NEC4 Clause 61.3
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Use this template to formally notify the Project Manager of events that may
              alter the Prices, Completion Date or Key Dates, in accordance with Clause 61.3.
            </p>
          </CardContent>
          <CardFooter>
            <AnimatedButton 
              onClick={() => setActiveTemplate('compensation-event')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              animation="default"
            >
              Create CE Notice
            </AnimatedButton>
          </CardFooter>
        </AnimatedCard>
        
        {/* Template Card - Progress Report */}
        <AnimatedCard animation="hover" index={3} className="border-2 border-indigo-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Progress Report</CardTitle>
              <BarChart2 className="text-indigo-500 w-5 h-5" />
            </div>
            <CardDescription>
              Template for submitting Progress Reports under NEC4 Clause 31.2
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Use this template to submit comprehensive progress reports showing actual versus
              planned progress, forecasts, and early warnings in accordance with Clause 31.2.
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
        
        {/* Template Card - Non-Conformance Report */}
        <AnimatedCard animation="hover" index={4} className="border-2 border-red-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Non-Conformance Report</CardTitle>
              <AlertOctagon className="text-red-500 w-5 h-5" />
            </div>
            <CardDescription>
              Template for documenting non-conformances under NEC4 Quality Management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Use this template to report work that does not conform to the requirements 
              specified in the Works Information or contract.
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
        <AnimatedCard animation="hover" index={5} className="border-2 border-purple-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Technical Query</CardTitle>
              <HelpCircle className="text-purple-500 w-5 h-5" />
            </div>
            <CardDescription>
              Template for submitting technical queries on the NEC4 contract
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Use this template to submit formal queries regarding technical aspects 
              of the works, specifications, or design requirements.
            </p>
          </CardContent>
          <CardFooter>
            <AnimatedButton 
              onClick={() => setActiveTemplate('technical-query')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              animation="default"
            >
              Create TQ
            </AnimatedButton>
          </CardFooter>
        </AnimatedCard>
        
        {/* Template Card - Payment Application */}
        <AnimatedCard animation="hover" index={6} className="border-2 border-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payment Application</CardTitle>
              <Receipt className="text-green-500 w-5 h-5" />
            </div>
            <CardDescription>
              Template for submitting payment applications under NEC4 Option Y(UK)2
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Use this template to submit applications for payment as a Contractor,
              showing the amount due and calculations as required by the payment provisions.
            </p>
          </CardContent>
          <CardFooter>
            <AnimatedButton 
              onClick={() => setActiveTemplate('payment-application')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              animation="default"
            >
              Create Payment Application
            </AnimatedButton>
          </CardFooter>
        </AnimatedCard>
      </div>
      
      {/* Template Preview Area */}
      <AnimationWrapper type="fadeIn" delay={0.3}>
        <div className="bg-gray-50 rounded-lg p-6 border shadow-sm w-full">
          <div className="flex justify-between items-center mb-6">
            <AnimationWrapper as="h2" type="slideIn" delay={0.4} className="text-2xl font-bold">
              Template Preview
            </AnimationWrapper>
            {activeTemplate && (
              <AnimationWrapper type="fadeIn" delay={0.5}>
                <AnimatedButton 
                  variant="outline" 
                  onClick={() => setActiveTemplate(null)}
                  animation="subtle"
                >
                  Back to Templates
                </AnimatedButton>
              </AnimationWrapper>
            )}
          </div>
          
          <AnimationWrapper type="fadeIn" delay={0.6} className="w-full">
            <div className="w-full max-w-full overflow-x-auto">
              {renderTemplate()}
            </div>
          </AnimationWrapper>
        </div>
      </AnimationWrapper>
    </div>
  );
}