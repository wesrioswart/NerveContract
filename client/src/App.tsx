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
import Procurement from "@/pages/procurement";
import Inventory from "@/pages/inventory";
import Login from "@/pages/login";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ProjectProvider } from "./contexts/project-context";
import { UserProvider } from "./contexts/user-context";
import FloatingAssistant from "./components/ai-assistant/floating-assistant";

function App() {
  const [location, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [currentForm, setCurrentForm] = useState<string | undefined>(undefined);
  const [currentFormData, setCurrentFormData] = useState<Record<string, any> | undefined>(undefined);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(user));
    } else if (location !== "/login") {
      setLocation("/login");
    }
  }, [location, setLocation]);

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

  const handleLogin = (user: any) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    setLocation("/");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem("user");
    setLocation("/login");
  };

  if (!isLoggedIn && location !== "/login") {
    return (
      <Login onLogin={handleLogin} />
    );
  }

  if (location === "/login") {
    return (
      <Login onLogin={handleLogin} />
    );
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <UserProvider>
      <ProjectProvider>
        <div className="app-container flex h-screen overflow-hidden bg-gray-50">
          <Sidebar 
            user={currentUser} 
            onLogout={handleLogout} 
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
          />
          
          <div className={cn(
            "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "ml-16" : "ml-64"
          )}>
            <Header 
              user={currentUser} 
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
                  <Route path="/inventory" component={Inventory} />
                  <Route path="/email-processor" component={EmailProcessor} />
                  <Route component={NotFound} />
                </Switch>
              </div>
            </main>
          </div>
          
          {/* Floating AI Assistant */}
          {isLoggedIn && currentUser && (
            <FloatingAssistant
              userId={currentUser.id}
              currentForm={currentForm}
              currentData={currentFormData}
            />
          )}
          
          <Toaster />
        </div>
      </ProjectProvider>
    </UserProvider>
  );
}

export default App;
