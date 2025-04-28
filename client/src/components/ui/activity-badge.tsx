import React from 'react';
import { cn } from "@/lib/utils";

type ActivityBadgeProps = {
  count: number;
  variant?: 'default' | 'warning' | 'danger';
  className?: string;
};

/**
 * A badge component for showing activity counts in the sidebar
 */
export function ActivityBadge({ 
  count, 
  variant = 'default', 
  className 
}: ActivityBadgeProps) {
  if (count === 0) return null;
  
  return (
    <div 
      className={cn(
        "rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold",
        variant === 'default' && "bg-blue-100 text-blue-800",
        variant === 'warning' && "bg-amber-100 text-amber-800",
        variant === 'danger' && "bg-red-100 text-red-800",
        className
      )}
    >
      {count > 9 ? '9+' : count}
    </div>
  );
}