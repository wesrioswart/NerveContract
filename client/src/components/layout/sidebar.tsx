import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  MessageCircle, 
  CheckCircle, 
  AlertTriangle, 
  FileWarning, 
  CalendarDays, 
  Receipt, 
  FileText, 
  ClipboardList,
  BarChart, 
  Settings, 
  LogOut, 
  User,
  GanttChart,
  Mail,
  SendHorizontal,
  ChevronDown,
  Clipboard,
  FileSpreadsheet,
  HardHat,
  BadgeCheck,
  BellRing,
  CalendarClock
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type SidebarProps = {
  user: any;
  onLogout: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
};

export default function Sidebar({ user, onLogout, collapsed = false, onToggle }: SidebarProps) {
  const [location] = useLocation();

  // Core navigation items
  const coreNavItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/ai-assistant", label: "AI Assistant", icon: MessageCircle },
  ];

  // Contract management items
  const contractNavItems = [
    { path: "/compensation-events", label: "Compensation Events", icon: CheckCircle },
    { path: "/early-warnings", label: "Early Warnings", icon: AlertTriangle },
    { path: "/ncr-tqr", label: "NCRs & TQRs", icon: FileWarning },
  ];

  // Programme items
  const programmeNavItems = [
    { path: "/programme", label: "Programme Upload", icon: CalendarDays },
    { path: "/programme-management", label: "Programme Management", icon: GanttChart },
  ];

  // Financial items
  const financialNavItems = [
    { path: "/payment-certificates", label: "Payment Certificates", icon: Receipt },
  ];

  // Templates and utility items
  const templateItems = [
    { path: "/templates", label: "All Templates", icon: FileText },
    { path: "/templates/daily-site-report", label: "Daily Site Report", icon: Clipboard },
    { path: "/templates/progress-report", label: "Progress Report", icon: BadgeCheck },
    { path: "/templates/pmi", label: "NEC4 PMI", icon: FileWarning },
  ];

  const utilityItems = [
    { path: "/email-processor", label: "Email Processor", icon: Mail, badge: "New" },
    { path: "/reports", label: "Reports & Analytics", icon: BarChart },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  // Function to render nav items
  const renderNavItems = (items: any[], activeHighlight = true) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = location === item.path;
      
      return (
        <Link 
          key={item.path} 
          href={item.path}
          title={collapsed ? item.label : undefined}
          className={cn(
            "flex items-center rounded transition duration-200 ease-in-out",
            collapsed ? "justify-center p-2" : "gap-3 p-3",
            activeHighlight && isActive 
              ? "bg-blue-100 text-blue-700 font-medium" 
              : "text-gray-800 hover:bg-blue-50",
          )}
        >
          <Icon className={cn(
            "w-5 h-5", 
            isActive ? "text-blue-500" : "text-gray-500"
          )} />
          
          {!collapsed && (
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium">{item.label}</span>
              {item.badge && (
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 text-[10px] py-0 px-1.5">
                  {item.badge}
                </Badge>
              )}
            </div>
          )}
        </Link>
      );
    });
  };

  return (
    <div 
      className={cn(
        "sidebar bg-gray-50 shadow-lg h-screen fixed overflow-y-auto transition-all duration-300 ease-in-out z-50",
        collapsed ? "w-16" : "w-64"
      )}
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
      
      {/* Main Navigation */}
      <div className={cn(
        "py-4", 
        collapsed ? "px-2" : "px-3"
      )}>
        <nav className="flex flex-col space-y-1">
          {/* Core Navigation */}
          {renderNavItems(coreNavItems)}
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Contract Management Section */}
          {!collapsed ? (
            <div className="space-y-1">
              <h4 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                Contract Management
              </h4>
              {renderNavItems(contractNavItems)}
            </div>
          ) : (
            renderNavItems(contractNavItems)
          )}
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Programme Management Section */}
          {!collapsed ? (
            <div className="space-y-1">
              <h4 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                Programme
              </h4>
              {renderNavItems(programmeNavItems)}
            </div>
          ) : (
            renderNavItems(programmeNavItems)
          )}
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Financial Management */}
          {!collapsed ? (
            <div className="space-y-1">
              <h4 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                Financial
              </h4>
              {renderNavItems(financialNavItems)}
            </div>
          ) : (
            renderNavItems(financialNavItems)
          )}
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Templates Section */}
          {!collapsed ? (
            <div className="space-y-1">
              <h4 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                Templates
              </h4>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="templates" className="border-0">
                  <AccordionTrigger className="py-2 px-3 text-sm hover:bg-blue-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium">NEC4 Templates</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-0">
                    <div className="flex flex-col space-y-1 pl-8">
                      <Link href="/templates/daily-site-report" className="text-sm py-2 px-3 rounded-md hover:bg-blue-50 text-gray-800">
                        Daily Site Report
                      </Link>
                      <Link href="/templates/progress-report" className="text-sm py-2 px-3 rounded-md hover:bg-blue-50 text-gray-800">
                        Progress Report
                      </Link>
                      <Link href="/templates/pmi" className="text-sm py-2 px-3 rounded-md hover:bg-blue-50 text-gray-800">
                        Project Manager Instruction
                      </Link>
                      <Link href="/templates" className="text-sm py-2 px-3 rounded-md hover:bg-blue-50 text-gray-800">
                        All Templates
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            renderNavItems([{ path: "/templates", label: "Templates", icon: FileText }])
          )}
        </nav>
      </div>
      
      {/* Utility and Logout Section */}
      <div className={cn(
        "absolute bottom-0 w-full border-t border-gray-200",
        collapsed ? "p-2" : "p-3"
      )}>
        {/* Utility Items */}
        <div className="mb-2 space-y-1">
          {renderNavItems(utilityItems, false)}
        </div>
        
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
    </div>
  );
}
