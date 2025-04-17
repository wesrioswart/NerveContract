import React, { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Printer, Save, Receipt, PlusCircle, MinusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProject } from "@/contexts/project-context";
import { AnimationWrapper } from "@/components/ui/animation-wrapper";
import { AnimatedButton } from "@/components/ui/animated-button";

// Define the form schema
const paymentItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  workSection: z.string().optional(),
});

const formSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  applicationNumber: z.string().min(1, "Application number is required"),
  applicationDate: z.string().min(1, "Date is required"),
  contractorName: z.string().min(1, "Contractor name is required"),
  contractReference: z.string().min(1, "Contract reference is required"),
  paymentPeriod: z.string().min(1, "Payment period is required"),
  paymentDueDate: z.string().min(1, "Payment due date is required"),
  previouslyPaid: z.string().optional(),
  retentionPercentage: z.string().optional(),
  applicantName: z.string().min(1, "Applicant name is required"),
  applicantRole: z.string().min(1, "Applicant role is required"),
  paymentItems: z.array(paymentItemSchema).min(1, "At least one payment item is required"),
  subTotal: z.string().min(1, "Subtotal is required"),
  vat: z.string().optional(),
  deductions: z.string().optional(),
  retentionAmount: z.string().optional(),
  totalDue: z.string().min(1, "Total due is required"),
  supportingDocuments: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentItem = z.infer<typeof paymentItemSchema>;
type FormValues = z.infer<typeof formSchema>;

export default function PaymentApplicationTemplate() {
  const { toast } = useToast();
  const { currentProject } = useProject();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: currentProject?.name || '',
      applicationDate: new Date().toISOString().substring(0, 10),
      contractorName: '',
      applicationNumber: '',
      contractReference: '',
      paymentPeriod: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
      paymentDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // 14 days from now
      previouslyPaid: '0.00',
      retentionPercentage: '5',
      paymentItems: [{ description: '', amount: '0.00', workSection: '' }],
      subTotal: '0.00',
      vat: '0.00',
      deductions: '0.00',
      retentionAmount: '0.00',
      totalDue: '0.00',
    }
  });

  const paymentItems = watch('paymentItems');
  const subTotal = watch('subTotal');
  const vat = watch('vat') || '0.00';
  const deductions = watch('deductions') || '0.00';
  const retentionPercentage = watch('retentionPercentage') || '0';
  
  // Calculate subtotal whenever payment items change
  React.useEffect(() => {
    const newSubTotal = paymentItems.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);
    
    setValue('subTotal', newSubTotal.toFixed(2));
    
    // Calculate retention amount
    const retentionAmount = (newSubTotal * parseFloat(retentionPercentage || '0')) / 100;
    setValue('retentionAmount', retentionAmount.toFixed(2));
    
    // Calculate total due
    const totalDue = newSubTotal + parseFloat(vat || '0') - parseFloat(deductions || '0') - retentionAmount;
    setValue('totalDue', totalDue.toFixed(2));
  }, [paymentItems, setValue, retentionPercentage, vat, deductions]);

  // Recalculate total when vat or deductions change
  React.useEffect(() => {
    const subtotalValue = parseFloat(subTotal || '0');
    const vatValue = parseFloat(vat || '0');
    const deductionsValue = parseFloat(deductions || '0');
    const retentionAmount = (subtotalValue * parseFloat(retentionPercentage || '0')) / 100;
    
    const totalDue = subtotalValue + vatValue - deductionsValue - retentionAmount;
    setValue('totalDue', totalDue.toFixed(2));
    setValue('retentionAmount', retentionAmount.toFixed(2));
  }, [subTotal, vat, deductions, retentionPercentage, setValue]);

  const addPaymentItem = () => {
    setValue('paymentItems', [...paymentItems, { description: '', amount: '0.00', workSection: '' }]);
  };

  const removePaymentItem = (index: number) => {
    if (paymentItems.length > 1) {
      setValue('paymentItems', paymentItems.filter((_, i) => i !== index));
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Payment Application Submitted",
        description: `Application ${data.applicationNumber} has been successfully submitted.`
      });
      
      setIsSubmitting(false);
      setShowPreview(true);
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Error Submitting Application",
        description: "There was a problem submitting your payment application. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your payment application draft has been saved successfully.",
      variant: "default"
    });
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    toast({
      title: "PDF Generated",
      description: "Your payment application has been generated as a PDF.",
      variant: "default"
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <AnimationWrapper type="fadeIn">
        <div className="border-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <AnimationWrapper as="h2" type="slideIn" className="text-xl font-bold mb-2">
              Payment Application
            </AnimationWrapper>
            <AnimationWrapper as="p" type="fadeIn" delay={0.2} className="text-sm text-gray-500">
              Template for submitting payment applications under NEC4 Option Y(UK)2
            </AnimationWrapper>
          </div>
          
          {!showPreview ? (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <Receipt className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="font-medium">NEC4 Contract Payment Provisions</h3>
                </div>
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded text-sm text-green-800 mb-4">
                  <p>
                    "The Contractor submits applications for payment to the Project Manager on or before each assessment date. Each application shows the amount the Contractor considers is due and how it has been calculated."
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("projectName")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {errors.projectName && (
                    <p className="text-red-500 text-xs mt-1">{errors.projectName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Application Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("applicationNumber")}
                    placeholder="PA-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {errors.applicationNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.applicationNumber.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Application Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("applicationDate")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {errors.applicationDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.applicationDate.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contract Reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("contractReference")}
                    placeholder="Contract/Agreement reference number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {errors.contractReference && (
                    <p className="text-red-500 text-xs mt-1">{errors.contractReference.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contractor <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("contractorName")}
                    placeholder="Contractor company name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {errors.contractorName && (
                    <p className="text-red-500 text-xs mt-1">{errors.contractorName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Payment Period <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("paymentPeriod")}
                    placeholder="e.g. April 2023"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {errors.paymentPeriod && (
                    <p className="text-red-500 text-xs mt-1">{errors.paymentPeriod.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Payment Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("paymentDueDate")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {errors.paymentDueDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.paymentDueDate.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Previously Paid Amount (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("previouslyPaid")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Applicant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("applicantName")}
                    placeholder="Name of person submitting the application"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {errors.applicantName && (
                    <p className="text-red-500 text-xs mt-1">{errors.applicantName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Applicant Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("applicantRole")}
                    placeholder="e.g. Quantity Surveyor, Project Manager"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {errors.applicantRole && (
                    <p className="text-red-500 text-xs mt-1">{errors.applicantRole.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Retention Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    {...register("retentionPercentage")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">
                    Payment Items <span className="text-red-500">*</span>
                  </label>
                  <AnimatedButton
                    type="button"
                    onClick={addPaymentItem}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    animation="subtle"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Item
                  </AnimatedButton>
                </div>
                
                {paymentItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 mb-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-6">
                        <label className="block text-xs font-medium mb-1">Description</label>
                        <input
                          {...register(`paymentItems.${index}.description` as const)}
                          placeholder="Item description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        {errors.paymentItems?.[index]?.description && (
                          <p className="text-red-500 text-xs mt-1">Description required</p>
                        )}
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium mb-1">Work Section</label>
                        <input
                          {...register(`paymentItems.${index}.workSection` as const)}
                          placeholder="Optional"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium mb-1">Amount (£)</label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`paymentItems.${index}.amount` as const)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        {errors.paymentItems?.[index]?.amount && (
                          <p className="text-red-500 text-xs mt-1">Amount required</p>
                        )}
                      </div>
                    </div>
                    {paymentItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePaymentItem(index)}
                        className="mt-6 text-red-500 hover:text-red-700"
                      >
                        <MinusCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                {errors.paymentItems && !Array.isArray(errors.paymentItems) && (
                  <p className="text-red-500 text-xs mt-1">{errors.paymentItems.message}</p>
                )}
              </div>
              
              <div className="mb-6 border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Supporting Documents
                    </label>
                    <input
                      {...register("supportingDocuments")}
                      placeholder="List any supporting documents or references"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Notes
                    </label>
                    <textarea
                      rows={2}
                      {...register("notes")}
                      placeholder="Any additional notes or comments"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-8 border rounded-md p-4 bg-gray-50">
                <h3 className="text-md font-bold mb-3">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Subtotal:</span>
                    <span>£{parseFloat(subTotal || '0').toFixed(2)}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">VAT Amount (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("vat")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Deductions (£)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("deductions")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Retention ({retentionPercentage}%):</span>
                    <span>£{watch('retentionAmount')}</span>
                  </div>
                  
                  <div className="flex justify-between border-t border-gray-300 pt-2 font-bold">
                    <span>Total Due This Period:</span>
                    <span>£{watch('totalDue')}</span>
                  </div>
                </div>
              </div>
              
              <AnimationWrapper type="fadeIn" delay={0.3} className="mt-8">
                <div className="w-full flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <AnimatedButton 
                      type="button" 
                      onClick={handleSaveDraft}
                      variant="outline" 
                      className="gap-1 bg-white" 
                      animation="subtle"
                      disabled={isSubmitting}
                    >
                      <Save className="w-4 h-4" />
                      Save Draft
                    </AnimatedButton>
                    
                    <AnimatedButton 
                      type="button" 
                      onClick={handlePrint}
                      variant="outline" 
                      className="gap-1 bg-white" 
                      animation="subtle"
                      disabled={isSubmitting}
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </AnimatedButton>
                    
                    <AnimatedButton 
                      type="button" 
                      onClick={handleDownload}
                      className="gap-1 bg-teal-600 hover:bg-teal-700 text-white" 
                      animation="subtle"
                      disabled={isSubmitting}
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </AnimatedButton>
                  </div>
                  
                  <AnimatedButton 
                    type="submit" 
                    className="gap-1 bg-green-600 hover:bg-green-700 text-white" 
                    animation="bounce"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Receipt className="w-4 h-4" />
                        Submit Application
                      </>
                    )}
                  </AnimatedButton>
                </div>
              </AnimationWrapper>
            </form>
          ) : (
            <div>
              <AnimationWrapper type="fadeIn" delay={0.2} className="p-6 border-b border-gray-200 print:hidden">
                <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                  <AnimatedButton
                    onClick={() => setShowPreview(false)}
                    variant="outline"
                    animation="subtle"
                    className="bg-white w-full sm:w-auto"
                  >
                    Back to Edit
                  </AnimatedButton>
                  
                  <div className="flex flex-wrap gap-2">
                    <AnimatedButton 
                      variant="outline" 
                      onClick={handlePrint} 
                      className="gap-1 bg-white" 
                      animation="subtle"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </AnimatedButton>
                    
                    <AnimatedButton 
                      onClick={handleDownload} 
                      className="gap-1 bg-teal-600 hover:bg-teal-700 text-white" 
                      animation="subtle"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </AnimatedButton>
                  </div>
                </div>
              </AnimationWrapper>
              
              <div className="p-8 max-w-4xl mx-auto">
                <AnimationWrapper type="fadeIn" delay={0.3} className="text-center mb-8">
                  <AnimationWrapper as="h1" type="scale" delay={0.4} className="text-2xl font-bold">
                    PAYMENT APPLICATION
                  </AnimationWrapper>
                  <AnimationWrapper as="p" type="fadeIn" delay={0.5} className="text-sm text-gray-500 mt-1">
                    In accordance with NEC4 Contract Payment Provisions
                  </AnimationWrapper>
                </AnimationWrapper>
                
                <div className="border border-gray-200 rounded-md p-6 mb-6">
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Project</p>
                      <p className="font-medium">{watch("projectName")}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Application Number</p>
                      <p className="font-medium">{watch("applicationNumber")}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Application Date</p>
                      <p>{watch("applicationDate")}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contract Reference</p>
                      <p>{watch("contractReference")}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contractor</p>
                      <p>{watch("contractorName")}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Period</p>
                      <p>{watch("paymentPeriod")}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Due Date</p>
                      <p>{watch("paymentDueDate")}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Previously Paid</p>
                      <p>£{parseFloat(watch("previouslyPaid") || '0').toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                <AnimationWrapper type="fadeIn" delay={0.6} className="mb-6">
                  <h2 className="text-lg font-bold mb-4">Payment Items</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-t border-b">
                        <tr>
                          <th className="px-4 py-2 text-left">Description</th>
                          <th className="px-4 py-2 text-left">Work Section</th>
                          <th className="px-4 py-2 text-right">Amount (£)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {watch('paymentItems').map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-3">{item.description}</td>
                            <td className="px-4 py-3">{item.workSection || '-'}</td>
                            <td className="px-4 py-3 text-right">{parseFloat(item.amount || '0').toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AnimationWrapper>
                
                <AnimationWrapper type="fadeIn" delay={0.7} className="mb-6">
                  <div className="bg-gray-50 p-6 rounded-md border">
                    <h3 className="text-md font-bold mb-4">Payment Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b pb-2">
                        <span>Subtotal:</span>
                        <span>£{parseFloat(watch('subTotal') || '0').toFixed(2)}</span>
                      </div>
                      
                      {parseFloat(watch('vat') || '0') > 0 && (
                        <div className="flex justify-between border-b pb-2">
                          <span>VAT:</span>
                          <span>£{parseFloat(watch('vat') || '0').toFixed(2)}</span>
                        </div>
                      )}
                      
                      {parseFloat(watch('deductions') || '0') > 0 && (
                        <div className="flex justify-between border-b pb-2">
                          <span>Deductions:</span>
                          <span>£{parseFloat(watch('deductions') || '0').toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between border-b pb-2">
                        <span>Retention ({watch('retentionPercentage')}%):</span>
                        <span>£{parseFloat(watch('retentionAmount') || '0').toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between pt-2 font-bold">
                        <span>Total Due This Period:</span>
                        <span>£{parseFloat(watch('totalDue') || '0').toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </AnimationWrapper>
                
                {(watch('supportingDocuments') || watch('notes')) && (
                  <AnimationWrapper type="fadeIn" delay={0.8} className="mb-6">
                    <div className="border rounded-md p-4">
                      {watch('supportingDocuments') && (
                        <div className="mb-3">
                          <h4 className="text-sm font-bold">Supporting Documents</h4>
                          <p className="text-sm">{watch('supportingDocuments')}</p>
                        </div>
                      )}
                      
                      {watch('notes') && (
                        <div>
                          <h4 className="text-sm font-bold">Notes</h4>
                          <p className="text-sm whitespace-pre-wrap">{watch('notes')}</p>
                        </div>
                      )}
                    </div>
                  </AnimationWrapper>
                )}
                
                <div className="border-t border-gray-200 pt-6 mt-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium">Submitted by:</p>
                      <div className="mt-4">
                        <p>{watch("applicantName")}</p>
                        <p className="text-sm text-gray-500">{watch("applicantRole")}</p>
                      </div>
                      <p className="mt-6 pt-6 border-t border-gray-300 text-center">Signature</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Received by Project Manager:</p>
                      <div className="mt-4">
                        <p className="text-gray-400">Name of recipient</p>
                      </div>
                      <p className="mt-6 pt-6 border-t border-gray-300 text-center">Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AnimationWrapper>
    </div>
  );
}