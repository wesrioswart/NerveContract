import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PlusCircle, X, Save, Edit, Trash2 } from "lucide-react";

// Define annotation types
interface Annotation {
  id: string;
  x: number;
  y: number;
  text: string;
  type: "issue" | "comment" | "instruction" | "nec4-clause";
  taskId?: string;
  timestamp: string;
  nec4Clause?: string;
  status?: "pending" | "resolved";
}

interface AnnotationInterfaceProps {
  programmeId: number;
  taskData: any[]; // This should match the Task type from gantt-chart-component
  readOnly?: boolean;
}

export default function AnnotationInterface({ 
  programmeId, 
  taskData, 
  readOnly = false 
}: AnnotationInterfaceProps) {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draggingAnnotation, setDraggingAnnotation] = useState<string | null>(null);
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [newAnnotation, setNewAnnotation] = useState<Partial<Annotation>>({
    text: "",
    type: "comment",
    status: "pending"
  });

  // Fetch annotations
  useEffect(() => {
    const fetchAnnotations = async () => {
      try {
        // Fetch annotations from the API
        const response = await apiRequest('GET', `/api/programmes/${programmeId}/annotations`);
        const data = await response.json();
        
        // Transform server data to client annotation format if needed
        const formattedAnnotations: Annotation[] = data.map((item: any) => ({
          id: item.id.toString(),
          x: item.xPosition,
          y: item.yPosition,
          text: item.content,
          type: item.annotationType || "comment",
          taskId: item.taskId ? item.taskId.toString() : undefined,
          timestamp: item.createdAt,
          nec4Clause: item.nec4Clause,
          status: item.status || "pending"
        }));
        
        setAnnotations(formattedAnnotations);
      } catch (error) {
        console.error("Error fetching annotations:", error);
        toast({
          title: "Failed to load annotations",
          description: "Could not load annotation data. Please try again.",
          variant: "destructive"
        });
        
        // If API fails, use empty array
        setAnnotations([]);
      }
    };

    fetchAnnotations();
  }, [programmeId, toast]);

  // Save annotation mutation
  const saveAnnotationMutation = useMutation({
    mutationFn: async (annotation: Partial<Annotation>) => {
      // Transform client annotation to server format
      const serverAnnotation = {
        xPosition: annotation.x,
        yPosition: annotation.y,
        content: annotation.text,
        annotationType: annotation.type,
        taskId: annotation.taskId ? parseInt(annotation.taskId) : null,
        nec4Clause: annotation.nec4Clause,
        status: annotation.status
      };
      
      // New annotation
      if (!annotation.id) {
        const response = await apiRequest(
          'POST', 
          `/api/programmes/${programmeId}/annotations`, 
          serverAnnotation
        );
        
        if (!response.ok) {
          throw new Error('Failed to create annotation');
        }
        
        const savedAnnotation = await response.json();
        
        // Transform server response to client format
        const newAnn: Annotation = {
          id: savedAnnotation.id.toString(),
          x: savedAnnotation.xPosition,
          y: savedAnnotation.yPosition,
          text: savedAnnotation.content,
          type: savedAnnotation.annotationType || "comment",
          taskId: savedAnnotation.taskId ? savedAnnotation.taskId.toString() : undefined,
          timestamp: savedAnnotation.createdAt,
          nec4Clause: savedAnnotation.nec4Clause,
          status: savedAnnotation.status || "pending"
        };
        
        // Update local state
        setAnnotations(prev => [...prev, newAnn]);
        return newAnn;
      } 
      // Update existing annotation
      else {
        const response = await apiRequest(
          'PATCH', 
          `/api/programmes/${programmeId}/annotations/${annotation.id}`, 
          serverAnnotation
        );
        
        if (!response.ok) {
          throw new Error('Failed to update annotation');
        }
        
        const updatedAnnotation = await response.json();
        
        // Transform server response to client format
        const updatedAnn: Annotation = {
          id: updatedAnnotation.id.toString(),
          x: updatedAnnotation.xPosition,
          y: updatedAnnotation.yPosition,
          text: updatedAnnotation.content,
          type: updatedAnnotation.annotationType || "comment",
          taskId: updatedAnnotation.taskId ? updatedAnnotation.taskId.toString() : undefined,
          timestamp: updatedAnnotation.updatedAt || updatedAnnotation.createdAt,
          nec4Clause: updatedAnnotation.nec4Clause,
          status: updatedAnnotation.status || "pending"
        };
        
        // Update local state
        setAnnotations(prev => 
          prev.map(ann => ann.id === annotation.id ? updatedAnn : ann)
        );
        return updatedAnn;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isEditing 
          ? "Annotation updated successfully" 
          : "New annotation added successfully",
      });
      
      // Reset states
      setNewAnnotation({
        text: "",
        type: "comment",
        status: "pending"
      });
      setIsCreating(false);
      setIsEditing(false);
      setShowAnnotationDialog(false);
    },
    onError: (error) => {
      console.error("Error saving annotation:", error);
      toast({
        title: "Failed to save",
        description: "Could not save annotation. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete annotation mutation
  const deleteAnnotationMutation = useMutation({
    mutationFn: async (id: string) => {
      // This would be a real API call in production
      // await apiRequest('DELETE', `/api/programmes/${programmeId}/annotations/${id}`);
      
      // Update local state
      setAnnotations(prev => prev.filter(ann => ann.id !== id));
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Annotation deleted successfully",
      });
      setActiveAnnotation(null);
      setShowAnnotationDialog(false);
    },
    onError: (error) => {
      console.error("Error deleting annotation:", error);
      toast({
        title: "Failed to delete",
        description: "Could not delete annotation. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle creating a new annotation
  const handleCreateAnnotation = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isCreating || !containerRef.current) return;
    
    // Get container bounds
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate position relative to container
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Set up new annotation
    setNewAnnotation(prev => ({
      ...prev,
      x,
      y
    }));
    
    // Show dialog for entering annotation details
    setShowAnnotationDialog(true);
    setIsCreating(false);
  };

  // Handle editing an existing annotation
  const handleEditAnnotation = (annotation: Annotation) => {
    setActiveAnnotation(annotation);
    setNewAnnotation(annotation);
    setIsEditing(true);
    setShowAnnotationDialog(true);
  };

  // Handle saving an annotation
  const handleSaveAnnotation = () => {
    if (!newAnnotation.text) {
      toast({
        title: "Validation error",
        description: "Annotation text is required",
        variant: "destructive"
      });
      return;
    }
    
    saveAnnotationMutation.mutate(newAnnotation as Annotation);
  };

  // Handle deleting an annotation
  const handleDeleteAnnotation = () => {
    if (activeAnnotation?.id) {
      deleteAnnotationMutation.mutate(activeAnnotation.id);
    }
  };

  // Handle starting annotation drag
  const handleAnnotationDragStart = (
    e: React.MouseEvent<HTMLDivElement>, 
    annotationId: string,
    annotationX: number,
    annotationY: number
  ) => {
    if (readOnly) return;
    
    e.stopPropagation();
    
    // Calculate offset to maintain relative position during drag
    const offsetX = e.clientX - annotationX;
    const offsetY = e.clientY - annotationY;
    setDragOffset({ x: offsetX, y: offsetY });
    
    // Set the annotation as being dragged
    setDraggingAnnotation(annotationId);
  };

  // Handle annotation drag movement
  const handleAnnotationDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingAnnotation || !containerRef.current) return;
    
    e.preventDefault();
    
    // Get container bounds
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate new position relative to container with offset
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    // Update annotation position in state
    setAnnotations(prev => 
      prev.map(ann => 
        ann.id === draggingAnnotation 
          ? { ...ann, x, y } 
          : ann
      )
    );
  };

  // Handle annotation drag end
  const handleAnnotationDragEnd = () => {
    // Reset dragging state
    setDraggingAnnotation(null);
    
    // In a real implementation, we'd save the new positions to the server here
  };

  // Get color for annotation type
  const getAnnotationTypeColor = (type: string) => {
    switch (type) {
      case "issue":
        return "bg-red-100 border-red-300 text-red-800";
      case "comment":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "instruction":
        return "bg-amber-100 border-amber-300 text-amber-800";
      case "nec4-clause":
        return "bg-purple-100 border-purple-300 text-purple-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  // Get annotation status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">Pending</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">Resolved</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Programme Annotations</CardTitle>
            <CardDescription>
              Add comments, issues, and instructions to your programme
            </CardDescription>
          </div>
          {!readOnly && (
            <Button 
              size="sm" 
              onClick={() => setIsCreating(prev => !prev)}
              variant={isCreating ? "secondary" : "default"}
            >
              {isCreating ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add Annotation
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Annotation Canvas */}
        <div 
          ref={containerRef}
          className={`relative w-full border border-gray-200 rounded-md bg-gray-50 min-h-[500px] ${
            isCreating ? "cursor-crosshair" : "cursor-default"
          }`}
          onClick={handleCreateAnnotation}
          onMouseMove={handleAnnotationDragMove}
          onMouseUp={handleAnnotationDragEnd}
          onMouseLeave={handleAnnotationDragEnd}
        >
          {/* Annotations */}
          {annotations.map(annotation => (
            <div
              key={annotation.id}
              className={`absolute p-3 rounded-md border cursor-pointer select-none shadow-sm 
                ${getAnnotationTypeColor(annotation.type)}
                ${draggingAnnotation === annotation.id ? 'shadow-md z-50' : 'z-10'}
              `}
              style={{
                left: `${annotation.x}px`,
                top: `${annotation.y}px`,
                maxWidth: '250px',
                minWidth: '180px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveAnnotation(annotation);
              }}
              onMouseDown={(e) => handleAnnotationDragStart(e, annotation.id, annotation.x, annotation.y)}
            >
              {/* Annotation header with type badge */}
              <div className="flex justify-between items-start mb-1">
                <Badge variant="outline" className="text-xs capitalize">
                  {annotation.type}
                </Badge>
                {getStatusBadge(annotation.status)}
              </div>
              
              {/* Annotation content */}
              <p className="text-sm font-medium">{annotation.text}</p>
              
              {/* NEC4 Clause reference if available */}
              {annotation.nec4Clause && (
                <div className="mt-1 text-xs flex items-center">
                  <Badge variant="outline" className="bg-purple-50 text-purple-800 text-xs">
                    NEC4 Clause {annotation.nec4Clause}
                  </Badge>
                </div>
              )}
              
              {/* Task reference if available */}
              {annotation.taskId && (
                <div className="mt-1 text-xs">
                  <span className="opacity-75">
                    {taskData.find(task => task.id === annotation.taskId)?.name || annotation.taskId}
                  </span>
                </div>
              )}
              
              {/* Edit button */}
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white shadow-sm hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditAnnotation(annotation);
                  }}
                >
                  <Edit className="h-3 w-3" />
                  <span className="sr-only">Edit</span>
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {/* Instructions */}
        {isCreating && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
            Click anywhere on the canvas above to place a new annotation
          </div>
        )}
        
        {/* List of annotations for reference */}
        <div className="mt-6">
          <h4 className="font-medium mb-2">All Annotations ({annotations.length})</h4>
          <div className="space-y-2">
            {annotations.map(annotation => (
              <div 
                key={annotation.id}
                className={`p-3 border rounded-md cursor-pointer 
                  ${annotation.id === activeAnnotation?.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                  }`}
                onClick={() => setActiveAnnotation(annotation)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex gap-2 items-center mb-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {annotation.type}
                      </Badge>
                      {getStatusBadge(annotation.status)}
                    </div>
                    <p className="font-medium">{annotation.text}</p>
                  </div>
                  
                  {!readOnly && (
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAnnotation(annotation);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveAnnotation(annotation);
                          deleteAnnotationMutation.mutate(annotation.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Reference */}
                <div className="mt-1 flex gap-2 text-xs text-gray-500">
                  {annotation.nec4Clause && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-800 text-xs">
                      NEC4 Clause {annotation.nec4Clause}
                    </Badge>
                  )}
                  
                  {annotation.taskId && (
                    <span>
                      Task: {taskData.find(task => task.id === annotation.taskId)?.name || annotation.taskId}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      {/* Annotation Dialog */}
      <Dialog open={showAnnotationDialog} onOpenChange={setShowAnnotationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Annotation" : "New Annotation"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update the details of this annotation" 
                : "Add a new annotation to your programme"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="annotation-text">Annotation Text</Label>
              <Textarea 
                id="annotation-text"
                value={newAnnotation.text || ""}
                onChange={(e) => setNewAnnotation({ ...newAnnotation, text: e.target.value })}
                placeholder="Enter annotation details..."
                className="resize-none h-24"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annotation-type">Type</Label>
                <Select
                  value={newAnnotation.type}
                  onValueChange={(value) => setNewAnnotation({ ...newAnnotation, type: value as any })}
                >
                  <SelectTrigger id="annotation-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comment">Comment</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                    <SelectItem value="instruction">Instruction</SelectItem>
                    <SelectItem value="nec4-clause">NEC4 Clause</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="annotation-status">Status</Label>
                <Select
                  value={newAnnotation.status}
                  onValueChange={(value) => setNewAnnotation({ ...newAnnotation, status: value as any })}
                >
                  <SelectTrigger id="annotation-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annotation-nec4">NEC4 Clause Reference (Optional)</Label>
              <Input
                id="annotation-nec4"
                value={newAnnotation.nec4Clause || ""}
                onChange={(e) => setNewAnnotation({ ...newAnnotation, nec4Clause: e.target.value })}
                placeholder="e.g. 31.3"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annotation-task">Related Task (Optional)</Label>
              <Select
                value={newAnnotation.taskId}
                onValueChange={(value) => setNewAnnotation({ ...newAnnotation, taskId: value })}
              >
                <SelectTrigger id="annotation-task">
                  <SelectValue placeholder="Select related task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {taskData.map(task => (
                    <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <div>
              {isEditing && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteAnnotation}
                  disabled={deleteAnnotationMutation.isPending}
                >
                  {deleteAnnotationMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAnnotationDialog(false);
                  setIsEditing(false);
                  setNewAnnotation({
                    text: "",
                    type: "comment",
                    status: "pending"
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAnnotation}
                disabled={saveAnnotationMutation.isPending}
              >
                {saveAnnotationMutation.isPending ? "Saving..." : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}