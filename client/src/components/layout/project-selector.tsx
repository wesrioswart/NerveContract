import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ChevronDown } from "lucide-react";
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

  const truncateReference = (ref: string, maxLength: number = 20) => {
    return ref.length > maxLength ? `${ref.substring(0, maxLength)}...` : ref;
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Project</span>
      </div>
      
      <div className="space-y-2">
        <Select
          value={projectId?.toString() || ""}
          onValueChange={(value) => setProjectId(parseInt(value))}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full h-auto p-3 border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex-1 text-left">
              {currentProject ? (
                <div className="space-y-1">
                  <div className="font-medium text-slate-900 text-sm leading-tight">
                    {currentProject.name}
                  </div>
                  <div className="text-xs text-slate-500" title={currentProject.contractReference}>
                    {truncateReference(currentProject.contractReference)}
                  </div>
                </div>
              ) : (
                <span className="text-slate-500">
                  {isLoading ? "Loading projects..." : "Select a project"}
                </span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </SelectTrigger>
          <SelectContent className="w-full">
            {projects.map((project) => (
              <SelectItem 
                key={project.id} 
                value={project.id.toString()}
                className="p-3 cursor-pointer"
              >
                <div className="flex flex-col space-y-1 w-full">
                  <span className="font-medium text-slate-900 text-sm leading-tight">
                    {project.name}
                  </span>
                  <span 
                    className="text-xs text-slate-500" 
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
    </div>
  );
}