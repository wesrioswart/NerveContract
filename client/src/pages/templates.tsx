import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PMITemplate from '@/components/templates/pmi-template';

export default function TemplatesPage() {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  
  // Function to render the selected template
  const renderTemplate = () => {
    switch (activeTemplate) {
      case 'pmi':
        return <PMITemplate />;
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
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">NEC4 Document Templates</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Template Card - PMI */}
        <Card className="hover:shadow-md transition-shadow">
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
            <Button 
              onClick={() => setActiveTemplate('pmi')}
              className="w-full"
            >
              View Template
            </Button>
          </CardFooter>
        </Card>
        
        {/* Template Card - Early Warning */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Early Warning Notice</CardTitle>
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
            <Button 
              onClick={() => alert("This template will be available soon")}
              className="w-full"
              variant="outline"
            >
              Coming Soon
            </Button>
          </CardFooter>
        </Card>
        
        {/* Template Card - Compensation Event */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Compensation Event Notice</CardTitle>
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
            <Button 
              onClick={() => alert("This template will be available soon")}
              className="w-full"
              variant="outline"
            >
              Coming Soon
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Template Preview Area */}
      <div className="bg-gray-50 rounded-lg p-6 border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Template Preview</h2>
          {activeTemplate && (
            <Button 
              variant="outline" 
              onClick={() => setActiveTemplate(null)}
            >
              Back to Templates
            </Button>
          )}
        </div>
        
        {renderTemplate()}
      </div>
    </div>
  );
}