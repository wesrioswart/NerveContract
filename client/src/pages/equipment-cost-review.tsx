import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useProject } from "@/contexts/project-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText,
  XCircle,
  Eye,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

interface EquipmentCostReview {
  id: number;
  equipmentName: string;
  supplierName: string;
  hireReference: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalDays: number;
  totalCost: number;
  status: 'active' | 'completed' | 'disputed';
  sccCompliant: boolean;
  validationNotes: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  complianceIssues: string[];
}

export default function EquipmentCostReview() {
  const { projectId, currentProject } = useProject();
  const { toast } = useToast();
  const [selectedCost, setSelectedCost] = useState<EquipmentCostReview | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | ''>('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [activeTab, setActiveTab] = useState("pending");

  // Fetch equipment costs requiring review
  const { data: reviewItems, isLoading, refetch } = useQuery<EquipmentCostReview[]>({
    queryKey: [`/api/projects/${projectId}/equipment-cost-reviews`],
    enabled: !!projectId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP' 
    }).format(amount);
  };

  const getStatusBadge = (status: string, sccCompliant: boolean) => {
    if (status === 'disputed') {
      return <Badge variant="destructive">Disputed</Badge>;
    }
    if (!sccCompliant) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Requires Review</Badge>;
    }
    return <Badge variant="secondary">Validated</Badge>;
  };

  const getReviewStatusBadge = (reviewStatus: string) => {
    switch (reviewStatus) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleReviewItem = (item: EquipmentCostReview) => {
    setSelectedCost(item);
    setReviewDecision('');
    setReviewNotes('');
    setIsReviewDialogOpen(true);
  };

  const reviewMutation = useMutation({
    mutationFn: async (reviewData: { 
      id: number; 
      decision: 'approve' | 'reject'; 
      notes: string; 
    }) => {
      const response = await apiRequest('POST', `/api/projects/${projectId}/equipment-cost-reviews/${reviewData.id}/review`, {
        decision: reviewData.decision,
        notes: reviewData.notes
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: `Equipment cost has been ${reviewDecision}d successfully.`,
      });
      setIsReviewDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Review Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = () => {
    if (!selectedCost || !reviewDecision) return;

    reviewMutation.mutate({
      id: selectedCost.id,
      decision: reviewDecision,
      notes: reviewNotes
    });
  };

  const filterItems = (items: EquipmentCostReview[], status: string) => {
    if (!items) return [];
    switch (status) {
      case 'pending':
        return items.filter(item => item.reviewStatus === 'pending');
      case 'approved':
        return items.filter(item => item.reviewStatus === 'approved');
      case 'rejected':
        return items.filter(item => item.reviewStatus === 'rejected');
      default:
        return items;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading equipment cost reviews...</p>
        </div>
      </div>
    );
  }

  const pendingItems = filterItems(reviewItems || [], 'pending');
  const approvedItems = filterItems(reviewItems || [], 'approved');
  const rejectedItems = filterItems(reviewItems || [], 'rejected');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipment Cost Review</h1>
          <p className="text-gray-600 mt-1">
            Review equipment costs for SCC compliance and contract adherence
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Project: {currentProject?.name}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingItems.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedItems.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedItems.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Review ({pendingItems.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedItems.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Items Requiring Review
              </CardTitle>
              <CardDescription>
                Equipment costs that need manual review for SCC compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No items requiring review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{item.equipmentName}</h4>
                          {getStatusBadge(item.status, item.sccCompliant)}
                          {getReviewStatusBadge(item.reviewStatus)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Supplier:</span> {item.supplierName}
                          </div>
                          <div>
                            <span className="font-medium">Reference:</span> {item.hireReference}
                          </div>
                          <div>
                            <span className="font-medium">Daily Rate:</span> {formatCurrency(item.dailyRate)}
                          </div>
                          <div>
                            <span className="font-medium">Total Cost:</span> {formatCurrency(item.totalCost)}
                          </div>
                        </div>
                        {item.complianceIssues && item.complianceIssues.length > 0 && (
                          <div className="mt-2">
                            <span className="font-medium text-red-600">Compliance Issues:</span>
                            <ul className="text-sm text-red-600 mt-1">
                              {item.complianceIssues.map((issue, index) => (
                                <li key={index}>• {issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReviewItem(item)}
                          className="mb-2"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Approved Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No approved items</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 border rounded-lg bg-green-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{item.equipmentName}</h4>
                          {getReviewStatusBadge(item.reviewStatus)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Approved by:</span> {item.reviewedBy}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Review Date:</span> {item.reviewedAt}
                        </div>
                        {item.reviewNotes && (
                          <div className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Notes:</span> {item.reviewNotes}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-green-600">{formatCurrency(item.totalCost)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Rejected Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rejectedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No rejected items</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rejectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 border rounded-lg bg-red-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{item.equipmentName}</h4>
                          {getReviewStatusBadge(item.reviewStatus)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Rejected by:</span> {item.reviewedBy}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Review Date:</span> {item.reviewedAt}
                        </div>
                        {item.reviewNotes && (
                          <div className="text-sm text-red-600 mt-2">
                            <span className="font-medium">Rejection Reason:</span> {item.reviewNotes}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-red-600">{formatCurrency(item.totalCost)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      {selectedCost && (
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Review Equipment Cost</DialogTitle>
              <DialogDescription>
                Review {selectedCost.equipmentName} for SCC compliance
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Equipment</Label>
                  <div className="mt-1 text-sm">{selectedCost.equipmentName}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Supplier</Label>
                  <div className="mt-1 text-sm">{selectedCost.supplierName}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Reference</Label>
                  <div className="mt-1 text-sm font-mono">{selectedCost.hireReference}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Cost</Label>
                  <div className="mt-1 text-lg font-bold">{formatCurrency(selectedCost.totalCost)}</div>
                </div>
              </div>

              {selectedCost.complianceIssues && selectedCost.complianceIssues.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">Compliance Issues</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {selectedCost.complianceIssues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Validation Notes</Label>
                <div className="mt-1 text-sm p-3 bg-gray-50 rounded border">
                  {selectedCost.validationNotes}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Review Decision</Label>
                <Select value={reviewDecision} onValueChange={(value: 'approve' | 'reject') => setReviewDecision(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                        Approve
                      </div>
                    </SelectItem>
                    <SelectItem value="reject">
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                        Reject
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Review Notes</Label>
                <Textarea 
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter review notes..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsReviewDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitReview}
                  disabled={!reviewDecision || reviewMutation.isPending}
                >
                  {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}