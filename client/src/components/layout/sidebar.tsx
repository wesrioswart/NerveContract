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
  SendHorizontal
} from 'lucide-react';

type SidebarProps = {
  user: any;
  onLogout: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
};

export default function Sidebar({ user, onLogout, collapsed = false, onToggle }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/ai-assistant", label: "AI Assistant", icon: MessageCircle },
    { path: "/compensation-events", label: "Compensation Events", icon: CheckCircle },
    { path: "/early-warnings", label: "Early Warnings", icon: AlertTriangle },
    { path: "/ncr-tqr", label: "NCRs & TQRs", icon: FileWarning },
    { path: "/templates", label: "NEC4 Templates", icon: FileText },
    { path: "/programme", label: "Programme", icon: CalendarDays },
    { path: "/programme-management", label: "Programme Management", icon: GanttChart },
    { path: "/payment-certificates", label: "Payment Certificates", icon: Receipt },
  ];

  return (
    <div 
      className={cn(
        "sidebar bg-gray-50 shadow-lg h-screen fixed overflow-y-auto transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn(
        "flex items-center h-16 border-b border-gray-200",
        collapsed ? "justify-center px-0" : "px-4"
      )}>
        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="ml-3">
            <p className="text-base font-medium">{user?.fullName || 'Jane Cooper'}</p>
            <p className="text-xs text-gray-500">{user?.role || 'Principal Contractor'}</p>
          </div>
        )}
      </div>
      
      <div className={cn("p-2", collapsed ? "px-1" : "p-4")}>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded transition duration-200 ease-in-out",
                  collapsed ? "justify-center p-2" : "gap-3 p-3",
                  location === item.path 
                    ? "bg-blue-100 text-blue-700 font-medium" 
                    : "text-gray-800 hover:bg-blue-50"
                )}
              >
                <Icon className={cn("w-5 h-5", location === item.path ? "text-blue-500" : "text-gray-500")} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className={cn(
        "absolute bottom-0 w-full border-t border-gray-200",
        collapsed ? "p-2" : "p-4"
      )}>
        <Link 
          href="/settings" 
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center rounded text-gray-800 hover:bg-blue-50 transition duration-200 ease-in-out mb-2",
            collapsed ? "justify-center p-2" : "gap-3 p-3",
            location === "/settings" ? "bg-blue-100" : ""
          )}
        >
          <Settings className="w-5 h-5 text-gray-500" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>
        
        <Link 
          href="/email-processor" 
          title={collapsed ? "Email Processor" : undefined}
          className={cn(
            "flex items-center rounded transition duration-200 ease-in-out mb-2",
            collapsed ? "justify-center p-2" : "gap-3 p-3",
            "bg-blue-100 text-blue-700"
          )}
        >
          <Mail className={cn("w-5 h-5", "text-blue-500")} />
          {!collapsed && <span className="text-sm font-medium">Email Processor</span>}
        </Link>
        
        <Link 
          href="/reports" 
          title={collapsed ? "Reports" : undefined}
          className={cn(
            "flex items-center rounded text-gray-800 hover:bg-blue-50 transition duration-200 ease-in-out mb-2",
            collapsed ? "justify-center p-2" : "gap-3 p-3",
            location === "/reports" ? "bg-blue-100" : ""
          )}
        >
          <BarChart className="w-5 h-5 text-gray-500" />
          {!collapsed && <span className="text-sm font-medium">Reports</span>}
        </Link>
        
        <button 
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "flex items-center rounded text-gray-800 hover:bg-blue-50 transition duration-200 ease-in-out w-full",
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
