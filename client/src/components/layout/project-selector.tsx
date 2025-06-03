import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useProject } from "@/contexts/project-context";

interface Project {
  id: number;
  name: string;
  contractReference: string;
  clientName: string;
}

export function ProjectSelector() {
  const { projectId, setProjectId, projects, isLoading, currentProject } = useProject();

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Current Project</span>
      </div>
      
      <Select
        value={projectId?.toString() || ""}
        onValueChange={(value) => setProjectId(parseInt(value))}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue 
            placeholder={isLoading ? "Loading projects..." : "Select a project"}
          />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id.toString()}>
              <div className="flex flex-col">
                <span className="font-medium">{project.name}</span>
                <span className="text-xs text-muted-foreground">
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