import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { FileText, AlertTriangle, Clock, User } from "lucide-react";
import { Link } from "wouter";

interface NewItem {
  id: number;
  title: string;
  reference?: string;
  type: string;
  createdAt: string;
  createdBy?: {
    id: number;
    fullName: string;
  };
}

interface NewItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NewItem[];
  projectId: number;
}

const getItemIcon = (type: string) => {
  switch (type) {
    case 'rfi':
      return <FileText className="h-4 w-4" />;
    case 'compensation-event':
    case 'early-warning':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getItemColor = (type: string) => {
  switch (type) {
    case 'rfi':
      return 'bg-blue-100 text-blue-800';
    case 'compensation-event':
      return 'bg-red-100 text-red-800';
    case 'early-warning':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getItemLink = (item: NewItem, projectId: number) => {
  switch (item.type) {
    case 'rfi':
      return `/projects/${projectId}/rfi-management`;
    case 'compensation_event':
      return `/projects/${projectId}/compensation-events`;
    case 'early_warning':
      return `/projects/${projectId}/early-warnings`;
    case 'equipment_hire':
      return `/projects/${projectId}/equipment-hire`;
    default:
      return `/projects/${projectId}`;
  }
};

const formatItemType = (type: string) => {
  switch (type) {
    case 'rfi':
      return 'RFI';
    case 'compensation-event':
      return 'Compensation Event';
    case 'early-warning':
      return 'Early Warning';
    default:
      return type;
  }
};

export function NewItemsModal({ open, onOpenChange, items, projectId }: NewItemsModalProps) {
  const handleMarkAsViewed = () => {
    // Store in localStorage that user has viewed notifications
    localStorage.setItem(`notifications_viewed_${projectId}`, new Date().toISOString());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Recent Project Activity</DialogTitle>
          <DialogDescription>
            Items created in the last 7 days ({items.length} total)
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recent activity in the last 7 days
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getItemIcon(item.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <Link
                        href={getItemLink(item, projectId)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                        onClick={() => {
                          console.log('Navigating to:', getItemLink(item, projectId));
                          // Close modal when clicking link
                          onOpenChange(false);
                        }}
                      >
                        {item.title}
                      </Link>
                      <Badge
                        variant="secondary"
                        className={`ml-2 ${getItemColor(item.type)} text-xs`}
                      >
                        {formatItemType(item.type)}
                      </Badge>
                    </div>
                    
                    {item.reference && (
                      <p className="text-xs text-gray-500 mb-1">
                        {item.reference}
                      </p>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                      
                      {item.createdBy && (
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {item.createdBy.fullName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleMarkAsViewed}>
            Mark as Viewed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}