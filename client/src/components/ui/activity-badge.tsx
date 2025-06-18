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
  // Always show the badge, even when count is 0
  
  const content = (
    <div className="relative">
      {Icon && <Icon className={cn("h-5 w-5", iconClassName)} />}
      {count > 0 && (
        <div 
          className={cn(
            "absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-xs font-medium",
            className
          )}
        >
          {count > 9 ? '9+' : count}
        </div>
      )}
    </div>
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