import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStatusColor, formatDate } from "@/lib/utils";

export default function NCRTqr() {
  const [activeTab, setActiveTab] = useState("ncr");
  
  // For MVP, we'll assume project ID 1
  const projectId = 1;
  
  const { data: nonConformanceReports = [], isLoading: ncrLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/non-conformance-reports`],
  });
  
  const { data: technicalQueries = [], isLoading: tqLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/technical-queries`],
  });
  
  // Calculate statistics
  const openNCRs = nonConformanceReports.filter((ncr: any) => ncr.status === "Open").length;
  const closedNCRs = nonConformanceReports.filter((ncr: any) => ncr.status === "Closed").length;
  
  const openTQs = 2; // This would come from the technicalQueries data in a real implementation
  const answeredTQs = 4; // This would come from the technicalQueries data in a real implementation
  
  const handleNewNCR = () => {
    alert("This would open the NCR form");
  };
  
  const handleNewTQ = () => {
    alert("This would open the Technical Query form");
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Non-Conformance & Technical Queries</h1>
        <Button
          onClick={activeTab === "ncr" ? handleNewNCR : handleNewTQ}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
          New {activeTab === "ncr" ? "NCR" : "Technical Query"}
        </Button>
      </div>
      
      <Tabs 
        defaultValue="ncr" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full mb-6"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="ncr">Non-Conformance Reports</TabsTrigger>
          <TabsTrigger value="tq">Technical Queries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ncr" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Open NCRs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{openNCRs}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Closed NCRs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-700">{closedNCRs}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex">
              <Input
                placeholder="Search by reference, description or location..."
                className="flex-1"
                prefix={<span className="material-icons text-gray-400">search</span>}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">REF</th>
                    <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">DESCRIPTION</th>
                    <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">LOCATION</th>
                    <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">STATUS</th>
                    <th className="py-3 text-left text-xs font-medium text-gray-500 px-2">RAISED</th>
                  </tr>
                </thead>
                <tbody>
                  {ncrLoading ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center">
                        <span className="material-icons animate-spin text-primary">refresh</span>
                        <span className="ml-2">Loading...</span>
                      </td>
                    </tr>
                  ) : nonConformanceReports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-500">
                        No non-conformance reports found
                      </td>
                    </tr>
                  ) : (
                    nonConformanceReports.map((ncr: any) => {
                      const { bgColor, textColor } = getStatusColor(ncr.status);
                      
                      return (
                        <tr 
                          key={ncr.id} 
                          className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="py-3 text-sm font-medium px-2">{ncr.reference}</td>
                          <td className="py-3 text-sm px-2">{ncr.description}</td>
                          <td className="py-3 text-sm px-2">{ncr.location}</td>
                          <td className="py-3 text-sm px-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${bgColor} ${textColor}`}>
                              {ncr.status}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-500 px-2">
                            {formatDate(ncr.raisedAt, "dd MMM yyyy")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="tq" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Open Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">{openTQs}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Answered Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-700">{answeredTQs}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex">
              <Input
                placeholder="Search by reference or question..."
                className="flex-1"
                prefix={<span className="material-icons text-gray-400">search</span>}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8 text-gray-500">
              <p>Technical query data will be implemented in the next release</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
