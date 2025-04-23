import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera,
  QrCode,
  AlertTriangle,
  Check,
  Truck,
  Package,
  Send,
  ArrowRight,
  Loader2
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function MobileScanInterface() {
  const [qrCode, setQrCode] = useState("");
  const [scanMethod, setScanMethod] = useState<"manual" | "camera">("manual");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [processingState, setProcessingState] = useState<"idle" | "scanning" | "processing" | "success" | "error">("idle");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [scannedItem, setScannedItem] = useState<any>(null);
  const { toast } = useToast();

  // Query to get data for the scanned item
  const { isLoading: isLoadingItem } = useQuery({
    queryKey: ["/api/equipment/mobile-scan", qrCode],
    queryFn: async () => {
      if (!qrCode || qrCode.length < 5) return null;
      setProcessingState("processing");
      try {
        const res = await apiRequest("GET", `/api/equipment/mobile-scan?code=${qrCode}`);
        const data = await res.json();
        setScannedItem(data);
        setProcessingState("success");
        return data;
      } catch (error) {
        setProcessingState("error");
        return null;
      }
    },
    enabled: processingState === "processing" && qrCode.length >= 5,
  });

  // Mutation to record the scan (off-hire request)
  const { mutate: recordScan, isPending: isRecording } = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/equipment/off-hire-requests", {
        ...data,
        qrCode
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Off-hire request has been recorded successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/off-hire-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/dashboard"] });
      setShowConfirmation(false);
      setQrCode("");
      setAdditionalNotes("");
      setScannedItem(null);
      setProcessingState("idle");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record scan. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle manual QR code input
  const handleManualInput = () => {
    if (qrCode.length >= 5) {
      setProcessingState("processing");
      // The query will automatically run because of the dependency on processingState
    } else {
      toast({
        title: "Invalid QR Code",
        description: "Please enter a valid QR code (at least 5 characters)",
        variant: "destructive",
      });
    }
  };

  // Simulate camera scan
  const simulateCameraScan = () => {
    setScanMethod("camera");
    setProcessingState("scanning");
    
    // Simulate the scanning process
    setTimeout(() => {
      // Generate a fake QR code that matches the format expected
      const fakeQrCode = `EQ${Math.floor(Math.random() * 10000)}`;
      setQrCode(fakeQrCode);
      setProcessingState("processing");
    }, 1500);
  };

  // Handle confirmation and submit the off-hire request
  const handleConfirmOffHire = () => {
    if (!scannedItem) return;
    
    const offHireData = {
      hireId: scannedItem.hireId,
      requestedEndDate: new Date().toISOString().split('T')[0], // Today
      notes: additionalNotes,
      pickupAddress: scannedItem.deliveryAddress || "Main warehouse",
      pickupContact: scannedItem.deliveryContact || "Site Manager"
    };
    
    recordScan(offHireData);
  };

  // Reset the scan
  const resetScan = () => {
    setQrCode("");
    setAdditionalNotes("");
    setScannedItem(null);
    setProcessingState("idle");
    setScanMethod("manual");
  };

  // Render scanning interface based on the current method
  const renderScanInterface = () => {
    if (processingState === "scanning" && scanMethod === "camera") {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-full max-w-md aspect-square bg-gray-900 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse text-white text-sm font-medium">
                Accessing camera...
              </div>
            </div>
            <div className="absolute inset-16 border-2 border-dashed border-white rounded-lg flex items-center justify-center">
              <QrCode className="h-12 w-12 text-white opacity-50" />
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={resetScan} 
            className="mt-4"
          >
            Cancel
          </Button>
        </div>
      );
    }

    if (processingState === "idle") {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setScanMethod("manual")}
              variant={scanMethod === "manual" ? "default" : "outline"}
              className="flex-1 h-auto py-6 flex flex-col items-center gap-2"
            >
              <QrCode className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Manual Entry</span>
              <span className="text-xs text-muted-foreground">
                Enter QR code manually
              </span>
            </Button>
            <Button
              onClick={simulateCameraScan}
              variant={scanMethod === "camera" ? "default" : "outline"}
              className="flex-1 h-auto py-6 flex flex-col items-center gap-2"
            >
              <Camera className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Camera Scan</span>
              <span className="text-xs text-muted-foreground">
                Use device camera to scan QR
              </span>
            </Button>
          </div>

          {scanMethod === "manual" && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Enter Equipment QR Code</div>
                <div className="flex items-center gap-2">
                  <Input
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="e.g. EQ1234"
                    className="flex-1"
                  />
                  <Button onClick={handleManualInput}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Render result based on the current state
  const renderResult = () => {
    if (processingState === "processing" || isLoadingItem) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">
            Processing QR code: {qrCode}
          </p>
        </div>
      );
    }

    if (processingState === "error") {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">QR Code Not Recognized</h3>
          <p className="text-sm text-muted-foreground mb-6">
            The QR code "{qrCode}" was not found in our system or is not associated with any equipment.
          </p>
          <Button onClick={resetScan}>Try Again</Button>
        </div>
      );
    }

    if (processingState === "success" && scannedItem) {
      return (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-green-600 bg-green-50 p-2 rounded">
            <Check className="h-5 w-5" />
            <span className="text-sm font-medium">Equipment found</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 flex items-center mb-2">
                <Package className="h-4 w-4 mr-2" />
                Equipment Details
              </h3>
              <p className="text-base font-semibold mb-1">{scannedItem.name}</p>
              <p className="text-sm mb-1">{scannedItem.make} {scannedItem.model}</p>
              <p className="text-xs text-muted-foreground">Serial: {scannedItem.serialNumber}</p>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-amber-800 flex items-center mb-2">
                <Truck className="h-4 w-4 mr-2" />
                Hire Details
              </h3>
              <p className="text-base font-semibold mb-1">Ref: {scannedItem.hireReference}</p>
              <p className="text-sm mb-1">Since: {new Date(scannedItem.startDate).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">
                Expected until: {new Date(scannedItem.expectedEndDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <label htmlFor="notes" className="text-sm font-medium mb-1 block">
              Additional Notes
            </label>
            <Textarea
              id="notes"
              placeholder="Add any additional information about the off-hire request..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          <Button 
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowConfirmation(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Request Off-Hire
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Equipment Scanning Station</CardTitle>
        </CardHeader>
        <CardContent>
          {renderScanInterface()}
          {renderResult()}
        </CardContent>
      </Card>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Off-Hire Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to request off-hire for this equipment?
            </DialogDescription>
          </DialogHeader>
          
          {scannedItem && (
            <div className="py-2">
              <p className="font-medium">{scannedItem.name}</p>
              <p className="text-sm text-muted-foreground">
                {scannedItem.make} {scannedItem.model} ({scannedItem.serialNumber})
              </p>
              <p className="text-sm mt-2">
                <span className="font-medium">Hire Reference:</span> {scannedItem.hireReference}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              disabled={isRecording}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmOffHire}
              disabled={isRecording}
            >
              {isRecording ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : "Confirm Off-Hire"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}