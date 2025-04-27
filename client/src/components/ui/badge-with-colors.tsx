import React from "react";
import { cn } from "@/lib/utils";
import { Badge, BadgeProps } from "@/components/ui/badge";

type BaseVariant = "default" | "secondary" | "destructive" | "outline";
type ExtendedVariant = "success" | "warning" | "info";
type BadgeVariant = BaseVariant | ExtendedVariant;

type ExtendedVariantProps = Omit<BadgeProps, "variant"> & {
  variant?: BadgeVariant | null | undefined;
};

export function BadgeWithColors({ 
  variant = "default", 
  className, 
  ...props 
}: ExtendedVariantProps) {
  const getVariantStyle = () => {
    if (variant === "success") {
      return "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800";
    } else if (variant === "warning") {
      return "bg-amber-100 text-amber-800 hover:bg-amber-100 hover:text-amber-800";
    } else if (variant === "info") {
      return "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800";
    }
    return "";
  };

  const isExtendedVariant = variant === "success" || variant === "warning" || variant === "info";
  const badgeVariant = isExtendedVariant ? "outline" : (variant as BaseVariant | null | undefined);

  return (
    <Badge
      variant={badgeVariant}
      className={cn(getVariantStyle(), className)}
      {...props}
    />
  );
}