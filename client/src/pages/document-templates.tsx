import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ClipboardList, FileText, FilePlus2, Info, Calculator } from "lucide-react";
import EarlyWarningTemplate from "@/components/document-templates/early-warning-template";
import CompensationEventQuotationTemplate from "@/components/document-templates/compensation-event-quotation-template";

export default function DocumentTemplates() {
  const [activeTab, setActiveTab] = useState("gallery");
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">NEC4 Document Templates</h1>
          <p className="text-gray-500">Standard documents and forms for NEC4 contract management</p>
        </div>
      </div>

      <Tabs
        defaultValue="gallery"
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          if (value === "gallery") {
            setActiveTemplate(null);
          }
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="gallery">
            <FileText className="w-4 h-4 mr-2" />
            Template Gallery
          </TabsTrigger>
          {activeTemplate && (
            <TabsTrigger value="editor">
              <FilePlus2 className="w-4 h-4 mr-2" />
              {activeTemplate === "early-warning" ? "Early Warning Notice" : 
               activeTemplate === "pmi" ? "Project Manager's Instruction" : 
               activeTemplate === "compensation-event" ? "Compensation Event Notice" : 
               activeTemplate === "compensation-event-quotation" ? "Compensation Event Quotation" :
               "Template Editor"}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="gallery" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PMI Template Card */}
            <Card>
              <CardHeader>
                <CardTitle>Project Manager's Instruction (PMI)</CardTitle>
                <CardDescription>
                  Template for issuing formal PMIs in accordance with NEC4 Clause 14.3
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Use this template to formally instruct the Contractor to implement
                  changes to the Scope or Key Dates as permitted under Clause 14.3 of the
                  NEC4 contract.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-xs text-blue-800">
                  <p className="font-medium">NEC4 Clause 14.3</p>
                  <p>
                    "The Project Manager may give an instruction to the Contractor which changes the Scope or a Key Date."
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setActiveTemplate("pmi");
                    setActiveTab("editor");
                  }}
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  View Template
                </Button>
              </CardFooter>
            </Card>

            {/* Early Warning Template Card */}
            <Card className="border-2 border-amber-500">
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
                <p className="text-sm mb-4">
                  Use this template to notify potential issues that could increase costs, delay
                  completion, or impair the performance of the works, as required by Clause 15.1.
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 text-xs text-amber-800">
                  <p className="font-medium">NEC4 Clause 15.1</p>
                  <p>
                    "The Contractor and the Project Manager give an early warning by notifying
                    the other as soon as either becomes aware of any matter which could affect time, cost, or quality."
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  onClick={() => {
                    setActiveTemplate("early-warning");
                    setActiveTab("editor");
                  }}
                >
                  <FilePlus2 className="w-4 h-4 mr-2" />
                  Create Early Warning
                </Button>
              </CardFooter>
            </Card>

            {/* Compensation Event Template Card */}
            <Card>
              <CardHeader>
                <CardTitle>Compensation Event Notice</CardTitle>
                <CardDescription>
                  Template for notifying Compensation Events under NEC4 Clause 61.3
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Use this template to formally notify the Project Manager of events that
                  may alter the Prices, Completion Date or Key Dates, in accordance with Clause 61.3.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-xs text-blue-800">
                  <p className="font-medium">NEC4 Clause 61.3</p>
                  <p>
                    "The Contractor notifies the Project Manager of an event which has happened or
                    which is expected to happen as a compensation event if the event is not notified by
                    the Project Manager."
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setActiveTemplate("compensation-event");
                    setActiveTab("editor");
                  }}
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  View Template
                </Button>
              </CardFooter>
            </Card>

            {/* Compensation Event Quotation Template Card */}
            <Card className="border-2 border-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Compensation Event Quotation</CardTitle>
                  <Calculator className="text-blue-500 w-5 h-5" />
                </div>
                <CardDescription>
                  Template for submitting CE quotations under NEC4 Clause 62.2
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Use this template to submit detailed quotations for compensation events, including 
                  Defined Cost breakdowns, time impacts, and programme assessments with AI integration.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 text-xs text-blue-800">
                  <p className="font-medium">NEC4 Clause 62.2</p>
                  <p>
                    "The Contractor submits a quotation for a compensation event to the Project Manager. 
                    The quotation comprises proposed changes to the Prices and any delay to the Completion Date."
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  onClick={() => {
                    setActiveTemplate("compensation-event-quotation");
                    setActiveTab("editor");
                  }}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Create Quotation
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start space-x-3">
            <Info className="text-blue-500 w-6 h-6 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">NEC4 Document Templates</h3>
              <p className="text-sm text-blue-700 mt-1">
                These templates are designed to comply with NEC4 contract requirements. Templates help ensure
                consistent documentation across your project, reduce risk of non-compliance,
                and facilitate proper record-keeping for contract administration.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="editor">
          {activeTemplate === "early-warning" && <EarlyWarningTemplate />}
          
          {activeTemplate === "compensation-event-quotation" && <CompensationEventQuotationTemplate />}
          
          {activeTemplate === "pmi" && (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <h2 className="text-xl font-bold mb-4">Project Manager's Instruction Template</h2>
              <p className="text-gray-500 mb-6">This template is coming soon</p>
              <Button
                variant="outline"
                onClick={() => {
                  setActiveTemplate(null);
                  setActiveTab("gallery");
                }}
              >
                Return to Gallery
              </Button>
            </div>
          )}
          
          {activeTemplate === "compensation-event" && (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <h2 className="text-xl font-bold mb-4">Compensation Event Notice Template</h2>
              <p className="text-gray-500 mb-6">This template is coming soon</p>
              <Button
                variant="outline"
                onClick={() => {
                  setActiveTemplate(null);
                  setActiveTab("gallery");
                }}
              >
                Return to Gallery
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}