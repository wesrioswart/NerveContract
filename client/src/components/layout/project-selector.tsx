import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ChevronDown, Check } from "lucide-react";
import { useProject } from "@/contexts/project-context";
import { cn } from "@/lib/utils";

interface Project {
  id: number;
  name: string;
  contractReference: string;
  clientName: string;
}

export function ProjectSelector() {
  const { projectId, setProjectId, projects, isLoading, currentProject } = useProject();

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Building2 className="h-4 w-4 text-slate-600" />
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Project</span>
      </div>
      
      <Select
        value={projectId?.toString() || ""}
        onValueChange={(value) => setProjectId(parseInt(value))}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full h-auto px-3 py-3 border-slate-300 hover:border-slate-400 focus:border-blue-500 transition-all duration-200 bg-white">
          <div className="flex-1 text-left min-w-0">
            {currentProject ? (
              <div className="space-y-1">
                <div className="font-semibold text-slate-900 text-sm leading-tight">
                  {currentProject.name}
                </div>
                <div 
                  className="text-xs text-slate-600 font-medium" 
                  title={currentProject.contractReference}
                >
                  {currentProject.contractReference}
                </div>
              </div>
            ) : (
              <span className="text-slate-500 text-sm">
                {isLoading ? "Loading projects..." : "Select a project"}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 ml-2" />
        </SelectTrigger>
        <SelectContent className="w-full min-w-[var(--radix-select-trigger-width)] border-slate-200 shadow-lg">
          {currentProject && (
            <SelectItem 
              key={`current-${currentProject.id}`}
              value={currentProject.id.toString()}
              className="px-3 py-3 bg-blue-50 border-l-3 border-l-blue-500"
            >
              <div className="flex items-center w-full">
                <Check className="h-4 w-4 text-blue-600 shrink-0 mr-3" />
                <div className="flex flex-col space-y-1 min-w-0 flex-1">
                  <span className="font-semibold text-blue-900 text-sm leading-tight">
                    {currentProject.name}
                  </span>
                  <span 
                    className="text-xs text-blue-700 font-medium" 
                    title={currentProject.contractReference}
                  >
                    {currentProject.contractReference}
                  </span>
                </div>
              </div>
            </SelectItem>
          )}
          {projects.filter(project => project.id !== projectId).map((project) => (
            <SelectItem 
              key={project.id} 
              value={project.id.toString()}
              className="px-3 py-3 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 data-[highlighted]:bg-slate-50"
            >
              <div className="flex flex-col space-y-1 w-full">
                <span className="font-semibold text-slate-900 text-sm leading-tight">
                  {project.name}
                </span>
                <span 
                  className="text-xs text-slate-600 font-medium" 
                  title={project.contractReference}
                >
                  {project.contractReference}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}