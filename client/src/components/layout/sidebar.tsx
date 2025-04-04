import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type SidebarProps = {
  user: any;
  onLogout: () => void;
};

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "dashboard" },
    { path: "/ai-assistant", label: "AI Assistant", icon: "chat" },
    { path: "/compensation-events", label: "Compensation Events", icon: "fact_check" },
    { path: "/early-warnings", label: "Early Warnings", icon: "warning" },
    { path: "/ncr-tqr", label: "NCRs & TQRs", icon: "report_problem" },
    { path: "/programme", label: "Programme", icon: "today" },
    { path: "/payment-certificates", label: "Payment Certificates", icon: "receipt" },
    { path: "/templates", label: "NEC4 Templates", icon: "description" },
    { path: "/reports", label: "Reports", icon: "bar_chart" },
  ];

  return (
    <div className="sidebar bg-white shadow-lg w-64 h-screen fixed overflow-y-auto transition-all">
      <div className="flex items-center h-16 border-b border-gray-200 px-4">
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
          <span className="material-icons text-xs">person</span>
        </div>
        <div className="ml-3">
          <p className="text-base font-medium">{user?.fullName || 'Jane Cooper'}</p>
          <p className="text-xs text-gray-500">{user?.role || 'Principal Contractor'}</p>
        </div>
      </div>
      
      <div className="py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "flex items-center px-4 py-3 text-base w-full",
                location === item.path 
                  ? "bg-primary text-white font-medium" 
                  : "text-gray-800 hover:bg-gray-100"
              )}
            >
              <span className="material-icons mr-4">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="absolute bottom-0 w-full border-t border-gray-200">
        <Link 
          href="/settings" 
          className="flex items-center px-4 py-3 text-base text-gray-800 hover:bg-gray-100 w-full"
        >
          <span className="material-icons mr-4">settings</span>
          Settings
        </Link>
        <button 
          onClick={onLogout}
          className="flex items-center px-4 py-3 text-base text-gray-800 hover:bg-gray-100 w-full text-left"
        >
          <span className="material-icons mr-4">logout</span>
          Logout
        </button>
      </div>
    </div>
  );
}
