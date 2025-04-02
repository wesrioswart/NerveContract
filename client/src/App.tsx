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
import PaymentCertificates from "@/pages/payment-certificates";
import Reports from "@/pages/reports";
import Login from "@/pages/login";
import { useEffect, useState } from "react";

function App() {
  const [location, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  return (
    <div className="app-container min-h-screen grid grid-cols-[auto_1fr] grid-rows-[auto_1fr] md:grid-cols-[16rem_1fr]">
      <Sidebar user={currentUser} onLogout={handleLogout} />
      
      <Header user={currentUser} />
      
      <main className="p-6 overflow-y-auto col-start-2 row-start-2">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/ai-assistant" component={AIAssistant} />
          <Route path="/compensation-events" component={CompensationEvents} />
          <Route path="/early-warnings" component={EarlyWarnings} />
          <Route path="/ncr-tqr" component={NCRTqr} />
          <Route path="/programme" component={Programme} />
          <Route path="/payment-certificates" component={PaymentCertificates} />
          <Route path="/reports" component={Reports} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <Toaster />
    </div>
  );
}

export default App;
