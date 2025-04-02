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
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-primary">NEC4 Assistant</h1>
      </div>
      
      <div className="py-4 px-4">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
            <span className="material-icons">person</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.fullName || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.role || 'Role'}</p>
          </div>
        </div>
        
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "flex items-center px-2 py-2 text-sm rounded-md",
                location === item.path 
                  ? "bg-primary bg-opacity-10 text-primary" 
                  : "text-gray-900 hover:bg-gray-100"
              )}
            >
              <span className="material-icons text-sm mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-0 w-full border-t border-gray-200 px-4 py-4">
        <a href="#" className="flex items-center text-sm text-gray-900 hover:text-primary">
          <span className="material-icons text-sm mr-3">settings</span>
          Settings
        </a>
        <button 
          onClick={onLogout}
          className="flex items-center mt-3 text-sm text-gray-900 hover:text-primary w-full text-left"
        >
          <span className="material-icons text-sm mr-3">logout</span>
          Logout
        </button>
      </div>
    </div>
  );
}
