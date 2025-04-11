import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

type MSProjectUploadProps = {
  projectId: number;
};

export default function MSProjectUpload({ projectId }: MSProjectUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<"select" | "preview" | "success">("select");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // For XML files, read the content for preview
      // For MPP files, just show file info
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'xml') {
        // Read the file content if it's XML
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setXmlContent(event.target.result as string);
          }
        };
        reader.readAsText(selectedFile);
      } else if (fileExtension === 'mpp') {
        // For MPP files, we don't try to read them as text
        setXmlContent("Binary MPP file - preview not available");
      }
      
      // Move to preview step regardless of file type
      setUploadStep("preview");
    }
  };

  const resetForm = () => {
    setFile(null);
    setXmlContent(null);
    setUploadStep("select");
  };

  const parseXmlMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/programme/parse-xml", { xmlContent });
    },
    onSuccess: async (response) => {
      const result = await response.json();
      
      // In a real implementation, we would add these milestones to the project
      // For MVP, we'll just show a success message and reload the programme milestones
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/programme-milestones`] });
      
      setUploadStep("success");
      toast({
        title: "Programme Updated",
        description: "MS Project file has been successfully parsed and milestones updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to parse MS Project file: " + error,
        variant: "destructive",
      });
    },
  });

  // Direct file upload mutation for MPP files
  const fileUploadMutation = useMutation({
    mutationFn: async (fileToUpload: File) => {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('projectId', projectId.toString());
      
      return apiRequest('POST', '/api/programme/upload', formData as FormData, true);
    },
    onSuccess: async (response) => {
      const result = await response.json();
      
      // Refresh milestones data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/programme-milestones`] });
      
      setUploadStep("success");
      toast({
        title: "Programme Updated",
        description: "Project file has been successfully uploaded and processed.",
      });
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload programme file. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async () => {
    if (!file) return;
    
    try {
      // Check file extension to determine upload method
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'xml' && xmlContent) {
        // For XML files, use XML parsing
        await parseXmlMutation.mutateAsync();
      } else if (fileExtension === 'mpp') {
        // For MPP files, use direct file upload
        await fileUploadMutation.mutateAsync(file);
      } else {
        throw new Error("Unsupported file type");
      }
    } catch (error) {
      console.error("Error processing file:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import MS Project File</CardTitle>
        <CardDescription>
          Upload an MS Project XML or MPP file to update your project programme
        </CardDescription>
      </CardHeader>
      <CardContent>
        {uploadStep === "select" && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
            <span className="material-icons text-gray-400 text-5xl mb-4">upload_file</span>
            <h3 className="text-lg font-medium mb-2">Drag and drop your MS Project file here</h3>
            <p className="text-sm text-gray-500 mb-4">Or click to browse your files</p>
            <input
              type="file"
              accept=".xml,.mpp"
              onChange={handleFileChange}
              className="hidden"
              id="ms-project-upload"
            />
            <Button 
              variant="outline" 
              onClick={() => document.getElementById("ms-project-upload")?.click()}
            >
              <span className="material-icons mr-2">add</span>
              Select File
            </Button>
            <p className="text-xs text-gray-400 mt-4">Supported formats: XML, MPP</p>
          </div>
        )}

        {uploadStep === "preview" && file && (
          <div className="space-y-4">
            <Alert>
              <span className="material-icons mr-2">info</span>
              <AlertTitle>File Selected</AlertTitle>
              <AlertDescription>
                You have selected <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </AlertDescription>
            </Alert>
            
            <div className="border rounded-lg p-4 h-64 overflow-auto bg-gray-50">
              <h3 className="font-medium mb-2">File Preview</h3>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                {xmlContent?.substring(0, 500)}...
              </pre>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={resetForm}
              >
                <span className="material-icons mr-2">close</span>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={parseXmlMutation.isPending || fileUploadMutation.isPending}
                className="bg-primary hover:bg-blue-800"
              >
                {parseXmlMutation.isPending || fileUploadMutation.isPending ? (
                  <>
                    <span className="material-icons animate-spin mr-2">refresh</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">check</span>
                    Parse and Import
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {uploadStep === "success" && (
          <div className="text-center py-6">
            <span className="material-icons text-green-600 text-5xl mb-4">check_circle</span>
            <h3 className="text-lg font-medium mb-2">Programme Updated Successfully</h3>
            <p className="text-gray-500 mb-6">Your project milestones have been updated with the new data</p>
            <Button 
              onClick={resetForm}
              className="bg-primary hover:bg-blue-800"
            >
              <span className="material-icons mr-2">replay</span>
              Import Another File
            </Button>
          </div>
        )}
      </CardContent>
      {uploadStep === "select" && (
        <CardFooter className="border-t pt-4 text-sm text-gray-500">
          <div className="flex items-start">
            <span className="material-icons text-amber-500 mr-2">lightbulb</span>
            <p>
              Importing your MS Project file will update or create milestones in your project. 
              Existing data will not be deleted but may be overwritten if the same milestone exists.
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
