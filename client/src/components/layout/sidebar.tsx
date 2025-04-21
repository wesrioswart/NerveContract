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
  Package2
} from 'lucide-react';
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
  
  // NEC4 Templates - Placed prominently at the top
  const templateItems = [
    { path: "/templates/daily-site-report", label: "Daily Site Report", icon: Clipboard },
    { path: "/templates/progress-report", label: "Progress Report", icon: BadgeCheck },
    { path: "/templates/pmi", label: "Project Manager Instruction", icon: FileWarning },
    { path: "/templates", label: "All Templates", icon: FileText },
  ];
  
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
    { path: "/programme", label: "Programme", icon: GanttChart }
  ];

  // Financial items
  const financialNavItems = [
    { path: "/payment-certificates", label: "Payment Certificates", icon: Receipt },
  ];
  
  // Procurement & Inventory items
  const procurementNavItems = [
    { path: "/procurement", label: "Procurement", icon: ShoppingCart },
    { path: "/inventory", label: "Inventory", icon: Package2, badge: "New" },
  ];

  // Utility items
  const utilityItems = [
    { path: "/email-processor", label: "Email Processor", icon: Mail, badge: "New" },
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
          {/* NEC4 Templates Section - Placed at the top */}
          {!collapsed ? (
            <>
              <h4 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                NEC4 Templates
              </h4>
              {renderNavItems(templateItems)}
            </>
          ) : (
            // Show only the Daily Site Report when collapsed
            renderNavItems([templateItems[0]])
          )}
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Core Navigation */}
          {renderNavItems(coreNavItems)}
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Contract Management */}
          {!collapsed && (
            <h4 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
              Contract Management
            </h4>
          )}
          {renderNavItems(contractNavItems)}
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Programme Management */}
          {!collapsed && (
            <h4 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
              Programme
            </h4>
          )}
          {renderNavItems(programmeNavItems)}
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Financial Management */}
          {!collapsed && (
            <h4 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
              Financial
            </h4>
          )}
          {renderNavItems(financialNavItems)}
          
          {!collapsed && <Separator className="my-3" />}
          
          {/* Procurement & Inventory */}
          {!collapsed && (
            <h4 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
              Resources
            </h4>
          )}
          {renderNavItems(procurementNavItems)}
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
