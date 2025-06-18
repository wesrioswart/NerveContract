import React from 'react';
import { cn } from "@/lib/utils";

type ActivityBadgeProps = {
  count: number;
  variant?: 'default' | 'warning' | 'danger';
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  iconClassName?: string;
  onClick?: () => void;
};

/**
 * A badge component for showing activity counts in the sidebar
 */
export function ActivityBadge({ 
  count, 
  variant = 'default', 
  className,
  icon: Icon,
  label,
  iconClassName,
  onClick
}: ActivityBadgeProps) {
  if (count === 0) return null;
  
  const content = (
    <>
      {Icon && <Icon className={cn("h-4 w-4", iconClassName)} />}
      {label && <span className="ml-2 text-sm">{label}</span>}
      <div 
        className={cn(
          "rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold ml-auto",
          variant === 'default' && "bg-blue-100 text-blue-800",
          variant === 'warning' && "bg-amber-100 text-amber-800",
          variant === 'danger' && "bg-red-100 text-red-800",
          className
        )}
      >
        {count > 9 ? '9+' : count}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center w-full p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        )}
      >
        {content}
      </button>
    );
  }
  
  return (
    <div className="flex items-center">
      {content}
    </div>
  );
}