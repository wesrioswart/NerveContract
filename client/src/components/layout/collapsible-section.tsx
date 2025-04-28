import React from 'react';
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useSidebar } from '@/contexts/sidebar-context';

type CollapsibleSectionProps = {
  title: string;
  section: 'templates' | 'contractManagement' | 'programme' | 'financial' | 'resources' | 'utility';
  children: React.ReactNode;
  activityCount?: number;
  collapsed?: boolean; // main sidebar collapsed state
};

export function CollapsibleSection({ 
  title, 
  section,
  children, 
  activityCount = 0,
  collapsed = false 
}: CollapsibleSectionProps) {
  const { collapsedSections, toggleSection } = useSidebar();
  const isSectionCollapsed = collapsedSections[section];
  
  // Don't render the collapsible functionality if the entire sidebar is collapsed
  if (collapsed) {
    return <>{children}</>;
  }
  
  return (
    <div className="mb-3">
      <div 
        className="flex items-center justify-between px-3 cursor-pointer group"
        onClick={() => toggleSection(section)}
      >
        <div className="flex items-center">
          {isSectionCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-gray-500 mr-1 group-hover:text-gray-700" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-500 mr-1 group-hover:text-gray-700" />
          )}
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-gray-700">
            {title}
          </h4>
        </div>
        
        {activityCount > 0 && (
          <div className="rounded-full bg-red-100 text-red-800 w-5 h-5 flex items-center justify-center text-xs font-semibold">
            {activityCount > 9 ? '9+' : activityCount}
          </div>
        )}
      </div>
      
      <div className={cn(
        "transition-all duration-200 overflow-hidden",
        isSectionCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100 mt-2"
      )}>
        {children}
      </div>
    </div>
  );
}