import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { animationPresets } from "@/lib/animation-utils";

interface AnimatedToastProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export const animatedToast = {
  // Default/neutral toast
  default: ({ title, description, action }: AnimatedToastProps) => {
    toast({
      title,
      description,
      action
    });
  },
  
  // Success toast with green styling and success icon
  success: ({ title, description, action }: AnimatedToastProps) => {
    toast({
      title,
      description,
      action,
      variant: "success"
    });
  },
  
  // Warning toast with amber styling and warning icon
  warning: ({ title, description, action }: AnimatedToastProps) => {
    toast({
      title,
      description,
      action,
      variant: "destructive"
    });
  },
  
  // Error toast with red styling and error icon
  error: ({ title, description, action }: AnimatedToastProps) => {
    toast({
      title,
      description,
      action,
      variant: "destructive"
    });
  },
  
  // Info toast with blue styling and info icon
  info: ({ title, description, action }: AnimatedToastProps) => {
    toast({
      title,
      description,
      action
    });
  }
};

interface AnimatedToastContentProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

function AnimatedToastContent({
  title,
  description,
  action,
  variant = "default"
}: AnimatedToastContentProps) {
  // Get appropriate icon based on variant
  const Icon = () => {
    if (variant === "success") {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (variant === "warning") {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (variant === "error") {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (variant === "info") {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return null;
  };

  // Get border color based on variant
  const getBorderColor = () => {
    switch (variant) {
      case "success":
        return "border-l-emerald-500";
      case "warning":
        return "border-l-amber-500";
      case "error":
        return "border-l-red-500";
      case "info":
        return "border-l-blue-500";
      default:
        return "border-l-gray-300";
    }
  };

  return (
    <motion.div
      {...animationPresets.notification}
      className={cn(
        "flex gap-3 items-start p-1",
        "border-l-4",
        getBorderColor()
      )}
    >
      <div className="flex-shrink-0 pt-0.5">
        <Icon />
      </div>
      
      <div className="flex-1">
        {title && <p className="font-medium text-gray-900">{title}</p>}
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      
      {action && (
        <div className="flex-shrink-0 self-center ml-2">
          {action}
        </div>
      )}
    </motion.div>
  );
}