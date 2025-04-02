import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PMITemplate = () => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // This would be implemented with a PDF generation library
    alert("PDF download functionality would be implemented here");
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="border-2">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">PROJECT MANAGER'S INSTRUCTION (PMI)</CardTitle>
              <CardDescription>In accordance with NEC4 Engineering and Construction Contract</CardDescription>
            </div>
            <div className="text-right">
              <p className="font-semibold">PMI No: <span className="font-normal">PMI-00001</span></p>
              <p className="font-semibold">Date: <span className="font-normal">{new Date().toLocaleDateString()}</span></p>
              <p className="font-semibold">Contract Ref: <span className="font-normal">NEC4-2023-001</span></p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="project-name" className="font-semibold">Project Name</Label>
              <Input id="project-name" placeholder="Enter project name" />
            </div>
            <div>
              <Label htmlFor="contract-name" className="font-semibold">Contract Name</Label>
              <Input id="contract-name" placeholder="Enter contract name" />
            </div>
          </div>

          <div>
            <Label htmlFor="contractor-name" className="font-semibold">Contractor</Label>
            <Input id="contractor-name" placeholder="Enter contractor name" />
          </div>

          <div>
            <Label htmlFor="instruction-clause" className="font-semibold">Reference Clause(s)</Label>
            <Select defaultValue="14.3">
              <SelectTrigger id="instruction-clause">
                <SelectValue placeholder="Select clause" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14.3">Clause 14.3 - Changes to Scope</SelectItem>
                <SelectItem value="27.3">Clause 27.3 - Instruction to Contractor</SelectItem>
                <SelectItem value="31.3">Clause 31.3 - Programme Revision</SelectItem>
                <SelectItem value="13.3">Clause 13.3 - Communications</SelectItem>
                <SelectItem value="other">Other (specify below)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="other-clause" className="font-semibold">Other Clause Reference (if applicable)</Label>
            <Input id="other-clause" placeholder="Enter clause reference" />
          </div>

          <div>
            <Label htmlFor="instruction-title" className="font-semibold">Instruction Title</Label>
            <Input id="instruction-title" placeholder="Enter a descriptive title for this instruction" />
          </div>

          <div>
            <Label htmlFor="instruction-description" className="font-semibold">Instruction Details</Label>
            <Textarea 
              id="instruction-description" 
              placeholder="Provide a clear, detailed description of the instruction" 
              className="min-h-[150px]"
            />
          </div>

          <div>
            <Label className="font-semibold">This Instruction Results In:</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="change-to-scope" />
                <Label htmlFor="change-to-scope">Change to the Scope (Cl. 14.3)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="change-to-key-date" />
                <Label htmlFor="change-to-key-date">Change to Key Date (Cl. 14.3)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="compensation-event" />
                <Label htmlFor="compensation-event">Compensation Event (Cl. 60.1(1))</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="no-change" />
                <Label htmlFor="no-change">No change to Prices or Time</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="quotation-required" className="font-semibold">Quotation Required:</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <input type="radio" name="quotation" id="quotation-yes" value="yes" />
                <Label htmlFor="quotation-yes">Yes - Submit within 3 weeks (Cl. 62.3)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" name="quotation" id="quotation-no" value="no" />
                <Label htmlFor="quotation-no">No</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="response-required" className="font-semibold">Contractor Response Required By:</Label>
            <Input type="date" id="response-required" />
          </div>

          <div className="border-t pt-4">
            <p className="font-semibold mb-2">Project Manager</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pm-name">Name</Label>
                <Input id="pm-name" placeholder="Project Manager name" />
              </div>
              <div>
                <Label htmlFor="pm-signature">Signature</Label>
                <Input id="pm-signature" placeholder="Electronic signature or typed name" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-md text-sm">
            <p className="font-semibold mb-2">Confirmation of Receipt (To be completed by the Contractor)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receipt-name">Name</Label>
                <Input id="receipt-name" placeholder="Contractor representative name" disabled />
              </div>
              <div>
                <Label htmlFor="receipt-date">Date</Label>
                <Input id="receipt-date" type="date" disabled />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-100 rounded-md text-sm">
            <p className="font-semibold">Notes:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>This instruction is issued under the NEC4 Engineering and Construction Contract.</li>
              <li>Instructions are only valid when issued by the Project Manager (or delegated authority) in accordance with Clauses 13.1 and 14.3.</li>
              <li>The Contractor is required to acknowledge receipt of this instruction.</li>
              <li>If this instruction causes a compensation event, please follow the procedures outlined in Clause 61.3 onwards.</li>
              <li>If the Contractor believes this instruction constitutes a compensation event but is not marked as such, notify the Project Manager within 8 weeks (Clause 61.3).</li>
            </ol>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2 border-t pt-4">
          <Button variant="outline" onClick={handlePrint}>Print</Button>
          <Button onClick={handleDownload}>Download PDF</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PMITemplate;