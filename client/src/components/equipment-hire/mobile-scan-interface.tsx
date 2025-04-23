import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Camera, QrCode, Check, X, MapPin, AlignLeft, FileImage } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function MobileScanInterface() {
  const [activeTab, setActiveTab] = useState("qr-code");
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [scanLocation, setScanLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Request user location if supported
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast({
            title: "Location Acquired",
            description: "Your current location has been added to the scan.",
          });
        },
        (error) => {
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Could not access your location: " + error.message,
          });
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Location Not Supported",
        description: "Geolocation is not supported by your browser.",
      });
    }
  };

  // Mutation for handling the scan
  const scanMutation = useMutation({
    mutationFn: async (scanData: any) => {
      const res = await apiRequest("POST", "/api/equipment-hire/mobile-scan", scanData);
      return await res.json();
    },
    onSuccess: (data) => {
      setScanResult(data);
      setIsSuccessDialogOpen(true);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-hire/hires"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-hire/off-hire-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-hire/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-hire/dashboard-stats"] });
      
      // Reset form
      setQrCodeValue("");
      setScanLocation("");
      setNotes("");
      setImages([]);
      setUserCoordinates(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: error.message || "Failed to process QR code scan. Please try again.",
      });
    },
  });

  const handleSubmit = () => {
    if (!qrCodeValue.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "QR code value is required.",
      });
      return;
    }

    scanMutation.mutate({
      qrCode: qrCodeValue,
      latitude: userCoordinates?.latitude,
      longitude: userCoordinates?.longitude,
      location: scanLocation,
      notes: notes,
      images: images
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Mobile Off-hire Scan</h2>
        <p className="text-muted-foreground">
          Scan equipment QR codes for off-hire processing
        </p>
      </div>

      <Card className="md:max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Equipment Off-hire Scan</CardTitle>
          <CardDescription>
            Scan a QR code on an off-hire request document or enter it manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr-code">
                <QrCode className="h-4 w-4 mr-2" /> 
                QR Code
              </TabsTrigger>
              <TabsTrigger value="camera">
                <Camera className="h-4 w-4 mr-2" /> 
                Camera
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr-code" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="qr-code">QR Code Value</Label>
                <Input 
                  id="qr-code" 
                  placeholder="Enter QR code" 
                  value={qrCodeValue}
                  onChange={(e) => setQrCodeValue(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the QR code from the off-hire document
                </p>
              </div>
            </TabsContent>

            <TabsContent value="camera" className="space-y-4 py-4">
              <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center h-64">
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground mb-4">
                  Camera access will be requested when you click the button below
                </p>
                <Button>
                  <Camera className="h-4 w-4 mr-2" />
                  Activate Camera
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Point the camera at the QR code on the off-hire document
              </p>
            </TabsContent>
          </Tabs>

          <div className="space-y-4 mt-6 pt-6 border-t">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="location">Collection Location</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={requestLocation}
                  disabled={!!userCoordinates}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {userCoordinates ? "Location Added" : "Add Current Location"}
                </Button>
              </div>
              <Input 
                id="location" 
                placeholder="Equipment collection location" 
                value={scanLocation}
                onChange={(e) => setScanLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Add any notes about the equipment condition or collection" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Equipment Photos</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {images.map((image, index) => (
                  <div 
                    key={index} 
                    className="relative h-24 rounded-md overflow-hidden border bg-gray-50 dark:bg-gray-900"
                  >
                    <img 
                      src={image} 
                      alt={`Equipment ${index + 1}`} 
                      className="h-full w-full object-cover"
                    />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="h-24 border-dashed flex flex-col"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileImage className="h-6 w-6 mb-1" />
                  <span className="text-xs">Add Photo</span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Reset</Button>
          <Button 
            onClick={handleSubmit}
            disabled={!qrCodeValue.trim() || scanMutation.isPending}
          >
            {scanMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Process Off-hire Scan
          </Button>
        </CardFooter>
      </Card>

      {/* Success Dialog */}
      <AlertDialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <Check className="h-5 w-5 mr-2 text-green-500" />
              Off-hire Scan Successful
            </AlertDialogTitle>
            <AlertDialogDescription>
              The equipment has been successfully scanned and marked as returned.
              {scanResult && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                  <p className="font-medium">Equipment Details:</p>
                  <p className="text-sm mt-1">Reference: {scanResult.reference}</p>
                  <p className="text-sm">Item: {scanResult.equipment?.name}</p>
                  <p className="text-sm">Status: Updated to Returned</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}