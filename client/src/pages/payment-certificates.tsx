import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import PaymentCertificateList from "@/components/payment/payment-certificate-list";
import PaymentCertificateForm from "@/components/payment/payment-certificate-form";
import { PlusCircle, Calendar, TrendingUp } from "lucide-react";
import { PaymentCertificate } from "@shared/schema";

export default function PaymentCertificates() {
  const [activeTab, setActiveTab] = useState("certificates");
  const [showNewForm, setShowNewForm] = useState(false);
  
  // For MVP, we'll assume project ID 1
  const projectId = 1;
  
  const { data: paymentCertificates = [], isLoading } = useQuery<Array<PaymentCertificate>>({
    queryKey: [`/api/projects/${projectId}/payment-certificates`],
  });

  // Calculate statistics
  const totalCertified = paymentCertificates
    .filter((cert) => cert.status === "Certified" || cert.status === "Paid")
    .reduce((total: number, cert) => total + cert.amount, 0);
  
  const totalPending = paymentCertificates
    .filter((cert) => cert.status === "Draft" || cert.status === "Submitted")
    .reduce((total: number, cert) => total + cert.amount, 0);
  
  const nextPayment = paymentCertificates
    .filter((cert) => cert.status === "Draft" || cert.status === "Submitted")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  
  const handleNewPaymentCertificate = () => {
    setShowNewForm(true);
    setActiveTab("new");
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Payment Certificates</h1>
        <Button
          onClick={handleNewPaymentCertificate}
          className="bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5"
          size="sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Payment Application</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Certified</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalCertified)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Pending Certification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Next Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">
              {nextPayment ? formatCurrency(nextPayment.amount) : "£0"}
            </p>
            {nextPayment && (
              <p className="text-xs flex items-center text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                Due on {new Date(nextPayment.dueDate).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs 
        defaultValue="certificates" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full mb-6"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="new">New Application</TabsTrigger>
          <TabsTrigger value="forecast">Payment Forecast</TabsTrigger>
        </TabsList>
        
        <TabsContent value="certificates" className="space-y-4">
          <PaymentCertificateList 
            projectId={projectId} 
            isLoading={isLoading}
            certificates={paymentCertificates}
          />
        </TabsContent>
        
        <TabsContent value="new" className="space-y-4">
          <PaymentCertificateForm 
            projectId={projectId} 
            onSuccess={() => {
              setShowNewForm(false);
              setActiveTab("certificates");
            }} 
          />
        </TabsContent>
        
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Forecast</CardTitle>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-60" />
                <p>Payment forecast visualization will be available in the next release</p>
                <p className="text-sm mt-2">
                  This feature will display projected cash flow for the project
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
