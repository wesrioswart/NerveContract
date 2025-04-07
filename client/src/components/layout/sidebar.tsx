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
  BarChart, 
  Settings, 
  LogOut, 
  User
} from 'lucide-react';

type SidebarProps = {
  user: any;
  onLogout: () => void;
};

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/ai-assistant", label: "AI Assistant", icon: MessageCircle },
    { path: "/compensation-events", label: "Compensation Events", icon: CheckCircle },
    { path: "/early-warnings", label: "Early Warnings", icon: AlertTriangle },
    { path: "/ncr-tqr", label: "NCRs & TQRs", icon: FileWarning },
    { path: "/programme", label: "Programme", icon: CalendarDays },
    { path: "/payment-certificates", label: "Payment Certificates", icon: Receipt },
    { path: "/templates", label: "NEC4 Templates", icon: FileText },
    { path: "/reports", label: "Reports", icon: BarChart },
  ];

  return (
    <div className="sidebar bg-gray-50 shadow-lg w-64 h-screen fixed overflow-y-auto transition-all">
      <div className="flex items-center h-16 border-b border-gray-200 px-4">
        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
        <div className="ml-3">
          <p className="text-base font-medium">{user?.fullName || 'Jane Cooper'}</p>
          <p className="text-xs text-gray-500">{user?.role || 'Principal Contractor'}</p>
        </div>
      </div>
      
      <div className="p-4">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex items-center gap-3 p-3 rounded transition duration-200 ease-in-out",
                  location === item.path 
                    ? "bg-blue-100 text-blue-700 font-medium" 
                    : "text-gray-800 hover:bg-blue-50"
                )}
              >
                <Icon className={cn("w-5 h-5", location === item.path ? "text-blue-500" : "text-gray-500")} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="absolute bottom-0 w-full border-t border-gray-200 p-4">
        <Link 
          href="/settings" 
          className="flex items-center gap-3 p-3 mb-2 rounded text-gray-800 hover:bg-blue-50 transition duration-200 ease-in-out"
        >
          <Settings className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 p-3 rounded text-gray-800 hover:bg-blue-50 transition duration-200 ease-in-out w-full"
        >
          <LogOut className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
