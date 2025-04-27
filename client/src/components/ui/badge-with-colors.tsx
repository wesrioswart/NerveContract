import React from "react";
import { cn } from "@/lib/utils";
import { Badge, BadgeProps } from "@/components/ui/badge";

type ExtendedVariantProps = BadgeProps & {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | null | undefined;
};

export function BadgeWithColors({ 
  variant = "default", 
  className, 
  ...props 
}: ExtendedVariantProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case "success":
        return "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800";
      case "warning":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100 hover:text-amber-800";
      case "info":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800";
      default:
        return "";
    }
  };

  return (
    <Badge
      variant={
        variant === "success" || variant === "warning" || variant === "info"
          ? "outline"
          : variant
      }
      className={cn(getVariantStyle(), className)}
      {...props}
    />
  );
}