import { Link } from "wouter";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingNavButton() {
  return (
    <div className="fixed top-4 left-4 z-[100]">
      <Link href="/dashboard">
        <Button 
          variant="default" 
          size="sm" 
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        >
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </Link>
    </div>
  );
}