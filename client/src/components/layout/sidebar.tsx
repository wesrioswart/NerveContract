import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  MessageCircle, 
  CheckCircle, 
  AlertTriangle, 
  FileWarning, 
  Receipt, 
  FileText, 
  Settings, 
  LogOut, 
  User,
  GanttChart,
  Mail,
  Clipboard,
  BadgeCheck,
  ShoppingCart,
  Package2,
  Building,
  Bell,
  Truck,
  QrCode,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Users,
  Calendar,
  BarChart2,
  DollarSign,
  AlertOctagon,
  HelpCircle,
  Zap,
  Menu,
  X,
  Brain
} from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { ActivityBadge } from "@/components/ui/activity-badge";
import { CollapsibleSection } from "@/components/layout/collapsible-section";
import { useSidebar } from "@/contexts/sidebar-context";
import { useProject } from "@/contexts/project-context";
import { ProjectSelector } from "./project-selector";
import { NewItemsModal } from "@/components/notifications/new-items-modal";
import { useQuery } from "@tanstack/react-query";

type SidebarProps = {
  user: any;
  onLogout: () => Promise<void>;  // Updated to match async function
  collapsed?: boolean;
  onToggle?: () => void;
};

export default function Sidebar({ user, onLogout, collapsed = false, onToggle }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { activityCounts, setProjectId } = useSidebar();
  const { currentProject } = useProject();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showNewItemsModal, setShowNewItemsModal] = useState(false);
  
  // Get recent items for notifications
  const { data: recentItems = [], refetch: refetchNotifications } = useQuery({
    queryKey: [`/api/projects/${currentProject?.id}/notifications/recent-items`],
    enabled: !!currentProject?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Check if user has viewed notifications recently
  const getNewItemsCount = () => {
    if (!currentProject?.id || !Array.isArray(recentItems) || recentItems.length === 0) return 0;
    
    const lastViewed = localStorage.getItem(`notifications_viewed_${currentProject.id}`);
    if (!lastViewed) return recentItems.length;
    
    const lastViewedDate = new Date(lastViewed);
    const newItems = (recentItems as any[]).filter((item: any) => 
      new Date(item.createdAt) > lastViewedDate
    );
    return newItems.length;
  };

  const newItemsCount = getNewItemsCount();
  
  // Update project ID in sidebar context when current project changes
  useEffect(() => {
    if (currentProject) {
      refetchNotifications(); // Refresh notifications when project changes
      setProjectId(currentProject.id);
    }
  }, [currentProject, setProjectId, refetchNotifications]);
  
  // Template selector options for quick access
  const templateOptions = [
    { value: 'daily-site-report', label: 'Daily Site Report', icon: Calendar },
    { value: 'progress-report', label: 'Progress Report', icon: BarChart2 },
    { value: 'pmi', label: 'Project Manager\'s Instruction', icon: FileText },
    { value: 'early-warning', label: 'Early Warning Notice', icon: AlertTriangle },
    { value: 'compensation-event', label: 'Compensation Event', icon: DollarSign },
    { value: 'ncr', label: 'Non-Conformance Report', icon: AlertOctagon },
    { value: 'technical-query', label: 'Technical Query', icon: HelpCircle },
    { value: 'payment-application', label: 'Payment Application', icon: Receipt },
  ];

  // Handle template selection from dropdown
  const handleTemplateSelect = (value: string) => {
    setSelectedTemplate(value);
    if (value === 'early-warning') {
      // Open Early Warning template modal
      setLocation('/early-warnings?quick-create=true');
    } else {
      setLocation(`/templates?template=${value}`);
    }
  };

  // NEC4 Templates - Only show "All Templates" link
  const templateItems = [
    { path: "/templates", label: "All Templates", icon: FileText },
  ];
  
  // Main navigation items - simplified business model approach
  const mainNavItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
  ];

  // Contract Intelligence - AI integrated throughout
  const contractIntelligenceItems = [
    { path: "/ai-assistant", label: "Contract Assistant", icon: MessageCircle, badge: "AI" },
    { path: "/super-model-demo", label: "Super Model Analysis", icon: Brain, badge: "SUPER" },
    { path: "/ai-reports", label: "AI Reports", icon: FileText, badge: "AI" },
  ];

  // Risk & Compliance
  const riskComplianceItems = [
    { 
      path: "/early-warnings", 
      label: "Early Warnings", 
      icon: AlertTriangle, 
      activityCount: activityCounts.earlyWarnings,
      activityVariant: "danger"
    },
    { 
      path: "/compensation-events", 
      label: "Compensation Events", 
      icon: CheckCircle, 
      activityCount: activityCounts.compensationEvents,
      activityVariant: "warning"
    },
    { 
      path: "/ncr-tqr", 
      label: "NCRs & TQRs", 
      icon: FileWarning, 
      activityCount: activityCounts.ncrs,
      activityVariant: "warning"
    },
  ];

  // Operations
  const operationsItems = [
    { path: "/programme", label: "Programme Management", icon: GanttChart },
    { 
      path: "/rfi-management", 
      label: "RFI Management", 
      icon: MessageSquare, 
      activityCount: activityCounts.rfis,
      activityVariant: "danger"
    },
    { 
      path: "/resource-allocation", 
      label: "Resource Planning", 
      icon: Users, 
      badge: "AI"
    },
  ];

  // Commercial
  const commercialItems = [
    { path: "/financial", label: "Financial Overview", icon: DollarSign },
    { path: "/procurement", label: "Procurement", icon: ShoppingCart },
    { 
      path: "/suppliers", 
      label: "Supplier Management", 
      icon: Building,
      activityCount: activityCounts.pendingSuppliers,
      activityVariant: "default"
    },
    { 
      path: "/equipment-hire", 
      label: "Equipment Hire", 
      icon: Truck,
      activityCount: activityCounts.equipmentHire,
      activityVariant: "warning"
    },
    { path: "/payment-certificates", label: "Payment Certificates", icon: Receipt },
  ];

  // System & Admin (only for authorized users)
  const systemItems = [
    { path: "/workflow-dashboard", label: "Agent Workflows", icon: Zap, badge: "AI" },
    { path: "/email-processor", label: "Email Processor", icon: Mail, badge: "NEW" },
    { path: "/settings", label: "Settings", icon: Settings },
  ];
  
  // Function to render nav items
  const renderNavItems = (items: any[], activeHighlight = true) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = location === item.path;
      
      // Check if this is a PDF or external link
      const isPdfLink = item.path.includes('/api/pdf/');
      
      // Common content for both link types
      const linkContent = (
        <>
          <Icon className={cn(
            "w-5 h-5", 
            isActive ? "text-blue-500" : "text-gray-500"
          )} />
          
          {!collapsed && (
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium">{item.label}</span>
              <div className="flex items-center gap-1.5">
                {item.activityCount > 0 && (
                  <ActivityBadge 
                    count={item.activityCount} 
                    variant={item.activityVariant || "default"} 
                  />
                )}
                {item.badge && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] py-0 px-1.5">
                    {item.badge}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* For collapsed sidebar, show activity badge but not text badge */}
          {collapsed && item.activityCount > 0 && (
            <ActivityBadge 
              count={item.activityCount} 
              variant={item.activityVariant || "default"} 
              className="absolute -top-1 -right-1"
            />
          )}
        </>
      );
      
      // Common class names
      const linkClassNames = cn(
        "flex items-center rounded transition duration-200 ease-in-out relative",
        collapsed ? "justify-center p-2" : "gap-3 p-3",
        activeHighlight && isActive 
          ? "bg-blue-100 text-blue-700 font-medium" 
          : "text-gray-800 hover:bg-blue-50",
      );
      
      // For PDF downloads, use an anchor tag with download attribute
      if (isPdfLink) {
        return (
          <a 
            key={item.path}
            href={item.path}
            download
            title={collapsed ? item.label : undefined}
            className={linkClassNames}
          >
            {linkContent}
          </a>
        );
      }
      
      // For regular links, use the Link component
      return (
        <Link 
          key={item.path} 
          href={item.path}
          title={collapsed ? item.label : undefined}
          className={linkClassNames}
        >
          {linkContent}
        </Link>
      );
    });
  };

  // Calculate total activity count for contract management
  const contractManagementCount = 
    activityCounts.compensationEvents + 
    activityCounts.earlyWarnings + 
    activityCounts.rfis + 
    activityCounts.ncrs;
  
  // Calculate total activity count for resources section
  const resourcesCount = 
    activityCounts.pendingSuppliers + 
    activityCounts.equipmentHire;

  return (
    <div 
      className={cn(
        "sidebar bg-white border-r border-gray-200 shadow-lg h-screen fixed z-50 flex flex-col left-0 top-0 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      style={{ display: 'block', visibility: 'visible' }}
    >
      {/* User Profile Section */}
      <div className={cn(
        "flex items-center h-16 border-b border-gray-200",
        collapsed ? "justify-center px-0" : "px-4"
      )}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="ml-3">
            <p className="text-base font-medium">{user?.fullName || 'Jane Cooper'}</p>
            <p className="text-xs text-gray-500">{user?.role || 'Principal Contractor'}</p>
          </div>
        )}
      </div>
      
      {/* Project Selector */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-200">
          <ProjectSelector />
        </div>
      )}
      
      {/* Main Navigation - with overflow scrolling */}
      <div className={cn(
        "py-4 flex-grow overflow-y-auto", 
        collapsed ? "px-2" : "px-3"
      )}>
        <nav className="flex flex-col space-y-1">
          {/* NEC4 Templates Section - Placed at the top */}
          {!collapsed ? (
            <CollapsibleSection title="NEC4 Templates" section="templates" collapsed={collapsed}>
              {/* Quick Template Selector */}
              <div className="mb-3 px-2">
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-blue-500" />
                      <SelectValue placeholder="Quick Create" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {templateOptions.map((template) => {
                      const IconComponent = template.icon;
                      return (
                        <SelectItem key={template.value} value={template.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-3 w-3" />
                            <span className="text-xs">{template.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {renderNavItems(templateItems)}
            </CollapsibleSection>
          ) : (
            // Show only the Daily Site Report when collapsed
            renderNavItems([templateItems[0]])
          )}
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Core Navigation - Dashboard always visible */}
          <div className="mb-4">
            {renderNavItems(mainNavItems)}
          </div>
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Contract Intelligence */}
          {!collapsed ? (
            <CollapsibleSection 
              title="Contract Intelligence" 
              section="contractIntelligence" 
              collapsed={collapsed}
            >
              {renderNavItems(contractIntelligenceItems)}
            </CollapsibleSection>
          ) : (
            renderNavItems(contractIntelligenceItems)
          )}
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Risk & Compliance */}
          {!collapsed ? (
            <CollapsibleSection 
              title="Risk & Compliance" 
              section="riskCompliance" 
              activityCount={contractManagementCount}
              collapsed={collapsed}
            >
              {renderNavItems(riskComplianceItems)}
            </CollapsibleSection>
          ) : (
            renderNavItems(riskComplianceItems)
          )}
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Operations */}
          {!collapsed ? (
            <CollapsibleSection 
              title="Operations" 
              section="operations" 
              collapsed={collapsed}
            >
              {renderNavItems(operationsItems)}
            </CollapsibleSection>
          ) : (
            renderNavItems(operationsItems)
          )}
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Commercial */}
          {!collapsed ? (
            <CollapsibleSection 
              title="Commercial" 
              section="commercial" 
              activityCount={resourcesCount}
              collapsed={collapsed}
            >
              {renderNavItems(commercialItems)}
            </CollapsibleSection>
          ) : (
            renderNavItems(commercialItems)
          )}
        </nav>
      </div>
      
      {/* Utility and Logout Section */}
      <div className={cn(
        "w-full border-t border-gray-200 mt-auto",
        collapsed ? "p-2" : "p-3"
      )}>
        {/* System Items */}
        <div className="mb-2 space-y-1">
          {!collapsed ? (
            <CollapsibleSection 
              title="System & Admin" 
              section="system" 
              collapsed={collapsed}
              defaultOpen={true}
            >
              {renderNavItems(systemItems, false)}
            </CollapsibleSection>
          ) : (
            renderNavItems([systemItems[0]], false)  // Just show agent workflows when collapsed
          )}
        </div>
        
        {/* Notifications Section */}
        {!collapsed && currentProject && (
          <div className="mb-3">
            <Button 
              variant="outline"
              size="sm"
              className="w-full flex items-center gap-2"
              onClick={() => {
                console.log('Bell clicked - opening modal', { 
                  currentModal: showNewItemsModal, 
                  itemsCount: Array.isArray(recentItems) ? recentItems.length : 0 
                });
                setShowNewItemsModal(true);
              }}
            >
              <Bell className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Notifications</span>
              {newItemsCount > 0 && (
                <div className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium ml-auto">
                  {newItemsCount > 9 ? '9+' : newItemsCount}
                </div>
              )}
            </Button>
          </div>
        )}
        
        {/* Logout Button */}
        <button 
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "flex items-center rounded text-gray-800 hover:bg-red-50 transition duration-200 ease-in-out w-full",
            collapsed ? "justify-center p-2" : "gap-3 p-3"
          )}
        >
          <LogOut className="w-5 h-5 text-gray-500" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      {/* New Items Modal */}
      {currentProject && (
        <NewItemsModal
          open={showNewItemsModal}
          onOpenChange={(open) => {
            console.log('Modal state changing to:', open);
            setShowNewItemsModal(open);
          }}
          items={Array.isArray(recentItems) ? recentItems : []}
          projectId={currentProject.id}
        />
      )}
    </div>
  );
}