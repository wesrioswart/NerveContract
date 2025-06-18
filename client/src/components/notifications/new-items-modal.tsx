import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle, 
  FileWarning, 
  Truck,
  Clock,
  User,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';

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
  isNew: boolean;
}

interface NewItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NewItem[];
  onMarkAsViewed?: (type: string) => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'rfi':
      return <MessageSquare className="h-4 w-4" />;
    case 'compensation-event':
      return <CheckCircle className="h-4 w-4" />;
    case 'early-warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'ncr':
      return <FileWarning className="h-4 w-4" />;
    case 'equipment-hire':
      return <Truck className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'rfi':
      return 'RFI';
    case 'compensation-event':
      return 'Compensation Event';
    case 'early-warning':
      return 'Early Warning';
    case 'ncr':
      return 'NCR';
    case 'equipment-hire':
      return 'Equipment Hire';
    default:
      return 'Item';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'rfi':
      return 'bg-blue-100 text-blue-800';
    case 'compensation-event':
      return 'bg-orange-100 text-orange-800';
    case 'early-warning':
      return 'bg-red-100 text-red-800';
    case 'ncr':
      return 'bg-yellow-100 text-yellow-800';
    case 'equipment-hire':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getItemLink = (item: NewItem, projectId: number) => {
  switch (item.type) {
    case 'rfi':
      return `/projects/${projectId}/rfi-management`;
    case 'compensation-event':
      return `/projects/${projectId}/compensation-events`;
    case 'early-warning':
      return `/projects/${projectId}/early-warnings`;
    case 'ncr':
      return `/projects/${projectId}/ncr-tqr`;
    case 'equipment-hire':
      return `/projects/${projectId}/equipment-hire`;
    default:
      return `/projects/${projectId}`;
  }
};

export function NewItemsModal({ open, onOpenChange, items, onMarkAsViewed }: NewItemsModalProps) {
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, NewItem[]>);

  const handleMarkAllAsViewed = () => {
    Object.keys(groupedItems).forEach(type => {
      onMarkAsViewed?.(type);
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            New Items ({items.length})
          </DialogTitle>
          <DialogDescription>
            Here are the latest items that have been added since your last visit.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([type, typeItems]) => (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  {getTypeIcon(type)}
                  <h3 className="font-medium">{getTypeLabel(type)}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {typeItems.length} new
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {typeItems.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${getTypeColor(type)}`}>
                              {item.reference || `${getTypeLabel(type)}-${item.id}`}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              NEW
                            </Badge>
                          </div>
                          
                          <h4 className="font-medium text-sm truncate mb-1">
                            {item.title}
                          </h4>
                          
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.createdBy?.fullName || 'Unknown'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        
                        <Link href={getItemLink(item, 1)}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                
                {Object.keys(groupedItems).indexOf(type) < Object.keys(groupedItems).length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleMarkAllAsViewed}>
            Mark All as Viewed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}