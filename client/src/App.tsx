import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Dashboard from "@/pages/dashboard";
import AIAssistant from "@/pages/ai-assistant";
import CompensationEvents from "@/pages/compensation-events";
import EarlyWarnings from "@/pages/early-warnings";
import NCRTqr from "@/pages/ncr-tqr";
import Programme from "@/pages/programme";
import ProgrammeManagement from "@/pages/programme-management";
import PaymentCertificates from "@/pages/payment-certificates";
import Reports from "@/pages/reports";
import Templates from "@/pages/templates";
import EmailProcessor from "@/pages/email-processor";
import WorkflowDashboard from "@/pages/workflow-dashboard";
import InvestorDiagrams from "@/pages/investor-diagrams";
import Procurement from "@/pages/procurement";
import Suppliers from "@/pages/suppliers";
import Inventory from "@/pages/inventory";
import EquipmentHire from "@/pages/equipment-hire";
import RfiManagement from "@/pages/rfi-management";
import ResourceAllocation from "@/pages/resource-allocation";
import Financial from "@/pages/financial";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ProjectProvider } from "./contexts/project-context";
import { UserProvider, useUser } from "./contexts/user-context";
import { SidebarProvider } from "./contexts/sidebar-context";
import FloatingAssistant from "./components/ai-assistant/floating-assistant";
import { Loader2 } from "lucide-react";

// AppContent component that uses the UserProvider context
function AppContent() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [currentForm, setCurrentForm] = useState<string | undefined>(undefined);
  const [currentFormData, setCurrentFormData] = useState<Record<string, any> | undefined>(undefined);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && location !== "/login") {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  // Set current form based on route
  useEffect(() => {
    if (location.includes("/compensation-events")) {
      setCurrentForm("compensation-event");
    } else if (location.includes("/early-warnings")) {
      setCurrentForm("early-warning");
    } else if (location.includes("/ncr-tqr")) {
      if (location.includes("/technical-query")) {
        setCurrentForm("technical-query");
      } else {
        setCurrentForm("non-conformance");
      }
    } else if (location.includes("/templates") && location.includes("pmi")) {
      setCurrentForm("instruction");
    } else {
      setCurrentForm(undefined);
    }
    // Reset form data when navigating
    setCurrentFormData(undefined);
  }, [location]);

  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated && location !== "/login") {
    return <Login onLogin={() => setLocation("/")} />;
  }

  if (location === "/login") {
    return <Login onLogin={() => setLocation("/")} />;
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <ProjectProvider>
      <SidebarProvider>
        <div className="app-container flex h-screen overflow-hidden bg-gray-50">
          <Sidebar 
            user={user} 
            onLogout={logout} 
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
          />
          
          <div className={cn(
            "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "ml-16" : "ml-64"
          )}>
            <Header 
              user={user} 
              onToggleSidebar={toggleSidebar}
              sidebarCollapsed={sidebarCollapsed}
            />
            
            <main className="flex-1 overflow-y-auto p-6">
              <div className="container mx-auto max-w-7xl">
                <Switch>
                  <Route path="/" component={Dashboard} />
                  <Route path="/ai-assistant" component={AIAssistant} />
                  <Route path="/compensation-events" component={CompensationEvents} />
                  <Route path="/early-warnings" component={EarlyWarnings} />
                  <Route path="/ncr-tqr" component={NCRTqr} />
                  <Route path="/programme" component={Programme} />
                  <Route path="/programme-management" component={ProgrammeManagement} />
                  <Route path="/payment-certificates" component={PaymentCertificates} />
                  <Route path="/reports" component={Reports} />
                  <Route path="/templates" component={Templates} />
                  <Route path="/procurement" component={Procurement} />
                  <Route path="/suppliers" component={Suppliers} />
                  <Route path="/inventory" component={Inventory} />
                  <Route path="/equipment-hire" component={EquipmentHire} />
                  <Route path="/financial" component={Financial} />
                  <Route path="/email-processor" component={EmailProcessor} />
                  <Route path="/workflow-dashboard" component={WorkflowDashboard} />
                  <Route path="/investor-diagrams" component={InvestorDiagrams} />
                  <Route path="/rfi-management" component={RfiManagement} />
                  <Route path="/resource-allocation" component={ResourceAllocation} />
                  <Route path="/settings" component={Settings} />
                  
                  {/* Project-specific routes */}
                  <Route path="/projects/:id/dashboard" component={Dashboard} />
                  <Route path="/projects/:id/ai-assistant" component={AIAssistant} />
                  <Route path="/projects/:id/compensation-events" component={CompensationEvents} />
                  <Route path="/projects/:id/early-warnings" component={EarlyWarnings} />
                  <Route path="/projects/:id/ncr-tqr" component={NCRTqr} />
                  <Route path="/projects/:id/programme" component={Programme} />
                  <Route path="/projects/:id/programme-management" component={ProgrammeManagement} />
                  <Route path="/projects/:id/payment-certificates" component={PaymentCertificates} />
                  <Route path="/projects/:id/reports" component={Reports} />
                  <Route path="/projects/:id/templates" component={Templates} />
                  <Route path="/projects/:id/procurement" component={Procurement} />
                  <Route path="/projects/:id/suppliers" component={Suppliers} />
                  <Route path="/projects/:id/inventory" component={Inventory} />
                  <Route path="/projects/:id/equipment-hire" component={EquipmentHire} />
                  <Route path="/projects/:id/financial" component={Financial} />
                  <Route path="/projects/:id/email-processor" component={EmailProcessor} />
                  <Route path="/projects/:id/rfi-management" component={RfiManagement} />
                  <Route path="/projects/:id/resource-allocation" component={ResourceAllocation} />
                  <Route path="/projects/:id/settings" component={Settings} />
                  
                  <Route component={NotFound} />
                </Switch>
              </div>
            </main>
          </div>
          
          {/* Floating AI Assistant */}
          {isAuthenticated && user && (
            <FloatingAssistant
              userId={user.id}
              currentForm={currentForm}
              currentData={currentFormData}
            />
          )}
        </div>
      </SidebarProvider>
    </ProjectProvider>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
      <Toaster />
    </UserProvider>
  );
}

export default App;