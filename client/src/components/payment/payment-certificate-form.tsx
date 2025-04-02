import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type PaymentCertificateFormProps = {
  projectId: number;
  onSuccess: () => void;
};

export default function PaymentCertificateForm({ projectId, onSuccess }: PaymentCertificateFormProps) {
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [period, setPeriod] = useState("monthly");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createPaymentCertificateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/payment-certificates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/payment-certificates`] });
      toast({
        title: "Payment Application Created",
        description: "Your payment application has been submitted successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create payment application: " + error,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !dueDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    const amountValue = parseFloat(amount.replace(/[^0-9.]/g, ""));
    
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await createPaymentCertificateMutation.mutateAsync({
        projectId,
        reference: `PC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        amount: amountValue,
        dueDate: new Date(dueDate),
        status: "Draft",
        description,
      });
    } catch (error) {
      console.error("Error creating payment certificate:", error);
    }
  };
  
  // Format amount as currency as user types
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    
    if (value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setAmount(new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "GBP",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(numValue));
      } else {
        setAmount("");
      }
    } else {
      setAmount("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Payment Application</CardTitle>
        <CardDescription>
          Create a new payment application for the project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (£)</Label>
              <Input
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder="£0"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="period">Assessment Period</Label>
            <Select
              value={period}
              onValueChange={setPeriod}
            >
              <SelectTrigger id="period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly Assessment</SelectItem>
                <SelectItem value="interim">Interim Assessment</SelectItem>
                <SelectItem value="final">Final Assessment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this payment application..."
              rows={4}
            />
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
            <div className="flex items-start">
              <span className="material-icons text-amber-500 mr-2">info</span>
              <p>
                This payment application will be created in Draft status. You can review and edit before submitting.
                Once submitted, it cannot be modified.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createPaymentCertificateMutation.isPending}
              className="bg-cyan-700 hover:bg-cyan-800 text-white"
            >
              {createPaymentCertificateMutation.isPending ? (
                <>
                  <span className="material-icons animate-spin mr-2">refresh</span>
                  Creating...
                </>
              ) : (
                "Create Payment Application"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
